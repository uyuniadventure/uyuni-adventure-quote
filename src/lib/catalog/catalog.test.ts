// @vitest-environment node
import { readFile } from "node:fs/promises";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createDatabase } from "../../../scripts/db/local-db.mjs";
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
  deleteDayBlocks,
  deleteTemplates,
  purgeImportedCatalog,
  previewTemplateDeletion,
} from "./index";

let pg: Awaited<ReturnType<typeof createDatabase>>;
const admin = "71000000-0000-0000-0000-000000000001";
const ops = "71000000-0000-0000-0000-000000000002";
const seller = "71000000-0000-0000-0000-000000000003";
let client: string, service: string, moduleId: string;
let blocks: string[], template: string;
const rows = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) =>
  (await pg.query<T>(sql, args)).rows;
const one = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) =>
  (await rows<T>(sql, args))[0]!;
const as = async (id: string) => {
  await pg.exec("set role authenticated");
  await pg.query("select set_config('request.jwt.claim.sub',$1,true)", [id]);
};
const makeBlock = async (origin = "manual", code: string = crypto.randomUUID()) =>
  (
    await one<{ id: string }>(
      "insert into day_blocks(code,catalog_origin) values($1,$2) returning id",
      [code, origin],
    )
  ).id;
const makeTemplate = async (bids: string[], origin = "manual") => {
  const id = (
    await one<{ id: string }>(
      `insert into itinerary_templates(sku,name,route_type,days,nights,category,status,catalog_origin)
     values($1,'Prueba','ONEWAY',$2,$3,'BUDGET','activo',$4) returning id`,
      [crypto.randomUUID(), Math.max(bids.length, 1), Math.max(bids.length - 1, 0), origin],
    )
  ).id;
  for (const [index, bid] of bids.entries())
    await pg.query("insert into template_days(template_id,day_number,block_id) values($1,$2,$3)", [
      id,
      index + 1,
      bid,
    ]);
  return id;
};

async function quote(status = "borrador", archived = false) {
  await pg.exec("reset role");
  const id = (
    await one<{ id: string }>(
      `insert into quotes(code,template_id,client_id,client_type,start_date,pax_paying,category,seller_id)
     values($1,$2,$3,'B2C','2027-01-01',2,'BUDGET',$4) returning id`,
      [crypto.randomUUID(), template, client, seller],
    )
  ).id;
  const day = (
    await one<{ id: string }>(
      `insert into quote_days(quote_id,day_number,title,source_block_id,snapshot)
     values($1,1,'Título conservado',$2,'{"reviewed":true}') returning id`,
      [id, blocks[0]!],
    )
  ).id;
  await pg.query(
    `insert into quote_items(quote_day_id,service_id,sku,description,type,pricing_unit,qty,unit_cost_original,unit_cost_usd,currency)
     values($1,$2,'ITEM','Servicio copiado','extra','per_unit',1,100,100,'USD')`,
    [day, service],
  );
  // Fixture-only state setup. Every deletion below runs with ALL real guards on.
  await pg.exec("alter table quotes disable trigger user");
  await pg.query(
    `update quotes set calculation='{"total_price_usd":125}',total_cost_usd=100,total_price_usd=125,
     total_margin_usd=25,price_per_pax_usd=62.5,pdf_path='frozen.pdf',pdf_url='frozen',
     status=$2::public.quote_status,lost_reason=case when $2::public.quote_status='perdida' then 'Prueba' else null end,archived_at=case when $3 then now() else null end where id=$1`,
    [id, status, archived],
  );
  await pg.exec("alter table quotes enable trigger user");
  await as(ops);
  return id;
}

async function snapshot(id: string) {
  // Operation has no SELECT access to the seller's quote. Read as owner of test DB.
  await pg.exec("reset role");
  const data = await one(
    `select to_jsonb(q) as quote,
    (select jsonb_agg(to_jsonb(d) order by d.id) from quote_days d where d.quote_id=q.id) days,
    (select jsonb_agg(to_jsonb(i) order by i.id) from quote_items i join quote_days d on d.id=i.quote_day_id where d.quote_id=q.id) items
    from quotes q where q.id=$1`,
    [id],
  );
  await as(ops);
  return data as {
    quote: Record<string, unknown>;
    days: Record<string, unknown>[];
    items: unknown;
  };
}

beforeAll(async () => {
  pg = await createDatabase();
  for (const [id, role] of [
    [admin, "admin"],
    [ops, "operacion"],
    [seller, "vendedor"],
  ]) {
    await pg.query("insert into auth.users(id,email) values($1,$2)", [id, `${role}@catalog.test`]);
    await pg.query("update profiles set role=$2 where id=$1", [id, role]);
  }
  await pg.exec("insert into currencies(code,name) values('USD','Dólar') on conflict do nothing");
  client = (
    await one<{ id: string }>(
      "insert into clients(name,type) values('Cliente sintético','B2C') returning id",
    )
  ).id;
  service = (
    await one<{ id: string }>(
      "insert into services(sku,name,type,pricing_unit) values('TEST','Test','extra','per_unit') returning id",
    )
  ).id;
  moduleId = (
    await one<{ id: string }>(
      "insert into activity_modules(code,name,duration) values('TEST','Test','FD') returning id",
    )
  ).id;
  transport.client = pgliteSupabase(pg);
}, 120000);
beforeEach(async () => {
  await pg.exec("reset role; begin");
  await as(admin);
  blocks = [];
  for (let n = 0; n < 4; n++) blocks.push(await makeBlock());
  template = await makeTemplate(blocks);
});
afterEach(async () => {
  await pg.exec("rollback; reset role");
});
afterAll(async () => pg?.close());

describe("T01u: RPC y API de borrado con migraciones y RLS reales", () => {
  it("sin force devuelve plantillas únicas por bloque y no elimina ninguna fila del lote", async () => {
    const free = await makeBlock();
    const other = await makeTemplate([blocks[1]!, blocks[1]!]);
    const before = await rows("select * from template_days order by id");
    const conflicts = await deleteDayBlocks([free, blocks[1]!, blocks[1]!]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]!.block_id).toBe(blocks[1]!);
    expect(conflicts[0]!.templates.map((t) => t.id).sort()).toEqual([template, other].sort());
    expect(conflicts[0]!.templates.every((t) => !!t.sku)).toBe(true);
    expect(await rows("select * from template_days order by id")).toEqual(before);
    expect(await one("select id from day_blocks where id=$1", [free])).toEqual({ id: free });
  });
  it("force renumera días consecutivos en todas las plantillas, conservando los IDs", async () => {
    const other = await makeTemplate([blocks[0]!, blocks[1]!, blocks[2]!, blocks[3]!]);
    const keep = await rows(
      "select id,block_id from template_days where block_id=any($1) order by id",
      [[blocks[1]!, blocks[3]!]],
    );
    expect(await deleteDayBlocks([blocks[0]!, blocks[2]!], { force: true })).toEqual([]);
    expect(
      await rows("select id,block_id from template_days where template_id=any($1) order by id", [
        [template, other],
      ]),
    ).toEqual(keep);
    for (const id of [template, other]) {
      expect(
        await rows(
          "select day_number from template_days where template_id=$1 order by day_number",
          [id],
        ),
      ).toEqual([{ day_number: 1 }, { day_number: 2 }]);
      expect(
        await one("select status,days,nights from itinerary_templates where id=$1", [id]),
      ).toEqual({ status: "pendiente", days: 2, nights: 1 });
    }
  });
  it("permite quitar todos los días y conserva la plantilla vacía pendiente de revisión", async () => {
    await deleteDayBlocks(blocks, { force: true });
    expect(await rows("select id from template_days where template_id=$1", [template])).toEqual([]);
    expect(await one("select status from itinerary_templates where id=$1", [template])).toEqual({
      status: "pendiente",
    });
  });
  it("sin referencias elimina un bloque y sus traducciones, ítems y enlaces; conserva módulos y tarifas", async () => {
    const id = await makeBlock();
    await pg.query(
      "insert into day_block_translations(block_id,lang,title,description) values($1,'es','Día','Texto')",
      [id],
    );
    await pg.query("insert into day_block_items(block_id,service_id) values($1,$2)", [id, service]);
    await pg.query("insert into day_block_modules(block_id,module_id) values($1,$2)", [
      id,
      moduleId,
    ]);
    expect(await deleteDayBlocks([id])).toEqual([]);
    for (const table of ["day_block_translations", "day_block_items", "day_block_modules"])
      expect(await rows(`select id from ${table} where block_id=$1`, [id])).toEqual([]);
    expect(await one("select id from services where id=$1", [service])).toEqual({ id: service });
    expect(await one("select id from activity_modules where id=$1", [moduleId])).toEqual({
      id: moduleId,
    });
  });
  for (const status of [
    "borrador",
    "revisada",
    "enviada",
    "vendida",
    "perdida",
    "cancelada",
    "archivada",
  ]) {
    it(`elimina plantilla usada en cotización ${status}: solo template_id cambia`, async () => {
      const id = await quote(status === "archivada" ? "enviada" : status, status === "archivada");
      const before = await snapshot(id);
      expect(await rows("select id from quotes where id=$1", [id])).toEqual([]);
      expect(await previewTemplateDeletion([template, template])).toEqual({
        templates: 1,
        template_days: 4,
        quotes_detached: 1,
      });
      expect(await deleteTemplates([template, template])).toEqual({
        templates: 1,
        template_days: 4,
        quotes_detached: 1,
      });
      before.quote["template_id"] = null;
      expect(await snapshot(id)).toEqual(before);
      expect(await rows("select id from template_days where template_id=$1", [template])).toEqual(
        [],
      );
      expect((await rows("select id from day_blocks where id=any($1)", [blocks])).length).toBe(4);
    });
  }
  it("eliminar bloques conserva snapshots y totales de cotización enviada/archivada", async () => {
    const id = await quote("enviada", true);
    const before = await snapshot(id);
    await deleteDayBlocks([blocks[0]!], { force: true });
    before.days[0]!["source_block_id"] = null;
    expect(await snapshot(id)).toEqual(before);
  });
  it("los controles siguen rechazando una edición directa de una cotización archivada", async () => {
    const id = await quote("enviada", true);
    await as(admin);
    await expect(
      pg.query("update quotes set template_id=null,total_price_usd=1 where id=$1", [id]),
    ).rejects.toThrow(/immutable/);
  });
  for (const caller of [seller, ""])
    it(`rechaza todas las RPC para ${caller ? "vendedor" : "sesión sin usuario"}`, async () => {
      await as(caller);
      // Savepoints allow checking all permission errors without aborting this fixture.
      for (const sql of [
        "delete_day_blocks('{}'::uuid[],true)",
        "delete_templates('{}'::uuid[])",
        "purge_imported_catalog('BORRAR')",
      ]) {
        await pg.exec("savepoint denied");
        await expect(pg.query(`select public.${sql}`)).rejects.toMatchObject({ code: "42501" });
        await pg.exec("rollback to savepoint denied");
      }
    });
  it("anon no tiene EXECUTE y authenticated no puede invocar el helper privado", async () => {
    expect(
      await one(`select has_function_privilege('anon','public.delete_day_blocks(uuid[],boolean)','execute') a,
      has_function_privilege('anon','public.delete_templates(uuid[])','execute') b,
      has_function_privilege('anon','public.purge_imported_catalog(text)','execute') c,
      has_function_privilege('authenticated','public._lock_catalog_deletion()','execute') helper`),
    ).toEqual({ a: false, b: false, c: false, helper: false });
  });
  it("purge exige BORRAR exacto, también en servidor", async () => {
    for (const value of [null, "", "borrar", "BORRAR "]) {
      await pg.exec("savepoint invalid");
      await expect(pg.query("select purge_imported_catalog($1)", [value])).rejects.toMatchObject({
        code: "22023",
      });
      await pg.exec("rollback to savepoint invalid");
    }
    expect(await one("select id from itinerary_templates where id=$1", [template])).toEqual({
      id: template,
    });
  });
  it("listas vacías/no existentes son seguras y NULL no significa borrar todo", async () => {
    expect(await deleteDayBlocks([])).toEqual([]);
    expect(await deleteTemplates([crypto.randomUUID()])).toEqual({
      templates: 0,
      template_days: 0,
      quotes_detached: 0,
    });
    for (const sql of [
      "delete_templates(null)",
      "delete_day_blocks(array[null]::uuid[])",
      "delete_day_blocks('{}',null)",
    ]) {
      await pg.exec("savepoint invalid");
      await expect(pg.query(`select ${sql}`)).rejects.toMatchObject({ code: "22023" });
      await pg.exec("rollback to savepoint invalid");
    }
  });
  it("purga solo importados, cuenta todas las filas y conserva manuales, tarifario, clientes y cotizaciones", async () => {
    // Remove the six historical recovery blocks/templates to isolate exact counts.
    await purgeImportedCatalog("BORRAR");
    const imported = await makeBlock("importacion");
    const orphan = await makeBlock("importacion");
    const importedTemplate = await makeTemplate([imported, blocks[0]!], "importacion");
    const manual = await makeTemplate([blocks[1]!, imported, blocks[2]!]);
    const derived = await makeBlock();
    await pg.query("update day_blocks set parent_block_id=$2 where id=$1", [derived, imported]);
    await pg.query(
      "insert into day_block_translations(block_id,lang,title,description) values($1,'es','Título','Texto')",
      [orphan],
    );
    await pg.query("insert into day_block_items(block_id,service_id) values($1,$2)", [
      imported,
      service,
    ]);
    await pg.query("insert into day_block_modules(block_id,module_id) values($1,$2)", [
      imported,
      moduleId,
    ]);
    template = importedTemplate;
    blocks[0] = imported;
    const qid = await quote("enviada", true);
    const before = await snapshot(qid);
    const result = await purgeImportedCatalog("BORRAR");
    expect(result).toEqual({
      templates: 1,
      day_blocks: 2,
      template_days: 3,
      day_block_translations: 1,
      day_block_items: 1,
      day_block_modules: 1,
      templates_updated: 1,
    });
    before.quote["template_id"] = null;
    before.days[0]!["source_block_id"] = null;
    expect(await snapshot(qid)).toEqual(before);
    expect(
      await rows("select day_number from template_days where template_id=$1 order by day_number", [
        manual,
      ]),
    ).toEqual([{ day_number: 1 }, { day_number: 2 }]);
    expect(await one("select status from itinerary_templates where id=$1", [manual])).toEqual({
      status: "pendiente",
    });
    expect(await one("select parent_block_id from day_blocks where id=$1", [derived])).toEqual({
      parent_block_id: null,
    });
    expect(await one("select id from services where id=$1", [service])).toEqual({ id: service });
    expect(await one("select id from clients where id=$1", [client])).toEqual({ id: client });
    expect(Object.values(await purgeImportedCatalog("BORRAR")).every((n) => n === 0)).toBe(true);
  });
  it("no confunde manuales sin creador/prefijo importado ni plantillas reemplazadas desde cotización", async () => {
    const id = await quote();
    await as(admin);
    await pg.query(
      "update itinerary_templates set catalog_origin='importacion',source_quote_id=$2 where id=$1",
      [template, id],
    );
    const manual = await makeBlock("manual", "DAY_MANUAL");
    await pg.query("update day_blocks set created_by=null where id=$1", [manual]);
    await purgeImportedCatalog("BORRAR");
    expect(await one("select id from itinerary_templates where id=$1", [template])).toEqual({
      id: template,
    });
    expect(await one("select catalog_origin from day_blocks where id=$1", [manual])).toEqual({
      catalog_origin: "manual",
    });
  });
  it("un fallo al borrar bloques revierte también el borrado de plantillas del purge", async () => {
    await pg.query("update day_blocks set catalog_origin='importacion' where id=any($1)", [blocks]);
    await pg.query("update itinerary_templates set catalog_origin='importacion' where id=$1", [
      template,
    ]);
    await pg.exec(`reset role; create function public.test_reject_delete() returns trigger language plpgsql as $$ begin raise exception 'Fallo de prueba'; end $$;
      create trigger test_reject_delete before delete on day_blocks for each row execute function public.test_reject_delete()`);
    await as(admin);
    await pg.exec("savepoint failed_purge");
    await expect(purgeImportedCatalog("BORRAR")).rejects.toThrow("Fallo de prueba");
    await pg.exec("rollback to savepoint failed_purge");
    expect(await one("select id from itinerary_templates where id=$1", [template])).toEqual({
      id: template,
    });
    expect(
      (await rows("select id from template_days where template_id=$1", [template])).length,
    ).toBe(4);
  });
  it("declara RESTRICT de block_id y SET NULL de template_id", async () => {
    expect(
      await rows(
        "select conname,confdeltype from pg_constraint where conname in ('quotes_template_id_fkey','template_days_block_id_fkey') order by conname",
      ),
    ).toEqual([
      { conname: "quotes_template_id_fkey", confdeltype: "n" },
      { conname: "template_days_block_id_fkey", confdeltype: "r" },
    ]);
  });
  it("el respaldo se ejecuta en READ ONLY sin mutaciones y cubre el mismo origen que purge", async () => {
    await pg.exec("rollback; reset role");
    const sql = await readFile(
      new URL("../../../docs/consultas/respaldo_catalogo.sql", import.meta.url),
      "utf8",
    );
    const result = await pg.exec(sql);
    expect(result.filter((r) => r.fields.length > 0)).toHaveLength(11);
    expect(
      (await rows("select id from itinerary_templates where catalog_origin='importacion'")).length,
    ).toBe(2);
  });
});
