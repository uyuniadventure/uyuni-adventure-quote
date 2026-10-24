// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { createDatabase, seedDatabase, execArchivedSeed } from "../../../scripts/db/local-db.mjs";
import { pgliteSupabase } from "../../test/pglite-supabase";
const transport = vi.hoisted(() => ({ client: null as ReturnType<typeof pgliteSupabase> | null }));
vi.mock("../db", () => ({
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
import { createQuoteFromTemplate, loadQuote, recalculateQuote, type QuoteBasics } from "./index";
import { assertCompleteCalculation } from "../pricing";

let pg: Awaited<ReturnType<typeof createDatabase>>;
let templateId: string, clientId: string;
let fx: Record<string, number>;
const admin = "00000000-0000-0000-0000-000000000021";
const basics = (pax = 2): QuoteBasics => ({
  client_id: clientId,
  client_type: "B2C",
  language: "es",
  category: "COMFORT",
  tour_sku: "SPAUYU-3D2N-MP",
  start_date: "2026-10-14",
  pax_paying: pax,
  tc_count: 0,
  rooming: { paying: {}, tc: {} },
  vehicles: {},
  staff: { drivers: 0, guides: 0 },
  fx_snapshot: fx,
  margin_pct: 25,
  rounding_rule: { mode: "none", increment: 1 },
});
beforeAll(async () => {
  pg = await createDatabase();
  await seedDatabase(pg);
  const root = new URL("../../../supabase/seed/applied/", import.meta.url);
  const report = JSON.parse(await readFile(new URL("blocks-report.json", root), "utf8"));
  for (const file of report.seed_order)
    await execArchivedSeed(pg, await readFile(new URL(file, root), "utf8"));
  templateId = (
    await pg.query<{ id: string }>("select id from itinerary_templates where sku='SPAUYU-3D2N-MP'")
  ).rows[0]!.id;
  const rates = (
    await pg.query<{ currency: string; rate: number }>(
      "select distinct on(currency) currency,rate_to_usd::float8 rate from exchange_rates order by currency,valid_from desc",
    )
  ).rows;
  fx = { USD: 1, ...Object.fromEntries(rates.map((r) => [r.currency, r.rate])) };
  await pg.exec(
    `insert into auth.users(id,email) values('${admin}','config@test.invalid'); update profiles set role='admin' where id='${admin}'; set role authenticated; select set_config('request.jwt.claim.sub','${admin}',false);`,
  );
  clientId = (
    await pg.query<{ id: string }>(
      "insert into clients(type,name) values('B2C','Configuración por defecto') returning id",
    )
  ).rows[0]!.id;
  transport.client = pgliteSupabase(pg);
  await pg.query("update itinerary_templates set status='activo' where id=$1", [templateId]);
}, 120000);
afterAll(async () => pg?.close());

describe("SPAUYU-3D2N-MP from unchanged imported data", () => {
  it.each([2, 3])(
    "creates and reopens a complete, nonzero quote for %i pax with default warnings",
    async (pax) => {
      const source = () =>
        pg.query<{ data: { pricing_config: object } }>(
          "select to_jsonb(i) data from day_block_items i join template_days d on d.block_id=i.block_id where d.template_id=$1 order by i.id",
          [templateId],
        );
      const before = (await source()).rows;
      expect(before.length).toBeGreaterThan(0);
      expect(
        before.every(
          (r) => Object.keys((r.data as { pricing_config: object }).pricing_config).length === 0,
        ),
      ).toBe(true);
      const quote = await createQuoteFromTemplate(templateId, basics(pax));
      const result = await recalculateQuote(quote.id);
      assertCompleteCalculation(result);
      expect(result.total_price_usd).toBeGreaterThan(0);
      expect(result.items.every((i) => i.status === "ok")).toBe(true);
      expect(result.warnings.join(" ")).toContain("Habitaciones por defecto");
      const saved = await loadQuote(quote.id);
      const hotels = saved.items.filter((i) => i.type === "alojamiento");
      expect(hotels.length).toBeGreaterThanOrEqual(3);
      expect(hotels.filter(i=>i.selected)).toHaveLength(pax===3 ? 3 : 2);
      const amount = (sku: string) =>
        result.items.find((r) => r.id === hotels.find((i) => i.sku === sku)?.id)?.total_cost_usd;
      expect(amount("HTL_MALLKU_VILLAMAR_DBL_2026")).toBe(312);
      expect(amount("HTL_MALLKU_VILLAMAR_SGL_2026")).toBe(pax === 3 ? 312 : 0);
      expect(amount("HTL_PDS_COLCHANI_STANDARD_DRY_2026")).toBe(pax === 3 ? 892 : 446);
      // Independent source ledger: one circuit, buffet, 2 lunches + 2 cocktails,
      // selected hotel nights, two dinners + tickets per pax, two CLP transfers.
      const expectedCost =
        690 +
        20 +
        2 * 15 +
        2 * 10 +
        (pax === 2 ? 312 + 446 : 2 * 312 + 2 * 446) +
        pax * (44 + 44 + 30) +
        (2 * 125000) / fx["CLP"]!;
      expect(result.total_cost_usd).toBeCloseTo(expectedCost, 2);
      expect(saved.quote.calculation).toEqual(result);
      expect(await recalculateQuote(quote.id)).toEqual(result);
      // User choices remain empty (automatic), so changing pax recalculates defaults.
      expect(saved.quote.rooming).toEqual({ paying: {}, tc: {} });
      expect((await source()).rows).toEqual(before);
    },
  );
  it("keeps an explicit quote distribution when creating and reopening a template", async () => {
    const rooming = { paying: { DBL: 2 }, tc: {} };
    const quote = await createQuoteFromTemplate(templateId, { ...basics(4), rooming });
    const result = await recalculateQuote(quote.id);
    assertCompleteCalculation(result);
    expect(result.effective_rooming).toEqual(rooming);
    expect(result.warnings.some((w) => w.startsWith("Habitaciones por defecto"))).toBe(false);
    expect((await loadQuote(quote.id)).quote.rooming).toEqual(rooming);
  });
  it("validates and freezes explicit day-link configurations before saving automatic vehicle choices", async () => {
    // Only isolated test links are changed; all tariff amounts remain imported.
    const links = (
      await pg.query<{ id: string; sku: string; pricing_config: object }>(
        "select i.id,s.sku,i.pricing_config from day_block_items i join template_days d on d.block_id=i.block_id join services s on s.id=i.service_id where d.template_id=$1 and (s.sku='HTL_MALLKU_VILLAMAR_DBL_2026' or s.sku='TRF_DIEGO_COLQUE_SPA_HITO_CAJON_2_4PAX_2026')",
        [templateId],
      )
    ).rows;
    try {
      for (const link of links)
        await pg.query("update day_block_items set pricing_config=$2 where id=$1", [
          link.id,
          link.sku.startsWith("HTL_")
            ? { room_type: "DBL", nights: 2 }
            : { pricing_unit: "per_vehicle", vehicle_segment: "chile" },
        ]);
      const quote = await createQuoteFromTemplate(templateId, {
        ...basics(3),
        tc_count: 1,
        staff: { drivers: 1, guides: 1 },
      });
      const result = await recalculateQuote(quote.id);
      assertCompleteCalculation(result);
      const saved = await loadQuote(quote.id);
      const transfers = saved.items.filter((i) => i.pricing_unit === "per_vehicle");
      expect(transfers).toHaveLength(2);
      for (const item of transfers)
        expect(result.items.find((r) => r.id === item.id)).toMatchObject({
          quantity: 1,
          unit_cost_original: 130000,
          pricing_config: { vehicle_segment: "chile", rate_band: { pax_min: 5, pax_max: 9 } },
        });
      const hotel = saved.items.find((i) => i.sku === "HTL_MALLKU_VILLAMAR_DBL_2026")!;
      expect(hotel.pricing_snapshot).toMatchObject({
        pricing_config: { room_type: "DBL", nights: 2 },
      });
      expect(result.items.find((r) => r.id === hotel.id)?.total_cost_usd).toBe(624);
      expect(saved.quote.calculation).toEqual(result);
      // Restore the catalog first; this quote must still use its own frozen config/rates.
      for (const link of links)
        await pg.query("update day_block_items set pricing_config=$2 where id=$1", [
          link.id,
          link.pricing_config,
        ]);
      expect(await recalculateQuote(quote.id)).toEqual(result);
    } finally {
      for (const link of links)
        await pg.query("update day_block_items set pricing_config=$2 where id=$1", [
          link.id,
          link.pricing_config,
        ]);
    }
  });
});
