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
import { importTables } from "./plan-v2";
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
export function controlPackageCosts(pkg: PackageV2, fx: Record<string, number>) {
  return pkg.controls.map((r) => {
    try {
      const app = costPackageTemplate(
        { pkg, sku: r["sku"]! },
        { pax: Number(r["pax"]), fx },
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
export async function stageImportPackage(file: File, fx: Record<string, number>) {
  const pkg = readPackageZip(new Uint8Array(await file.arrayBuffer()));
  const catalog = await loadImportCatalog();
  const validation = validatePackageV2(pkg, {
    services: (catalog["services"] ?? []).map((s) => ({ sku: String(s["sku"]) })),
  });
  let rows: ReturnType<typeof diffPackageV2> = [];
  if (!validation.errors.length)
    try {
      rows = diffPackageV2(pkg, catalog);
    } catch (e) {
      validation.errors.push({ key: "catalog", message: String(e) });
    }
  const control = validation.errors.length ? [] : controlPackageCosts(pkg, fx);
  const batchId = unwrap(
    await db.rpc("stage_import_package", {
      p_file_name: file.name,
      p_package: json(pkg),
      p_rows: json(rows),
      p_validation: json({ ...validation, control, fx }),
    }),
  );
  const saved = unwrap(await db.from("import_batches").select("*").eq("id", batchId).single());
  return { batchId, validation: saved.summary as unknown as typeof validation, rows, control };
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
