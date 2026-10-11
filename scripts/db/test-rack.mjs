import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createDatabase, seedDatabase, root } from "./local-db.mjs";

const db = await createDatabase({ throughMigration: "20261011000100_template_quote_defaults.sql" });
const preflight = await readFile(
  new URL("supabase/seed/04_rack_to_net_preflight.sql", root),
  "utf8",
);
const update = await readFile(
  new URL("supabase/migrations/20261011000200_rack_to_net.sql", root),
  "utf8",
);
const snapshot = async () =>
  (await db.query("select to_jsonb(r) data from service_rates r order by id")).rows;
const rejectUnconfirmedCount = async (expected) => {
  const before = await snapshot();
  const [summary, rows] = await db.exec(preflight);
  assert.equal(summary.rows[0].filas_a_copiar, expected);
  assert.equal(summary.rows[0].confirma_243, false);
  assert.equal(rows.rows.length, expected);
  await assert.rejects(() => db.exec(update), /Recuento no confirmado/);
  await db.exec("rollback");
  assert.deepEqual(await snapshot(), before, "A rejected count must not change any rate");
};

try {
  await seedDatabase(db);
  const [historical] = await db.exec(preflight);
  assert.deepEqual(historical.rows[0], {
    filas_a_copiar: 0,
    confirma_243: false,
    rack_ya_copiado_con_marca_historica: 238,
    sin_neto_ni_rack: 5,
  });
  console.log("PRECHECK historical local data:", historical.rows[0]);
  await rejectUnconfirmedCount(0);
  const untouched = await snapshot();

  // Artificial, isolated fixture; this is NOT a confirmation of Cloud's count.
  const {
    rows: [service],
  } = await db.query(`insert into services(sku,name,type,pricing_unit,currency)
    values('TEST_RACK_COPY','Synthetic rack migration test','extra','per_unit','USD') returning id`);
  const populate = async (n) => {
    await db.query("delete from service_rates where service_id=$1", [service.id]);
    await db.query(
      `insert into service_rates(service_id,price_net,price_rack,net_cost_missing,notes)
      select $1,null,g,true,'Preserve this source note' from generate_series(0,$2::int-1) g`,
      [service.id, n],
    );
  };
  await populate(242);
  await rejectUnconfirmedCount(242);
  await populate(244);
  await rejectUnconfirmedCount(244);
  await populate(243);
  const [summary, candidates] = await db.exec(preflight);
  assert.equal(summary.rows[0].filas_a_copiar, 243);
  assert.equal(summary.rows[0].confirma_243, true);
  assert.equal(candidates.rows.length, 243);
  console.log(
    "PRECHECK synthetic fixture: 243 listed candidates; applying to the isolated test DB only",
  );
  await db.exec(update);
  assert.equal((await db.exec(preflight))[0].rows[0].filas_a_copiar, 0);
  const {
    rows: [after],
  } = await db.query(
    `select
    count(*)::int as copied,
    bool_and(price_net=price_rack and not net_cost_missing) as correct,
    sum(price_rack)::integer as rack_sum,
    count(*) filter (where price_net=0 and price_rack=0)::int as zero_preserved,
    bool_and(notes='Preserve this source note') as notes_preserved
    from service_rates where service_id=$1`,
    [service.id],
  );
  assert.deepEqual(after, {
    copied: 243,
    correct: true,
    rack_sum: 29403,
    zero_preserved: 1,
    notes_preserved: true,
  });
  assert.deepEqual(
    (await snapshot()).filter((r) => r.data.service_id !== service.id),
    untouched,
    "Existing net prices, historical rack copies and missing-both rows remain intact",
  );
  await rejectUnconfirmedCount(0);
  console.log(
    "PASS rack copy: exact 243 guard, atomic abort for 0/242/244, rack/zero preservation, untouched other rates",
  );
} finally {
  await db.close();
}
