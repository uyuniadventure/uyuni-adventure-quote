// @vitest-environment node
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, expect, it } from "vitest";
import {
  createDatabase,
  seedDatabase,
  root,
  execArchivedSeed,
} from "../../../scripts/db/local-db.mjs";

let pg: Awaited<ReturnType<typeof createDatabase>>;
const migration = "20261017000100_catalog_deletion.sql";
beforeAll(async () => {
  pg = await createDatabase({ throughMigration: "20261016000400_quote_flow_stabilization.sql" });
  await seedDatabase(pg);
  const report = JSON.parse(
    await readFile(new URL("supabase/seed/applied/blocks-report.json", root), "utf8"),
  ) as { seed_order: string[] };
  for (const file of report.seed_order)
    await execArchivedSeed(
      pg,
      await readFile(new URL(`supabase/seed/applied/${file}`, root), "utf8"),
    );
  for (const file of ["03_uyuuyu_ltd_2pax.sql", "04_spauyu_mp_2pax.sql"])
    await execArchivedSeed(pg, await readFile(new URL(`supabase/seed/${file}`, root), "utf8"));
  // An unknown manual record with no creator and an import-looking code must survive.
  await pg.exec("insert into day_blocks(code) values('DAY_MANUAL_SIN_AUTOR')");
  await pg.exec(await readFile(new URL(`supabase/migrations/${migration}`, root), "utf8"));
}, 60000);
afterAll(async () => pg?.close());

it("identifica todos los IDs de importación histórica, incluidos huérfanos y presupuestos 03/04", async () => {
  expect(
    (
      await pg.query(
        "select catalog_origin,count(*)::int n from day_blocks group by catalog_origin order by catalog_origin",
      )
    ).rows,
  ).toEqual([
    { catalog_origin: "importacion", n: 155 },
    { catalog_origin: "manual", n: 1 },
  ]);
  expect(
    (
      await pg.query(
        "select catalog_origin,count(*)::int n from itinerary_templates group by catalog_origin",
      )
    ).rows,
  ).toEqual([{ catalog_origin: "importacion", n: 42 }]);
});

it("Supabase y el espejo Drizzle contienen exactamente la misma migración", async () => {
  const sql = await readFile(new URL(`supabase/migrations/${migration}`, root), "utf8");
  expect(
    await readFile(new URL("drizzle/migrations/0022_catalog_deletion.sql", root), "utf8"),
  ).toBe(sql);
});
