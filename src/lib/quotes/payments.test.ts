// @vitest-environment node
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { createDatabase } from "../../../scripts/db/local-db.mjs";
import { pgliteSupabase } from "@/test/pglite-supabase";
import type { Tables } from "@/types/db";

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
import { registerQuotePayment, loadQuotePayments, type PaymentInput } from "./payments";
import { loadQuote, recalculateQuote } from "./index";
import { transitionQuote, beginQuoteEdit } from "../states";

let pg: Awaited<ReturnType<typeof createDatabase>>;
let clientId: string;
const admin = "72000000-0000-0000-0000-000000000001";
const seller = "72000000-0000-0000-0000-000000000002";
const other = "72000000-0000-0000-0000-000000000003";
const ops = "72000000-0000-0000-0000-000000000004";
const one = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) =>
  (await pg.query<T>(sql, args)).rows[0]!;
const as = (id: string) => pg.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
const input = (amount: number, extra: Partial<PaymentInput> = {}): PaymentInput => ({
  amount,
  currency: "USD",
  date: "2026-10-12",
  method: "transferencia",
  bank: "Banco de prueba",
  type: "deposito",
  ...extra,
});
const pay = (
  id: string,
  amount: number,
  extra: Partial<PaymentInput> = {},
  paymentId = crypto.randomUUID(),
) => registerQuotePayment(id, paymentId, input(amount, extra));
async function fresh(sent = true) {
  const { q } = await one<{ q: Tables<"quotes"> }>(
    "select to_jsonb(create_quote_snapshot($1,$2)) q",
    [
      {
        client_id: clientId,
        client_type: "B2C",
        language: "es",
        tour_sku: "PAYMENT-TEST",
        category: "COMFORT",
        start_date: "2026-11-01",
        pax_paying: 2,
        tc_count: 1,
        rooming: { paying: { DBL: 1 }, tc: { SGL: 1 } },
        staff: { drivers: 1 },
        vehicles: { bolivia: 1 },
        fx_snapshot: { USD: 1, BOB: 7, EUR: 0.8 },
        margin_pct: 0,
        rounding_rule: { mode: "none", increment: 1 },
      },
      [
        {
          day_number: 1,
          title: "Viaje",
          snapshot: { reviewed: true },
          items: [
            {
              description: "Transporte",
              type: "transporte",
              pricing_unit: "per_group",
              currency: "USD",
              qty: 1,
              unit_cost_original: 1000,
              price_overridden: true,
              override_note: "Prueba",
              pricing_snapshot: { rates: [] },
            },
          ],
        },
        { day_number: 2, title: "Día libre", snapshot: { reviewed: true }, items: [] },
      ],
    ],
  );
  await recalculateQuote(q.id);
  if (sent) {
    await transitionQuote(q.id, "revisada");
    await transitionQuote(q.id, "enviada");
  }
  return q.id;
}
beforeAll(async () => {
  pg = await createDatabase();
  await pg.exec(
    "insert into currencies(code,name) values('USD','USD'),('BOB','BOB'),('EUR','EUR'),('CLP','CLP') on conflict do nothing",
  );
  await pg.query(
    "insert into auth.users(id,email) values($1,'admin-pay@test.invalid'),($2,'seller-pay@test.invalid'),($3,'other-pay@test.invalid'),($4,'ops-pay@test.invalid')",
    [admin, seller, other, ops],
  );
  await pg.query("update profiles set role='admin' where id=$1", [admin]);
  await pg.query("update profiles set role='operacion' where id=$1", [ops]);
  await pg.exec("set role authenticated");
  await as(admin);
  clientId = (
    await one<{ id: string }>(
      "insert into clients(type,name) values('B2C','Prueba de pagos') returning id",
    )
  ).id;
  transport.client = pgliteSupabase(pg);
}, 120000);
beforeEach(async () => {
  await pg.exec("set role authenticated");
  await as(admin);
  await pg.exec("update pricing_settings set deposit_pct=30");
  await pg.query("update clients set deposit_pct=null where id=$1", [clientId]);
  await as(seller);
});
afterAll(async () => pg?.close());

it("accumulates installments, sells at the threshold, and copies services, free days, pax and costs", async () => {
  const id = await fresh();
  const saved = await loadQuote(id);
  expect((await pay(id, 299.99)).summary).toMatchObject({
    status: "enviada",
    deposit_required_usd: 300,
    deposit_remaining_usd: 0.01,
    operation_id: null,
  });
  await expect(transitionQuote(id, "vendida", "partial payment")).rejects.toThrow(
    /registered deposit/,
  );
  await expect(pg.query("update quotes set status='vendida' where id=$1", [id])).rejects.toThrow(
    /registered deposit/,
  );
  const sold = await pay(id, 0.01);
  expect(sold.summary).toMatchObject({
    status: "vendida",
    deposit_remaining_usd: 0,
    paid_usd: 300,
    balance_usd: 700,
  });
  expect(sold.summary.operation_id).toBeTruthy();
  await as(ops);
  const op = await one<{ data: Tables<"ops_services"> }>(
    "select to_jsonb(o) data from ops_services o where id=$1",
    [sold.summary.operation_id],
  );
  expect(op.data).toMatchObject({
    quote_id: id,
    pax: 3,
    quoted_cost_usd: 1000,
    sale_price_usd: 1000,
    quote_snapshot: {
      pax_paying: 2,
      tc_count: 1,
      staff: { drivers: 1 },
      rooming: saved.quote.rooming,
      vehicles: saved.quote.vehicles,
    },
    days_snapshot: saved.days,
  });
  const item = await one<{ data: Tables<"ops_items"> }>(
    "select to_jsonb(i) data from ops_items i where service_id=$1",
    [op.data.id],
  );
  expect(item.data).toMatchObject({
    item_snapshot: saved.items[0],
    cost_usd: 1000,
    cost_local: 1000,
    date: "2026-11-01",
    description: "Transporte",
  });
  await expect(
    pg.query("update ops_services set days_snapshot='[]' where id=$1", [op.data.id]),
  ).rejects.toThrow(/inmutable/);
  await as(seller);
  await pay(id, 700, { type: "saldo" });
  expect((await loadQuotePayments(id)).summary.balance_usd).toBe(0);
  expect(await one("select count(*)::int n from ops_services where quote_id=$1", [id])).toEqual({
    n: 1,
  });
  expect(
    await one(
      "select count(*)::int n from quote_status_history where quote_id=$1 and new_status='vendida'",
      [id],
    ),
  ).toEqual({ n: 1 });
});

it("uses client deposit over Admin, honors zero and preserves it in versions", async () => {
  await as(admin);
  await pg.exec("update pricing_settings set deposit_pct=40");
  const global = await fresh();
  expect((await loadQuote(global)).quote.deposit_pct).toBe(40);
  await pg.query("update clients set deposit_pct=20 where id=$1", [clientId]);
  const id = await fresh();
  expect((await loadQuote(id)).quote.deposit_pct).toBe(20);
  await pg.query("update clients set deposit_pct=0 where id=$1", [clientId]);
  expect((await loadQuote(await fresh())).quote.deposit_pct).toBe(0);
  const version = await beginQuoteEdit(id);
  expect((await loadQuote(version)).quote.deposit_pct).toBe(20);
  expect((await loadQuote(global)).quote.deposit_pct).toBe(40);
});

it("converts using frozen quote FX, never today's rates or a caller-supplied rate", async () => {
  const id = await fresh();
  await as(admin);
  await pg.exec(
    "insert into exchange_rates(currency,rate_to_usd,valid_from) values('BOB',20,'2026-10-12')",
  );
  await as(seller);
  expect((await pay(id, 1400, { currency: "BOB" })).payment).toMatchObject({
    amount: 1400,
    fx_rate: 7,
    amount_usd: 200,
  });
  const paid = await pay(id, 80, { currency: "EUR" });
  expect(paid.summary).toMatchObject({ status: "vendida", paid_usd: 300, balance_usd: 700 });
  await expect(pay(id, 1, { currency: "CLP" })).rejects.toThrow(/tipo de cambio/);
  expect((await loadQuotePayments(id)).payments).toHaveLength(2);
  const direct = await one<{ fx_rate: string; amount_usd: string }>(
    "insert into quote_payments(quote_id,amount,currency,date,method,type,fx_rate) values($1,7,'BOB','2026-10-12','cash','saldo',1) returning fx_rate::text,amount_usd::text",
    [id],
  );
  expect(Number(direct.fx_rate)).toBe(7);
  expect(Number(direct.amount_usd)).toBe(1);
});

it("is idempotent on identical retries and rejects changes under the same ID", async () => {
  const id = await fresh(),
    key = crypto.randomUUID();
  const first = await pay(id, 300, {}, key);
  const retry = await pay(id, 300, {}, key);
  expect(retry).toEqual(first);
  await expect(pay(id, 301, {}, key)).rejects.toThrow(/otros datos/);
  expect((await loadQuotePayments(id)).payments).toHaveLength(1);
  expect(await one("select count(*)::int n from ops_services where quote_id=$1", [id])).toEqual({
    n: 1,
  });
});

it("validates a private receipt belongs to this payment and prevents overwrites", async () => {
  const id = await fresh(),
    key = crypto.randomUUID(),
    path = `${id}/${key}/receipt.pdf`;
  await expect(pay(id, 300, { receipt_path: path }, key)).rejects.toThrow(/no accesible/);
  await pg.query("insert into storage.objects(bucket_id,name) values('payment-receipts',$1)", [
    path,
  ]);
  await expect(pay(id, 300, { receipt_path: path })).rejects.toThrow(/ajeno/);
  const result = await pay(id, 300, { receipt_path: path }, key);
  expect(result.payment).toMatchObject({
    receipt_path: path,
    bank: "Banco de prueba",
    registered_by: seller,
  });
  expect(
    await one(
      "with d as (delete from storage.objects where name=$1 returning *) select count(*)::int n from d",
      [path],
    ),
  ).toEqual({ n: 0 });
  await as(other);
  expect(await one("select count(*)::int n from storage.objects where name=$1", [path])).toEqual({
    n: 0,
  });
  await expect(
    pg.query("insert into storage.objects(bucket_id,name) values('payment-receipts',$1)", [
      `${id}/${crypto.randomUUID()}/receipt.pdf`,
    ]),
  ).rejects.toThrow(/row-level security/);
});

it("enforces ownership, Admin settings and append-only financial records", async () => {
  const id = await fresh();
  expect(
    await one(
      "with changed as (update pricing_settings set deposit_pct=1 returning *) select count(*)::int n from changed",
    ),
  ).toEqual({ n: 0 });
  await as(other);
  await expect(pay(id, 300)).rejects.toThrow();
  await expect(loadQuotePayments(id)).rejects.toThrow();
  await as(admin);
  await pay(id, 300);
  await expect(
    pg.query("update quote_payments set amount=1 where quote_id=$1", [id]),
  ).rejects.toThrow(/permission denied/);
  await expect(pg.query("delete from quote_payments where quote_id=$1", [id])).rejects.toThrow(
    /permission denied/,
  );
});

it("rolls back payment, sale, history and operation if copying a service fails", async () => {
  const id = await fresh();
  await pg.exec("reset role");
  await pg.exec(
    "create function public.fail_ops_payment_test() returns trigger language plpgsql as $$ begin raise exception 'copy failed'; end $$; create trigger fail_ops_payment_test before insert on ops_items for each row execute function public.fail_ops_payment_test()",
  );
  await pg.exec("set role authenticated");
  try {
    await expect(pay(id, 300)).rejects.toThrow(/copy failed/);
  } finally {
    await pg.exec(
      "reset role; drop trigger fail_ops_payment_test on ops_items; drop function public.fail_ops_payment_test(); set role authenticated",
    );
  }
  expect((await loadQuotePayments(id)).payments).toHaveLength(0);
  expect((await loadQuote(id)).quote.status).toBe("enviada");
  expect(await one("select count(*)::int n from ops_services where quote_id=$1", [id])).toEqual({
    n: 0,
  });
  expect(
    await one(
      "select count(*)::int n from quote_status_history where quote_id=$1 and new_status='vendida'",
      [id],
    ),
  ).toEqual({ n: 0 });
});

it("counts other payments toward balance but only deposits confirm the sale; overpayment is explicit", async () => {
  const id = await fresh();
  expect((await pay(id, 1000, { type: "saldo" })).summary).toMatchObject({
    status: "enviada",
    balance_usd: 0,
    deposit_remaining_usd: 300,
  });
  expect((await pay(id, 300)).summary).toMatchObject({
    status: "vendida",
    balance_usd: 0,
    credit_usd: 300,
  });
});

it.each(["borrador", "perdida", "cancelada", "archivada"])(
  "rejects deposits on %s",
  async (status) => {
    const id = await fresh(status !== "borrador");
    if (status === "archivada") await beginQuoteEdit(id);
    else if (status === "perdida" || status === "cancelada")
      await transitionQuote(id, status, "Prueba");
    await expect(pay(id, 300)).rejects.toThrow();
    expect((await loadQuotePayments(id)).payments).toHaveLength(0);
  },
);

it.each([0, -1, NaN, Infinity])("rejects invalid amount %s", async (amount) => {
  await expect(pay(crypto.randomUUID(), amount)).rejects.toThrow();
});

it("migrates historical payments with frozen FX and flags missing rates without inventing them", async () => {
  const old = await createDatabase({
    throughMigration: "20261012000200_quote_state_transitions.sql",
  });
  try {
    await old.exec(
      "insert into currencies(code,name) values('USD','USD'),('BOB','BOB'),('CLP','CLP') on conflict do nothing",
    );
    await old.query("insert into auth.users(id,email) values($1,'migration-pay@test.invalid')", [
      seller,
    ]);
    await old.exec("set role authenticated");
    await old.query("select set_config('request.jwt.claim.sub',$1,false)", [seller]);
    const c = (
      await old.query<{ id: string }>(
        "insert into clients(type,name) values('B2C','Historical') returning id",
      )
    ).rows[0]!.id;
    const q = (
      await old.query<{ id: string }>(
        "insert into quotes(code,client_id,client_type,language,start_date,pax_paying,category,fx_snapshot) values('HISTORY-PAY',$1,'B2C','es','2026-11-01',2,'COMFORT',$2) returning id",
        [c, { USD: 1, BOB: 7 }],
      )
    ).rows[0]!.id;
    await old.query(
      "insert into quote_payments(quote_id,amount,currency,date,method,type) values($1,10,'USD','2026-10-11','cash','otro'),($1,70,'BOB','2026-10-11','cash','otro'),($1,10000,'CLP','2026-10-11','cash','otro')",
      [q],
    );
    await old.exec("reset role");
    await old.exec(
      await readFile(
        new URL(
          "../../../supabase/migrations/20261012000300_quote_payments_deposit.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await old.exec("set role authenticated");
    const rows = (
      await old.query<{ currency: string; usd: string | null }>(
        "select currency,amount_usd::text usd from quote_payments order by currency",
      )
    ).rows;
    expect(rows).toEqual([
      { currency: "BOB", usd: "10.0000" },
      { currency: "CLP", usd: null },
      { currency: "USD", usd: "10.0000" },
    ]);
    expect(
      (
        await old.query<{ data: Record<string, unknown> }>(
          "select quote_payment_summary($1) data",
          [q],
        )
      ).rows[0]!.data,
    ).toMatchObject({ unconverted_payments: 1, paid_usd: null, balance_usd: null });
    await expect(
      old.query("select register_quote_payment($1,$2,$3)", [
        q,
        crypto.randomUUID(),
        input(1, { type: "otro" }),
      ]),
    ).rejects.toThrow(/históricos/);
  } finally {
    await old.close();
  }
}, 120000);
