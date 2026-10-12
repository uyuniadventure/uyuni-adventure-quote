// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createDatabase } from "../../../scripts/db/local-db.mjs";
import { pgliteSupabase } from "@/test/pglite-supabase";
import type { Enums, Tables } from "@/types/db";

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
import { beginQuoteEdit, transitionQuote } from "./index";
import { loadQuote, recalculateQuote, updateQuoteItem } from "../quotes";

type Status = Enums<"quote_status">;
let pg: Awaited<ReturnType<typeof createDatabase>>;
let clientId: string;
const admin = "71000000-0000-0000-0000-000000000001";
const seller = "71000000-0000-0000-0000-000000000002";
const ops = "71000000-0000-0000-0000-000000000003";
const one = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) =>
  (await pg.query<T>(sql, args)).rows[0]!;
const as = (id: string) => pg.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
const history = async (id: string) =>
  (
    await pg.query<Tables<"quote_status_history">>(
      "select * from quote_status_history where quote_id=$1 order by changed_at,id",
      [id],
    )
  ).rows;
// Above the 30% deposit on the adjusted USD 133 quote (USD 39.90).
async function pay(id: string, type = "deposito", amount = 40) {
  return one<{ id: string }>(
    "insert into quote_payments(quote_id,amount,currency,date,method,type) values($1,$2,'USD','2026-10-12','transferencia',$3) returning id",
    [id, amount, type],
  );
}
async function fresh() {
  const { q } = await one<{ q: Tables<"quotes"> }>(
    "select to_jsonb(create_quote_snapshot($1,$2)) q",
    [
      {
        client_id: clientId,
        client_type: "B2C",
        language: "es",
        tour_sku: "STATE-TEST",
        category: "COMFORT",
        start_date: "2026-11-01",
        pax_paying: 2,
        tc_count: 0,
        rooming: {},
        vehicles: {},
        fx_snapshot: { USD: 1 },
        margin_pct: 25,
        rounding_rule: { mode: "none", increment: 1 },
      },
      [
        {
          day_number: 1,
          title: "Día original",
          description: "Texto congelado",
          snapshot: { reviewed: true },
          items: [
            {
              description: "Transfer",
              type: "transporte",
              pricing_unit: "per_group",
              currency: "USD",
              qty: 1,
              unit_cost_original: 100,
              price_overridden: true,
              override_note: "Costo confirmado",
              adjustment_pct: 0.064,
              adjustment_note: "Prueba",
              pricing_snapshot: { rates: [] },
            },
          ],
        },
      ],
    ],
  );
  await recalculateQuote(q.id);
  return q.id;
}
async function at(status: Status) {
  const id = await fresh();
  if (status === "borrador") return id;
  if (status === "perdida" || status === "cancelada") {
    await transitionQuote(id, status, "Motivo inicial");
    return id;
  }
  await transitionQuote(id, "revisada");
  if (status === "revisada") return id;
  await transitionQuote(id, "enviada");
  if (status === "vendida") await pay(id);
  return id;
}
beforeAll(async () => {
  pg = await createDatabase();
  await pg.query(
    "insert into currencies(code,name) values('USD','US Dollar') on conflict(code) do nothing",
  );
  await pg.query(
    "insert into auth.users(id,email) values($1,'admin-states@test.invalid'),($2,'seller-states@test.invalid'),($3,'ops-states@test.invalid')",
    [admin, seller, ops],
  );
  await pg.query("update profiles set role='admin' where id=$1", [admin]);
  await pg.query("update profiles set role='operacion' where id=$1", [ops]);
  await pg.exec("set role authenticated");
  await as(admin);
  clientId = (
    await one<{ id: string }>("insert into clients(type,name) values('B2C','Estados') returning id")
  ).id;
  transport.client = pgliteSupabase(pg);
}, 60000);
beforeEach(async () => {
  await pg.exec("set role authenticated");
  await as(admin);
});
afterAll(async () => pg?.close());

// Explicit acceptance matrix: Admin has a reason for the exceptional manual sale.
const allowed: Record<Status, Status[]> = {
  borrador: ["revisada", "perdida", "cancelada"],
  revisada: ["enviada", "perdida", "cancelada"],
  enviada: ["vendida", "perdida", "cancelada"],
  vendida: ["perdida", "cancelada"],
  perdida: ["cancelada"],
  cancelada: ["perdida"],
};
const statuses = Object.keys(allowed) as Status[];
describe("transitionQuote + Postgres: complete transition matrix", () => {
  it.each(
    statuses.flatMap((from) =>
      statuses.map((to) => ({ from, to, allowed: allowed[from].includes(to) })),
    ),
  )("$from → $to (allowed: $allowed)", async ({ from, to, allowed: ok }) => {
    const id = await at(from);
    const before = await loadQuote(id),
      log = await history(id);
    if (!ok) {
      await expect(transitionQuote(id, to, "Motivo explícito")).rejects.toThrow(
        /Invalid quote transition/,
      );
      expect(await loadQuote(id)).toEqual(before);
      expect(await history(id)).toEqual(log);
      return;
    }
    expect(await transitionQuote(id, to, "  Motivo explícito  ")).toMatchObject({ status: to });
    const rows = await history(id);
    expect(rows).toHaveLength(log.length + 1);
    const event = rows.find((row) => !log.some((old) => old.id === row.id))!;
    expect(event).toMatchObject({
      old_status: from,
      new_status: to,
      changed_by: admin,
      note: "Motivo explícito",
    });
    expect(Number.isNaN(Date.parse(event.changed_at))).toBe(false);
    if (["vendida", "perdida", "cancelada"].includes(to))
      expect((await loadQuote(id)).quote.next_followup_at).toBeNull();
  });
});
describe("reasons, red warnings, deposit and immutable versions", () => {
  it.each(
    statuses.flatMap((from) =>
      (["perdida", "cancelada"] as const).filter((to) => from !== to).map((to) => ({ from, to })),
    ),
  )("requires a reason for $from → $to", async ({ from, to }) => {
    const id = await at(from);
    await expect(transitionQuote(id, to, "  ")).rejects.toThrow(/reason required/);
    expect((await loadQuote(id)).quote.status).toBe(from);
  });
  it.each([seller, ops])(
    "cannot sell without a deposit as %s, even with a note or direct SQL",
    async (actor) => {
      await as(actor);
      const id = await at("enviada");
      await expect(transitionQuote(id, "vendida", "Quiero vender")).rejects.toThrow(
        /registered deposit/,
      );
      await expect(
        pg.query("update quotes set status='vendida' where id=$1", [id]),
      ).rejects.toThrow(/registered deposit/);
      expect((await loadQuote(id)).quote.status).toBe("enviada");
    },
  );
  it("only an Admin can override the deposit and must record their own reason/identity", async () => {
    await as(seller);
    const id = await at("enviada");
    await as(admin);
    await expect(transitionQuote(id, "vendida")).rejects.toThrow(/admin with a reason/);
    await expect(transitionQuote(id, "vendida", " ")).rejects.toThrow(/admin with a reason/);
    await transitionQuote(id, "vendida", "Depósito confirmado externamente");
    expect((await history(id)).find((h) => h.new_status === "vendida")).toMatchObject({
      changed_by: admin,
      note: "Depósito confirmado externamente",
    });
  });
  it("a real deposit sells atomically once; balance/other payments do not sell", async () => {
    await as(seller);
    const draft = await at("borrador");
    await expect(pay(draft)).rejects.toThrow(/sent quote/);
    expect(
      await one("select count(*)::int n from quote_payments where quote_id=$1", [draft]),
    ).toEqual({ n: 0 });
    const id = await at("enviada");
    await pay(id, "saldo");
    await pay(id, "otro");
    expect((await loadQuote(id)).quote.status).toBe("enviada");
    await expect(pay(id, "deposito", 0)).rejects.toThrow();
    const deposit = await pay(id);
    await pay(id);
    expect((await loadQuote(id)).quote.status).toBe("vendida");
    expect((await history(id)).filter((h) => h.new_status === "vendida")).toEqual([
      expect.objectContaining({
        old_status: "enviada",
        changed_by: seller,
        note: `Depósito registrado: ${deposit.id}`,
      }),
    ]);
    expect(await one("select count(*)::int n from ops_services where quote_id=$1", [id])).toEqual({
      n: 1,
    });
    await expect(pg.query("delete from quote_payments where quote_id=$1", [id])).rejects.toThrow(
      /permission denied/,
    );
  });
  it.each(["quote", "item", "scenario"])(
    "blocks sending on a red %s error, also through direct SQL; permits closing it",
    async (kind) => {
      const id = await at("revisada");
      const { quote } = await loadQuote(id);
      const calculation = structuredClone(quote.calculation) as unknown as {
        status: string;
        items: { status: string }[];
        scenarios: { status: string }[];
      };
      if (kind === "quote") calculation.status = "error";
      if (kind === "item") calculation.items[0]!.status = "error";
      if (kind === "scenario") calculation.scenarios = [{ status: "error" }];
      await pg.query("update quotes set calculation=$2 where id=$1", [id, calculation]);
      await expect(transitionQuote(id, "enviada")).rejects.toThrow(/errores de cálculo/);
      await expect(
        pg.query("update quotes set status='enviada' where id=$1", [id]),
      ).rejects.toThrow(/errores de cálculo/);
      await transitionQuote(id, "perdida", "No viaja");
      await transitionQuote(id, "cancelada", "Archivo cancelado");
    },
  );
  it("requires a fresh calculation and rechecks review/import blockers at delivery, while allowing advisory warnings", async () => {
    const id = await at("revisada");
    await pg.query(
      "update quote_days set snapshot=snapshot || '{\"reviewed\":false}' where quote_id=$1",
      [id],
    );
    await expect(transitionQuote(id, "enviada")).rejects.toThrow(/Recalculate/);
    await recalculateQuote(id);
    await expect(transitionQuote(id, "enviada")).rejects.toThrow(/Review all/);
    await pg.query(
      "update quote_days set snapshot=snapshot || '{\"reviewed\":true}' where quote_id=$1",
      [id],
    );
    await pg.query(
      'update quotes set pricing_config=pricing_config || \'{"unresolved":["SKU pendiente"]}\' where id=$1',
      [id],
    );
    await recalculateQuote(id);
    await expect(transitionQuote(id, "enviada")).rejects.toThrow(/Resolve source/);
    await pg.query(
      "update quotes set pricing_config=pricing_config || '{\"unresolved\":[]}' where id=$1",
      [id],
    );
    await recalculateQuote(id);
    await pg.query(
      "update quotes set calculation=jsonb_set(calculation,'{warnings}','[\"Aviso de continuidad\"]') where id=$1",
      [id],
    );
    expect(await transitionQuote(id, "enviada")).toMatchObject({ status: "enviada" });
  });
  it("versions on edit, freezes the sent copy and audits the new draft without copying payments/history", async () => {
    await as(seller);
    const id = await at("enviada"),
      original = await loadQuote(id);
    const edited = await updateQuoteItem(original.items[0]!.id, { qty: 2 });
    const next = await loadQuote(edited.quote_id),
      archived = await loadQuote(id);
    expect(next.quote).toMatchObject({
      status: "borrador",
      parent_quote_id: id,
      version: 2,
      calculation: null,
      next_followup_at: null,
    });
    expect(next.quote.code).toBe(`${original.quote.code}-v2`);
    expect(next.items[0]).toMatchObject({
      qty: 2,
      adjustment_pct: 0.064,
      adjustment_note: "Prueba",
    });
    expect(next.days[0]!.block_snapshot).toEqual(original.days[0]!.block_snapshot);
    expect(archived.days).toEqual(original.days);
    expect(archived.items).toEqual(original.items);
    expect(archived.quote.calculation).toEqual(original.quote.calculation);
    expect(archived.quote.archived_at).toBeTruthy();
    expect(await history(edited.quote_id)).toEqual([
      expect.objectContaining({
        old_status: null,
        new_status: "borrador",
        changed_by: seller,
        note: `Nueva versión de ${original.quote.code}`,
      }),
    ]);
    await expect(transitionQuote(id, "perdida", "Anterior")).rejects.toThrow(/Archived/);
    await expect(pg.query("update quotes set margin_pct=50 where id=$1", [id])).rejects.toThrow(
      /Archived/,
    );
    await expect(
      pg.query("update quote_items set qty=3 where id=$1", [original.items[0]!.id]),
    ).rejects.toThrow(/immutable/);
    await expect(pay(id)).rejects.toThrow(/Archived/);
    expect(await beginQuoteEdit(edited.quote_id)).toBe(edited.quote_id);
  });
  it("beginQuoteEdit creates one draft and refuses archived or closed versions; failed edits roll everything back", async () => {
    const id = await at("enviada"),
      before = await loadQuote(id);
    await expect(updateQuoteItem(before.items[0]!.id, { qty: -1 })).rejects.toThrow();
    expect(await loadQuote(id)).toEqual(before);
    const next = await beginQuoteEdit(id);
    expect(next).not.toBe(id);
    expect((await loadQuote(next)).quote.status).toBe("borrador");
    await expect(beginQuoteEdit(id)).rejects.toThrow(/Archived/);
    for (const status of ["vendida", "perdida", "cancelada"] as const)
      await expect(beginQuoteEdit(await at(status))).rejects.toThrow(/Only sent/);
  });
  it("enforces ownership, immutable history and payment identity", async () => {
    await as(seller);
    const id = await at("enviada");
    await expect(
      pg.query(
        "insert into quote_payments(quote_id,amount,currency,date,method,type,registered_by) values($1,30,'USD','2026-10-12','bank','deposito',$2)",
        [id, admin],
      ),
    ).rejects.toThrow(/actor/);
    await as(ops);
    await expect(transitionQuote(id, "cancelada", "Ajena")).rejects.toThrow();
    await expect(beginQuoteEdit(id)).rejects.toThrow();
    expect(await history(id)).toEqual([]);
    await as(seller);
    await expect(
      pg.query("update quote_status_history set note='changed' where quote_id=$1", [id]),
    ).rejects.toThrow(/permission denied/);
    await expect(
      pg.query("insert into quote_status_history(quote_id,new_status) values($1,'vendida')", [id]),
    ).rejects.toThrow(/permission denied/);
  });
  it("cannot edit inputs and send a stale calculation in the same SQL statement", async () => {
    const id = await at("revisada"),
      before = await loadQuote(id);
    await expect(
      pg.query("update quotes set margin_pct=50,status='enviada' where id=$1", [id]),
    ).rejects.toThrow(/Recalculate/);
    expect(await loadQuote(id)).toEqual(before);
  });
  it("service-role email completion records the sender, even when Admin sends another seller's quote", async () => {
    await as(seller);
    const id = await at("revisada");
    await pg.query(
      "update quotes set pdf_path=$2,pdf_url='https://example.invalid/test.pdf' where id=$1",
      [id, `${id}/test.pdf`],
    );
    await as(admin);
    const { email } = await one<{ email: { id: string } }>(
      "select to_jsonb(claim_quote_email($1,'client@example.invalid','Programa','Contenido')) email",
      [id],
    );
    await pg.exec("set role service_role");
    await as("");
    await pg.query("select finish_quote_email($1,'local-test-receipt')", [email.id]);
    await pg.query("select finish_quote_email($1,'local-test-receipt')", [email.id]);
    await pg.exec("set role authenticated");
    await as(admin);
    expect((await history(id)).filter((h) => h.new_status === "enviada")).toEqual([
      expect.objectContaining({
        changed_by: admin,
        old_status: "revisada",
        note: "Email aceptado por Resend: local-test-receipt",
      }),
    ]);
  });
  it("does not leak reasons between transitions in the same transaction", async () => {
    const first = await at("enviada"),
      second = await at("enviada");
    await pg.exec("begin");
    try {
      await transitionQuote(first, "vendida", "Excepción del primero");
      expect(await one("select current_setting('app.transition_note',true) note")).toEqual({
        note: "",
      });
      await expect(transitionQuote(second, "vendida")).rejects.toThrow(/admin with a reason/);
    } finally {
      await pg.exec("rollback");
    }
    expect((await loadQuote(first)).quote.status).toBe("enviada");
  });
});
