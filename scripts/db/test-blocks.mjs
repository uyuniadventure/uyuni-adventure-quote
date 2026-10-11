import { createDatabase, seedDatabase, root } from "./local-db.mjs";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const db = await createDatabase();
try {
  // The recovery migration adds these rows before the archived seeds are replayed.
  // Keep the original report unchanged and verify both contributions explicitly.
  const recoveredCounts = {
    itinerary_templates: 2,
    day_blocks: 6,
    day_block_translations: 6,
    day_block_items: 0,
    template_days: 6,
  };
  for (const [table, expected] of Object.entries(recoveredCounts)) {
    const { rows } = await db.query(`select count(*)::int n from public.${table}`);
    assert.equal(rows[0].n, expected, `${table}: migration count mismatch`);
  }
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
  const expectedCounts = Object.fromEntries(
    Object.entries(report.counts).map(([table, count]) => [table, count + recoveredCounts[table]]),
  );
  for (const [table, expected] of Object.entries(expectedCounts)) {
    const { rows } = await db.query(`select count(*)::int n from public.${table}`);
    if (rows[0].n !== expected) throw Error(table + ": count mismatch");
  }
  console.log("PASS blocks: exact counts, FK integrity and repeatability", expectedCounts);
} finally {
  await db.close();
}
