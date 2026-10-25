// @vitest-environment node
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createDatabase, seedDatabase } from "../../../scripts/db/local-db.mjs";
import { pgliteSupabase } from "@/test/pglite-supabase";
import fixture from "../../../tests/fixtures/SPAUYU-3D2N-MP.json";
import type { QuoteResult } from "../pricing";

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
  createEmptyQuote,
  loadQuote,
  recalculateQuote,
  applyAdjustmentBulk,
  type TemplateQuoteBasics,
  type QuoteBasics,
} from "./index";

import {
  addBlockDay,
  addBlockDays,
  deleteDay,
  groupDays,
  moveDay,
  resolveDay,
  resetDayField,
  saveDayAsNewBlock,
  setDayLinkType,
  ungroup,
  updateDayContent,
  validateContinuity,
} from "./days";
import { loadTemplateSource } from "./template-source";
vi.setConfig({ testTimeout: 30000 });
let pg: Awaited<ReturnType<typeof createDatabase>>;
let templateId: string, clientId: string;
const admin = "40000000-0000-0000-0000-000000000001";
const seller = "40000000-0000-0000-0000-000000000002";
const one = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) =>
  (await pg.query<T>(sql, args)).rows[0]!;
const as = (id: string) => pg.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
const basics = (): TemplateQuoteBasics => ({
  client_id: clientId,
  language: "es",
  start_date: fixture.input.start_date,
  pax_paying: 2,
  tc_count: 0,
  fx_snapshot: fixture.input.fx_snapshot,
  vehicles: fixture.input.vehicles,
});
beforeAll(async () => {
  pg = await createDatabase();
  await seedDatabase(pg);
  const root = new URL("../../../", import.meta.url);
  const read = (path: string) => readFile(new URL(path, root), "utf8");
  const blocks = JSON.parse(await read("supabase/seed/applied/blocks-report.json"));
  for (const file of blocks.seed_order) await pg.exec(await read(`supabase/seed/applied/${file}`));
  await pg.exec(await read("supabase/seed/04_spauyu_mp_2pax.sql"));
  templateId = (
    await one<{ id: string }>("select id from itinerary_templates where sku='SPAUYU-3D2N-MP'")
  ).id;
  await pg.query(
    "insert into auth.users(id,email) values($1,'creation-admin@test.invalid'),($2,'creation-seller@test.invalid')",
    [admin, seller],
  );
  await pg.query("update profiles set role='admin' where id=$1", [admin]);
  // Local acceptance fixture only. Production approval still requires Andrea's OK.
  await pg.query("update itinerary_templates set status='activo' where id=$1", [templateId]);
  await pg.query(
    "update services set status='activo' where id in(select i.service_id from day_block_items i join template_days d on d.block_id=i.block_id where d.template_id=$1)",
    [templateId],
  );
  await pg.exec("set role authenticated");
  await as(admin);
  clientId = (
    await one<{ id: string }>(
      "insert into clients(type,name) values('B2C','Creación atómica') returning id",
    )
  ).id;
  transport.client = pgliteSupabase(pg);
}, 60000);
beforeEach(async () => {
  vi.restoreAllMocks();
  await pg.exec("set role authenticated");
  await as(admin);
});
afterAll(async () => pg?.close());

async function newQuote() {
  return loadQuote((await createQuoteFromTemplate(templateId, basics())).id);
}
async function freeBlock() {
  const b = await one<{ id: string }>(
    "insert into day_blocks(code,start_point,end_point,status) values('FREE-'||gen_random_uuid(),'Uyuni','La Paz','activo') returning id",
  );
  await pg.query(
    "insert into day_block_translations(block_id,lang,title,description) values($1,'es','Día libre','Sin servicios'),($1,'it','Giorno libero','Tempo libero')",
    [b.id],
  );
  return b.id;
}
describe("días congelados, grupos y operaciones atómicas", () => {
  it("reuses one catalog block in separate quotes and persists both snapshots on reload", async () => {
    const blockId = await freeBlock();
    const quoteBasics = (sku: string): QuoteBasics =>
      ({
        ...basics(),
        client_type: "B2C",
        category: "COMFORT",
        tour_sku: sku,
        rooming: { paying: {}, tc: {} },
        vehicles: {},
        rounding_rule: { mode: "none", increment: 1 },
      }) as QuoteBasics;
    const first = await createEmptyQuote(quoteBasics("E09-REUSE-1"));
    const second = await createEmptyQuote(quoteBasics("E09-REUSE-2"));

    await addBlockDay(first.id, blockId);
    await addBlockDay(second.id, blockId);

    const [savedFirst, savedSecond] = await Promise.all([
      loadQuote(first.id),
      loadQuote(second.id),
    ]);
    expect(savedFirst.days).toHaveLength(1);
    expect(savedSecond.days).toHaveLength(1);
    expect(savedFirst.days[0]?.source_block_id).toBe(blockId);
    expect(savedSecond.days[0]?.source_block_id).toBe(blockId);
    expect(await one("select count(*)::int count from day_blocks where id=$1", [blockId])).toEqual({
      count: 1,
    });
  });

  it("adds the SPA block sequence as seller, at the fixture total, and separates repeated purchases", async () => {
    const source = await loadTemplateSource(templateId, clientId);
    const ids = source.templateDays
      .sort((a, b) => a.day_number - b.day_number)
      .map((d) => d.block_id);
    await as(seller);
    const empty = await createEmptyQuote({
      ...basics(),
      client_type: "B2C",
      category: "COMFORT",
      tour_sku: "SPAUYU-3D2N-BLOCKS",
      rooming: { paying: {}, tc: {} },
      vehicles: {},
      rounding_rule: { mode: "none", increment: 1 },
    } as QuoteBasics);
    const result = await addBlockDays(empty.id, ids);
    expect(result.calculation.status).toBe("ok");
    expect(result.calculation.total_cost_usd).toBe(1939);
    const saved = await loadQuote(empty.id);
    expect(saved.days.map((d) => d.link_type)).toEqual(["grouped", "grouped", "grouped"]);
    expect(saved.days.map((d) => d.group_position)).toEqual([1, 2, 3]);
    expect(new Set(saved.days.map((d) => d.group_id)).size).toBe(1);
    expect(saved.days.every((d) => !!d.group_id && !!d.source_block_id && !!d.block_snapshot)).toBe(
      true,
    );
    expect(saved.quote.template_id).toBeNull();
    expect((await addBlockDays(empty.id, ids)).calculation.total_cost_usd).toBe(3878);
    const twice = await loadQuote(empty.id);
    expect(new Set(twice.days.map((d) => d.group_id)).size).toBe(2);
    expect(twice.days.map((d) => d.date)).toEqual([
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
      "2026-10-18",
      "2026-10-19",
    ]);
  });
  it("rejects an incomplete sequence without inserting days, and rolls back a failed batch calculation", async () => {
    const source = await loadTemplateSource(templateId, clientId);
    const ids = source.templateDays
      .sort((a, b) => a.day_number - b.day_number)
      .map((d) => d.block_id);
    const data = await newQuote();
    await expect(addBlockDays(data.quote.id, ids.slice(0, 2))).rejects.toThrow("todos los bloques");
    expect(await loadQuote(data.quote.id)).toEqual(data);
    const rpc = transport.client!.rpc.bind(transport.client);
    vi.spyOn(transport.client!, "rpc").mockImplementation(async (name, args) => {
      if (name === "edit_quote_days" && args["p_result"])
        (args["p_result"] as { items: unknown[] }).items.pop();
      return rpc(name, args);
    });
    await expect(addBlockDays(data.quote.id, ids)).rejects.toThrow("Incomplete calculation");
    expect(await loadQuote(data.quote.id)).toEqual(data);
  });
  it("expands a purchase linked only to the first library block when appending after existing days", async () => {
    await pg.exec("begin");
    try {
      const data = await newQuote();
      const source = await loadTemplateSource(templateId, clientId);
      const ids = source.templateDays
        .sort((a, b) => a.day_number - b.day_number)
        .map((d) => d.block_id);
      await pg.query(
        "delete from day_block_items where block_id=any($1::uuid[]) and multi_day_span>1",
        [ids.slice(1)],
      );
      await pg.query(
        "update day_block_items set coverage_key=null,coverage_start_day=null where block_id=$1 and multi_day_span>1",
        [ids[0]],
      );
      const result = await addBlockDays(data.quote.id, ids);
      expect(result.calculation.total_cost_usd).toBe(3878);
      const saved = await loadQuote(data.quote.id);
      const addedDays = saved.days.slice(3);
      const purchases = saved.items.filter(
        (i) => i.day_span === 3 && addedDays.some((d) => d.id === i.quote_day_id),
      );
      expect(purchases).toHaveLength(3);
      expect(new Set(purchases.map((i) => i.source_block_service_id)).size).toBe(1);
      expect(
        purchases.every(
          (i) => (i.pricing_snapshot as { coverage_start_day: number }).coverage_start_day === 4,
        ),
      ).toBe(true);
      expect(new Set(addedDays.map((d) => d.group_id)).size).toBe(1);
    } finally {
      await pg.exec("rollback");
    }
  });
  it("copies all languages and original service links; multi-day purchase creates one group and charges once", async () => {
    const source = await loadTemplateSource(templateId, clientId);
    const block = source.blocks[0]!;
    await pg.query(
      "insert into day_block_translations(block_id,lang,title,description) values($1,'fr','Titre figé','Texte figé') on conflict(block_id,lang) do update set title=excluded.title",
      [block.id],
    );
    const data = await newQuote();
    expect(data.quote.total_cost_usd).toBe(1939);
    expect(new Set(data.days.map((d) => d.group_id)).size).toBe(1);
    expect(data.days.map((d) => [d.link_type, d.group_position])).toEqual([
      ["grouped", 1],
      ["grouped", 2],
      ["grouped", 3],
    ]);
    expect(data.items.every((i) => i.source_block_service_id !== null)).toBe(true);
    for (const d of data.days) {
      expect(d.block_snapshot).toMatchObject({
        block: { id: d.source_block_id },
        translations: expect.any(Array),
        services: expect.any(Array),
        modules: expect.any(Array),
      });
    }
    expect(resolveDay(data.days.find((d) => d.source_block_id === block.id)!).title?.["fr"]).toBe(
      "Titre figé",
    );
    const result = data.quote.calculation as unknown as QuoteResult;
    const purchase = data.items.filter((i) => i.day_span === 3).map((i) => i.id);
    expect(result.items.filter((i) => purchase.includes(i.id)).map((i) => i.covered)).toEqual([
      false,
      true,
      true,
    ]);
    const again = await newQuote();
    expect(again.days[0]!.group_id).not.toBe(data.days[0]!.group_id);
  });
  it("content edits affect only overrides, preserve other languages, and reset removes the diff", async () => {
    const data = await newQuote(),
      day = data.days[0]!;
    const original = await one("select to_jsonb(b) row from day_blocks b where id=$1", [
      day.source_block_id,
    ]);
    const before = resolveDay(day);
    const changed = await updateDayContent(day.id, {
      title: { es: "Título local" },
      internal_notes: "Solo para esta cotización",
    });
    expect(changed.calculation.total_cost_usd).toBe(1939);
    const edited = (await loadQuote(data.quote.id)).days[0]!;
    expect(resolveDay(edited).title).toEqual({ ...before.title, es: "Título local" });
    expect(edited.title).toBe("Título local");
    expect(
      await one("select to_jsonb(b) row from day_blocks b where id=$1", [day.source_block_id]),
    ).toEqual(original);
    await updateDayContent(day.id, { title: { es: before.title!["es"]! } });
    expect((await loadQuote(data.quote.id)).days[0]!.overrides).toEqual({
      internal_notes: "Solo para esta cotización",
    });
    const textEdit = await updateDayContent(day.id, { includes: { es: "Incluye personalizado" } });
    expect(textEdit.calculation.total_cost_usd).toBe(changed.calculation.total_cost_usd);
    expect(resolveDay((await loadQuote(data.quote.id)).days[0]!).includes?.["es"]).toBe(
      "Incluye personalizado",
    );
    await resetDayField(day.id, "includes");
    const reset = (await loadQuote(data.quote.id)).days[0]!;
    expect(resolveDay(reset).includes).toEqual(before.includes);
    expect(reset.overrides).not.toHaveProperty("includes");
    expect(reset.block_snapshot).toEqual(day.block_snapshot);
    const frozen = resolveDay((await loadQuote(data.quote.id)).days[0]!);
    await pg.query(
      "update day_block_translations set title='Biblioteca editada' where block_id=$1",
      [day.source_block_id],
    );
    expect(resolveDay((await loadQuote(data.quote.id)).days[0]!)).toEqual(frozen);
    await expect(updateDayContent(day.id, { services: [] } as never)).rejects.toThrow();
    await expect(
      pg.query("update quote_days set overrides='{\"services\":[]}' where id=$1", [day.id]),
    ).rejects.toThrow("quote_day_content_only");
    await expect(
      pg.query("update quote_days set block_snapshot='{}' where id=$1", [day.id]),
    ).rejects.toThrow("inmutables");
  });
  it("normalizes continuity, reports it in B3 and suppresses it when either day is independent", async () => {
    const data = await newQuote();
    await ungroup(data.days[0]!.group_id!);
    await updateDayContent(data.days[0]!.id, { end_point: " San Pédro de Atacama " });
    await updateDayContent(data.days[1]!.id, {
      start_point: "sanpedrodeatacama",
      end_point: "UYU",
    });
    await updateDayContent(data.days[2]!.id, { start_point: "UYU" });
    expect(await validateContinuity(data.quote.id)).toEqual([]);
    const mismatch = await updateDayContent(data.days[1]!.id, { start_point: "La Paz" });
    expect(await validateContinuity(data.quote.id)).toEqual([
      { nivel: "aviso", día: 2, mensaje: expect.stringContaining("no conecta") },
    ]);
    expect(mismatch.calculation.warnings).toContainEqual(expect.stringContaining("no conecta"));
    expect((await recalculateQuote(data.quote.id)).warnings).toContainEqual(
      expect.stringContaining("no conecta"),
    );
    await setDayLinkType(data.days[0]!.id, "independent");
    expect(await validateContinuity(data.quote.id)).toEqual([]);
    await setDayLinkType(data.days[0]!.id, "chained");
    await setDayLinkType(data.days[1]!.id, "independent");
    expect(await validateContinuity(data.quote.id)).toEqual([]);
    expect(
      (await applyAdjustmentBulk(data.quote.id, { filtro: { day_number: 1 }, pct: 0 })).calculation
        .warnings,
    ).not.toContainEqual(expect.stringContaining("no conecta"));
  });
  it("moves and deletes all three grouped days, renumbers dates and retains the single charge", async () => {
    const data = await newQuote();
    await addBlockDay(data.quote.id, await freeBlock());
    const before = await loadQuote(data.quote.id);
    const moved = await moveDay(data.quote.id, data.days[1]!.id, 4);
    const after = await loadQuote(data.quote.id);
    expect(after.days.map((d) => d.id)).toEqual([
      before.days[3]!.id,
      ...data.days.map((d) => d.id),
    ]);
    expect(after.days.map((d) => d.date)).toEqual([
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
    ]);
    expect(after.days.slice(1).map((d) => d.group_position)).toEqual([1, 2, 3]);
    expect(moved.calculation.total_cost_usd).toBe(1939);
    expect(
      after.items
        .filter((i) => i.day_span === 3)
        .every(
          (i) => (i.pricing_snapshot as { coverage_start_day: number }).coverage_start_day === 2,
        ),
    ).toBe(true);
    await deleteDay(data.quote.id, data.days[1]!.id);
    const deleted = await loadQuote(data.quote.id);
    expect(deleted.days.map((d) => d.id)).toEqual([before.days[3]!.id]);
    expect(deleted.days[0]!.day_number).toBe(1);
    expect(deleted.items).toEqual([]);
    expect(deleted.quote.total_cost_usd).toBe(0);
  });
  it("requires consecutive complete groups; ungroup keeps single billing and rejects splitting a purchase", async () => {
    const data = await newQuote();
    await expect(groupDays(data.quote.id, [1, 3])).rejects.toThrow("consecutivos");
    await expect(groupDays(data.quote.id, [1, 2])).rejects.toThrow("grupo completo");
    await ungroup(data.days[0]!.group_id!);
    expect(
      (await loadQuote(data.quote.id)).days.every(
        (d) => d.link_type === "chained" && d.group_id === null,
      ),
    ).toBe(true);
    await expect(deleteDay(data.quote.id, data.days[0]!.id)).rejects.toThrow("compra multi-día");
    await groupDays(data.quote.id, [1, 2, 3]);
    expect((await loadQuote(data.quote.id)).quote.total_cost_usd).toBe(1939);
  });
  it("saves a pending derived block with all languages and actual default items without touching its parent", async () => {
    const data = await newQuote(),
      day = data.days[1]!;
    const original = await one("select to_jsonb(b) row from day_blocks b where id=$1", [
      day.source_block_id,
    ]);
    await updateDayContent(day.id, {
      description: { it: "Testo locale", es: "Texto local" },
      meals: ["almuerzo"],
      start_point: "Nueva salida",
    });
    const before = await loadQuote(data.quote.id);
    const saved = await saveDayAsNewBlock(day.id, "Alternativa cliente");
    const b = await one<{
      parent_block_id: string;
      status: string;
      name: string;
      content: unknown;
    }>("select * from day_blocks where id=$1", [saved.block_id]);
    expect(b).toMatchObject({
      parent_block_id: day.source_block_id,
      status: "pendiente",
      name: "Alternativa cliente",
    });
    expect(b.content).toEqual(resolveDay(before.days[1]!));
    expect(
      await one("select to_jsonb(b) row from day_blocks b where id=$1", [day.source_block_id]),
    ).toEqual(original);
    const rows = (
      await pg.query<{ qty: number; pricing_config: unknown; item_snapshot: unknown }>(
        "select * from day_block_items where block_id=$1",
        [saved.block_id],
      )
    ).rows;
    const items = before.items.filter((i) => i.quote_day_id === day.id);
    expect(rows).toHaveLength(items.length);
    expect(rows.map((r) => r.item_snapshot)).toEqual(
      expect.arrayContaining(
        items.map((i) => ({
          ...i,
          adjustment_pct: 0,
          adjustment_note: null,
          total_cost_usd: null,
          total_cost_local: null,
        })),
      ),
    );
    expect(
      await one("select description from day_block_translations where block_id=$1 and lang='it'", [
        saved.block_id,
      ]),
    ).toEqual({ description: "Testo locale" });
    expect((await loadQuote(data.quote.id)).days).toEqual(before.days);
  });
  it("rolls back the entire day operation when the calculation fails and detects concurrent edits", async () => {
    const data = await newQuote();
    const rpc = transport.client!.rpc.bind(transport.client);
    vi.spyOn(transport.client!, "rpc").mockImplementation(async (name, args) => {
      if (name === "edit_quote_days" && args["p_result"])
        (args["p_result"] as { items: unknown[] }).items.pop();
      return rpc(name, args);
    });
    await expect(
      updateDayContent(data.days[0]!.id, { title: { es: "Must roll back" } }),
    ).rejects.toThrow("Incomplete calculation");
    expect(await loadQuote(data.quote.id)).toEqual(data);
    vi.restoreAllMocks();
    vi.spyOn(transport.client!, "rpc").mockImplementation(async (name, args) => {
      if (name === "edit_quote_days" && args["p_result"])
        await pg.query("update quotes set margin_pct=26 where id=$1", [data.quote.id]);
      return rpc(name, args);
    });
    await expect(updateDayContent(data.days[0]!.id, { title: { es: "Conflict" } })).rejects.toThrow(
      "cambió",
    );
    expect((await loadQuote(data.quote.id)).days).toEqual(data.days);
  });
  it("keeps seller ownership and media permissions", async () => {
    const data = await newQuote();
    await pg.query(
      "insert into storage.objects(bucket_id,name) values('media','places/test/photo.png')",
    );
    await as(seller);
    expect(
      (await pg.query("select * from storage.objects where bucket_id='media'")).rows,
    ).toHaveLength(1);
    await expect(
      pg.query("insert into storage.objects(bucket_id,name) values('media','not-allowed.png')"),
    ).rejects.toThrow("row-level security");
    await expect(updateDayContent(data.days[0]!.id, { title: { es: "Ajeno" } })).rejects.toThrow();
    const own = await newQuote();
    expect((await updateDayContent(own.days[0]!.id, { title: { es: "Propio" } })).quote_id).toBe(
      own.quote.id,
    );
    const saved = await saveDayAsNewBlock(own.days[0]!.id, "Propuesta vendedor");
    expect(
      await one("select status,created_by from day_blocks where id=$1", [saved.block_id]),
    ).toEqual({ status: "pendiente", created_by: seller });
  });
  it("versions preserve snapshots and edits but isolate group identity", async () => {
    const data = await newQuote();
    await updateDayContent(data.days[0]!.id, { title: { it: "Titolo versione" } });
    await pg.query(
      "update quote_days set snapshot=snapshot || '{\"reviewed\":true}' where quote_id=$1",
      [data.quote.id],
    );
    await pg.query(
      "update quotes set pricing_config=pricing_config || '{\"unresolved\":[]}' where id=$1",
      [data.quote.id],
    );
    await recalculateQuote(data.quote.id);
    await pg.query("select transition_quote($1,'revisada')", [data.quote.id]);
    await pg.query("select transition_quote($1,'enviada')", [data.quote.id]);
    const sent = await loadQuote(data.quote.id);
    await expect(updateDayContent(data.days[0]!.id, { title: { es: "No" } })).rejects.toThrow(
      "versión",
    );
    const next = (await one<{ id: string }>("select version_quote($1) id", [data.quote.id])).id;
    const version = await loadQuote(next);
    expect(version.days.map((d) => [d.block_snapshot, d.overrides, d.source_block_id])).toEqual(
      sent.days.map((d) => [d.block_snapshot, d.overrides, d.source_block_id]),
    );
    expect(new Set(version.days.map((d) => d.group_id)).size).toBe(1);
    expect(version.days[0]!.group_id).not.toBe(sent.days[0]!.group_id);
    await ungroup(version.days[0]!.group_id!);
    expect((await loadQuote(data.quote.id)).days).toEqual(sent.days);
    expect((await loadQuote(next)).quote.total_cost_usd).toBe(1939);
  });
  it("appends real default services atomically and rejects stale catalog prices", async () => {
    const data = await newQuote(),
      blockId = await freeBlock();
    const service = (
      await one<{ id: string }>(
        "insert into services(sku,name,type,pricing_unit,currency,status) values('ADD-'||gen_random_uuid(),'Extra','extra','per_group','USD','activo') returning id",
      )
    ).id;
    await pg.query("insert into service_rates(service_id,price_net) values($1,10)", [service]);
    const link = (
      await one<{ id: string }>(
        "insert into day_block_items(block_id,service_id,qty) values($1,$2,2) returning id",
        [blockId, service],
      )
    ).id;
    const added = await addBlockDay(data.quote.id, blockId);
    expect(added.calculation.total_cost_usd).toBe(1959);
    const saved = await loadQuote(data.quote.id);
    expect(saved.items.find((i) => i.service_id === service)).toMatchObject({
      qty: 2,
      unit_cost_original: 10,
      total_cost_usd: 20,
      source_block_service_id: link,
    });
    const rpc = transport.client!.rpc.bind(transport.client);
    vi.spyOn(transport.client!, "rpc").mockImplementation(async (name, args) => {
      if (name === "edit_quote_days" && args["p_result"])
        await pg.query("update service_rates set price_net=500 where service_id=$1", [service]);
      return rpc(name, args);
    });
    await expect(addBlockDay(data.quote.id, blockId)).rejects.toThrow("tarifas cambiaron");
    expect(await loadQuote(data.quote.id)).toEqual(saved);
  });
});
