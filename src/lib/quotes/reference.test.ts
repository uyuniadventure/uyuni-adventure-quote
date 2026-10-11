// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { createDatabase, seedDatabase } from "../../../scripts/db/local-db.mjs";
import { pgliteSupabase } from "@/test/pglite-supabase";
import reference from "../../../docs/fase0/references/uyuuyu-ltd-2pax.json";

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
import {
  createQuoteFromTemplate,
  loadQuote,
  recalculateQuote,
  updateQuoteItem,
  type QuoteBasics,
} from "./index";
import { listQuotes } from "./list";
import { assertCompleteCalculation, type Rate } from "../pricing";
import type { Json } from "../../types/db";

let pg: Awaited<ReturnType<typeof createDatabase>>;
let templateId: string, clientId: string;
const seller = "00000000-0000-0000-0000-000000000001";
const otherSeller = "00000000-0000-0000-0000-000000000002";
const root = new URL("../../../", import.meta.url);
const sql = (path: string) => readFile(new URL(path, root), "utf8");
const basics = (): QuoteBasics => ({
  client_id: clientId,
  client_type: "B2C",
  language: "es",
  category: "COMFORT",
  tour_sku: reference.sku,
  // The source has no departure date. This test date is inside the 2026 rates.
  start_date: "2026-10-14",
  pax_paying: reference.pax_paying,
  tc_count: reference.tc_count,
  rooming: { paying: {}, tc: {} },
  vehicles: {},
  staff: { drivers: 0, guides: 0 },
  fx_snapshot: { USD: 1 },
  margin_pct: reference.margin_pct,
  rounding_rule: { mode: "none", increment: 1 },
  pax_scenarios: [],
});
beforeAll(async () => {
  pg = await createDatabase();
  await seedDatabase(pg);
  const report = JSON.parse(await sql("supabase/seed/applied/blocks-report.json"));
  for (const file of report.seed_order) await pg.exec(await sql(`supabase/seed/applied/${file}`));
  await pg.exec(await sql("supabase/seed/03_uyuuyu_ltd_2pax.sql"));
  templateId = (
    await pg.query<{ id: string }>("select id from itinerary_templates where sku=$1", [
      reference.sku,
    ])
  ).rows[0]!.id;
  await pg.exec(
    `insert into auth.users(id,email)values('${seller}','seller@test.invalid'),('${otherSeller}','other@test.invalid'); update profiles set role='admin' where id='${seller}'; set role authenticated; select set_config('request.jwt.claim.sub','${seller}',false);`,
  );
  clientId = (
    await pg.query<{ id: string }>(
      "insert into clients(type,name)values('B2C','Referencia LTd')returning id",
    )
  ).rows[0]!.id;
  transport.client = pgliteSupabase(pg);
}, 30000);
afterAll(async () => {
  await pg?.close();
});

describe("UYUUYU-3D2N-LTd · Sheets, 2 pasajeros", () => {
  it("creates the real template snapshot, matches every Sheets line and reopens from the filtered list", async () => {
    const quote = await createQuoteFromTemplate(templateId, basics());
    const result = await recalculateQuote(quote.id);
    assertCompleteCalculation(result);
    const saved = await loadQuote(quote.id);
    const differences = reference.rows
      .map((expected) => {
        const item = saved.items.find(
          (i) =>
            (i.pricing_snapshot as { _source_cell?: string })._source_cell === expected.source_cell,
        );
        const actual = result.items.find((i) => i.id === item?.id);
        return `${expected.source_cell} | ${expected.description} | Sheets ${expected.cost_usd} | app ${actual?.total_cost_usd ?? "MISSING"} | delta ${actual?.total_cost_usd != null ? actual.total_cost_usd - expected.cost_usd : "MISSING"}`;
      })
      .join("\n");
    expect(result.items, differences).toHaveLength(reference.rows.length);
    for (const expected of reference.rows) {
      const item = saved.items.find(
        (i) =>
          (i.pricing_snapshot as { _source_cell?: string })._source_cell === expected.source_cell,
      )!;
      const actual = result.items.find((i) => i.id === item?.id);
      expect(actual, differences).toBeDefined();
      expect(actual!.total_cost_usd, differences).toBeCloseTo(expected.cost_usd, 2);
      expect(actual!.quantity, differences).toBe(expected.quantity);
    }
    expect(Math.abs(result.total_cost_usd - reference.cost_usd), differences).toBeLessThanOrEqual(
      1,
    );
    expect(result.total_price_usd, differences).toBe(reference.total_price_usd);
    expect(result.price_per_pax_usd).toBe(reference.price_per_pax_usd);
    expect(saved.quote.rooming).toEqual(reference.rooming);
    expect(saved.quote.staff).toEqual(reference.staff);
    expect(saved.quote.margin_pct).toBe(25);
    const listed = await listQuotes({
      client: "Referencia",
      code: quote.code,
      status: "borrador",
      page: 0,
    });
    expect(listed.count).toBe(1);
    expect(listed.rows[0]!.id).toBe(quote.id);
    expect(listed.rows[0]!.total_price_usd).toBe(reference.total_price_usd);
    expect(await loadQuote(listed.rows[0]!.id)).toEqual(saved);

    // Editing and reopening must retain the override without touching the master.
    const item = saved.items.find(
      (i) => (i.pricing_snapshot as { _source_cell?: string })._source_cell === "F49",
    )!;
    await updateQuoteItem(item.id, {
      price_overridden: true,
      unit_cost_original: 21,
      override_note: "Prueba de persistencia",
    });
    await recalculateQuote(quote.id);
    const reopened = await loadQuote(quote.id);
    expect(reopened.items.find((i) => i.id === item.id)?.unit_cost_original).toBe(21);
    expect(reopened.quote.total_cost_usd).toBe(1477);
    const master = await pg.query<{ data: { price_net: number } }>(
      "select to_jsonb(r) data from service_rates r where service_id=$1",
      [item.service_id],
    );
    expect(master.rows[0]!.data.price_net).toBe(20);
  });

  it("keeps the margin editable and rejects an unconfigured passenger scenario", async () => {
    const quote = await createQuoteFromTemplate(templateId, basics());
    // The quote panel persists margin edits on the quote under the caller's RLS.
    await pg.query("update quotes set margin_pct=10 where id=$1", [quote.id]);
    const result = await recalculateQuote(quote.id);
    expect(result.total_cost_usd).toBe(1475);
    expect(result.total_price_usd).toBe(1622.5);
    expect((await loadQuote(quote.id)).quote.margin_pct).toBe(10);
    const before = (await listQuotes({ client: "", code: "", status: "all", page: 0 })).count;
    await expect(
      createQuoteFromTemplate(templateId, { ...basics(), pax_paying: 3 }),
    ).rejects.toThrow("2 pasajeros + 0 TC");
    expect((await listQuotes({ client: "", code: "", status: "all", page: 0 })).count).toBe(before);
  });

  it("filters related client names and statuses in SQL and respects quote RLS", async () => {
    expect(
      (await listQuotes({ client: "No existe", code: "", status: "all", page: 0 })).count,
    ).toBe(0);
    expect((await listQuotes({ client: "", code: "", status: "vendida", page: 0 })).count).toBe(0);
    await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [otherSeller]);
    try {
      expect(
        (await listQuotes({ client: "Referencia", code: "", status: "all", page: 0 })).count,
      ).toBe(0);
    } finally {
      await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [seller]);
    }
  });

  it("persists missing-price errors, reopens their warnings and recovers after a documented override", async () => {
    const quote = await createQuoteFromTemplate(templateId, basics());
    await recalculateQuote(quote.id);
    const saved = await loadQuote(quote.id);
    const item = saved.items.find(
      (i) => (i.pricing_snapshot as { _source_cell?: string })._source_cell === "F49",
    )!;
    const snapshot = item.pricing_snapshot as unknown as { rates: Rate[] };
    await updateQuoteItem(item.id, {
      pricing_snapshot: {
        ...snapshot,
        rates: snapshot.rates.map((r) => ({
          ...r,
          price_net: null,
          price_rack: null,
        })),
      } as unknown as Json,
    });
    // Remove unrelated review blockers in this test quote, not the master template.
    await pg.query(
      "update quote_days set snapshot=snapshot || '{\"reviewed\":true}' where quote_id=$1",
      [quote.id],
    );
    await pg.query(
      "update quotes set pricing_config=pricing_config || '{\"unresolved\":[]}' where id=$1",
      [quote.id],
    );
    const result = await recalculateQuote(quote.id);
    expect(result.status).toBe("error");
    const reopened = await loadQuote(quote.id);
    expect(reopened.quote.calculation).toEqual(result);
    expect(reopened.quote.total_cost_usd).toBeNull();
    expect(reopened.quote.total_price_usd).toBeNull();
    expect(reopened.items.find((i) => i.id === item.id)).toMatchObject({
      total_cost_usd: null,
      total_cost_local: null,
    });
    expect(result.warnings).toContain(`${item.id}: sin costo neto ni rack`);
    await expect(
      pg.query("update quotes set status='revisada' where id=$1", [quote.id]),
    ).rejects.toThrow("errores de cálculo");
    await expect(
      pg.query("update quotes set pdf_path=$2 where id=$1", [quote.id, `${quote.id}/invalid.pdf`]),
    ).rejects.toThrow("errores de cálculo");
    // A valid override resolves the quote without filling a master price or altering the source snapshot.
    await updateQuoteItem(item.id, {
      price_overridden: true,
      unit_cost_original: 20,
      override_note: "Proveedor confirmó",
    });
    expect(await recalculateQuote(quote.id)).toMatchObject({
      status: "ok",
      total_cost_usd: 1475,
      warnings: [],
    });
    await pg.query("update quotes set status='revisada' where id=$1", [quote.id]);
    expect((await loadQuote(quote.id)).quote.status).toBe("revisada");
  });

  it("reapplying the reference seed preserves template edits, prior quotes and unrelated templates", async () => {
    await pg.exec("reset role");
    const tables = [
      "itinerary_templates",
      "template_days",
      "day_blocks",
      "day_block_items",
      "day_block_translations",
      "quotes",
      "quote_days",
      "quote_items",
    ];
    await pg.query("update day_blocks set route_from='UYU' where code='REF_UYUUYU_LTD_2PAX_D2'");
    await pg.query(
      "update template_days set block_id=(select id from day_blocks where code not like 'REF_UYUUYU_LTD_2PAX_%' order by id limit 1) where template_id=$1 and day_number=3",
      [templateId],
    );
    await pg.query(
      "delete from day_block_items where id=md5('uyuuyu-ltd-2pax-20261011:item:F63')::uuid",
    );
    const snapshot = async () =>
      Promise.all(
        tables.map((t) =>
          pg
            .query(`select to_jsonb(t) data from ${t} t order by id`)
            .then((r: { rows: unknown[] }) => r.rows),
        ),
      );
    const before = await snapshot();
    await pg.exec(await sql("supabase/seed/03_uyuuyu_ltd_2pax.sql"));
    expect(await snapshot()).toEqual(before);
    await pg.exec(
      `set role authenticated; select set_config('request.jwt.claim.sub','${seller}',false);`,
    );
  });
});
