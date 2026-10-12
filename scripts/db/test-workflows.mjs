import assert from "node:assert/strict";
import { createDatabase, seedDatabase } from "./local-db.mjs";
const db = await createDatabase();
const scalar = async (sql, args = []) =>
  Object.values((await db.query(sql, args)).rows[0] || {})[0];
const seller = "00000000-0000-0000-0000-000000000001";
const ops = "00000000-0000-0000-0000-000000000002";
try {
  await seedDatabase(db);
  await db.exec(
    `insert into auth.users(id,email)values('${seller}','seller@test.invalid'),('${ops}','ops@test.invalid');update profiles set role='operacion' where id='${ops}';set role authenticated;select set_config('request.jwt.claim.sub','${seller}',false);`,
  );
  const client = await scalar("insert into clients(type,name)values('B2B','Test')returning id");
  const p = {
    tour_sku: "SPAUYU-3D2N-MP",
    client_id: client,
    client_type: "B2B",
    language: "es",
    start_date: "2027-01-01",
    pax_paying: 2,
    tc_count: 1,
    category: "COMFORT",
    rooming: { paying: { DBL_TWN: 1 }, tc: { SGL: 1 } },
    vehicles: { bolivia: 1 },
    fx_snapshot: { USD: 1 },
    margin_pct: 20,
    rounding_rule: { mode: "none", increment: 1 },
  };
  const item = {
    description: "Transfer",
    type: "transporte",
    pricing_unit: "per_group",
    currency: "USD",
    qty: 1,
    unit_cost_original: 100,
    unit_cost_usd: 100,
    pricing_snapshot: { rates: [] },
  };
  let q = await scalar("select to_jsonb(public.create_quote_snapshot($1,$2))", [
    p,
    [{ day_number: 1, title: "Día 1", snapshot: { reviewed: true }, items: [item, item] }],
  ]);
  const items = (await db.query("select * from quote_items")).rows;
  assert.equal(items.length, 2);
  await assert.rejects(
    () => db.query("select public.transition_quote($1,'vendida')", [q.id]),
    /Invalid quote transition/,
  );
  await assert.rejects(
    () => db.query("select public.transition_quote($1,'revisada')", [q.id]),
    /Recalculate/,
  );
  const result = {
    total_cost_usd: 200,
    total_margin_usd: 40,
    total_price_usd: 240,
    price_per_pax_usd: 120,
    single_supplement_pp: 0,
    items: items.map((i) => ({
      id: i.id,
      quantity: 1,
      unit_cost_original: 100,
      unit_cost_usd: 100,
      total_cost_usd: 100,
    })),
  };
  q = await scalar("select to_jsonb(public.save_quote_calculation($1,$2,$3))", [
    q.id,
    q.updated_at,
    result,
  ]);
  await db.query("select public.transition_quote($1,'revisada')", [q.id]);
  await db.query("select public.transition_quote($1,'enviada')", [q.id]);
  await assert.rejects(
    () => db.query("update quote_items set qty=2 where id=$1", [items[0].id]),
    /immutable/,
  );
  const edited = await scalar("select public.edit_quote_item($1,$2)", [
    items[0].id,
    { price_overridden: true, override_note: "Confirmed", unit_cost_original: 110 },
  ]);
  assert.notEqual(edited.quote_id, q.id);
  const clone = await scalar("select to_jsonb(q) from quotes q where id=$1", [edited.quote_id]);
  assert.equal(clone.version, 2);
  assert.ok(clone.code.endsWith("-v2"));
  assert.equal(
    await scalar("select unit_cost_original from quote_items where id=$1", [items[0].id]),
    "100.0000",
  );
  assert.equal(
    await scalar(
      "select count(*)::int from quote_items i join quote_days d on d.id=i.quote_day_id where d.quote_id=$1",
      [clone.id],
    ),
    2,
  );
  await assert.rejects(
    () =>
      db.query(
        "insert into quote_payments(quote_id,amount,currency,date,method,type)values($1,10,'USD','2027-01-01','cash','deposito')",
        [q.id],
      ),
    /Archived/,
  );
  const clonedItems = (
    await db.query(
      "select i.* from quote_items i join quote_days d on d.id=i.quote_day_id where d.quote_id=$1",
      [clone.id],
    )
  ).rows;
  const updated = await scalar("select updated_at from quotes where id=$1", [clone.id]);
  await assert.rejects(
    () =>
      db.query("select public.save_quote_calculation($1,$2,$3)", [clone.id, "2020-01-01", result]),
    /changed/,
  );
  await db.query("select public.save_quote_calculation($1,$2,$3)", [
    clone.id,
    updated,
    { ...result, items: clonedItems.map((i) => ({ ...result.items[0], id: i.id })) },
  ]);
  await db.query("select public.transition_quote($1,'revisada')", [clone.id]);
  await db.query("select public.transition_quote($1,'enviada')", [clone.id]);
  await assert.rejects(
    () => db.query("select public.transition_quote($1,'perdida',' ')", [clone.id]),
    /reason/,
  );
  for (let n = 0; n < 2; n++)
    await db.query(
      "insert into quote_payments(quote_id,amount,currency,date,method,type)values($1,72,'USD','2027-01-01','cash','deposito')",
      [clone.id],
    );
  assert.equal(await scalar("select status from quotes where id=$1", [clone.id]), "vendida");
  assert.equal(await scalar("select count(*)::int from ops_services"), 1);
  assert.equal(await scalar("select count(*)::int from ops_items"), 2);
  assert.equal(
    await scalar(
      "select count(*)::int from quote_status_history where quote_id=$1 and new_status='vendida'",
      [clone.id],
    ),
    1,
  );
  await assert.rejects(() => db.query("delete from quote_status_history"), /permission denied/);
  await db.exec(`select set_config('request.jwt.claim.sub','${ops}',false)`);
  const op = await scalar("select id from ops_services");
  assert.equal(
    (await scalar("select to_jsonb(public.compute_real_margin($1))", [op])).real_margin_usd,
    40,
  );
  await assert.rejects(
    () => db.query("select public.build_supplier_payables($1)", [op]),
    /supplier/,
  );
  const supplier = await scalar("select id from suppliers limit 1");
  await db.query("update ops_items set supplier_id=$1 where service_id=$2", [supplier, op]);
  await db.query("select public.build_supplier_payables($1)", [op]);
  await db.query("update ops_supplier_payables set paid_usd=50 where service_id=$1", [op]);
  await db.query("select public.build_supplier_payables($1)", [op]);
  assert.equal(
    await scalar("select balance_usd from ops_supplier_payables where service_id=$1", [op]),
    "150.0000",
  );
  await db.query(
    "update ops_items set booking_status='cancelado' where id=(select id from ops_items where service_id=$1 limit 1)",
    [op],
  );
  await db.query("select public.build_supplier_payables($1)", [op]);
  assert.equal(
    await scalar("select balance_usd from ops_supplier_payables where service_id=$1", [op]),
    "50.0000",
  );
  assert.equal(
    (await scalar("select to_jsonb(public.compute_real_margin($1))", [op])).real_margin_usd,
    140,
  );
  for (let n = 0; n < 2; n++)
    await db.query("select public.generate_communication_plan($1,$2)", [
      op,
      ["Welcome", "48h", "24h", "Day 1", "Survey"],
    ]);
  assert.equal(
    await scalar("select count(*)::int from ops_communications where service_id=$1", [op]),
    5,
  );
  console.log(
    "PASS workflow: snapshots, duplicate-item version mapping, state guards, stale calculations, deposits, operations, history",
  );
} catch (e) {
  console.error(e.message, e.detail || "");
  process.exitCode = 1;
} finally {
  await db.close();
}
