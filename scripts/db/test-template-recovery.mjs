import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createDatabase, seedDatabase, root } from "./local-db.mjs";

// Explicit historical schema snapshot to verify the recovery's 40 -> 42 delta.
// The general test:db suite separately replays the full current migration directory.
const migrationFiles = [
  "20261004000100_foundation_schema.sql",
  "20261004000200_security.sql",
  "20261004000300_snapshot_fields.sql",
  "20261004000400_quote_workflows.sql",
  "20261004000500_sales_operations.sql",
  "20261004000600_quote_pdf_storage.sql",
  "20261004000700_email_outbox.sql",
];
const read = async (path) => readFile(new URL(path, root), "utf8");
const db = await createDatabase({ migrationFiles });
const auditSQL = await read("scripts/db/verify-template-import.sql");
try {
  await seedDatabase(db);
  const report = JSON.parse(await read("supabase/seed/applied/blocks-report.json"));
  for (const file of report.seed_order) await db.exec(await read("supabase/seed/applied/" + file));
  const before = (await db.query(auditSQL)).rows;
  assert.equal(before.length, 40);
  const guide = JSON.parse(await read("docs/fase0/guia_productos_extraida.json"));
  const normalize = (sku) => sku.replace(/\s/g, "").replace(/^(SPASPA)(4D)/, "$1-$2");
  const inventory = guide.programas.map((p, index) => ({
    index: index + 1,
    source_sku: p.sku_norm,
    normalized_sku: normalize(p.sku_norm),
    day_numbers: p.days.map((d) => d.n),
  }));
  assert.equal(new Set(inventory.map((p) => p.source_sku)).size, 43);
  const missing = [...new Set(inventory.map((p) => p.normalized_sku))].filter(
    (s) => !before.some((t) => t.sku === s),
  );
  assert.deepEqual(missing, ["SPAUYU-3D3N-FTL", "UYUUYU-2D1N-L", "SPA4D/"]);
  const migration = await read("supabase/migrations/20261006100000_recover_missing_templates.sql");
  await db.exec(migration);
  const after = (await db.query(auditSQL)).rows;
  assert.equal(after.length, 42);
  assert.deepEqual(
    after.filter((t) => before.some((b) => b.sku === t.sku)),
    before,
    "Existing templates unchanged",
  );
  const targets = ["SPAUYU-4D3N-FTL", "UYUUYU-2D1N-L"];
  for (const sku of targets) {
    const t = after.find((t) => t.sku === sku);
    assert.deepEqual(t.missing_blocks, []);
    assert.deepEqual(t.out_of_range, []);
    assert.deepEqual(t.days_without_services, t.linked_days);
  }
  const orphaned = (
    await db.query(`select i.id from public.day_block_items i
    left join public.services s on s.id=i.service_id where s.id is null`)
  ).rows;
  assert.deepEqual(orphaned, []);
  const recovered = (
    await db.query(
      `select t.sku,t.status,b.status block_status,tr.reviewed
    from public.itinerary_templates t join public.template_days d on d.template_id=t.id
    join public.day_blocks b on b.id=d.block_id
    join public.day_block_translations tr on tr.block_id=b.id and tr.lang='es'
    where t.sku=any($1)`,
      [targets],
    )
  ).rows;
  assert.equal(recovered.length, 6);
  assert(
    recovered.every(
      (r) => r.status === "pendiente" && r.block_status === "pendiente" && !r.reviewed,
    ),
  );
  assert.equal(
    (await db.query("select count(*)::int n from public.day_block_items")).rows[0].n,
    562,
  );
  // Exact replay preserves data, timestamps and human edits instead of overwriting them.
  const tables = [
    "itinerary_templates",
    "template_days",
    "day_blocks",
    "day_block_translations",
    "day_block_items",
  ];
  const snapshot = async () =>
    Promise.all(
      tables.map((t) => db.query(`select * from public.${t} order by id`).then((r) => r.rows)),
    );
  const firstPass = await snapshot();
  await db.exec(migration);
  assert.deepEqual(await snapshot(), firstPass);
  await db.query("update public.itinerary_templates set name='Human edit' where sku=$1", [
    targets[0],
  ]);
  await db.exec(migration);
  assert.equal(
    (await db.query("select name from public.itinerary_templates where sku=$1", [targets[0]]))
      .rows[0].name,
    "Human edit",
  );
  // The rejected source has no exact budget. Never borrow another itinerary's services.
  const budgets = JSON.parse(await read("docs/fase0/extraccion_presupuestos_standard.json"));
  for (const sku of [...targets, ...missing]) {
    assert(
      !budgets.some((b) => [b.sheet, b.sku_tpl].filter(Boolean).some((s) => normalize(s) === sku)),
    );
  }
  const unresolved = report.missing_skus;
  assert.equal(unresolved.filter((r) => r.sku).length, 0);
  const knownSkus = new Set(
    (
      await db.query(
        `select sku from public.services union select sku from public.service_sku_aliases`,
      )
    ).rows.map((r) => r.sku),
  );
  const checkedSheets = budgets.filter((b) =>
    before.some((t) => t.sku === normalize(b.sheet) || t.sku === normalize(b.sku_tpl || "")),
  );
  const unknownTariffSkus = checkedSheets.flatMap((b) =>
    b.items
      .filter((i) => i.sku && !knownSkus.has(i.sku))
      .map((i) => ({ sheet: b.sheet, sku: i.sku })),
  );
  assert.deepEqual(unknownTariffSkus, []);
  const audit = {
    basis: "Local reconstruction of applied seeds, not a remote database query",
    source_programs: inventory.length,
    distinct_source_skus: 43,
    templates_before: 40,
    templates_after: 42,
    inventory,
    missing_before: missing,
    excluded_by_user: ["SPA4D/"],
    tariff_skus_not_found: unknownTariffSkus,
    budget_rows_without_sku: unresolved,
    orphan_item_links: orphaned,
    templates: after,
  };
  if (process.argv.includes("--report"))
    await writeFile(
      new URL("docs/fase0/verificacion_plantillas.json", root),
      JSON.stringify(audit, null, 2) + "\n",
    );
  console.log(
    "PASS: 43 source SKUs, 40 -> 42 templates, 6 complete new days, 562 valid items; pending/unreviewed, replay and human edits verified.",
  );
  console.log(
    `${after.filter((t) => t.days_without_services.length).length} templates with empty days; ${after.filter((t) => t.missing_blocks.length).length} with incomplete day numbering (reported, unchanged).`,
  );
} finally {
  await db.close();
}
