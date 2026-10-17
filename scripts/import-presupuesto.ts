import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { createDatabase, seedDatabase } from "./db/local-db.mjs";
import { openBudgetWorkbook, extractScenario } from "./lib/budget-workbook";
import { pricingConfigSchemas } from "../src/lib/pricing/config";
import type { PricingItem, QuoteInput, Rate } from "../src/lib/pricing";
import { compareReference, type QuoteReference } from "../src/lib/pricing/reference";
import type { Tables } from "../src/types/db";

export const projectRoot = fileURLToPath(new URL("../", import.meta.url));
export const pilotSku = "SPAUYU-3D2N-MP";
const literal = (v: string) => "'" + v.replace(/'/g, "''") + "'";
const jsonSql = (v: unknown) => literal(JSON.stringify(v)) + "::jsonb";
type Service = Tables<"services"> & { rates: Rate[] };
type Link = {
  day_number: number;
  block_id: string;
  id: string;
  sku: string;
  qty: number;
  pricing_config: unknown;
};

export async function budgetPlan(options: { file?: string; sku?: string; pax?: number } = {}) {
  const sku = options.sku ?? pilotSku,
    pax = options.pax ?? 2;
  if (sku !== pilotSku || pax !== 2)
    throw new Error(
      "Piloto limitado a SPAUYU-3D2N-MP, 2 pax; revisar otras hojas/escenarios antes de habilitarlos.",
    );
  const file = options.file ?? resolve(projectRoot, "data/import/presupuestos.xlsx");
  const workbook = await openBudgetWorkbook(file);
  const source = extractScenario(
    workbook.sheet(sku),
    workbook.sheet("TARIFARIO_MAESTRO"),
    sku,
    pax,
  );
  const pg = await createDatabase();
  try {
    await seedDatabase(pg);
    const seedRoot = new URL("../supabase/seed/applied/", import.meta.url);
    const report = JSON.parse(await readFile(new URL("blocks-report.json", seedRoot), "utf8")) as {
      seed_order: string[];
    };
    for (const name of report.seed_order)
      await pg.exec(await readFile(new URL(name, seedRoot), "utf8"));
    const templates = (
      await pg.query<{ id: string }>("select id from itinerary_templates where sku=$1", [sku])
    ).rows;
    if (templates.length !== 1) throw new Error(`Plantilla no encontrada o ambigua: ${sku}`);
    const template = templates[0]!;
    const oldDays = (
      await pg.query<{ day_number: number; block_id: string }>(
        "select day_number,block_id from template_days where template_id=$1 order by day_number",
        [template.id],
      )
    ).rows;
    const before = (
      await pg.query<Link>(
        "select d.day_number,d.block_id,i.id,s.sku,i.qty::float8 qty,i.pricing_config from template_days d join day_block_items i on i.block_id=d.block_id join services s on s.id=i.service_id where d.template_id=$1 order by d.day_number,s.sku",
        [template.id],
      )
    ).rows;
    const services = (
      await pg.query<{ service: Service }>(
        "select to_jsonb(s) || jsonb_build_object('rates',coalesce((select jsonb_agg(to_jsonb(r)) from service_rates r where r.service_id=s.id),'[]'::jsonb)) service from services s",
      )
    ).rows.map((r) => r.service);
    const aliases = (
      await pg.query<{ sku: string; service_id: string }>(
        "select sku,service_id from service_sku_aliases",
      )
    ).rows;
    const lookup = (key: string) =>
      services.find((s) => s.sku === key) ??
      services.find((s) => s.id === aliases.find((a) => a.sku === key)?.service_id);
    const blockers = [...source.blockers],
      unmatched: { cell: string; sku: string | null; description: string }[] = [];
    if (oldDays.map((d) => d.day_number).join() !== "1,2,3")
      blockers.push("La plantilla no tiene exactamente días 1, 2 y 3");
    const modules = await pg.query(
      "select m.id from day_block_modules m join template_days d on d.block_id=m.block_id where d.template_id=$1",
      [template.id],
    );
    if (modules.rows.length)
      blockers.push(
        "La plantilla tiene módulos: revisar su contenido antes de sustituir sus bloques",
      );
    const input: QuoteInput = {
      pax_paying: pax,
      tc_count: 0,
      start_date: "2026-10-14",
      rooming: { paying: { DBL: 1 }, tc: {} },
      staff: { drivers: 0, guides: 0 },
      vehicles: {},
      fx_snapshot: source.fx,
      margin_pct: 25,
      margin_mode: "markup",
      client_type: "B2C",
      commission_mode: "none",
      rounding_rule: { mode: "none", increment: 1 },
      days: [1, 2, 3].map((day_number) => ({ day_number, items: [] })),
    };
    const links: { line: (typeof source.lines)[number]; service: Service; item: PricingItem }[] =
      [];
    for (const line of source.lines) {
      const service = line.sku ? lookup(line.sku) : undefined;
      if (!service) {
        unmatched.push({ cell: line.cell, sku: line.sku, description: line.description });
        continue;
      }
      if (!service.pricing_unit || !service.currency || line.quantity == null) {
        blockers.push(`${line.cell}: unidad, moneda o cantidad sin resolver`);
        continue;
      }
      const first = line.covered_by ? source.lines.find((l) => l.cell === line.covered_by)! : line;
      const continuations = source.lines.filter((l) => l.covered_by === first.cell);
      const unit = line.vehicle ? "per_vehicle" : service.pricing_unit;
      const span = continuations.length
        ? Math.max(...continuations.map((l) => l.day)) - first.day + 1
        : 1;
      if (span > service.multi_day_span)
        blockers.push(`${line.cell}: continuación fuera del alcance multi-día del catálogo`);
      const config =
        unit === "per_room"
          ? { room_type: line.room_type, nights: 1 }
          : unit === "per_vehicle"
            ? {
                vehicle_segment: service.sku,
                ...(line.vehicle
                  ? { rate_band: { pax_min: line.vehicle.pax_min, pax_max: line.vehicle.pax_max } }
                  : {}),
              }
            : {};
      const parsed = pricingConfigSchemas[unit].safeParse(config);
      if (!parsed.success) {
        blockers.push(`${line.cell}: ${parsed.error.message}`);
        continue;
      }
      if (unit === "per_vehicle") input.vehicles[service.sku] = first.quantity!;
      if (service.pricing_unit === "per_person" && first.quantity !== pax)
        blockers.push(`${line.cell}: cantidad de persona distinta de pax`);
      if (service.pricing_unit === "per_room" && (first.quantity !== 1 || line.room_type !== "DBL"))
        blockers.push(`${line.cell}: rooming distinto del escenario aprobado 1 DBL por noche`);
      const item: PricingItem = {
        id: line.cell,
        label: service.sku,
        pricing_unit: unit,
        currency: service.currency,
        qty: first.quantity!,
        rates: service.rates
          .map((r) => ({
            ...(r.id ? { id: r.id } : {}),
            season: r.season,
            valid_from: r.valid_from,
            valid_to: r.valid_to,
            pax_min: r.pax_min,
            pax_max: r.pax_max,
            price_net: r.price_net,
            ...(r.price_rack !== undefined ? { price_rack: r.price_rack } : {}),
            ...(r.room_type !== undefined ? { room_type: r.room_type } : {}),
          }))
          .sort((a, b) => (a.id ?? "").localeCompare(b.id ?? "")),
        applies_tc: service.applies_tc_default,
        margin_applicable: service.margin_applicable_default,
        included: true,
        pricing_config: parsed.data,
        day_span: span,
        ...(span > 1
          ? { coverage_key: `${sku}:${first.cell}`, coverage_start_day: first.day }
          : {}),
      };
      // Multi-day signatures must be identical apart from the item ID.
      input.days.find((d) => d.day_number === line.day)!.items.push(item);
      links.push({ line, service, item });
    }
    if (unmatched.length)
      blockers.push(`${unmatched.length} filas sin SKU del catálogo; no se crearán servicios`);
    const fixture: QuoteReference = {
      name: "SPA-UYU 3D2N MP · 2 pax",
      source: {
        file: "data/import/presupuestos.xlsx",
        sha256: workbook.sha256,
        sheet: source.sheet,
        range: source.range,
        total_cell: source.totalCell,
        read_on: "2026-10-11",
      },
      pax_paying: pax,
      tc_count: 0,
      expected: {
        cost_usd: source.expectedCost,
        cost_per_pax_usd: source.expectedCost / pax,
        price_usd: null,
      },
      input,
      lines: source.lines,
      blockers,
      notes: [
        ...source.warnings,
        "Se compara costo: PRECIO VENTA está vacío. El markup 25 % procede de Andrea, no de Sheets.",
        "Fecha de prueba 2026-10-14: la fuente no tiene fecha. Staff 0 para este cálculo; la fuente no desglosa staff.",
        "El escenario y las cantidades solo certifican 2 pagantes + 0 TC; habitación DBL en cada una de las dos noches.",
        "Tarifas tomadas del catálogo local migrado; FX de las fórmulas del Excel. No certifica el estado de Cloud.",
      ],
    };
    const defaults = {
      pax_paying: 2,
      tc_count: 0,
      rooming: input.rooming,
      staff: input.staff,
      source_url: "data/import/presupuestos.xlsx",
      source_sheet: source.sheet,
      source_range: source.range,
      source_sha256: workbook.sha256,
      expected_cost_usd: source.expectedCost,
      import_id: "presupuesto-spauyu-mp-2pax-v1",
    };
    const namespace = "presupuesto-spauyu-mp-2pax-v1";
    const block = (day: number) => `md5(${literal(`${namespace}:day:${day}`)})::uuid`;
    const sql = [
      "-- Generated by scripts/import-presupuesto.ts. Review before Lovable applies it.",
      "-- Apply after all migrations and historical seeds 00/01/02. No tariffs or existing quotes are changed.",
      `-- Workbook SHA-256: ${workbook.sha256}. ${source.sheet}!${source.range}.`,
      "begin;",
      "do $budget$ begin",
      `if (select count(*) from public.itinerary_templates where sku=${literal(sku)})<>1 then raise exception 'Expected one existing template'; end if;`,
      `if exists(select 1 from public.itinerary_templates where sku=${literal(sku)} and quote_defaults->>'import_id'=${literal(namespace)}) then
        if (select quote_defaults->>'source_sha256' from public.itinerary_templates where sku=${literal(sku)}) is distinct from ${literal(workbook.sha256)} then raise exception 'Source changed: prepare a reviewed import revision'; end if;
        return;
      end if;`,
      ...oldDays.map(
        (d) =>
          `if not exists(select 1 from public.template_days d join public.itinerary_templates t on t.id=d.template_id where t.sku=${literal(sku)} and d.day_number=${d.day_number} and d.block_id=${literal(d.block_id)}::uuid) then raise exception 'Template changed: review day ${d.day_number}'; end if;`,
      ),
      `if (select count(*) from public.template_days d join public.itinerary_templates t on t.id=d.template_id where t.sku=${literal(sku)})<>3 then raise exception 'Expected three days'; end if;`,
      ...links.map(
        ({ service }) =>
          `if not exists(select 1 from public.services where id=${literal(service.id)}::uuid and sku=${literal(service.sku)}) then raise exception 'Missing catalog service: ${service.sku}'; end if;`,
      ),
      ...oldDays.flatMap((d) => [
        `insert into public.day_blocks(catalog_origin,id,code,route_from,route_to,places,modality,hotel_service_id,default_day_position,status) select 'importacion',${block(d.day_number)},${literal(`IMPORT_SPAUYU_MP_2PAX_D${d.day_number}`)},route_from,route_to,places,modality,${links.find((l) => l.line.day === d.day_number && l.item.pricing_unit === "per_room") ? literal(links.find((l) => l.line.day === d.day_number && l.item.pricing_unit === "per_room")!.service.id) + "::uuid" : "null"},${d.day_number},'pendiente' from public.day_blocks where id=${literal(d.block_id)}::uuid;`,
        `insert into public.day_block_translations(block_id,lang,title,description,includes,excludes,reviewed) select ${block(d.day_number)},lang,title,description,includes,excludes,false from public.day_block_translations where block_id=${literal(d.block_id)}::uuid;`,
      ]),
      ...links.map(
        ({ line, service, item }) =>
          `insert into public.day_block_items(id,block_id,service_id,qty,applies_tc,margin_applicable,included,multi_day_span,coverage_key,coverage_start_day,pricing_config) values(md5(${literal(`${namespace}:item:${line.cell}`)})::uuid,${block(line.day)},${literal(service.id)}::uuid,${item.qty},${item.applies_tc},${item.margin_applicable},true,${item.day_span},${item.coverage_key ? literal(item.coverage_key) : "null"},${item.coverage_start_day ?? "null"},${jsonSql({ ...(item.pricing_config as object), ...(item.pricing_unit !== service.pricing_unit ? { pricing_unit: item.pricing_unit } : {}), description: line.description, _source_cell: line.cell, _source_sheet: source.sheet, _source_sha256: workbook.sha256 })});`,
      ),
      ...oldDays.map(
        (d) =>
          `update public.template_days set block_id=${block(d.day_number)} where template_id=(select id from public.itinerary_templates where sku=${literal(sku)}) and day_number=${d.day_number};`,
      ),
      `update public.itinerary_templates set catalog_origin='importacion',quote_defaults=${jsonSql(defaults)},status='pendiente' where sku=${literal(sku)};`,
      "end $budget$;",
      "commit;",
      "",
    ].join("\n");
    const diff = [
      "Catálogo de comparación: migraciones y seeds locales; Cloud no fue consultado.",
      "ENLACES ACTUALES",
      ...before.map(
        (l) =>
          `- Día ${l.day_number}: ${l.sku} · qty ${l.qty} · ${JSON.stringify(l.pricing_config)}`,
      ),
      "ENLACES PROPUESTOS (bloques propios de esta plantilla)",
      ...links.map(
        ({ line, service, item }) =>
          `+ Día ${line.day}: ${service.sku} · qty ${item.qty} · ${JSON.stringify(item.pricing_config)} · ${line.cell}${line.covered_by ? ` incluido por ${line.covered_by}` : ""}`,
      ),
      "SKU SIN CATÁLOGO",
      JSON.stringify(unmatched),
      compareReference(fixture).report,
    ].join("\n");
    return { fixture, sql, diff, unmatched };
  } finally {
    await pg.close();
  }
}

export async function main(args: string[]) {
  const allowed = new Set(["--sku", "--pax", "--file", "--apply", "--dry-run"]);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (!allowed.has(arg)) throw new Error(`Argumento desconocido: ${arg}`);
    if (!["--apply", "--dry-run"].includes(arg) && (!args[++i] || args[i]!.startsWith("--")))
      throw new Error(`Falta valor: ${arg}`);
  }
  if (args.includes("--apply") && args.includes("--dry-run"))
    throw new Error("Elige --apply o --dry-run");
  const option = (name: string, fallback: string) =>
    args.includes(name) ? args[args.indexOf(name) + 1]! : fallback;
  const plan = await budgetPlan({
    file: option("--file", resolve(projectRoot, "data/import/presupuestos.xlsx")),
    sku: option("--sku", pilotSku),
    pax: Number(option("--pax", "2")),
  });
  console.log(plan.diff);
  if (!args.includes("--apply")) {
    console.log("DRY RUN: no se escribieron archivos ni datos remotos.");
    return plan;
  }
  if (plan.fixture.blockers.length || !compareReference(plan.fixture).pass)
    throw new Error("Importación bloqueada: revisa el diff; no se escribió ningún archivo.");
  for (const [relative, content] of [
    [`tests/fixtures/${pilotSku}.json`, JSON.stringify(plan.fixture, null, 2) + "\n"],
    ["supabase/seed/04_spauyu_mp_2pax.sql", plan.sql],
    [
      "docs/pendientes/spauyu_mp_skus_sin_catalogo.json",
      JSON.stringify(plan.unmatched, null, 2) + "\n",
    ],
    ["docs/pendientes/spauyu_mp_importacion.txt", plan.diff + "\n"],
  ]) {
    const path = resolve(projectRoot, relative!);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content!, "utf8");
  }
  console.log("APPLY: fixture, diff y seed SQL guardados. No se ejecutó SQL en Cloud.");
  return plan;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
