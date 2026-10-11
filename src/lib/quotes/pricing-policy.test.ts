// @vitest-environment node
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createDatabase } from "../../../scripts/db/local-db.mjs";
import { pgliteSupabase } from "@/test/pglite-supabase";

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
import { createEmptyQuote, loadQuote, recalculateQuote, type QuoteBasics } from "./index";

let pg: Awaited<ReturnType<typeof createDatabase>>;
let clientId: string;
const seller = "00000000-0000-0000-0000-000000000011";
const admin = "00000000-0000-0000-0000-000000000012";
const operations = "00000000-0000-0000-0000-000000000013";
const basics = (): QuoteBasics => ({
  client_id: clientId,
  client_type: "B2B",
  language: "es",
  category: "COMFORT",
  tour_sku: "TEST-COMMISSION",
  start_date: "2026-10-11",
  pax_paying: 2,
  tc_count: 1,
  rooming: { paying: {}, tc: {} },
  vehicles: {},
  fx_snapshot: { USD: 1 },
  rounding_rule: { mode: "none", increment: 1 },
});
const actAs = (id: string) => pg.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
async function pricedQuote(input: QuoteBasics = basics()) {
  const quote = await createEmptyQuote(input);
  const day = (
    await pg.query<{ id: string }>(
      `insert into quote_days(quote_id,day_number,title,snapshot) values($1,1,'Test','{"reviewed":true}') returning id`,
      [quote.id],
    )
  ).rows[0]!;
  await pg.query(
    `insert into quote_items(quote_day_id,description,type,pricing_unit,currency,qty,unit_cost_original,unit_cost_usd,margin_applicable,pricing_snapshot)
    values($1,'Group cost','extra','per_group','USD',1,0,0,true,$2)`,
    [
      day.id,
      {
        rates: [
          {
            season: "ALL",
            valid_from: null,
            valid_to: null,
            pax_min: null,
            pax_max: null,
            price_net: 1000,
          },
        ],
      },
    ],
  );
  return quote;
}

beforeAll(async () => {
  pg = await createDatabase();
  await pg.exec(
    await readFile(new URL("../../../supabase/seed/applied/00_base.sql", import.meta.url), "utf8"),
  );
  await pg.exec(`insert into auth.users(id,email) values
    ('${seller}','seller@test.invalid'),('${admin}','admin@test.invalid'),('${operations}','ops@test.invalid');
    update profiles set role='admin' where id='${admin}';
    update profiles set role='operacion' where id='${operations}';
    set role authenticated; select set_config('request.jwt.claim.sub','${admin}',false);`);
  clientId = (
    await pg.query<{ id: string }>(
      "insert into clients(type,name) values('B2B','Commission test') returning id",
    )
  ).rows[0]!.id;
  transport.client = pgliteSupabase(pg);
}, 30000);
beforeEach(async () => {
  await actAs(admin);
  await pg.query("update pricing_settings set margin_pct=25,margin_mode='markup'");
  await pg.query(
    "update clients set margin_pct=null,commission_mode='none',commission_pct=0 where id=$1",
    [clientId],
  );
});
afterAll(async () => pg?.close());

describe("persisted margin and agency policy", () => {
  it("resolves quote > client > Admin, preserving explicit 0%, in the real snapshot RPC", async () => {
    await pg.query("update pricing_settings set margin_pct=30,margin_mode='margin_on_price'");
    const globalQuote = await createEmptyQuote(basics());
    expect(globalQuote).toMatchObject({
      margin_pct: 30,
      margin_mode: "margin_on_price",
      commission_mode: "none",
      commission_pct: 0,
    });
    await pg.query("update clients set margin_pct=10 where id=$1", [clientId]);
    expect(await createEmptyQuote(basics())).toMatchObject({ margin_pct: 10 });
    expect(
      await createEmptyQuote({ ...basics(), margin_pct: 0, margin_mode: "markup" }),
    ).toMatchObject({ margin_pct: 0, margin_mode: "markup" });
    await pg.query("update clients set margin_pct=0 where id=$1", [clientId]);
    expect(await createEmptyQuote({ ...basics(), margin_pct: null })).toMatchObject({
      margin_pct: 0,
    });
  });
  it("persists the gross breakdown and freezes it through client/Admin edits and quote versioning", async () => {
    await pg.query("update clients set commission_mode='gross',commission_pct=10 where id=$1", [
      clientId,
    ]);
    const quote = await pricedQuote();
    const result = await recalculateQuote(quote.id);
    expect(result).toMatchObject({
      total_cost_usd: 1000,
      total_margin_usd: 250,
      total_commission_usd: 138.89,
      total_price_usd: 1388.89,
      price_per_pax_usd: 694.45,
    });
    expect((await loadQuote(quote.id)).quote.calculation).toEqual(result);
    await pg.query("update pricing_settings set margin_pct=50,margin_mode='margin_on_price'");
    await pg.query("update clients set margin_pct=60,commission_pct=20 where id=$1", [clientId]);
    expect(await recalculateQuote(quote.id)).toEqual(result);
    await pg.query("select public.transition_quote($1,'revisada')", [quote.id]);
    await pg.query("select public.transition_quote($1,'enviada')", [quote.id]);
    const next = (await pg.query<{ id: string }>("select public.version_quote($1) id", [quote.id]))
      .rows[0]!.id;
    const version = await loadQuote(next);
    expect(version.quote).toMatchObject({
      margin_pct: 25,
      margin_mode: "markup",
      commission_mode: "gross",
      commission_pct: 10,
    });
    expect(await recalculateQuote(next)).toMatchObject({
      total_price_usd: 1388.89,
      total_commission_usd: 138.89,
    });
    expect((await loadQuote(quote.id)).quote.calculation).toEqual(result);
  });
  it("only commissions B2B quotes and invalidates calculations when their policy changes", async () => {
    await pg.query("update clients set commission_mode='gross',commission_pct=10 where id=$1", [
      clientId,
    ]);
    const quote = await pricedQuote({ ...basics(), client_type: "B2C" });
    expect(quote).toMatchObject({ commission_mode: "none", commission_pct: 0 });
    expect(await recalculateQuote(quote.id)).toMatchObject({
      total_price_usd: 1250,
      total_commission_usd: 0,
    });
    await pg.query("update quotes set margin_mode='margin_on_price' where id=$1", [quote.id]);
    expect((await loadQuote(quote.id)).quote.calculation).toBeNull();
    expect(await recalculateQuote(quote.id)).toMatchObject({ total_price_usd: 1333.33 });
  });
  it("enforces Admin writes, team reads and invalid percentage constraints in PostgreSQL", async () => {
    for (const id of [seller, operations]) {
      await actAs(id);
      expect((await pg.query("select * from pricing_settings")).rows).toHaveLength(1);
      expect(
        (await pg.query("update pricing_settings set margin_pct=40 returning id")).rows,
      ).toHaveLength(0);
      await expect(pg.query("delete from pricing_settings")).rejects.toThrow(/permission denied/);
    }
    await actAs("00000000-0000-0000-0000-000000000099");
    expect((await pg.query("select * from pricing_settings")).rows).toHaveLength(0);
    await actAs(admin);
    await expect(
      pg.query("update pricing_settings set margin_mode='margin_on_price',margin_pct=100"),
    ).rejects.toThrow(/check constraint/);
    await expect(
      pg.query("update clients set commission_pct=100 where id=$1", [clientId]),
    ).rejects.toThrow(/check constraint/);
    await expect(
      createEmptyQuote({ ...basics(), margin_mode: "margin_on_price", margin_pct: 100 }),
    ).rejects.toThrow(/check constraint/);
    await pg.query("update clients set commission_mode='gross',commission_pct=10 where id=$1", [
      clientId,
    ]);
    await actAs(seller);
    const quote = await pricedQuote();
    expect(await recalculateQuote(quote.id)).toMatchObject({ total_price_usd: 1388.89 });
    await actAs(operations);
    await expect(loadQuote(quote.id)).rejects.toThrow(/inaccessible/);
  });
});

it("migrates old quotes as markup/none without changing their saved calculation", async () => {
  const legacy = await createDatabase({
    throughMigration: "20261011000300_quote_pricing_errors.sql",
  });
  try {
    await legacy.exec(`insert into auth.users(id,email)values('${admin}','legacy@test.invalid');
      update profiles set role='admin' where id='${admin}';
      set role authenticated; select set_config('request.jwt.claim.sub','${admin}',false);`);
    const oldClient = (
      await legacy.query<{ id: string }>(
        "insert into clients(type,name)values('B2B','Legacy')returning id",
      )
    ).rows[0]!.id;
    const oldQuote = (
      await legacy.query<{ id: string }>(
        `insert into quotes(code,client_id,client_type,start_date,pax_paying,category,margin_pct)
      values('LEGACY',$1,'B2B','2026-10-11',2,'COMFORT',20)returning id`,
        [oldClient],
      )
    ).rows[0]!.id;
    await legacy.query(
      `update quotes set calculation='{"items":[],"total_cost_usd":1000,"total_margin_usd":200,"total_price_usd":1200}',
      total_cost_usd=1000,total_margin_usd=200,total_price_usd=1200 where id=$1`,
      [oldQuote],
    );
    const before = (
      await legacy.query<{ data: Record<string, unknown> }>(
        "select to_jsonb(q) data from quotes q where id=$1",
        [oldQuote],
      )
    ).rows[0]!.data;
    await legacy.exec("reset role");
    await legacy.exec(
      await readFile(
        new URL(
          "../../../supabase/migrations/20261011000400_margin_and_agency_commission.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const after = (
      await legacy.query<{ data: Record<string, unknown> }>(
        "select to_jsonb(q) data from quotes q where id=$1",
        [oldQuote],
      )
    ).rows[0]!.data;
    expect(after).toEqual({
      ...before,
      margin_mode: "markup",
      commission_mode: "none",
      commission_pct: 0,
    });
  } finally {
    await legacy.close();
  }
}, 30000);
