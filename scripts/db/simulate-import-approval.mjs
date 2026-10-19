import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createDatabase, seedDatabase, root, execArchivedSeed } from "./local-db.mjs";

// Isolated reconstruction only. Never connects to Cloud and has no apply flag.
const db = await createDatabase();
try {
  await seedDatabase(db);
  const blocks = JSON.parse(
    await readFile(new URL("supabase/seed/applied/blocks-report.json", root), "utf8"),
  );
  for (const file of blocks.seed_order)
    await execArchivedSeed(
      db,
      await readFile(new URL(`supabase/seed/applied/${file}`, root), "utf8"),
    );
  const id = "20000000-0000-0000-0000-000000000001";
  await db.query("insert into auth.users(id,email) values($1,'simulation@test.invalid')", [id]);
  await db.query("update public.profiles set role='admin' where id=$1", [id]);
  const snapshot = async () =>
    (
      await db.query(`select
    (select jsonb_agg(s order by id) from public.services s) services,
    (select jsonb_agg(t order by id) from public.itinerary_templates t) templates`)
    ).rows;
  const before = await snapshot();
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  const {
    rows: [{ result }],
  } = await db.query("select public.approve_valid_imports() result");
  await db.exec("reset role");
  assert.deepEqual(await snapshot(), before);
  const report = {
    basis:
      "SIMULACIÓN LOCAL: migraciones actuales + seeds archivados en supabase/seed/applied. No consulta ni cambia Lovable Cloud. No incluye el seed piloto 04_spauyu_mp_2pax.sql.",
    ...result,
  };
  if (process.argv.includes("--report"))
    await writeFile(
      new URL("docs/pendientes/aprobacion_importacion_simulacion.json", root),
      JSON.stringify(report, null, 2) + "\n",
    );
  console.log(report.basis);
  console.log(
    JSON.stringify(
      {
        date: report.review_date,
        services: { ...report.services, items: undefined },
        templates: { ...report.templates, items: undefined },
      },
      null,
      2,
    ),
  );
} finally {
  await db.close();
}
