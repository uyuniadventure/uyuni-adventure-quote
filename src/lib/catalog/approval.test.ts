// @vitest-environment node
import { readFile } from "node:fs/promises";
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { createDatabase, root } from "../../../scripts/db/local-db.mjs";
import { pgliteSupabase } from "@/test/pglite-supabase";

const transport = vi.hoisted(() => ({ client: null as ReturnType<typeof pgliteSupabase> | null }));
vi.mock("../db", () => ({
  db: {
    rpc: (...args: Parameters<ReturnType<typeof pgliteSupabase>["rpc"]>) =>
      transport.client!.rpc(...args),
  },
  unwrap: ({ data, error }: { data: unknown; error: { message: string } | null }) => {
    if (error) throw new Error(error.message);
    return data;
  },
}));
import {
  approveDayBlocks,
  approveImportReviewItems,
  approveTemplates,
  archiveDayBlocks,
  archiveTemplates,
  deleteDayBlocks,
  previewCatalogApproval,
} from "./index";
import { reviewImport } from "../import-review";

let pg: Awaited<ReturnType<typeof createDatabase>>;
const admin = "72000000-0000-0000-0000-000000000001";
const ops = "72000000-0000-0000-0000-000000000002";
const seller = "72000000-0000-0000-0000-000000000003";
let activeService: string;
const one = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) =>
  (await pg.query<T>(sql, args)).rows[0]!;
async function as(id: string) {
  await pg.exec("set role authenticated");
  await pg.query("select set_config('request.jwt.claim.sub',$1,true)", [id]);
}
async function legacyImportFingerprint() {
  return one<{ fingerprint: string }>(`select md5(jsonb_build_array(
    'import-approval-v3', false, (now() at time zone 'America/Santiago')::date, auth.uid(),
    (select jsonb_agg(s order by s.id) from public.services s),
    (select jsonb_agg(r order by r.id) from public.service_rates r),
    (select jsonb_agg(t order by t.id) from public.itinerary_templates t),
    (select jsonb_agg(t order by t.id) from public.template_day_items t),
    (select jsonb_agg(t order by t.id) from public.template_segment_items t),
    (select jsonb_agg(d order by d.id) from public.template_days d),
    (select jsonb_agg(b order by b.id) from public.day_blocks b),
    (select jsonb_agg(i order by i.id) from public.day_block_items i),
    (select jsonb_agg(m order by m.id) from public.day_block_modules m),
    (select jsonb_agg(m order by m.id) from public.activity_modules m),
    (select jsonb_agg(i order by i.id) from public.activity_module_items i)
  )::text) fingerprint`);
}
async function service(status: "activo" | "pendiente" | "inactivo" = "activo", rate = true) {
  const s = await one<{ id: string }>(
    "insert into services(sku,name,type,pricing_unit,currency,status) values($1,'Servicio','extra','per_unit','USD',$2) returning id",
    [crypto.randomUUID(), status],
  );
  if (rate) await pg.query("insert into service_rates(service_id,price_net) values($1,10)", [s.id]);
  return s.id;
}
async function block({
  serviceId = activeService,
  title = "Título ES",
  reviewed = true,
}: { serviceId?: string | null; title?: string | null; reviewed?: boolean } = {}) {
  const b = await one<{ id: string }>("insert into day_blocks(code) values($1) returning id", [
    crypto.randomUUID(),
  ]);
  if (serviceId)
    await pg.query("insert into day_block_items(block_id,service_id) values($1,$2)", [
      b.id,
      serviceId,
    ]);
  if (title !== null)
    await pg.query(
      "insert into day_block_translations(block_id,lang,title,description,reviewed) values($1,'es',$2,'Texto',$3)",
      [b.id, title, reviewed],
    );
  return b.id;
}
async function template(
  bids: string[],
  warnings: string[] = [],
  sku: string = crypto.randomUUID(),
) {
  const t = await one<{ id: string }>(
    "insert into itinerary_templates(sku,name,route_type,days,nights,category,import_warnings) values($1,'Plantilla','ROUNDTRIP',$2,$3,'BUDGET',$4) returning id",
    [sku, Math.max(bids.length, 1), Math.max(bids.length - 1, 0), JSON.stringify(warnings)],
  );
  for (const [i, bid] of bids.entries())
    await pg.query("insert into template_days(template_id,day_number,block_id) values($1,$2,$3)", [
      t.id,
      i + 1,
      bid,
    ]);
  return t.id;
}
beforeAll(async () => {
  pg = await createDatabase();
  for (const [id, role] of [
    [admin, "admin"],
    [ops, "operacion"],
    [seller, "vendedor"],
  ]) {
    await pg.query("insert into auth.users(id,email) values($1,$2)", [id, `${role}@approval.test`]);
    await pg.query("update profiles set role=$2 where id=$1", [id, role]);
  }
  await pg.exec("insert into currencies(code,name) values('USD','Dólar') on conflict do nothing");
  transport.client = pgliteSupabase(pg);
}, 30000);
beforeEach(async () => {
  await pg.exec("reset role; begin");
  await as(admin);
  activeService = await service();
});
afterEach(async () => {
  await pg.exec("rollback; reset role");
});
afterAll(async () => pg?.close());

it("bloque con 0 servicios queda pendiente; aceptar avisos lo activa sin inventar servicios", async () => {
  const id = await block({ serviceId: null });
  const initial = await approveDayBlocks([id]);
  expect(initial).toMatchObject({ approved: 0, pending: 1, accept_warnings: false });
  expect(initial.items[0]?.reasons).toEqual(["0 servicios vinculados al tarifario."]);
  expect(await one("select status from day_blocks where id=$1", [id])).toEqual({
    status: "pendiente",
  });
  expect(await approveDayBlocks([id], { acceptWarnings: true })).toMatchObject({
    approved: 1,
    pending: 0,
  });
  expect(await one("select status,approval_issues from day_blocks where id=$1", [id])).toEqual({
    status: "activo",
    approval_issues: ["0 servicios vinculados al tarifario."],
  });
  expect((await pg.query("select id from day_block_items where block_id=$1", [id])).rows).toEqual(
    [],
  );
});

it("distingue sin título ES, texto ES sin revisar y servicios pendientes", async () => {
  const pending = await service("pendiente");
  const blank = await block({ title: "  " });
  const unreviewed = await block({ reviewed: false });
  const dependency = await block({ serviceId: pending });
  const absent = await block({ title: null });
  const preview = await previewCatalogApproval("day_blocks", [
    blank,
    unreviewed,
    dependency,
    absent,
  ]);
  const reasons = (id: string) => preview.items.find((i) => i.id === id)!.reasons;
  expect(reasons(blank)).toEqual(["Sin título ES."]);
  expect(reasons(unreviewed)).toEqual(["Texto ES sin revisar."]);
  expect(reasons(absent)).toEqual(["Sin título ES.", "Texto ES sin revisar."]);
  expect(reasons(dependency)[0]).toMatch(/^Servicio pendiente:/);
});

it("los servicios de hotel y módulos cuentan; detecta pendientes también dentro del módulo", async () => {
  const hotel = await block({ serviceId: null });
  await pg.query("update day_blocks set hotel_service_id=$2 where id=$1", [hotel, activeService]);
  const nested = await block({ serviceId: null });
  const mod = await one<{ id: string }>(
    "insert into activity_modules(code,name,duration) values('MOD','Módulo','FD') returning id",
  );
  const pending = await service("pendiente");
  await pg.query("insert into activity_module_items(module_id,service_id) values($1,$2)", [
    mod.id,
    pending,
  ]);
  await pg.query("insert into day_block_modules(block_id,module_id) values($1,$2)", [
    nested,
    mod.id,
  ]);
  const result = await approveDayBlocks([hotel, nested]);
  expect(result).toMatchObject({ approved: 1, pending: 1 });
  expect(result.items.find((i) => i.id === nested)?.reasons).toEqual([
    expect.stringMatching(/^Servicio pendiente:/),
  ]);
  expect(result.items.find((i) => i.id === hotel)?.reasons).toEqual([]);
});

it("solo aprueba seleccionados sin avisos, deduplica IDs y no cambia el catálogo al previsualizar", async () => {
  const clean = await block(),
    bad = await block({ serviceId: null }),
    outside = await block();
  const before = (await pg.query("select * from day_blocks order by id")).rows;
  const preview = await previewCatalogApproval("day_blocks", [clean, bad, clean]);
  expect(preview).toMatchObject({ eligible: 1, with_warnings: 1 });
  expect(preview.items).toHaveLength(2);
  expect((await pg.query("select * from day_blocks order by id")).rows).toEqual(before);
  await as(ops);
  expect(await approveDayBlocks([clean, bad])).toMatchObject({ approved: 1, pending: 1 });
  expect(await one("select status from day_blocks where id=$1", [outside])).toEqual({
    status: "pendiente",
  });
});

it("revisa nuevamente los datos entre previsualización y aprobación", async () => {
  const id = await block();
  expect((await previewCatalogApproval("day_blocks", [id])).with_warnings).toBe(0);
  await pg.query("update day_block_translations set reviewed=false where block_id=$1", [id]);
  expect(await approveDayBlocks([id])).toMatchObject({ approved: 0, pending: 1 });
});

it("aceptar avisos no aprueba servicios ni marca revisados los textos", async () => {
  const pending = await service("pendiente");
  const id = await block({ serviceId: pending, reviewed: false });
  await approveDayBlocks([id], { acceptWarnings: true });
  expect(await one("select status from services where id=$1", [pending])).toEqual({
    status: "pendiente",
  });
  expect(await one("select reviewed from day_block_translations where block_id=$1", [id])).toEqual({
    reviewed: false,
  });
});

it("aprueba un servicio incompleto y conserva sus advertencias económicas y de importación", async () => {
  const id = await service("pendiente", false);
  await pg.query(
    "update services set pricing_unit=null,currency=null,import_issues='Revisar fuente' where id=$1",
    [id],
  );

  const result = await approveImportReviewItems("services", [id]);
  expect(result).toMatchObject({ approved: 1, pending: 0 });
  expect(
    await one("select status,pricing_unit,currency,approval_issues,import_issues from services where id=$1", [id]),
  ).toEqual({
    status: "activo",
    pricing_unit: null,
    currency: null,
    approval_issues: ["Sin unidad de cobro.", "Sin moneda.", "Sin tarifa habilitada."],
    import_issues: "Revisar fuente",
  });
});

it("informa como aprobadas solo las filas de servicios realmente actualizadas", async () => {
  const id = await service("pendiente", false);
  await pg.exec(`reset role;
    create function public.skip_service_approval_test() returns trigger language plpgsql as $$
    begin
      if new.id='${id}'::uuid then return null; end if;
      return new;
    end $$;
    create trigger skip_service_approval_test before update on services
    for each row execute function public.skip_service_approval_test()`);
  await as(admin);

  expect(await approveImportReviewItems("services", [id])).toMatchObject({
    approved: 0,
    pending: 1,
  });
  expect(await one("select status from services where id=$1", [id])).toEqual({
    status: "pendiente",
  });
});

it("aprueba en lote servicios sin moneda, unidad, tarifa, costo o tarifa habilitada sin completar datos", async () => {
  const missingCurrency = await service("pendiente");
  await pg.query("update services set currency=null where id=$1", [missingCurrency]);
  const missingUnit = await service("pendiente");
  await pg.query("update services set pricing_unit=null where id=$1", [missingUnit]);
  const noRate = await service("pendiente", false);
  const noCost = await service("pendiente", false);
  await pg.query("insert into service_rates(service_id,price_net,price_rack) values($1,null,null)", [noCost]);
  const disabledRate = await service("pendiente", false);
  await pg.query(
    "insert into service_rates(service_id,price_net,pricing_enabled) values($1,25,false)",
    [disabledRate],
  );
  const ids = [missingCurrency, missingUnit, noRate, noCost, disabledRate];

  expect(await approveImportReviewItems("services", ids)).toMatchObject({
    approved: ids.length,
    pending: 0,
  });
  const rows = (
    await pg.query<{ status: string; pricing_unit: string | null; currency: string | null }>(
      "select status,pricing_unit,currency from services where id=any($1) order by id",
      [ids],
    )
  ).rows;
  expect(rows).toHaveLength(ids.length);
  expect(rows.every((row) => row.status === "activo")).toBe(true);
  expect(rows.some((row) => row.currency === null)).toBe(true);
  expect(rows.some((row) => row.pricing_unit === null)).toBe(true);
  expect(
    await one("select count(*)::int n from service_rates where service_id=any($1) and price_net=0", [ids]),
  ).toEqual({ n: 0 });
});

it("mantiene reglas de módulos y permite aprobar servicios incompletos solo a Admin u Operación", async () => {
  const emptyModule = await one<{ id: string }>(
    "insert into activity_modules(code,name,duration) values($1,'Vacío','FD') returning id",
    [crypto.randomUUID()],
  );
  expect(await approveImportReviewItems("activity_modules", [emptyModule.id])).toMatchObject({
    approved: 0,
    pending: 1,
  });
  expect(await one("select status from activity_modules where id=$1", [emptyModule.id])).toEqual({
    status: "pendiente",
  });

  const byOps = await service("pendiente", false);
  await pg.query("update services set pricing_unit=null,currency=null where id=$1", [byOps]);
  await as(ops);
  expect(await approveImportReviewItems("services", [byOps])).toMatchObject({
    approved: 1,
    pending: 0,
  });

  await as(admin);
  const denied = await service("pendiente", false);
  await as(seller);
  await pg.exec("savepoint denied_service_approval");
  await expect(approveImportReviewItems("services", [denied])).rejects.toThrow(
    /Solo Admin y Operación/,
  );
  await pg.exec("rollback to savepoint denied_service_approval");
  await as(admin);
  expect(await one("select status from services where id=$1", [denied])).toEqual({
    status: "pendiente",
  });
});

it("aprobar plantillas permite aceptar avisos estructurales y de importación sin alterar los servicios", async () => {
  const pending = await service("pendiente");
  const bad = await template([await block({ serviceId: pending })], ["Revisar variante"]);
  const good = await template([await block()]);
  const outside = await template([await block()]);
  await as(ops);
  expect(await approveTemplates([good, bad])).toMatchObject({ approved: 1, pending: 1 });
  const accepted = await approveTemplates([bad], { acceptWarnings: true });
  expect(accepted).toMatchObject({ approved: 1, pending: 0 });
  expect(accepted.items[0]?.reasons).toContain("Importación: Revisar variante");
  expect(await one("select status from services where id=$1", [pending])).toEqual({
    status: "pendiente",
  });
  expect(await one("select status from itinerary_templates where id=$1", [outside])).toEqual({
    status: "pendiente",
  });
});

it("una plantilla vacía puede aprobarse solo al aceptar sus avisos explícitamente", async () => {
  const id = await template([]);
  expect(await approveTemplates([id])).toMatchObject({ approved: 0, pending: 1 });
  expect(await approveTemplates([id], { acceptWarnings: true })).toMatchObject({
    approved: 1,
    pending: 0,
  });
});

it("borrar un día de SPASPA-4D3N-FJJ renumera y actualiza la duración a 3/3", async () => {
  const bids = await Promise.all([block(), block(), block(), block()]);
  const id = await template(bids, [], "SPASPA-4D3N-FJJ");
  expect(await deleteDayBlocks([bids[1]!])).toEqual([
    { block_id: bids[1], templates: [{ id, sku: "SPASPA-4D3N-FJJ" }] },
  ]);
  await deleteDayBlocks([bids[1]!], { force: true });
  expect(
    await one("select days,nights,status,sku from itinerary_templates where id=$1", [id]),
  ).toEqual({ days: 3, nights: 2, status: "pendiente", sku: "SPASPA-4D3N-FJJ" });
  expect(
    (
      await pg.query(
        "select day_number from template_days where template_id=$1 order by day_number",
        [id],
      )
    ).rows,
  ).toEqual([{ day_number: 1 }, { day_number: 2 }, { day_number: 3 }]);
});

it("archivar usa inactivo y conserva días, bloques e ítems", async () => {
  const bid = await block(),
    tid = await template([bid]);
  const before = (await pg.query("select * from template_days where template_id=$1", [tid])).rows;
  await as(ops);
  expect(await archiveTemplates([tid, tid])).toEqual({ archived: 1 });
  expect(await archiveDayBlocks([bid])).toEqual({ archived: 1 });
  expect(await archiveTemplates([tid])).toEqual({ archived: 0 });
  expect((await pg.query("select * from template_days where template_id=$1", [tid])).rows).toEqual(
    before,
  );
  expect(await one("select status from day_blocks where id=$1", [bid])).toEqual({
    status: "inactivo",
  });
  expect(await one("select count(*)::int n from day_block_items where block_id=$1", [bid])).toEqual(
    { n: 1 },
  );
});

for (const caller of [seller, ""])
  it(`rechaza aprobación/borrado/archivo/previsualización de ${caller ? "vendedor" : "sesión sin usuario"}`, async () => {
    await as(caller);
    for (const sql of [
      "approve_day_blocks('{}',true)",
      "approve_templates('{}',true)",
      "delete_day_blocks('{}',true)",
      "delete_templates('{}')",
      "archive_catalog('templates','{}')",
      "review_catalog_approval('templates','{}')",
      "preview_template_deletion('{}')",
    ]) {
      await pg.exec("savepoint denied");
      await expect(pg.query(`select public.${sql}`)).rejects.toMatchObject({
        code: "42501",
        message: expect.stringMatching(/Solo Admin y Operación/),
      });
      await pg.exec("rollback to savepoint denied");
    }
  });

it("RLS impide al vendedor activar o borrar su propio bloque/plantilla pendiente", async () => {
  await as(seller);
  const bid = await block({ serviceId: null, title: null }),
    tid = await template([bid]);
  for (const [table, id] of [
    ["day_blocks", bid],
    ["itinerary_templates", tid],
  ]) {
    await pg.exec("savepoint denied");
    await expect(
      pg.query(`update ${table} set status='activo' where id=$1`, [id]),
    ).rejects.toMatchObject({ code: "42501" });
    await pg.exec("rollback to savepoint denied");
    expect((await pg.query(`delete from ${table} where id=$1 returning id`, [id])).rows).toEqual(
      [],
    );
  }
});

it("rechaza NULL y tipos de catálogo inválidos; listas vacías no seleccionan todo", async () => {
  expect(await approveDayBlocks([])).toMatchObject({ approved: 0, pending: 0, items: [] });
  expect(await approveTemplates([crypto.randomUUID()])).toMatchObject({
    approved: 0,
    pending: 0,
    items: [],
  });
  for (const sql of [
    "approve_day_blocks(null,true)",
    "approve_templates(array[null]::uuid[],false)",
    "approve_day_blocks('{}',null)",
    "approve_templates('{}',null)",
    "archive_catalog('quotes','{}')",
    "review_catalog_approval(null,'{}')",
  ]) {
    await pg.exec("savepoint invalid");
    await expect(pg.query(`select public.${sql}`)).rejects.toMatchObject({ code: "22023" });
    await pg.exec("rollback to savepoint invalid");
  }
});

it("un fallo de aprobación revierte todo el lote", async () => {
  const ids = [await block(), await block()];
  await pg.exec(`reset role; create function public.reject_catalog_test() returns trigger language plpgsql as $$ begin
    if new.id='${ids[1]}'::uuid then raise exception 'Fallo sintético'; end if; return new; end $$;
    create trigger reject_catalog_test before update on day_blocks for each row execute function public.reject_catalog_test()`);
  await as(admin);
  await pg.exec("savepoint atomic");
  await expect(approveDayBlocks(ids)).rejects.toThrow("Fallo sintético");
  await pg.exec("rollback to savepoint atomic");
  expect((await pg.query("select status from day_blocks where id=any($1)", [ids])).rows).toEqual([
    { status: "pendiente" },
    { status: "pendiente" },
  ]);
});

it("aprobación masiva conserva simulación/huella, aprueba servicios incompletos y mantiene reglas de plantillas", async () => {
  const missingRate = await service("pendiente", false);
  const tid = await template([await block({ serviceId: missingRate })]);
  const before = (await pg.query("select * from itinerary_templates order by id")).rows;
  const normal = await reviewImport();
  expect(normal.services).toMatchObject({ eligible: expect.any(Number), remaining: 0 });
  expect(normal.services.items.find((i) => i.id === missingRate)?.reasons).toContain(
    "Sin tarifa vigente con costo neto o rack.",
  );
  expect(normal.templates.items.find((i) => i.id === tid)?.reasons).toHaveLength(1);
  expect((await pg.query("select * from itinerary_templates order by id")).rows).toEqual(before);
  await pg.exec("savepoint legacy_fingerprint");
  await expect(reviewImport((await legacyImportFingerprint()).fingerprint)).rejects.toThrow(
    /Vuelve a simular/,
  );
  await pg.exec("rollback to savepoint legacy_fingerprint");
  await pg.exec("savepoint stale");
  await expect(reviewImport(normal.fingerprint, { acceptWarnings: true })).rejects.toThrow(
    /Vuelve a simular/,
  );
  await pg.exec("rollback to savepoint stale");
  const accepted = await reviewImport(undefined, { acceptWarnings: true });
  expect(accepted.templates.remaining).toBe(0);
  const applied = await reviewImport(accepted.fingerprint, { acceptWarnings: true });
  expect(applied).toMatchObject({ dry_run: false, accept_warnings: true });
  expect(await one("select status from itinerary_templates where id=$1", [tid])).toEqual({
    status: "activo",
  });
  expect(await one("select status from services where id=$1", [missingRate])).toEqual({
    status: "activo",
  });
});

it("Operación aprueba plantillas seleccionadas pero no el lote global que también cambia tarifas/servicios", async () => {
  await as(ops);
  await expect(reviewImport(undefined, { acceptWarnings: true })).rejects.toThrow("Solo Admin");
});

it("la migración tiene espejo idéntico y solo expone RPC públicas a authenticated", async () => {
  expect(
    await readFile(
      new URL("supabase/migrations/20261017000200_catalog_approval_actions.sql", root),
      "utf8",
    ),
  ).toBe(
    await readFile(new URL("drizzle/migrations/0023_catalog_approval_actions.sql", root), "utf8"),
  );
  for (const fn of [
    "approve_day_blocks(uuid[],boolean)",
    "approve_templates(uuid[],boolean)",
    "approve_import_items(text,uuid[])",
    "archive_catalog(text,uuid[])",
    "review_catalog_approval(text,uuid[])",
    "preview_template_deletion(uuid[])",
  ]) {
    expect(
      await one(
        "select has_function_privilege('anon',$1,'execute') a,has_function_privilege('authenticated',$1,'execute') b",
        [`public.${fn}`],
      ),
    ).toEqual({ a: false, b: true });
  }
  expect(
    await one(
      "select has_function_privilege('authenticated','public._template_approval_rows(uuid[],uuid[])','execute') a",
    ),
  ).toEqual({ a: false });
  expect(
    await one(
      "select count(*)::int n from pg_constraint where conrelid='public.services'::regclass and conname='services_check'",
    ),
  ).toEqual({ n: 0 });
  const flexibleApproval = await readFile(
    new URL("supabase/migrations/20261026000100_flexible_service_approval.sql", root),
    "utf8",
  );
  expect(flexibleApproval).toContain("'import-approval-v4'");
  expect(flexibleApproval).not.toContain("'import-approval-v3'");
  expect(
    await one(
      `select
        pg_get_functiondef('public.approve_valid_imports(boolean,text,boolean)'::regprocedure) like '%import-approval-v4%' v4,
        pg_get_functiondef('public.approve_valid_imports(boolean,text,boolean)'::regprocedure) like '%import-approval-v3%' v3`,
    ),
  ).toEqual({ v4: true, v3: false });
});
