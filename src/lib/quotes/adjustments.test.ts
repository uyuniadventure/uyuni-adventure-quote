// @vitest-environment node
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createDatabase, seedDatabase } from "../../../scripts/db/local-db.mjs";
import { pgliteSupabase } from "@/test/pglite-supabase";
import reference from "../../../tests/fixtures/SPAUYU-3D2N-MP.json";
import { calculateQuote, type QuoteInput } from "../pricing";
import { adjustmentTargets } from "./adjustment-filter";

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
  applyAdjustmentBulk,
  createQuoteFromTemplate,
  loadQuote,
  quotePricingInput,
  recalculateQuote,
  updateQuoteItem,
} from "./index";

let pg: Awaited<ReturnType<typeof createDatabase>>;
let templateId: string, clientId: string;
const admin = "30000000-0000-0000-0000-000000000001";
const seller = "30000000-0000-0000-0000-000000000002";
const other = "30000000-0000-0000-0000-000000000003";
const one = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) =>
  (await pg.query<T>(sql, args)).rows[0]!;
const actAs = (id: string) => pg.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
beforeAll(async () => {
  pg = await createDatabase();
  await seedDatabase(pg);
  const root = new URL("../../../", import.meta.url);
  const read = (path: string) => readFile(new URL(path, root), "utf8");
  const blocks = JSON.parse(await read("supabase/seed/applied/blocks-report.json"));
  for (const file of blocks.seed_order) await pg.exec(await read(`supabase/seed/applied/${file}`));
  await pg.exec(await read("supabase/seed/04_spauyu_mp_2pax.sql"));
  await pg.query(
    "insert into auth.users(id,email) values($1,'admin@adjust.test'),($2,'seller@adjust.test'),($3,'other@adjust.test')",
    [admin, seller, other],
  );
  await pg.query("update profiles set role='admin' where id=$1", [admin]);
  await pg.exec("set role authenticated");
  await actAs(admin);
  templateId = (
    await one<{ id: string }>("select id from itinerary_templates where sku='SPAUYU-3D2N-MP'")
  ).id;
  clientId = (
    await one<{ id: string }>(
      "insert into clients(type,name) values('B2C','Adjustment test') returning id",
    )
  ).id;
  transport.client = pgliteSupabase(pg);
  await pg.query("update itinerary_templates set status='activo' where id=$1", [templateId]);
}, 30000);
beforeEach(async () => {
  await pg.exec("set role authenticated");
  await actAs(admin);
});
afterAll(async () => pg?.close());

async function pilot() {
  const { days: _days, ...basics } = reference.input as unknown as QuoteInput;
  const q = await createQuoteFromTemplate(templateId, {
    ...basics,
    client_id: clientId,
    client_type: "B2C",
    language: "es",
    category: "COMFORT",
    tour_sku: "SPAUYU-3D2N-MP",
  });
  await pg.query("update quotes set seller_id=$1 where id=$2", [seller, q.id]);
  await actAs(seller);
  await recalculateQuote(q.id);
  return q.id;
}
const catalog = () =>
  one(
    "select (select jsonb_agg(s order by id) from services s) services, (select jsonb_agg(r order by id) from service_rates r) rates",
  );
async function rpc(
  data: Awaited<ReturnType<typeof loadQuote>>,
  filter: object,
  pct: number,
  result: unknown,
) {
  return pg.query("select public.apply_quote_adjustment_bulk($1,$2,$3,$4,$5,$6)", [
    data.quote.id,
    filter,
    pct,
    "test note",
    data.quote.updated_at,
    result,
  ]);
}
describe("ajustes de cotización atómicos", () => {
  it("adjusts only transport in SPAUYU 2 pax, leaves rates untouched and reopens with the same totals", async () => {
    const master = await catalog();
    const id = await pilot();
    const before = await loadQuote(id);
    expect(before.items.every((i) => i.adjustment_pct === 0 && i.adjustment_note === null)).toBe(
      true,
    );
    const beforeResult = calculateQuote(quotePricingInput(before));
    const applied = await applyAdjustmentBulk(id, { type: "transporte" }, 6.4, "combustible 2027");
    const after = await loadQuote(id);
    expect(applied.affected_item_ids.length).toBeGreaterThan(0);
    for (const item of after.items) {
      const prior = before.items.find((i) => i.id === item.id)!;
      const oldCost = beforeResult.items.find((i) => i.id === item.id)!;
      const newCost = applied.calculation.items.find((i) => i.id === item.id)!;
      expect(item.adjustment_pct).toBe(item.type === "transporte" ? 6.4 : 0);
      expect(item.adjustment_note).toBe(item.type === "transporte" ? "combustible 2027" : null);
      expect(item.pricing_snapshot).toEqual(prior.pricing_snapshot);
      expect(item.unit_cost_original).toBe(prior.unit_cost_original);
      expect(newCost.total_cost_usd).toBeCloseTo(
        oldCost.total_cost_usd! * (item.type === "transporte" ? 1.064 : 1),
        8,
      );
      expect(newCost.total_margin_usd).toBe(oldCost.total_margin_usd);
    }
    expect(after.quote.calculation).toEqual(applied.calculation);
    expect(await recalculateQuote(id)).toEqual(applied.calculation);
    expect(
      (await applyAdjustmentBulk(id, { type: "transporte" }, 6.4, "combustible 2027")).calculation,
    ).toEqual(applied.calculation);
    await actAs(admin);
    expect(await catalog()).toEqual(master);
  });
  it("filters by supplier, day and explicit IDs, combines filters, and expands a multi-day purchase", async () => {
    const id = await pilot();
    let data = await loadQuote(id);
    const meal = data.items.find((i) => i.type === "comida" && i.supplier_id)!;
    const supplier = await applyAdjustmentBulk(
      id,
      { supplier_id: meal.supplier_id!, type: "comida" },
      -10,
    );
    expect(supplier.affected_item_ids.sort()).toEqual(
      data.items
        .filter((i) => i.supplier_id === meal.supplier_id && i.type === "comida")
        .map((i) => i.id)
        .sort(),
    );
    const byDay = await applyAdjustmentBulk(id, { day_number: 1, type: "alojamiento" }, 4);
    const first = data.days.find((d) => d.day_number === 1)!;
    expect(byDay.affected_item_ids.sort()).toEqual(
      data.items
        .filter((i) => i.quote_day_id === first.id && i.type === "alojamiento")
        .map((i) => i.id)
        .sort(),
    );
    const covered = data.items.find((i) => i.day_span > 1 && i.quote_day_id !== first.id)!;
    const purchase = (covered.pricing_snapshot as { coverage_key: string }).coverage_key;
    const explicit = await applyAdjustmentBulk(
      id,
      { item_ids: [covered.id] },
      3,
      "Compra completa",
    );
    data = await loadQuote(id);
    const copies = data.items.filter(
      (i) => (i.pricing_snapshot as { coverage_key?: string }).coverage_key === purchase,
    );
    expect(copies.length).toBe(3);
    expect(explicit.matched_item_ids).toEqual([covered.id]);
    expect(explicit.affected_item_ids.sort()).toEqual(copies.map((i) => i.id).sort());
    expect(copies.every((i) => i.adjustment_pct === 3)).toBe(true);
    expect(
      explicit.calculation.items.filter(
        (i) => copies.some((c) => c.id === i.id) && i.total_cost_usd! > 0,
      ),
    ).toHaveLength(1);
    await expect(applyAdjustmentBulk(id, {}, 4)).rejects.toThrow("filtro");
    await expect(applyAdjustmentBulk(id, { item_ids: [] }, 4)).rejects.toThrow();
    await expect(applyAdjustmentBulk(id, { type: "vuelo" }, 4)).rejects.toThrow("ningún");
  });
  it("rejects stale revisions, foreign selections, unauthorized users and partial calculations without partial updates", async () => {
    const id = await pilot();
    const before = await loadQuote(id);
    const targets = adjustmentTargets(before.days, before.items, { type: "transporte" });
    const draft = structuredClone(before);
    for (const i of draft.items) if (targets.affectedIds.includes(i.id)) i.adjustment_pct = 6.4;
    const result = calculateQuote(quotePricingInput(draft));
    const partial = structuredClone(result);
    partial.items.pop();
    await expect(rpc(before, { type: "transporte" }, 6.4, partial)).rejects.toThrow("Incomplete");
    expect(await loadQuote(id)).toEqual(before);
    const foreignId = "30000000-0000-0000-0000-000000000099";
    await expect(
      rpc(before, { item_ids: [before.items[0]!.id, foreignId] }, 6.4, result),
    ).rejects.toThrow("ajenos");
    await actAs(other);
    await expect(rpc(before, { type: "transporte" }, 6.4, result)).rejects.toThrow();
    await expect(applyAdjustmentBulk(id, { type: "transporte" }, 6.4)).rejects.toThrow();
    await actAs(seller);
    expect(await loadQuote(id)).toEqual(before);
    await pg.query("update quote_items set description=description || ' edit' where id=$1", [
      before.items[0]!.id,
    ]);
    const edited = await loadQuote(id);
    await expect(rpc(before, { type: "transporte" }, 6.4, result)).rejects.toThrow("cambió");
    expect(await loadQuote(id)).toEqual(edited);
  });
  it("item edits and sent versions preserve adjustments; promoted templates do not inherit them", async () => {
    const id = await pilot();
    await applyAdjustmentBulk(id, { type: "transporte" }, 6.4, "combustible 2027");
    let data = await loadQuote(id);
    const selected = data.items.find((i) => i.type === "transporte")!;
    await updateQuoteItem(selected.id, { adjustment_pct: -10, adjustment_note: "Acuerdo privado" });
    await recalculateQuote(id);
    data = await loadQuote(id);
    expect(data.items.find((i) => i.id === selected.id)).toMatchObject({
      adjustment_pct: -10,
      adjustment_note: "Acuerdo privado",
    });
    await pg.query(
      "update quote_days set snapshot=snapshot || '{\"reviewed\":true}' where quote_id=$1",
      [id],
    );
    await pg.query(
      "update quotes set pricing_config=pricing_config || '{\"unresolved\":[]}' where id=$1",
      [id],
    );
    await recalculateQuote(id);
    await pg.query("select public.transition_quote($1,'revisada')", [id]);
    await pg.query("select public.transition_quote($1,'enviada')", [id]);
    const sent = await loadQuote(id);
    await expect(applyAdjustmentBulk(id, { type: "transporte" }, 5)).rejects.toThrow(
      "nueva versión",
    );
    expect(await loadQuote(id)).toEqual(sent);
    const next = (await one<{ id: string }>("select public.version_quote($1) id", [id])).id;
    const version = await loadQuote(next);
    for (const i of version.items) {
      const original = sent.items.find(
        (s) => s.id === (i.pricing_snapshot as { _version_source_id: string })._version_source_id,
      )!;
      expect([i.adjustment_pct, i.adjustment_note]).toEqual([
        original.adjustment_pct,
        original.adjustment_note,
      ]);
    }
    expect(await recalculateQuote(next)).toMatchObject({
      total_cost_usd: sent.quote.total_cost_usd,
      total_price_usd: sent.quote.total_price_usd,
    });
    const template = (
      await one<{ id: string }>("select public.promote_quote_template($1) id", [next])
    ).id;
    const snapshots = await pg.query<{
      snapshot: { adjustment_pct: number; adjustment_note: string | null };
    }>(
      "select i.item_snapshot snapshot from day_block_items i join template_days d on d.block_id=i.block_id where d.template_id=$1",
      [template],
    );
    expect(
      snapshots.rows.every(
        (r) => r.snapshot.adjustment_pct === 0 && r.snapshot.adjustment_note === null,
      ),
    ).toBe(true);
  });
});
