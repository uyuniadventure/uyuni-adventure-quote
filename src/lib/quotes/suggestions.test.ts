// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { createDatabase } from "../../../scripts/db/local-db.mjs";
import { pgliteSupabase } from "@/test/pglite-supabase";
const transport = vi.hoisted(() => ({ client: null as ReturnType<typeof pgliteSupabase> | null }));
vi.mock("../db", () => ({ db: { from: (table: string) => transport.client!.from(table) } }));
import { suggestTemplates, templateSuggestionError, templateImportWarnings } from "./suggestions";
import { getTemplateForQuote, templateQuotePrefill, quoteCreationSearch } from "./template-entry";
import { templatePassengerDefaults, templatePassengerMismatch } from "./template-defaults";

let pg: Awaited<ReturnType<typeof createDatabase>>;
const admin = randomUUID(),
  seller = randomUUID();
const as = async (id: string) => {
  await pg.exec("set role authenticated");
  await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
};
const add = async (
  sku: string,
  status = "pendiente",
  days = 3,
  owner = admin,
  route = "UYU",
  category = "COMFORT",
  modality = "privado",
) => {
  await pg.query(
    "insert into itinerary_templates(sku,name,route_from,route_to,route_type,days,nights,category,modality,status,created_by) values($1,$1,$5,'SPA','ONEWAY',$3,$3-1,$6,$7,$2,$4)",
    [sku, status, days, owner, route, category, modality],
  );
};
beforeAll(async () => {
  pg = await createDatabase();
  await pg.exec(
    "delete from itinerary_templates; insert into location_codes(code,name,country) values('UYU','Uyuni','BO'),('SPA','San Pedro','CL'),('LPB','La Paz','BO') on conflict do nothing",
  );
  await pg.query(
    "insert into auth.users(id,email) values($1,'suggest-admin@example.invalid'),($2,'suggest-seller@example.invalid')",
    [admin, seller],
  );
  await pg.query("update profiles set role='admin' where id=$1", [admin]);
  transport.client = pgliteSupabase(pg);
}, 30_000);
beforeEach(async () => {
  await pg.exec("begin");
  await as(admin);
});
afterEach(async () => {
  await pg.exec("rollback; reset role");
});
afterAll(async () => {
  await pg?.close();
});

it("returns three pending templates when none are active, excluding archived/inactive", async () => {
  for (const sku of ["ONE", "TWO", "THREE"]) await add(sku);
  await add("ARCHIVED", "inactivo");
  expect((await suggestTemplates({})).map((t) => t.sku).sort()).toEqual(["ONE", "THREE", "TWO"]);
});
it("ranks route, +/- one day, category and modality without excluding alternatives", async () => {
  await add("UYUSPA-4D3N", "activo", 4);
  await add("EXACT", "activo");
  await add("OTHER", "activo", 10, admin, "LPB", "VIP", "grupo");
  await add("ZERO", "activo", 10, admin, "LPB", "VIP", "grupo");
  await pg.exec("update itinerary_templates set route_to='LPB' where sku='ZERO'");
  await add("PENDING", "pendiente");
  const rows = await suggestTemplates({
    route_from: "UYU",
    route_to: "SPA",
    days: "3",
    category: "COMFORT",
    modality: "privado",
  });
  expect(rows.map((t) => [t.sku, t.score])).toEqual([
    ["EXACT", 11],
    ["UYUSPA-4D3N", 10],
    ["OTHER", 3],
    ["ZERO", 0],
    ["PENDING", 11],
  ]);
});
it("returns all visible templates even when all scores are zero", async () => {
  await add("ONE");
  await add("TWO");
  const rows = await suggestTemplates({
    route_from: "XXX",
    route_to: "YYY",
    days: 20,
    category: "VIP",
    modality: "grupo",
  });
  expect(rows).toHaveLength(2);
  expect(rows.every((t) => t.score === 0)).toBe(true);
});
it("does not truncate at the former 60 limit or the database page size", async () => {
  await pg.exec(
    "insert into itinerary_templates(sku,name,route_type,days,nights,category,status) select 'PAGE-'||n,'Page','ONEWAY',3,2,'COMFORT','activo' from generate_series(1,501) n",
  );
  const rows = await suggestTemplates({});
  expect(rows).toHaveLength(501);
  expect(new Set(rows.map((t) => t.id)).size).toBe(501);
});
it("matches catalogue RLS: own pending and all active, never another seller's pending", async () => {
  await add("OWN", "pendiente", 3, seller);
  await add("PRIVATE");
  await add("PUBLIC", "activo");
  await as(seller);
  expect((await suggestTemplates({})).map((t) => t.sku)).toEqual(["PUBLIC", "OWN"]);
});
it.each([
  [
    "42703",
    "column itinerary_templates.quote_defaults does not exist",
    "20261011000100_template_quote_defaults.sql",
  ],
  [
    "42703",
    "column itinerary_templates.import_warnings does not exist",
    "20261004000300_snapshot_fields.sql",
  ],
  [
    "PGRST204",
    "quote_defaults missing in schema cache",
    "20261011000100_template_quote_defaults.sql",
  ],
])("explains missing schema for %s: %s", (code, message, migration) => {
  expect(templateSuggestionError({ code, message }).message).toContain(migration);
});
it("keeps warnings readable without discarding structured import details", () => {
  expect(templateImportWarnings(["Revisar hotel", { day: 2, reason: "Falta texto" }])).toEqual([
    "Revisar hotel",
    '{"day":2,"reason":"Falta texto"}',
  ]);
  expect(templateImportWarnings(null)).toEqual([]);
});

it("loads a pending template through RLS with warnings and prefills only itinerary and passenger fields", async () => {
  await add("SELECTED", "pendiente", 4, seller);
  const id = (await suggestTemplates({}))[0]!.id;
  await pg.query(
    "update itinerary_templates set quote_defaults=$2,import_warnings=$3 where id=$1",
    [id, { pax_paying: 9, tc_count: 1 }, ["Confirmar hotel"]],
  );
  await as(seller);
  const template = await getTemplateForQuote(id);
  expect(template.status).toBe("pendiente");
  expect(template.import_warnings).toEqual(["Confirmar hotel"]);
  expect(templateQuotePrefill(template)).toEqual({
    route_from: "UYU",
    route_to: "SPA",
    days: "4",
    category: "COMFORT",
    modality: "privado",
    pax_paying: "9",
    tc_count: "1",
  });
});
it("rejects inactive templates, missing UUIDs and another user's pending template", async () => {
  await add("CLOSED", "activo");
  const id = (await suggestTemplates({}))[0]!.id;
  await pg.query("update itinerary_templates set status='inactivo' where id=$1", [id]);
  await expect(getTemplateForQuote(id)).rejects.toThrow("archivada");
  await pg.query("update itinerary_templates set status='pendiente' where id=$1", [id]);
  await as(seller);
  await expect(getTemplateForQuote(id)).rejects.toThrow("no existe o no tienes acceso");
  await expect(getTemplateForQuote(randomUUID())).rejects.toThrow("no existe o no tienes acceso");
  await expect(getTemplateForQuote("not-an-id")).rejects.toThrow("identificador");
});
it("keeps absent passenger defaults empty and respects explicit zero TC", () => {
  expect(templatePassengerDefaults({})).toEqual({});
  expect(templatePassengerDefaults({ pax_paying: 2, tc_count: 0 })).toEqual({
    pax_paying: 2,
    tc_count: 0,
  });
  expect(templatePassengerMismatch({ pax_paying: "2", tc_count: "0" }, { pax_paying: 2 })).toBe(
    false,
  );
  expect(templatePassengerMismatch({ pax_paying: "2", tc_count: "1" }, { tc_count: 0 })).toBe(true);
  expect(() => templatePassengerDefaults({ pax_paying: -1 })).toThrow("configuración");
});
it("validates template URLs and gives an existing quote precedence", () => {
  expect(quoteCreationSearch({ template: "id" })).toEqual({ template: "id" });
  expect(quoteCreationSearch({ quote: "saved", template: "id" })).toEqual({ quote: "saved" });
  expect(quoteCreationSearch({ template: 42, quote: [] })).toEqual({});
  expect(quoteCreationSearch({ template: " ", quote: "" })).toEqual({});
});
