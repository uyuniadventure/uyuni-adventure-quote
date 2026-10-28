// @vitest-environment node
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createDatabase, seedDatabase } from "../../../scripts/db/local-db.mjs";
import { pgliteSupabase } from "@/test/pglite-supabase";
import fixture from "../../../tests/fixtures/SPAUYU-3D2N-MP.json";
import { registerQuotePayment } from "./payments";
import { transitionQuote } from "../states";
import { calculateQuote, type QuoteInput } from "../pricing";
import { generateQuotePdf } from "../pdf";
import { getTemplateForQuote, templateQuotePrefill } from "./template-entry";
import { saveItemLabel, saveQuoteDocument } from "./document";

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
  it("saves PDF text without changing totals, rejects unknown keys and freezes non-drafts", async () => {
    const quote = await createQuoteFromTemplate(templateId, basics());
    const originalCost = quote.total_cost_usd;
    const originalPrice = quote.total_price_usd;
    await expect(
      saveQuoteDocument(quote.id, { arbitrary_sql_key: "no" } as never),
    ).rejects.toThrow();
    const edited = await saveQuoteDocument(quote.id, {
      client_name: "Cliente editado",
      introduction: "Introducción revisada para el PDF.",
    });
    expect(edited.total_cost_usd).toBe(originalCost);
    expect(edited.total_price_usd).toBe(originalPrice);
    expect(edited.calculation).toEqual(quote.calculation);

    const saved = await loadQuote(quote.id);
    const label = await saveItemLabel(quote.id, saved.items[0]!.id, "Traslado personalizado");
    expect(
      (label.document_snapshot as { item_labels: Record<string, string> }).item_labels[
        saved.items[0]!.id
      ],
    ).toBe("Traslado personalizado");
    const afterLabel = await loadQuote(quote.id);
    expect(afterLabel.quote.total_cost_usd).toBe(originalCost);
    expect(afterLabel.quote.total_price_usd).toBe(originalPrice);

    await transitionQuote(quote.id, "perdida", "Prueba de estado no editable");
    await expect(saveQuoteDocument(quote.id, { introduction: "No guardar" })).rejects.toThrow(
      "solo se pueden editar en borrador",
    );
    await expect(saveItemLabel(quote.id, saved.items[0]!.id, "No guardar")).rejects.toThrow(
      "solo se pueden editar en borrador",
    );
  });

  it("saves a valid nonempty info[] through PGlite and preserves the saved calculation", async () => {
    const quote = await createQuoteFromTemplate(templateId, basics());
    const info = [{ title: "Salud y altitud", content: "Texto práctico válido." }];
    await saveQuoteDocument(quote.id, { info });
    const { quote: saved } = await loadQuote(quote.id);
    expect((saved.document_snapshot as { info: unknown }).info).toEqual(info);
    expect(saved.total_cost_usd).toBe(quote.total_cost_usd);
    expect(saved.total_price_usd).toBe(quote.total_price_usd);
    expect(saved.calculation).toEqual(quote.calculation);
  });

  it("creates from the direct template entry at the same SPA 2-pax total as the wizard", async () => {
    await as(seller);
    const wizard = await createQuoteFromTemplate(templateId, basics());
    const selected = await getTemplateForQuote(templateId);
    const prefill = templateQuotePrefill(selected);
    const direct = await createQuoteFromTemplate(selected.id, {
      ...basics(),
      pax_paying: Number(prefill.pax_paying),
      tc_count: Number(prefill.tc_count),
      ...(prefill.category ? { category: prefill.category } : {}),
    });
    expect(direct.total_price_usd).toBe(wizard.total_price_usd);
    expect(direct.total_cost_usd).toBe(wizard.total_cost_usd);
    expect(direct.rooming).toEqual(wizard.rooming);
    expect(direct.staff).toEqual(wizard.staff);
    expect(direct.template_id).toBe(wizard.template_id);
  });
  it("registers SPAUYU 2 pax deposit and exposes the copied service in Operations", async () => {
    await as(seller);
    const quote = await createQuoteFromTemplate(templateId, basics());
    // Simulate the reviewer clearing import/text checks in this local acceptance
    // fixture only. Production send guards remain intact; pricing is unchanged.
    await pg.query(
      "update quotes set pricing_config=jsonb_set(pricing_config,'{unresolved}','[]') where id=$1",
      [quote.id],
    );
    await pg.query(
      "update quote_days set snapshot=jsonb_set(snapshot,'{reviewed}','true') where quote_id=$1",
      [quote.id],
    );
    await recalculateQuote(quote.id);
    await transitionQuote(quote.id, "revisada");
    await transitionQuote(quote.id, "enviada");
    const result = await registerQuotePayment(quote.id, crypto.randomUUID(), {
      amount: Math.round(quote.total_price_usd! * quote.deposit_pct) / 100,
      currency: "USD",
      date: "2026-10-12",
      method: "transferencia",
      type: "deposito",
    });
    expect(result.summary.status).toBe("vendida");
    const service = await one<{ data: Record<string, unknown> }>(
      "select to_jsonb(o) data from ops_services o where id=$1",
      [result.summary.operation_id],
    );
    expect(service.data).toMatchObject({
      quote_id: quote.id,
      pax: 2,
      quoted_cost_usd: 1939,
      sale_price_usd: quote.total_price_usd,
    });
    expect(service.data["days_snapshot"]).toHaveLength(3);
    const costs = await one<{ n: number; cost: string }>(
      "select count(*)::int n,sum(cost_usd)::text cost from ops_items where service_id=$1",
      [result.summary.operation_id],
    );
    expect(costs.n).toBeGreaterThan(0);
    expect(Number(costs.cost)).toBeCloseTo(fixture.expected.cost_usd, 2);
  });
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

  it("creates a visible pending template with the same total and preserves import warnings", async () => {
    const active = await createQuoteFromTemplate(templateId, basics());
    await pg.query("update itinerary_templates set status='pendiente',created_by=$2 where id=$1", [
      templateId,
      seller,
    ]);
    try {
      await as(seller);
      const q = await createQuoteFromTemplate(templateId, basics());
      expect(q.status).toBe("borrador");
      expect(q.total_cost_usd).toBeCloseTo(fixture.expected.cost_usd, 2);
      expect(q.total_cost_usd).toBe(active.total_cost_usd);
      expect(q.total_price_usd).toBe(active.total_price_usd);
      expect(q.total_price_usd).toBe(
        calculateQuote(fixture.input as unknown as QuoteInput).total_price_usd,
      );
      const source = await one<{ import_warnings: unknown }>(
        "select import_warnings from itinerary_templates where id=$1",
        [templateId],
      );
      expect(q.pricing_config).toMatchObject({ unresolved: source.import_warnings });
      expect((await loadQuote(q.id)).days).toHaveLength(3);
    } finally {
      await as(admin);
      await pg.query("update itinerary_templates set status='activo',created_by=null where id=$1", [
        templateId,
      ]);
    }
  });

  it("the definer RPC rejects somebody else's pending template even with a forged source", async () => {
    const before = await persisted();
    await pg.query("update itinerary_templates set status='pendiente',created_by=$2 where id=$1", [
      templateId,
      admin,
    ]);
    try {
      await as(seller);
      await expect(
        pg.query("select create_quote_from_template($1,'{}','[]','{}','{}')", [templateId]),
      ).rejects.toThrow("no está disponible para tu usuario");
      expect(await persisted()).toEqual(before);
    } finally {
      await as(admin);
      await pg.query("update itinerary_templates set status='activo',created_by=null where id=$1", [
        templateId,
      ]);
    }
  });

  it("does not force an error solely for a legacy economic status", async () => {
    const before = await persisted();
    await pg.exec("reset role; select set_config('app.import_economic_write','on',false)");
    await pg.query(
      "update itinerary_templates set status='activo',economic_status='blocked',economic_issues=array['Costo pendiente'] where id=$1",
      [templateId],
    );
    await pg.exec("set role authenticated");
    await as(admin);
    try {
      const quote = await createQuoteFromTemplate(templateId, basics());
      expect(quote.status).toBe("borrador");
      expect(quote.calculation).not.toMatchObject({
        warnings: expect.arrayContaining([
          expect.stringContaining("Validación económica de la plantilla"),
        ]),
      });
      expect((await persisted())["quotes"]).toBe(Number(before["quotes"]) + 1);
      expect(
        await one("select economic_status,economic_issues from itinerary_templates where id=$1", [
          templateId,
        ]),
      ).toEqual({ economic_status: "blocked", economic_issues: ["Costo pendiente"] });
    } finally {
      await pg.exec("reset role; select set_config('app.import_economic_write','on',false)");
      await pg.query(
        "update itinerary_templates set economic_status='validated',economic_issues='{}' where id=$1",
        [templateId],
      );
      await pg.exec("set role authenticated");
      await as(admin);
    }
  });

  it("rejects inactive templates but copies empty source days as editable error drafts", async () => {
    const before = await persisted();
    await pg.query("update itinerary_templates set status='inactivo' where id=$1", [templateId]);
    await expect(createQuoteFromTemplate(templateId, basics())).rejects.toThrow("archivada");
    await expect(
      pg.query("select create_quote_from_template($1,'{}','[]','{}','{}')", [templateId]),
    ).rejects.toThrow("archivada");
    await pg.query("update itinerary_templates set status='activo' where id=$1", [templateId]);
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
      const quote = await createQuoteFromTemplate(templateId, basics());
      const saved = await loadQuote(quote.id);
      expect(saved.days).toHaveLength(3);
      expect(saved.days[1]).toMatchObject({ day_number: 2, title: "Vacío" });
      expect(quote).toMatchObject({
        status: "borrador",
        total_cost_usd: null,
        total_price_usd: null,
      });
      expect(quote.calculation).toMatchObject({
        status: "error",
        warnings: expect.arrayContaining([
          expect.stringContaining("Días con servicios pendientes: 2"),
        ]),
      });
    } finally {
      await pg.query("update template_days set block_id=$1 where id=$2", [
        original.block_id,
        original.id,
      ]);
    }
    expect((await persisted())["quotes"]).toBe(Number(before["quotes"]) + 1);
  });

  it("keeps missing tariffs as null errors and blocks review and PDF", async () => {
    const service = (
      await one<{ service_id: string }>(
        `select i.service_id from day_block_items i join template_days d on d.block_id=i.block_id
         where d.template_id=$1 and i.service_id is not null limit 1`,
        [templateId],
      )
    ).service_id;
    const rates = (
      await pg.query<{ id: string; price_net: number | null; price_rack: number | null }>(
        "select id,price_net,price_rack from service_rates where service_id=$1",
        [service],
      )
    ).rows;
    try {
      await pg.query(
        "update service_rates set price_net=null,price_rack=null where service_id=$1",
        [service],
      );
      const quote = await createQuoteFromTemplate(templateId, basics());
      const saved = await loadQuote(quote.id);
      expect(quote).toMatchObject({
        status: "borrador",
        total_cost_usd: null,
        total_margin_usd: null,
        total_price_usd: null,
      });
      expect(quote.calculation).toMatchObject({ status: "error" });
      expect(
        (quote.calculation as { items: { status: string; total_cost_usd: number | null }[] }).items,
      ).toContainEqual(expect.objectContaining({ status: "error", total_cost_usd: null }));
      await pg.query(
        "update quotes set pricing_config=jsonb_set(pricing_config,'{unresolved}','[]') where id=$1",
        [quote.id],
      );
      await pg.query(
        "update quote_days set snapshot=jsonb_set(snapshot,'{reviewed}','true') where quote_id=$1",
        [quote.id],
      );
      await recalculateQuote(quote.id);
      await expect(transitionQuote(quote.id, "revisada")).rejects.toThrow("errores de cálculo");
      await expect(generateQuotePdf(quote.id)).rejects.toThrow("errores de cálculo");
      expect(
        (await loadQuote(quote.id)).items.map((item) => [
          item.id,
          item.service_id,
          item.pricing_snapshot,
        ]),
      ).toEqual(saved.items.map((item) => [item.id, item.service_id, item.pricing_snapshot]));
    } finally {
      for (const rate of rates)
        await pg.query("update service_rates set price_net=$2,price_rack=$3 where id=$1", [
          rate.id,
          rate.price_net,
          rate.price_rack,
        ]);
    }
  });

  it("preserves an unrepresentable service warning without fabricating an item", async () => {
    const service = (
      await one<{ id: string }>(
        `insert into services(sku,name,type,status)
         values('INCOMPLETE_DRAFT_SERVICE','Servicio por completar','extra','activo') returning id`,
      )
    ).id;
    const block = (
      await one<{ id: string }>(
        "insert into day_blocks(code,status) values('INCOMPLETE_DRAFT_DAY','activo') returning id",
      )
    ).id;
    await pg.query(
      "insert into day_block_translations(block_id,lang,title,description,reviewed) values($1,'es','Día editable','Completar servicios',true)",
      [block],
    );
    await pg.query("insert into day_block_items(block_id,service_id,qty) values($1,$2,1)", [
      block,
      service,
    ]);
    const template = (
      await one<{ id: string }>(
        `insert into itinerary_templates(sku,name,days,nights,route_type,category,status)
         values('INCOMPLETE-DRAFT-1D0N','Borrador incompleto',1,0,'ONEWAY','COMFORT','activo') returning id`,
      )
    ).id;
    await pg.query("insert into template_days(template_id,day_number,block_id) values($1,1,$2)", [
      template,
      block,
    ]);

    const quote = await createQuoteFromTemplate(template, basics());
    const saved = await loadQuote(quote.id);
    expect(saved.items).toEqual([]);
    expect(saved.days[0]!.snapshot).toMatchObject({
      omitted_economic_items: [
        expect.stringContaining("INCOMPLETE_DRAFT_SERVICE: falta unidad de cobro y moneda"),
      ],
    });
    expect(quote).toMatchObject({
      status: "borrador",
      total_cost_usd: null,
      total_margin_usd: null,
      total_price_usd: null,
    });
    expect(quote.calculation).toMatchObject({
      status: "error",
      warnings: expect.arrayContaining([
        expect.stringContaining("INCOMPLETE_DRAFT_SERVICE: falta unidad de cobro y moneda"),
      ]),
    });
    expect(await recalculateQuote(quote.id)).toMatchObject({
      status: "error",
      warnings: expect.arrayContaining([
        expect.stringContaining("INCOMPLETE_DRAFT_SERVICE: falta unidad de cobro y moneda"),
      ]),
    });
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
      ($1,'ALL','2027-01-01','2027-12-31',1,4,20),($1,'RAIN','2027-01-01','2027-12-31',1,2,30),
      ($1,'RAIN','2027-01-01','2027-12-31',3,4,40)`,
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
      seasons: [{ from: "2027-01-01", to: "2027-01-31", season: "RAIN" }],
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
