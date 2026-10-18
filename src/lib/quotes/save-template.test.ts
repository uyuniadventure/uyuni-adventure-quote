// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createDatabase } from "../../../scripts/db/local-db.mjs";
import { pgliteSupabase } from "@/test/pglite-supabase";

const transport = vi.hoisted(() => ({ client: null as ReturnType<typeof pgliteSupabase> | null }));
vi.mock("../db", () => ({
  db: {
    rpc: (...args: Parameters<ReturnType<typeof pgliteSupabase>["rpc"]>) =>
      transport.client!.rpc(...args),
    from: (...args: Parameters<ReturnType<typeof pgliteSupabase>["from"]>) =>
      transport.client!.from(...args),
  },
  unwrap: ({ data, error }: { data: unknown; error: { message: string } | null }) => {
    if (error) throw new Error(error.message);
    return data;
  },
}));
import { prepareQuoteTemplate, saveQuoteAsTemplate, TemplateSkuConflict } from "./save-template";

let pg: Awaited<ReturnType<typeof createDatabase>>;
let clientId: string;
let sequence = 0;
const admin = "70000000-0000-0000-0000-000000000001";
const ops = "70000000-0000-0000-0000-000000000002";
const seller = "70000000-0000-0000-0000-000000000003";
const other = "70000000-0000-0000-0000-000000000004";
const one = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) =>
  (await pg.query<T>(sql, args)).rows[0]!;
const actAs = (id: string) => pg.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
beforeAll(async () => {
  pg = await createDatabase();
  await pg.query(
    "insert into auth.users(id,email) values($1,'admin@template.test'),($2,'ops@template.test'),($3,'seller@template.test'),($4,'other@template.test')",
    [admin, ops, seller, other],
  );
  await pg.query("update profiles set role='admin' where id=$1", [admin]);
  await pg.query("update profiles set role='operacion' where id=$1", [ops]);
  clientId = (
    await one<{ id: string }>(
      "insert into clients(type,name) values('B2C','Prueba de plantillas') returning id",
    )
  ).id;
  await pg.exec("set role authenticated");
  transport.client = pgliteSupabase(pg);
}, 120000);
beforeEach(async () => {
  await pg.exec("set role authenticated");
  await actAs(admin);
});
afterAll(async () => pg?.close());

async function quote(owner = admin, suffix = `TEST${++sequence}`) {
  const q = await one<{ id: string }>(
    `insert into quotes(code,tour_sku,client_id,client_type,start_date,pax_paying,category,seller_id)
    values($1,$2,$3,'B2C','2027-01-01',2,'BUDGET',$4) returning id`,
    [`TEST-${crypto.randomUUID()}`, `XXXXXX-2D1N-${suffix}`, clientId, owner],
  );
  // Insert in reverse order to catch accidental dependence on insertion order.
  await pg.query(
    `insert into quote_days(quote_id,day_number,title,route_from,route_to,block_snapshot,overrides)
    values($1,2,'Día 2','LPB','UYU','{}','{}'),
    ($1,1,'Día 1','SPA','LPB','{"content":{"title":{"es":"Original"},"description":{"es":"Viaje"}}}',
    '{"title":{"es":"Título editado"},"includes":{"es":"Almuerzo"}}')`,
    [q.id],
  );
  return q.id;
}
async function counts() {
  return one(
    "select (select count(*) from itinerary_templates) templates,(select count(*) from template_days) days,(select count(*) from day_blocks) blocks,(select count(*) from day_block_items) items",
  );
}

describe("guardar cotización como plantilla", () => {
  it("deriva el SKU de los extremos y conserva el texto resuelto, sin usar XXX", async () => {
    const id = await quote();
    const preview = await prepareQuoteTemplate(id, { route_from: "LPB", route_to: "SPA" });
    expect(preview).toMatchObject({
      route_from: "SPA",
      route_to: "UYU",
      needs_from: false,
      needs_to: false,
    });
    expect(preview.sku).toMatch(/^SPAUYU-2D1N-TEST/);
    const saved = await saveQuoteAsTemplate(id, preview, "create");
    expect(saved.sku).not.toContain("XXX");
    expect(
      await one("select route_from,route_to,status from itinerary_templates where id=$1", [
        saved.id,
      ]),
    ).toEqual({ route_from: "SPA", route_to: "UYU", status: "pendiente" });
    expect(
      await one(
        "select t.title,t.includes from template_days d join day_block_translations t on t.block_id=d.block_id where d.template_id=$1 and d.day_number=1 and t.lang='es'",
        [saved.id],
      ),
    ).toEqual({ title: "Título editado", includes: "Almuerzo" });
  });
  it("el duplicado ofrece una elección en español y crea -V2 y -V3 sin escrituras parciales", async () => {
    const id = await quote();
    const preview = await prepareQuoteTemplate(id);
    const first = await saveQuoteAsTemplate(id, preview, "create");
    const before = await counts();
    await expect(saveQuoteAsTemplate(id, preview, "create")).rejects.toBeInstanceOf(
      TemplateSkuConflict,
    );
    expect(await counts()).toEqual(before);
    const duplicate = await prepareQuoteTemplate(id);
    expect(duplicate.existing?.id).toBe(first.id);
    expect((await saveQuoteAsTemplate(id, duplicate, "new")).sku).toBe(`${first.sku}-V2`);
    expect((await saveQuoteAsTemplate(id, duplicate, "new")).sku).toBe(`${first.sku}-V3`);
  });
  it("pide los extremos ausentes y rechaza XXX incluso al invocar directamente la RPC", async () => {
    const id = await quote();
    await pg.query("update quote_days set route_from=null where quote_id=$1 and day_number=1", [
      id,
    ]);
    await pg.query("update quote_days set route_to=null where quote_id=$1 and day_number=2", [id]);
    expect(await prepareQuoteTemplate(id)).toMatchObject({
      sku: null,
      needs_from: true,
      needs_to: true,
    });
    await expect(
      pg.query("select save_quote_as_template($1,'new','XXX','XXX')", [id]),
    ).rejects.toThrow("Selecciona el origen");
    const preview = await prepareQuoteTemplate(id, { route_from: "uyu", route_to: "spa" });
    expect((await saveQuoteAsTemplate(id, preview, "create")).sku).toMatch(/^UYUSPA-/);
  });
  it("el vendedor crea versiones aunque el SKU ocupado no sea visible, pero no reemplaza", async () => {
    const suffix = `PRIVATE${++sequence}`;
    const owned = await quote(seller, suffix);
    const hidden = await quote(other, suffix);
    const first = await saveQuoteAsTemplate(hidden, await prepareQuoteTemplate(hidden), "create");
    await actAs(seller);
    const preview = await prepareQuoteTemplate(owned);
    expect(preview.existing).toBeNull();
    await expect(saveQuoteAsTemplate(owned, preview, "create")).rejects.toBeInstanceOf(
      TemplateSkuConflict,
    );
    expect((await saveQuoteAsTemplate(owned, preview, "new")).sku).toBe(`${first.sku}-V2`);
    await expect(saveQuoteAsTemplate(owned, preview, "replace")).rejects.toThrow(
      "No tienes permiso",
    );
    await expect(prepareQuoteTemplate(hidden)).rejects.toThrow("No tienes acceso");
  });
  it.each([admin, ops])(
    "Admin/Operación reemplaza sin borrar bloques compartidos ni cambiar cotizaciones (%s)",
    async (owner) => {
      const id = await quote(owner);
      await actAs(owner);
      const first = await saveQuoteAsTemplate(id, await prepareQuoteTemplate(id), "create");
      const oldDay = await one<{ block_id: string }>(
        "select block_id from template_days where template_id=$1 and day_number=1",
        [first.id],
      );
      const frozen = await one(
        "select to_jsonb(d) data from quote_days d where quote_id=$1 and day_number=1",
        [id],
      );
      await pg.query(
        'update quote_days set overrides=overrides||\'{"title":{"es":"Nueva edición"}}\' where quote_id=$1 and day_number=1',
        [id],
      );
      const before = await one(
        "select to_jsonb(d) data from quote_days d where quote_id=$1 and day_number=1",
        [id],
      );
      expect(before).not.toEqual(frozen);
      const result = await saveQuoteAsTemplate(id, await prepareQuoteTemplate(id), "replace");
      expect(result).toEqual({ ...first, replaced: true });
      expect(
        await one("select to_jsonb(d) data from quote_days d where quote_id=$1 and day_number=1", [
          id,
        ]),
      ).toEqual(before);
      expect(
        (await pg.query("select id from day_blocks where id=$1", [oldDay.block_id])).rows,
      ).toHaveLength(1);
      expect(
        await one(
          "select t.title from template_days d join day_block_translations t on t.block_id=d.block_id where d.template_id=$1 and d.day_number=1 and t.lang='es'",
          [first.id],
        ),
      ).toEqual({ title: "Nueva edición" });
    },
  );
  it("rechaza una cotización o plantilla que cambió después de abrir el diálogo", async () => {
    const id = await quote();
    const preview = await prepareQuoteTemplate(id);
    await pg.query("update quote_days set title='Cambio' where quote_id=$1", [id]);
    await expect(saveQuoteAsTemplate(id, preview, "create")).rejects.toThrow("cotización cambió");
    const first = await saveQuoteAsTemplate(id, await prepareQuoteTemplate(id), "create");
    const replace = await prepareQuoteTemplate(id);
    await pg.query("update itinerary_templates set name='Cambio de otra persona' where id=$1", [
      first.id,
    ]);
    await expect(saveQuoteAsTemplate(id, replace, "replace")).rejects.toThrow("plantilla cambió");
  });
  it("revierte también un reemplazo si falla la copia de un día", async () => {
    const id = await quote();
    const first = await saveQuoteAsTemplate(id, await prepareQuoteTemplate(id), "create");
    const before = await counts();
    const oldDays = (
      await pg.query("select * from template_days where template_id=$1 order by day_number", [
        first.id,
      ])
    ).rows;
    await pg.exec(
      "reset role; create function public.test_fail_template_day() returns trigger language plpgsql as $$ begin raise exception 'Fallo de copia de prueba'; end $$; create trigger test_fail_template_day before insert on public.day_block_translations for each row execute function public.test_fail_template_day(); set role authenticated;",
    );
    try {
      await expect(
        saveQuoteAsTemplate(id, await prepareQuoteTemplate(id), "replace"),
      ).rejects.toThrow("Fallo de copia");
      expect(await counts()).toEqual(before);
      expect(
        (
          await pg.query("select * from template_days where template_id=$1 order by day_number", [
            first.id,
          ])
        ).rows,
      ).toEqual(oldDays);
    } finally {
      await pg.exec(
        "reset role; drop trigger test_fail_template_day on public.day_block_translations; drop function public.test_fail_template_day(); set role authenticated;",
      );
    }
  });
  it("los consumidores anteriores pueden guardar la misma cotización dos veces", async () => {
    const id = await quote();
    const a = await one<{ id: string }>("select promote_quote_template($1) id", [id]);
    const b = await one<{ id: string }>("select promote_quote_template($1) id", [id]);
    expect(a.id).not.toBe(b.id);
    expect(
      (await one<{ sku: string }>("select sku from itinerary_templates where id=$1", [b.id])).sku,
    ).toMatch(/-V2$/);
  });
});
