// @vitest-environment node
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createDatabase, seedDatabase } from "../../../scripts/db/local-db.mjs";
import { pgliteSupabase } from "@/test/pglite-supabase";
import fixture from "../../../tests/fixtures/SPAUYU-3D2N-MP.json";
import { calculateQuote, type QuoteInput } from "../pricing";

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
  type TemplateQuoteBasics,
} from "./index";

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
const persisted = async () => {
  await pg.exec("reset role");
  try {
    return await one(`select
  (select count(*) from quotes) quotes, (select count(*) from quote_days) days,
  (select count(*) from quote_items) items, (select count(*) from quote_status_history) history,
  (select jsonb_agg(c order by year) from quote_year_counters c) counters`);
  } finally {
    await pg.exec("set role authenticated");
  }
};
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
}, 30000);
beforeEach(async () => {
  vi.restoreAllMocks();
  await pg.exec("set role authenticated");
  await as(admin);
});
afterAll(async () => pg?.close());

describe("creación atómica desde plantilla", () => {
  it("SPAUYU 2 pax is already calculated on return, matches the fixture, and is visible to its seller", async () => {
    await as(seller);
    const rpc = vi.spyOn(transport.client!, "rpc");
    const quote = await createQuoteFromTemplate(templateId, basics());
    expect(rpc.mock.calls.map(([name]) => name)).toEqual(["create_quote_from_template"]);
    const expected = calculateQuote(fixture.input as unknown as QuoteInput);
    expect(Math.abs(quote.total_cost_usd! - fixture.expected.cost_usd)).toBeLessThanOrEqual(1);
    expect(quote.total_price_usd).toBe(expected.total_price_usd);
    expect(quote.total_cost_usd).toBe(1939);
    expect(quote.seller_id).toBe(seller);
    const { quote_year } = await one<{ quote_year: string }>(
      "select to_char(now() at time zone 'America/Santiago','YY') as quote_year",
    );
    expect(quote.code).toMatch(new RegExp(`^SPAUYU-3D2N-MP-ES-${quote_year}-[0-9]{4,}$`));
    const saved = await loadQuote(quote.id);
    expect(saved.quote.calculation).toBeTruthy();
    expect(saved.days.map((d) => d.date)).toEqual(["2026-10-14", "2026-10-15", "2026-10-16"]);
    expect(saved.quote.rooming).toEqual(fixture.input.rooming);
    expect(
      saved.items.every((i) => !!(i.pricing_snapshot as Record<string, unknown>)["_source_link"]),
    ).toBe(true);
    expect(await recalculateQuote(quote.id)).toEqual(saved.quote.calculation);
    const fx = (
      await pg.query<{ id: string; rate_to_usd: number }>(
        "select id,rate_to_usd from exchange_rates",
      )
    ).rows;
    expect(fx.length).toBeGreaterThan(0);
    await pg.query("update exchange_rates set rate_to_usd=999 where id=$1", [fx[0]!.id]);
    expect(
      (
        await one<{ rate_to_usd: number }>("select rate_to_usd from exchange_rates where id=$1", [
          fx[0]!.id,
        ])
      ).rate_to_usd,
    ).toBe(fx[0]!.rate_to_usd);
  });

  it("rejects pending templates, empty source days and missing translations before any write", async () => {
    const before = await persisted();
    await pg.query("update itinerary_templates set status='pendiente' where id=$1", [templateId]);
    await expect(createQuoteFromTemplate(templateId, basics())).rejects.toThrow("no está aprobada");
    await pg.query("update itinerary_templates set status='activo' where id=$1", [templateId]);
    await expect(
      createQuoteFromTemplate(templateId, { ...basics(), language: "xx" }),
    ).rejects.toThrow("falta traducción");
    const emptyBlock = (
      await one<{ id: string }>(
        "insert into day_blocks(code) values('EMPTY_CREATION') returning id",
      )
    ).id;
    await pg.query(
      "insert into day_block_translations(block_id,lang,title,description) values($1,'es','Vacío','Vacío')",
      [emptyBlock],
    );
    const original = await one<{ id: string; block_id: string }>(
      "select id,block_id from template_days where template_id=$1 and day_number=2",
      [templateId],
    );
    try {
      await pg.query("update template_days set block_id=$1 where id=$2", [emptyBlock, original.id]);
      await expect(createQuoteFromTemplate(templateId, basics())).rejects.toThrow(
        "Día 2: sin servicios",
      );
    } finally {
      await pg.query("update template_days set block_id=$1 where id=$2", [
        original.block_id,
        original.id,
      ]);
    }
    expect(await persisted()).toEqual(before);
  });

  it("denies anonymous/unregistered callers and does not expose the privileged source reader", async () => {
    const before = await persisted();
    await as("40000000-0000-0000-0000-000000000099");
    await expect(
      pg.query("select create_quote_from_template($1,'{}','[]','{}','{}')", [templateId]),
    ).rejects.toThrow("sin permiso");
    await as(seller);
    await expect(
      pg.query("select quote_template_source($1,$2)", [templateId, clientId]),
    ).rejects.toThrow("permission denied");
    await pg.exec("set role anon");
    await expect(
      pg.query("select create_quote_from_template($1,'{}','[]','{}','{}')", [templateId]),
    ).rejects.toThrow("permission denied");
    await pg.exec("set role authenticated");
    await as(admin);
    expect(await persisted()).toEqual(before);
  });

  it("rejects a catalog edit after preparation without leaving a draft or consuming a number", async () => {
    const before = await persisted();
    const rpc = transport.client!.rpc.bind(transport.client);
    vi.spyOn(transport.client!, "rpc").mockImplementationOnce(async (name, args) => {
      await pg.query("update itinerary_templates set name=name || ' actualizado' where id=$1", [
        templateId,
      ]);
      return rpc(name, args);
    });
    await expect(createQuoteFromTemplate(templateId, basics())).rejects.toThrow("cambiaron");
    expect(await persisted()).toEqual(before);
  });

  it("rolls back days, items, history and counter if saving the calculation fails", async () => {
    const before = await persisted();
    const rpc = transport.client!.rpc.bind(transport.client);
    vi.spyOn(transport.client!, "rpc").mockImplementationOnce((name, args) => {
      const result = args["p_result"] as { items: unknown[] };
      result.items.pop();
      return rpc(name, args);
    });
    await expect(createQuoteFromTemplate(templateId, basics())).rejects.toThrow(
      "Incomplete calculation",
    );
    expect(await persisted()).toEqual(before);
  });

  it("does not let a caller omit source items and cannot bypass creation through the legacy RPC", async () => {
    const before = await persisted();
    const rpc = transport.client!.rpc.bind(transport.client);
    vi.spyOn(transport.client!, "rpc").mockImplementationOnce((name, args) => {
      const days = args["p_days"] as { items: unknown[] }[];
      days[0]!.items.pop();
      return rpc(name, args);
    });
    await expect(createQuoteFromTemplate(templateId, basics())).rejects.toThrow("faltan servicios");
    await expect(
      pg.query("select create_quote_snapshot($1,'[]')", [{ template_id: templateId }]),
    ).rejects.toThrow("create_quote_from_template");
    expect(await persisted()).toEqual(before);
  });

  it("selects by each real day, configured season and paying + complimentary passengers", async () => {
    const service = (
      await one<{ id: string }>(
        "insert into services(sku,name,type,pricing_unit,currency,status) values('SEASON_CREATION','Test','extra','per_person','USD','activo') returning id",
      )
    ).id;
    await pg.query(
      `insert into service_rates(service_id,season,valid_from,valid_to,pax_min,pax_max,price_net) values
      ($1,'ALL','2026-01-01','2026-12-31',1,2,10),($1,'ALL','2026-01-01','2026-12-31',3,4,15),
      ($1,'ALL','2027-01-01','2027-12-31',1,4,20),($1,'DRY','2027-01-01','2027-12-31',1,2,30),
      ($1,'DRY','2027-01-01','2027-12-31',3,4,40)`,
      [service],
    );
    const template = (
      await one<{ id: string }>(
        "insert into itinerary_templates(sku,name,days,nights,route_type,category,status) values('SEASON-2D1N','Season',2,1,'ONEWAY','COMFORT','activo') returning id",
      )
    ).id;
    for (const n of [1, 2]) {
      const block = (
        await one<{ id: string }>("insert into day_blocks(code) values($1) returning id", [
          `SEASON_D${n}`,
        ])
      ).id;
      await pg.query(
        "insert into day_block_translations(block_id,lang,title,description) values($1,'es','Day','Text')",
        [block],
      );
      await pg.query(
        "insert into day_block_items(block_id,service_id,qty,applies_tc,pricing_config) values($1,$2,1,true,'{}')",
        [block, service],
      );
      await pg.query(
        "insert into template_days(template_id,day_number,block_id) values($1,$2,$3)",
        [template, n, block],
      );
    }
    const q = await createQuoteFromTemplate(template, {
      client_id: clientId,
      language: "es",
      start_date: "2026-12-31",
      pax_paying: 2,
      tc_count: 1,
      staff: { drivers: 1, guides: 1 },
      rooming: { paying: { DBL: 1 }, tc: { SGL: 1 } },
      seasons: [{ from: "2027-01-01", to: "2027-01-31", season: "DRY" }],
    });
    const data = await loadQuote(q.id);
    expect(data.days.map((d) => d.date)).toEqual(["2026-12-31", "2027-01-01"]);
    expect(q.total_cost_usd).toBe(165);
    expect(q.staff).toEqual({ drivers: 1, guides: 1 });
    expect(q.rooming).toEqual({ paying: { DBL: 1 }, tc: { SGL: 1 } });
    expect(data.items.map((i) => i.unit_cost_original)).toEqual([15, 40]);
    await pg.query("update itinerary_templates set quote_defaults=$1 where id=$2", [
      {
        pax_paying: 2,
        tc_count: 1,
        staff: { drivers: 1, guides: 1 },
        rooming: { paying: { DBL: 1 }, tc: { SGL: 1 } },
      },
      template,
    ]);
    const withoutStaff = await createQuoteFromTemplate(template, {
      client_id: clientId,
      language: "es",
      start_date: "2026-12-31",
      pax_paying: 2,
      tc_count: 1,
      staff: { drivers: 0, guides: 0 },
    });
    expect(withoutStaff.staff).toEqual({ drivers: 0, guides: 0 });
  });

  it("keeps an existing quote unchanged after template, block, quantity, pricing config and tariff edits", async () => {
    const q = await createQuoteFromTemplate(templateId, basics());
    const saved = await loadQuote(q.id);
    await pg.query("update itinerary_templates set sku='MODIFIED-MASTER' where id=$1", [
      templateId,
    ]);
    await pg.query(
      "update day_block_translations set title='Edited text' where block_id in(select block_id from template_days where template_id=$1)",
      [templateId],
    );
    await pg.query(
      "update day_block_items set qty=qty+1, pricing_config=pricing_config || '{\"nights\":9}' where block_id in(select block_id from template_days where template_id=$1)",
      [templateId],
    );
    await pg.query("update service_rates set price_net=9999 where service_id=$1", [
      saved.items[0]!.service_id,
    ]);
    expect(await loadQuote(q.id)).toEqual(saved);
    expect(await recalculateQuote(q.id)).toEqual(saved.quote.calculation);
    expect((await loadQuote(q.id)).quote.total_cost_usd).toBe(1939);
  });
});
