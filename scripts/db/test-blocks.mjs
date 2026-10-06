import { createDatabase, seedDatabase, root } from "./local-db.mjs";
import { readFile } from "node:fs/promises";
const db = await createDatabase();
try {
  await seedDatabase(db);
  const report = JSON.parse(
    await readFile(new URL("supabase/seed/applied/blocks-report.json", root), "utf8"),
  );
  for (let pass = 0; pass < 2; pass++)
    for (const file of report.seed_order) {
      const sql = await readFile(new URL("supabase/seed/applied/" + file, root), "utf8");
      if ((sql.match(/^insert into/gm) || []).length > 300) throw Error("Too many rows");
      await db.exec(sql);
    }
  for (const [table, expected] of Object.entries(report.counts)) {
    const { rows } = await db.query(`select count(*)::int n from public.${table}`);
    if (rows[0].n !== expected) throw Error(table + ": count mismatch");
  }
  console.log("PASS blocks: exact counts, FK integrity and repeatability", report.counts);
} finally {
  await db.close();
}
