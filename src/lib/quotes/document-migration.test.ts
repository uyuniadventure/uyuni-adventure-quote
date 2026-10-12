// @vitest-environment node
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createDatabase } from "../../../scripts/db/local-db.mjs";

let pg: Awaited<ReturnType<typeof createDatabase>>;

beforeAll(async () => {
  pg = await createDatabase({ throughMigration: "20261012000700_quote_day_text_review.sql" });
}, 60_000);
afterAll(async () => pg?.close());

it("moves legacy includes/excludes into resolved day content without changing its frozen block", async () => {
  const seller = "73000000-0000-0000-0000-000000000001";
  await pg.query("insert into auth.users(id,email) values($1,'legacy-text@test.invalid')", [
    seller,
  ]);
  await pg.query("update profiles set role='admin' where id=$1", [seller]);
  const client = (
    await pg.query<{ id: string }>(
      "insert into clients(type,name) values('B2C','Legacy') returning id",
    )
  ).rows[0]!.id;
  const quote = (
    await pg.query<{ id: string }>(
      `insert into quotes(code,client_id,client_type,language,seller_id,start_date,pax_paying,category,margin_pct)
       values('LEGACY-TEXT', $1, 'B2C', 'es', $2, '2026-12-01', 2, 'COMFORT', 25) returning id`,
      [client, seller],
    )
  ).rows[0]!.id;
  const day = (
    await pg.query<{ id: string; block_snapshot: unknown }>(
      `insert into quote_days(quote_id,day_number,date,title,description,includes,excludes,route_from,route_to,block_snapshot)
       values($1,1,'2026-12-01','Título guardado','Descripción guardada','Incluye heredado','Excluye heredado','Legacy SPA','Legacy UYU',
         jsonb_build_object('content',jsonb_build_object(
           'title',jsonb_build_object('es','Título del bloque'),
           'description',jsonb_build_object('es','Descripción del bloque'),
           'includes',jsonb_build_object('es','Incluye del bloque'),
           'excludes',jsonb_build_object('es','Excluye del bloque'),
           'start_point','SPA','end_point','UYU'
         )))
       returning id,block_snapshot`,
      [quote],
    )
  ).rows[0]!;

  const migration = await readFile(
    new URL(
      "../../../supabase/migrations/20261012000800_quote_pdf_document_model.sql",
      import.meta.url,
    ),
    "utf8",
  );
  await pg.exec(migration);
  const saved = (
    await pg.query<{ block_snapshot: unknown; overrides: unknown }>(
      "select block_snapshot,overrides from quote_days where id=$1",
      [day.id],
    )
  ).rows[0]!;
  expect(saved.block_snapshot).toEqual(day.block_snapshot);
  expect(saved.overrides).toEqual({
    title: { es: "Título guardado" },
    description: { es: "Descripción guardada" },
    includes: { es: "Incluye heredado" },
    excludes: { es: "Excluye heredado" },
    start_point: "Legacy SPA",
    end_point: "Legacy UYU",
  });
  const resolved = (
    await pg.query<{ content: Record<string, unknown> }>(
      "select resolve_day_content(block_snapshot,overrides) content from quote_days where id=$1",
      [day.id],
    )
  ).rows[0]!.content;
  expect((resolved["title"] as Record<string, string>)["es"]).toBe("Título guardado");
  expect((resolved["description"] as Record<string, string>)["es"]).toBe("Descripción guardada");
  expect((resolved["includes"] as Record<string, string>)["es"]).toBe("Incluye heredado");
  expect((resolved["excludes"] as Record<string, string>)["es"]).toBe("Excluye heredado");
  expect(resolved["start_point"]).toBe("Legacy SPA");
  expect(resolved["end_point"]).toBe("Legacy UYU");
});
