// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { budgetPlan } from "../../scripts/import-presupuesto";
import {
  extractScenario,
  openBudgetWorkbook,
  parseLookup,
} from "../../scripts/lib/budget-workbook";
import { createDatabase, seedDatabase } from "../../scripts/db/local-db.mjs";
import { pgliteSupabase } from "./pglite-supabase";
import { compareReference, type QuoteReference } from "../lib/pricing/reference";
import reference from "../../tests/fixtures/SPAUYU-3D2N-MP.json";

const transport = vi.hoisted(() => ({ client: null as ReturnType<typeof pgliteSupabase> | null }));
vi.mock("../lib/db", () => ({
  db: {
    from: (...args: Parameters<ReturnType<typeof pgliteSupabase>["from"]>) =>
      transport.client!.from(...args),
    rpc: (...args: Parameters<ReturnType<typeof pgliteSupabase>["rpc"]>) =>
      transport.client!.rpc(...args),
  },
  json: (value: unknown) => JSON.parse(JSON.stringify(value)),
  unwrap: ({ data, error }: { data: unknown; error: { message: string } | null }) => {
    if (error) throw new Error(error.message);
    if (data == null) throw new Error("Record not found or inaccessible");
    return data;
  },
}));
import {
  createQuoteFromTemplate,
  loadQuote,
  quotePricingInput,
  recalculateQuote,
} from "../lib/quotes";
import { listQuotes } from "../lib/quotes/list";

let pg: Awaited<ReturnType<typeof createDatabase>>;
const root = new URL("../../", import.meta.url);
const sql = (path: string) => readFile(new URL(path, root), "utf8");
let plan: Awaited<ReturnType<typeof budgetPlan>>;
beforeAll(async () => {
  plan = await budgetPlan();
  pg = await createDatabase();
  await seedDatabase(pg);
  const report = JSON.parse(await sql("supabase/seed/applied/blocks-report.json"));
  for (const file of report.seed_order) await pg.exec(await sql(`supabase/seed/applied/${file}`));
}, 30000);
afterAll(async () => pg?.close());

describe("importador de presupuesto SPAUYU · lectura, diff y seed", () => {
  it("reproduces the committed source fixture and keeps multi-day quantities", async () => {
    expect(plan.fixture).toEqual(reference);
    expect(plan.fixture.blockers).toEqual([]);
    expect(plan.unmatched).toEqual([]);
    expect(plan.fixture.lines.map((l) => l.cell)).toEqual([
      "F46",
      "F47",
      "F48",
      "F49",
      "F50",
      "F51",
      "F53",
      "F54",
      "F55",
      "F56",
      "F57",
      "F59",
      "F60",
    ]);
    expect(plan.fixture.lines.find((l) => l.cell === "F46")?.day).toBe(1);
    expect(plan.fixture.lines.find((l) => l.cell === "F55")?.day).toBe(2);
    expect(plan.fixture.input?.fx_snapshot["CLP"]).toBe(925.92);
    // The archived seed predates explicit provenance. Its business content must
    // stay byte-for-byte identical; only new import-origin metadata is added.
    const legacySql = plan.sql
      .replaceAll("day_blocks(catalog_origin,id,", "day_blocks(id,")
      .replaceAll("select 'importacion',md5(", "select md5(")
      .replaceAll("set catalog_origin='importacion',quote_defaults=", "set quote_defaults=");
    const normalizeEol = (value: string) => value.replaceAll("\r\n", "\n");
    expect(normalizeEol(legacySql)).toBe(
      normalizeEol(await sql("supabase/seed/04_spauyu_mp_2pax.sql")),
    );
  });
  it("does not silently accept compound lookup formulas or conflicting room SKUs", async () => {
    expect(
      parseLookup('=INDEX(TARIFARIO_MAESTRO!$H:$H,MATCH("A",TARIFARIO_MAESTRO!$Y:$Y,0))+10'),
    ).toBeNull();
    const workbook = await openBudgetWorkbook(
      fileURLToPath(new URL("data/import/presupuestos.xlsx", root)),
    );
    const scenario = extractScenario(
      workbook.sheet("SPAUYU-3D2N-MP"),
      workbook.sheet("TARIFARIO_MAESTRO"),
      "SPAUYU-3D2N-MP",
      5,
    );
    expect(scenario.blockers.some((b) => b.startsWith("F147:"))).toBe(true);
    expect(scenario.blockers.some((b) => b.startsWith("F148:"))).toBe(true);
    await expect(budgetPlan({ pax: 5 })).rejects.toThrow("Piloto limitado");
  });
  it("shows real differences and rejects missing/extra lines instead of fitting the engine", () => {
    const fixture = structuredClone(reference) as QuoteReference;
    fixture.input!.days[0]!.items[0]!.rates = [
      {
        season: "ALL",
        valid_from: null,
        valid_to: null,
        pax_min: 2,
        pax_max: 4,
        price_net: 135000,
      },
    ];
    const comparison = compareReference(fixture);
    expect(comparison.pass).toBe(false);
    expect(comparison.report).toContain("Tarifa, vigencia o cambio de moneda distinto");
    const missing = structuredClone(reference) as QuoteReference;
    missing.input!.days[0]!.items.pop();
    expect(compareReference(missing).pass).toBe(false);
    const extra = structuredClone(reference) as QuoteReference;
    extra.input!.days[0]!.items.push({ ...extra.input!.days[0]!.items[1]!, id: "extra" });
    expect(compareReference(extra).blockers.join()).toContain("Ítems no presentes");
  });
  it("applies only to the pilot, creates a quote matching every line, lists/reopens and is idempotent", async () => {
    const catalogSnapshot = () =>
      pg.query(
        "select * from (select 'services' kind,to_jsonb(s) data from services s union all select 'rates',to_jsonb(r) from service_rates r) snapshot order by kind,data::text",
      );
    const catalogBefore = await catalogSnapshot();
    const oldBlocks = await pg.query("select to_jsonb(i) data from day_block_items i order by id");
    const otherTemplates = () =>
      pg.query(
        "select to_jsonb(d) data from template_days d join itinerary_templates t on t.id=d.template_id where t.sku<>'SPAUYU-3D2N-MP' order by d.id",
      );
    const othersBefore = await otherTemplates();
    await pg.exec(plan.sql);
    expect(
      (
        await pg.query(
          "select catalog_origin from day_blocks where code like 'IMPORT_SPAUYU_MP_2PAX_D%' order by code",
        )
      ).rows,
    ).toEqual(Array.from({ length: 3 }, () => ({ catalog_origin: "importacion" })));
    expect(
      (await pg.query("select catalog_origin from itinerary_templates where sku='SPAUYU-3D2N-MP'"))
        .rows,
    ).toEqual([{ catalog_origin: "importacion" }]);
    expect(await catalogSnapshot()).toEqual(catalogBefore);
    expect(await otherTemplates()).toEqual(othersBefore);
    const newItems = await pg.query("select to_jsonb(i) data from day_block_items i order by id");
    expect(newItems.rows).toEqual(expect.arrayContaining(oldBlocks.rows));
    expect(newItems.rows.length - oldBlocks.rows.length).toBe(13);
    const admin = "00000000-0000-0000-0000-000000000091";
    await pg.exec(
      `insert into auth.users(id,email)values('${admin}','budget@test.invalid');update profiles set role='admin' where id='${admin}';set role authenticated;select set_config('request.jwt.claim.sub','${admin}',false);`,
    );
    transport.client = pgliteSupabase(pg);
    const client = (
      await pg.query<{ id: string }>(
        "insert into clients(type,name)values('B2C','Presupuesto MP')returning id",
      )
    ).rows[0]!;
    const template = (
      await pg.query<{ id: string }>(
        "select id from itinerary_templates where sku='SPAUYU-3D2N-MP'",
      )
    ).rows[0]!;
    const { days: _days, ...basics } = plan.fixture.input!;
    // Explicit approval in the isolated acceptance fixture, not in the import seed.
    await pg.query("update itinerary_templates set status='activo' where id=$1", [template.id]);
    const quote = await createQuoteFromTemplate(template.id, {
      ...basics,
      rooming: { paying: {}, tc: {} },
      vehicles: {},
      client_id: client.id,
      client_type: "B2C",
      language: "es",
      category: "COMFORT",
      tour_sku: "SPAUYU-3D2N-MP",
    });
    const result = await recalculateQuote(quote.id);
    const saved = await loadQuote(quote.id);
    const actual = quotePricingInput(saved);
    for (const day of actual.days)
      for (const item of day.items) {
        const snapshot = saved.items.find((i) => i.id === item.id)!.pricing_snapshot as {
          _source_cell: string;
        };
        item.id = snapshot._source_cell;
      }
    const comparison = compareReference(plan.fixture, actual);
    expect(comparison.pass, comparison.report).toBe(true);
    expect(result).toMatchObject({
      total_cost_usd: 1939,
      total_price_usd: 2423.75,
      price_per_pax_usd: 1211.88,
    });
    const listed = await listQuotes({
      client: "Presupuesto MP",
      code: quote.code,
      status: "borrador",
      page: 0,
    });
    expect(listed.count).toBe(1);
    expect(await loadQuote(listed.rows[0]!.id)).toEqual(saved);
    await expect(
      createQuoteFromTemplate(template.id, {
        ...basics,
        pax_paying: 3,
        client_id: client.id,
        client_type: "B2C",
        language: "es",
        category: "COMFORT",
        tour_sku: "SPAUYU-3D2N-MP",
      }),
    ).rejects.toThrow("2 pasajeros + 0 TC");
    await pg.exec("reset role");
    await pg.exec(plan.sql);
    expect(await pg.query("select to_jsonb(i) data from day_block_items i order by id")).toEqual(
      newItems,
    );
    expect(await loadQuote(quote.id)).toEqual(saved);
  });
});
