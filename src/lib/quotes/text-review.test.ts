// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createDatabase } from "../../../scripts/db/local-db.mjs";
import { pgliteSupabase } from "../../test/pglite-supabase";
import type { Enums, Tables } from "../../types/db";

const transport = vi.hoisted(() => ({
  client: null as ReturnType<typeof pgliteSupabase> | null,
  upload: vi.fn(),
  signed: vi.fn(),
}));
vi.mock("../db", () => ({
  db: {
    from: (...args: Parameters<ReturnType<typeof pgliteSupabase>["from"]>) =>
      transport.client!.from(...args),
    rpc: (...args: Parameters<ReturnType<typeof pgliteSupabase>["rpc"]>) =>
      transport.client!.rpc(...args),
    storage: { from: () => ({ upload: transport.upload, createSignedUrl: transport.signed }) },
  },
  json: (value: unknown) => JSON.parse(JSON.stringify(value)),
  unwrap: ({ data, error }: { data: unknown; error: { message: string } | null }) => {
    if (error) throw new Error(error.message);
    if (data == null) throw new Error("Record not found or inaccessible");
    return data;
  },
}));
import { loadQuote, recalculateQuote, unreviewedDays, unreviewedDaysMessage } from "./index";
import { reviewQuoteDays, updateDayContent } from "./days";
import { transitionQuote } from "../states";
import { generateQuotePdf } from "../pdf";

let pg: Awaited<ReturnType<typeof createDatabase>>;
let clientId: string;
const admin = "72000000-0000-0000-0000-000000000001";
const seller = "72000000-0000-0000-0000-000000000002";
const ops = "72000000-0000-0000-0000-000000000003";
const other = "72000000-0000-0000-0000-000000000004";
const one = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) =>
  (await pg.query<T>(sql, args)).rows[0]!;
const as = (id: string) => pg.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);

beforeAll(async () => {
  pg = await createDatabase();
  await pg.query(
    "insert into currencies(code,name) values('USD','US Dollar') on conflict do nothing",
  );
  for (const [id, role] of [
    [admin, "admin"],
    [seller, "vendedor"],
    [ops, "operacion"],
    [other, "vendedor"],
  ]) {
    await pg.query("insert into auth.users(id,email) values($1,$2)", [
      id,
      `${role}-${id}@test.invalid`,
    ]);
    await pg.query("update profiles set role=$2::public.app_role where id=$1", [id, role]);
  }
  await pg.exec("set role authenticated");
  await as(admin);
  clientId = (
    await one<{ id: string }>(
      "insert into clients(type,name) values('B2C','Textos de prueba') returning id",
    )
  ).id;
  transport.client = pgliteSupabase(pg);
  transport.upload.mockImplementation(async (path: string) => {
    await pg.query("insert into storage.objects(bucket_id,name) values('quote-pdfs',$1)", [path]);
    return { data: { path }, error: null };
  });
  transport.signed.mockImplementation(async (path: string) => ({
    data: { signedUrl: `https://example.invalid/${path}` },
    error: null,
  }));
}, 60000);
beforeEach(async () => {
  vi.clearAllMocks();
  await pg.exec("set role authenticated");
  await as(seller);
});
afterAll(async () => pg?.close());

async function fresh(blockId?: string) {
  const { q } = await one<{ q: Tables<"quotes"> }>(
    "select to_jsonb(create_quote_snapshot($1,$2)) q",
    [
      {
        client_id: clientId,
        client_type: "B2C",
        language: "es",
        tour_sku: "REVIEW-TEST",
        category: "COMFORT",
        start_date: "2026-11-01",
        pax_paying: 2,
        tc_count: 0,
        rooming: {},
        vehicles: {},
        fx_snapshot: { USD: 1 },
        margin_pct: 25,
        rounding_rule: { mode: "none", increment: 1 },
        document_snapshot: { client_name: "Prueba", terms_url: "https://example.invalid/terms" },
      },
      [1, 2, 3].map((n) => ({
        day_number: n,
        title: "Título original",
        description: "Descripción original",
        snapshot: {
          ...(n === 1 && blockId ? { block_id: blockId } : {}),
          ...(n === 3 ? {} : { reviewed: n === 2 }),
        },
        items:
          n === 1
            ? [
                {
                  description: "Transporte",
                  type: "transporte",
                  pricing_unit: "per_group",
                  currency: "USD",
                  qty: 1,
                  unit_cost_original: 100,
                  price_overridden: true,
                  override_note: "Prueba",
                  pricing_snapshot: { rates: [] },
                },
              ]
            : [],
      })),
    ],
  );
  await recalculateQuote(q.id);
  return loadQuote(q.id);
}
async function block() {
  await as(admin);
  const { id } = await one<{ id: string }>(
    "insert into day_blocks(code,status) values('REVIEW-'||gen_random_uuid(),'activo') returning id",
  );
  await pg.query(
    "insert into day_block_translations(block_id,lang,title,description,reviewed) values($1,'es','Título original','Descripción original',false),($1,'it','Titolo','Descrizione',false)",
    [id],
  );
  await as(seller);
  return id;
}
const translations = (id: string) =>
  pg.query<Tables<"day_block_translations">>(
    "select * from day_block_translations where block_id=$1 order by lang",
    [id],
  );

describe("revisión de textos de la cotización", () => {
  it("treats absent/null/string reviewed as pending, preserves IDs and sorts without mutating", () => {
    const days = [
      { id: "3", day_number: 3, snapshot: {} },
      { id: "2", day_number: 2, snapshot: { reviewed: true } },
      { id: "1", day_number: 1, snapshot: { reviewed: false } },
      { id: "4", day_number: 4, snapshot: null },
      { id: "5", day_number: 5, snapshot: { reviewed: "true" } },
    ];
    expect(unreviewedDays(days).map((d) => d.id)).toEqual(["1", "3", "4", "5"]);
    expect(days.map((d) => d.id)).toEqual(["3", "2", "1", "4", "5"]);
    expect(unreviewedDaysMessage([], "es")).toBeNull();
    expect(unreviewedDaysMessage(days, "it")).toBe(
      "Faltan revisar los textos de los días 1, 3, 4, 5 (idioma IT)",
    );
  });
  it("PDF and state guard name pending days, including a free day with no reviewed field", async () => {
    const data = await fresh();
    const message = "Faltan revisar los textos de los días 1, 3 (idioma ES)";
    await expect(generateQuotePdf(data.quote.id)).rejects.toThrow(message);
    await expect(transitionQuote(data.quote.id, "revisada")).rejects.toThrow(message);
    expect(transport.upload).not.toHaveBeenCalled();
  });
  it("reviews only selected days with audit metadata, then all; PDF succeeds without recalculation", async () => {
    const data = await fresh();
    const result = await reviewQuoteDays(data.quote.id, [data.days[0]!.id]);
    expect(result.day_ids).toEqual([data.days[0]!.id]);
    let saved = await loadQuote(data.quote.id);
    expect(saved.days[0]!.snapshot).toMatchObject({
      reviewed: true,
      reviewed_by: seller,
      reviewed_at: expect.any(String),
    });
    expect(saved.days[1]).toEqual(data.days[1]);
    expect(unreviewedDays(saved.days).map((d) => d.day_number)).toEqual([3]);
    await expect(generateQuotePdf(data.quote.id)).rejects.toThrow("días 3 (idioma ES)");
    // SQL's omitted second argument and TS undefined both mean all days.
    await pg.query("select review_quote_days($1)", [data.quote.id]);
    const blob = await generateQuotePdf(data.quote.id);
    expect(new TextDecoder().decode((await blob.arrayBuffer()).slice(0, 4))).toBe("%PDF");
    saved = await loadQuote(data.quote.id);
    expect(saved.quote.pdf_path).toBeTruthy();
    await reviewQuoteDays(data.quote.id);
    saved = await loadQuote(data.quote.id);
    expect(saved.quote.pdf_path).toBeNull();
    expect(saved.quote.pdf_url).toBeNull();
    expect(saved.quote.calculation).toEqual(data.quote.calculation);
    expect(saved.quote.total_price_usd).toBe(data.quote.total_price_usd);
    expect(saved.items).toEqual(data.items);
    expect(saved.days.map((d) => d.block_snapshot)).toEqual(data.days.map((d) => d.block_snapshot));
    await expect(transitionQuote(data.quote.id, "revisada")).resolves.toBeDefined();
  });
  it("does not invent a calculation when it was already stale", async () => {
    const data = await fresh();
    await pg.query("update quote_days set title='Cambio previo' where id=$1", [data.days[0]!.id]);
    await reviewQuoteDays(data.quote.id);
    expect((await loadQuote(data.quote.id)).quote.calculation).toBeNull();
    await expect(generateQuotePdf(data.quote.id)).rejects.toThrow("Recalculate");
  });
  it.each(["revisada", "enviada", "vendida", "perdida", "cancelada"] as const)(
    "rejects review in %s without changes",
    async (status: Enums<"quote_status">) => {
      const data = await fresh();
      await reviewQuoteDays(data.quote.id);
      if (status === "perdida" || status === "cancelada")
        await transitionQuote(data.quote.id, status, "Prueba");
      else {
        await transitionQuote(data.quote.id, "revisada");
        if (status !== "revisada") await transitionQuote(data.quote.id, "enviada");
        if (status === "vendida") {
          await as(admin);
          await transitionQuote(data.quote.id, "vendida", "Venta de prueba");
        }
      }
      const before = await loadQuote(data.quote.id);
      await expect(reviewQuoteDays(data.quote.id)).rejects.toThrow("en borrador");
      expect(await loadQuote(data.quote.id)).toEqual(before);
    },
  );
  it("RLS rejects other sellers' quotes and catalog review is forbidden for sellers", async () => {
    const data = await fresh();
    await expect(
      reviewQuoteDays(data.quote.id, undefined, { alsoUpdateBlock: true }),
    ).rejects.toThrow("Solo administración u operación");
    expect(await loadQuote(data.quote.id)).toEqual(data);
    await as(other);
    await expect(reviewQuoteDays(data.quote.id)).rejects.toThrow("sin permiso");
    await as(seller);
    expect(await loadQuote(data.quote.id)).toEqual(data);
  });
  it("validates the whole selection atomically and [] never means all", async () => {
    const data = await fresh();
    const second = await fresh();
    await expect(
      reviewQuoteDays(data.quote.id, [data.days[0]!.id, second.days[0]!.id]),
    ).rejects.toThrow("días ajenos");
    expect(await loadQuote(data.quote.id)).toEqual(data);
    expect((await reviewQuoteDays(data.quote.id, [])).day_ids).toEqual([]);
    expect(await loadQuote(data.quote.id)).toEqual(data);
  });
  it("updateDayContent reviews the edited day, even identical text, without touching the library", async () => {
    const id = await block();
    const original = await translations(id);
    const data = await fresh(id);
    await updateDayContent(data.days[0]!.id, { title: { es: "Título editado" } });
    let saved = await loadQuote(data.quote.id);
    expect(saved.days[0]!.snapshot).toMatchObject({ reviewed: true, reviewed_by: seller });
    expect(saved.days[0]!.title).toBe("Título editado");
    expect(saved.days[0]!.block_snapshot).toEqual(data.days[0]!.block_snapshot);
    expect(await translations(id)).toEqual(original);
    await updateDayContent(data.days[2]!.id, { title: { es: data.days[2]!.title } });
    saved = await loadQuote(data.quote.id);
    expect(unreviewedDays(saved.days)).toEqual([]);
    expect(saved.quote.total_price_usd).toBe(data.quote.total_price_usd);
    await expect(generateQuotePdf(data.quote.id)).resolves.toBeInstanceOf(Blob);
  });
  it.each([admin, ops])(
    "catalog-capable role %s reviews only the matching language",
    async (actor) => {
      const id = await block();
      await as(actor);
      const data = await fresh(id);
      const result = await reviewQuoteDays(data.quote.id, [data.days[0]!.id], {
        alsoUpdateBlock: true,
      });
      expect(result.block_translation_ids).toHaveLength(1);
      expect(result.skipped_blocks).toEqual([]);
      expect((await translations(id)).rows.map((t) => [t.lang, t.reviewed])).toEqual([
        ["es", true],
        ["it", false],
      ]);
      expect((await loadQuote(data.quote.id)).days[0]!.block_snapshot).toEqual(
        data.days[0]!.block_snapshot,
      );
    },
  );
  it("never approves customized or changed library text, and reports the skipped days", async () => {
    const id = await block();
    await as(admin);
    const data = await fresh(id);
    await updateDayContent(data.days[0]!.id, { description: { es: "Personalizada" } });
    let result = await reviewQuoteDays(data.quote.id, undefined, { alsoUpdateBlock: true });
    expect(result.block_translation_ids).toEqual([]);
    expect(result.skipped_blocks).toContainEqual({
      day_id: data.days[0]!.id,
      reason: "El día tiene textos personalizados.",
    });
    expect((await translations(id)).rows.every((t) => !t.reviewed)).toBe(true);
    const second = await fresh(id);
    await pg.query(
      "update day_block_translations set description='Nuevo texto sin revisar' where block_id=$1 and lang='es'",
      [id],
    );
    result = await reviewQuoteDays(second.quote.id, [second.days[0]!.id], {
      alsoUpdateBlock: true,
    });
    expect(result.skipped_blocks[0]!.reason).toContain("cambió");
    expect((await translations(id)).rows.every((t) => !t.reviewed)).toBe(true);
  });
  it("rolls back library approval if a subsequent child write fails", async () => {
    const id = await block();
    await as(admin);
    const data = await fresh(id);
    await pg.exec("reset role");
    await pg.exec(`create function public.fail_review_test() returns trigger language plpgsql as $$ begin raise exception 'Fallo de prueba'; end $$;
      create trigger zz_fail_review_test before update on public.quote_days for each row execute function public.fail_review_test();`);
    await pg.exec("set role authenticated");
    try {
      await expect(
        reviewQuoteDays(data.quote.id, [data.days[0]!.id], { alsoUpdateBlock: true }),
      ).rejects.toThrow("Fallo de prueba");
      expect(await loadQuote(data.quote.id)).toEqual(data);
      expect((await translations(id)).rows.every((t) => !t.reviewed)).toBe(true);
    } finally {
      await pg.exec("reset role");
      await pg.exec(
        "drop trigger zz_fail_review_test on public.quote_days; drop function public.fail_review_test()",
      );
    }
  });
});
