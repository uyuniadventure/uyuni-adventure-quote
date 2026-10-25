import { unzipSync, strFromU8 } from "fflate";
import { db, json, unwrap } from "../db";
import {
  parsePackageV2,
  validatePackageV2,
  diffPackageV2,
  type ImportCatalog,
  type PackageV2,
  type CatalogRow,
} from "./package-v2";
import { importTables, type TemplateEconomicAssessment } from "./plan-v2";
import { costPackageTemplate, type TemplateCostOptions } from "../pricing/template-cost";

/** Files are read locally; the real ZIP is never checked into source control. */
export function readPackageZip(bytes: Uint8Array): PackageV2 {
  if (bytes.byteLength > 20_000_000) throw new Error("ZIP demasiado grande (máximo 20 MB)");
  let total = 0;
  const files: Record<string, string> = {};
  const unpacked = unzipSync(bytes, {
    filter: (entry) => {
      if (entry.originalSize > 10_000_000 || (total += entry.originalSize) > 30_000_000)
        throw new Error("Contenido ZIP demasiado grande");
      return entry.name.endsWith(".csv");
    },
  });
  for (const [path, content] of Object.entries(unpacked)) {
    if (path.split("/").includes("..")) throw new Error("Ruta ZIP inválida");
    const name = path.split("/").pop()!;
    if (files[name] != null) throw new Error(`CSV repetido: ${name}`);
    files[name] = strFromU8(content);
  }
  return parsePackageV2(files);
}
export async function loadImportCatalog(): Promise<ImportCatalog> {
  const entries = await Promise.all(
    importTables.map(async (table) => {
      const rows: CatalogRow[] = [];
      for (let start = 0; ; start += 500) {
        const page = unwrap(
          await db
            .from(table)
            .select("*")
            .order(table === "doc_block_translations" ? "block_id" : "id")
            .range(start, start + 499),
        ) as unknown as CatalogRow[];
        rows.push(...page);
        if (page.length < 500) break;
      }
      return [table, rows] as const;
    }),
  );
  return Object.fromEntries(entries);
}
export function controlPackageCosts(pkg: PackageV2) {
  return pkg.controls.map((r) => {
    try {
      const date = r["start_date"] || r["fecha_inicio"] || undefined;
      const app = costPackageTemplate(
        { pkg, sku: r["sku"]! },
        {
          pax: Number(r["pax"]),
          tc: Number(r["tc"] || 0),
          staff: Number(r["staff"] || 0),
          ...(date ? { date, year: Number(date.slice(0, 4)) } : {}),
        },
      ).total_cost_usd;
      const delta = app - Number(r["costo_hoja"]);
      return {
        sku: r["sku"]!,
        pax: Number(r["pax"]),
        sheet: Number(r["costo_hoja"]),
        app,
        delta,
        level: Math.abs(delta) <= 1 ? "green" : Math.abs(delta) <= 15 ? "amber" : "red",
        error: null,
      };
    } catch (e) {
      return {
        sku: r["sku"]!,
        pax: Number(r["pax"]),
        sheet: Number(r["costo_hoja"]),
        app: null,
        delta: null,
        level: "red",
        error: String(e),
      };
    }
  });
}
export type TemplateImportAssessment = TemplateEconomicAssessment;
/** The historical cost control was supplied as a five-scenario matrix per covered itinerary. */
export const requiredImportControlPax = [1, 2, 3, 4, 5] as const;
export function assessPackageTemplates(pkg: PackageV2): TemplateImportAssessment[] {
  const validation = validatePackageV2(pkg);
  const control = controlPackageCosts(pkg);
  return pkg.templates.map((template) => {
    const sku = template["sku"]!;
    const rows = control.filter((r) => r.sku === sku);
    const reasons: string[] = validation.warnings
      .filter((w) => w.key === sku)
      .map((w) => w.message)
      .filter((message) => message === "Plantilla sin servicios");
    const blocked = validation.warnings
      .filter((w) => w.key === sku)
      .map((w) => w.message)
      .filter((message) => message.startsWith("BLOQUEADO:"));
    for (const pax of requiredImportControlPax) {
      const scenario = rows.filter((row) => row.pax === pax);
      if (scenario.length === 0)
        reasons.push(`Falta control económico independiente para pax ${pax}`);
      else if (scenario.length > 1)
        reasons.push(`Control económico ambiguo para pax ${pax}: ${scenario.length} filas`);
    }
    for (const row of rows) {
      if (row.error) reasons.push(`Pax ${row.pax}: ${row.error}`);
      else if (Math.abs(row.delta ?? Infinity) > 1)
        reasons.push(`Pax ${row.pax}: diferencia económica ${row.delta?.toFixed(2)} USD`);
    }
    const unique = [...new Set([...blocked, ...reasons])];
    return {
      sku,
      status: blocked.length ? "blocked" : unique.length ? "pending" : "validated",
      reasons: unique,
      controls: rows.length,
    };
  });
}
export async function stageImportPackage(file: File) {
  const pkg = readPackageZip(new Uint8Array(await file.arrayBuffer()));
  const catalog = await loadImportCatalog();
  const validation = validatePackageV2(pkg, {
    services: (catalog["services"] ?? []).map((s) => ({ sku: String(s["sku"]) })),
  });
  const control = validation.errors.length ? [] : controlPackageCosts(pkg);
  const templates = validation.errors.length ? [] : assessPackageTemplates(pkg);
  let rows: ReturnType<typeof diffPackageV2> = [];
  if (!validation.errors.length)
    try {
      rows = diffPackageV2(pkg, catalog, templates);
    } catch (e) {
      validation.errors.push({ key: "catalog", message: String(e) });
    }
  const batchId = unwrap(
    await db.rpc("stage_import_package", {
      p_file_name: file.name,
      p_package: json(pkg),
      p_rows: json(rows),
      p_validation: json({ ...validation, control, templates, pricing_source: "PRECIO_USD" }),
    }),
  );
  const saved = unwrap(await db.from("import_batches").select("*").eq("id", batchId).single());
  return {
    batchId,
    validation: saved.summary as unknown as typeof validation,
    rows,
    control,
    templates,
  };
}
export async function commitImportBatch(batchId: string) {
  return unwrap(await db.rpc("commit_import_batch", { p_batch_id: batchId }));
}
export async function discardImportBatch(batchId: string) {
  const { error } = await db.rpc("discard_import_batch", { p_batch_id: batchId });
  if (error) throw new Error(error.message);
}
export async function latestFx(date = new Date().toISOString().slice(0, 10)) {
  const rates = unwrap(await db.from("exchange_rates").select("*").order("valid_from"));
  const fx: Record<string, number> = { USD: 1 };
  for (const r of rates) if (r.valid_from <= date) fx[r.currency] = r.rate_to_usd;
  return fx;
}
export async function loadImportBatch(batchId: string) {
  return {
    batch: unwrap(await db.from("import_batches").select("*").eq("id", batchId).single()),
    rows: await loadBatchRows(batchId),
  };
}
async function loadBatchRows(batchId: string) {
  const rows = [];
  for (let start = 0; ; start += 500) {
    const page = unwrap(
      await db
        .from("import_rows")
        .select("*")
        .eq("batch_id", batchId)
        .order("position")
        .range(start, start + 499),
    );
    rows.push(...page);
    if (page.length < 500) return rows;
  }
}
export async function loadTemplatePackage(templateId: string): Promise<PackageV2> {
  return unwrap(
    await db.rpc("import_template_package", { p_template: templateId }),
  ) as unknown as PackageV2;
}
export async function costTemplate(
  template: string | { pkg: PackageV2; sku: string },
  options: TemplateCostOptions,
) {
  if (typeof template !== "string") return costPackageTemplate(template, options);
  const pkg = await loadTemplatePackage(template);
  const t = unwrap(await db.from("itinerary_templates").select("*").eq("id", template).single());
  return costPackageTemplate({ pkg, sku: t["sku"] }, options);
}
