import assert from "node:assert/strict";
import { createDatabase } from "./local-db.mjs";

const db = await createDatabase();
const admin = "10000000-0000-0000-0000-000000000001";
const seller = "10000000-0000-0000-0000-000000000002";
const ops = "10000000-0000-0000-0000-000000000003";
const unknown = "10000000-0000-0000-0000-000000000004";
const one = async (sql, args = []) => (await db.query(sql, args)).rows[0];
async function as(id, work, role = "authenticated") {
  await db.exec(`set role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
  try {
    return await work();
  } finally {
    await db.exec("reset role");
  }
}
const rpc = (dryRun = true, token = null) =>
  one("select public.approve_valid_imports($1,$2) result", [dryRun, token]).then((r) => r.result);
const denied = (work) => assert.rejects(work, (e) => e.code === "42501");
const invalid = (work) => assert.rejects(work, (e) => e.code === "22023");
const snapshot = () =>
  one(`select
  (select jsonb_agg(s order by id) from public.services s) services,
  (select jsonb_agg(t order by id) from public.itinerary_templates t) templates`);

async function service(sku, unit = "per_person", currency = "USD", status = "pendiente") {
  return (
    await one(
      `insert into public.services(sku,name,type,pricing_unit,currency,status,created_by,import_issues)
    values($1,$1,'extra',$2,$3,$4,$5,'Preservar nota de importación') returning id`,
      [sku, unit, currency, status, admin],
    )
  ).id;
}
async function rate(id, net, rack = null, from = null, to = null) {
  await db.query(
    `insert into public.service_rates(service_id,price_net,price_rack,valid_from,valid_to)
    values($1,$2,$3,$4,$5)`,
    [id, net, rack, from, to],
  );
}
async function block(code, serviceId, status = "pendiente", hotel = null) {
  const { id } = await one(
    `insert into public.day_blocks(code,created_by,status,hotel_service_id)
    values($1,$2,$3,$4) returning id`,
    [code, admin, status, hotel],
  );
  if (serviceId)
    await db.query("insert into public.day_block_items(block_id,service_id) values($1,$2)", [
      id,
      serviceId,
    ]);
  return id;
}
async function template(sku, blocks, days = blocks.length || 1, status = "pendiente") {
  const { id } = await one(
    `insert into public.itinerary_templates(sku,name,days,nights,route_type,category,created_by,status)
    values($1,$1,$2,0,'ONEWAY','COMFORT',$3,$4) returning id`,
    [sku, days, admin, status],
  );
  for (const [index, blockId] of blocks.entries())
    await db.query(
      "insert into public.template_days(template_id,day_number,block_id) values($1,$2,$3)",
      [id, index + 1, blockId],
    );
  return id;
}
try {
  await db.exec("insert into public.currencies(code,name) values('USD','US Dollar')");
  await db.query(
    "insert into auth.users(id,email) values($1,'admin@test.invalid'),($2,'seller@test.invalid'),($3,'ops@test.invalid')",
    [admin, seller, ops],
  );
  await db.query("update public.profiles set role='admin' where id=$1", [admin]);
  await db.query("update public.profiles set role='operacion' where id=$1", [ops]);
  const { today, yesterday, tomorrow } = await one(`select
    (now() at time zone 'America/Santiago')::date::text today,
    ((now() at time zone 'America/Santiago')::date - 1)::text yesterday,
    ((now() at time zone 'America/Santiago')::date + 1)::text tomorrow`);
  const net = await service("VALID_NET");
  await rate(net, 10, null, today, today);
  const zero = await service("VALID_ZERO");
  await rate(zero, 0);
  const rack = await service("VALID_RACK");
  await rate(rack, null, 20);
  const multiple = await service("VALID_MULTIPLE");
  await rate(multiple, 99, null, null, yesterday);
  await rate(multiple, 30);
  const missingUnit = await service("BAD_UNIT", null);
  await rate(missingUnit, 10);
  const missingCurrency = await service("BAD_CURRENCY", "per_person", null);
  await rate(missingCurrency, 10);
  const noRates = await service("BAD_NO_RATES");
  const noCost = await service("BAD_NO_COST");
  await rate(noCost, null);
  const expired = await service("BAD_EXPIRED");
  await rate(expired, 40, null, null, yesterday);
  const future = await service("BAD_FUTURE");
  await rate(future, null, 40, tomorrow);
  const inactive = await service("INACTIVE", "per_person", "USD", "inactivo");
  await rate(inactive, 1);
  const active = await service("ACTIVE", "per_person", "USD", "activo");
  await rate(active, 1);
  const goodBlock = await block("GOOD", net);
  const moduleBlock = await block("MODULE", null);
  const { id: moduleId } = await one(
    "insert into public.activity_modules(code,name,duration,created_by) values('MOD','Module','FD',$1) returning id",
    [admin],
  );
  await db.query("insert into public.activity_module_items(module_id,service_id) values($1,$2)", [
    moduleId,
    rack,
  ]);
  await db.query("insert into public.day_block_modules(block_id,module_id) values($1,$2)", [
    moduleBlock,
    moduleId,
  ]);
  const goodTemplate = await template("GOOD_TEMPLATE", [
    goodBlock,
    moduleBlock,
    await block("HOTEL", null, "pendiente", active),
  ]);
  await template("EMPTY_TEMPLATE", []);
  await template("MISSING_DAY", [goodBlock], 2);
  await template("EXTRA_DAY", [goodBlock, moduleBlock], 1);
  await template("EMPTY_DAY", [await block("EMPTY", null)]);
  const unlinkedBlocks = [];
  for (const serviceId of [null, net]) {
    const unlinked = await block(`UNLINKED_${unlinkedBlocks.length}`, serviceId);
    await db.query("insert into public.day_block_items(block_id,item_snapshot) values($1,$2)", [
      unlinked,
      { sku: "PRIVATE_ITEM", description: "Ítem sin catálogo", unit_cost_original: 10 },
    ]);
    unlinkedBlocks.push(unlinked);
    await template(`UNLINKED_TEMPLATE_${unlinkedBlocks.length}`, [unlinked]);
  }
  await template("BAD_SERVICE", [await block("BAD_SERVICE", missingUnit)]);
  await template("INACTIVE_SERVICE", [await block("INACTIVE_SERVICE", inactive)]);
  await template("BAD_HOTEL", [await block("BAD_HOTEL", net, "pendiente", noRates)]);
  await template("INACTIVE_BLOCK", [await block("INACTIVE_BLOCK", net, "inactivo")]);
  const { id: badModule } = await one(
    "insert into public.activity_modules(code,name,duration,created_by) values('BAD_MOD','Empty','FD',$1) returning id",
    [admin],
  );
  const emptyModuleBlock = await block("EMPTY_MODULE", net);
  await db.query("insert into public.day_block_modules(block_id,module_id) values($1,$2)", [
    emptyModuleBlock,
    badModule,
  ]);
  await template("EMPTY_MODULE", [emptyModuleBlock]);
  await template("INACTIVE_TEMPLATE", [goodBlock], 1, "inactivo");

  // Both modes enforce Admin even when called directly, outside the UI.
  for (const id of [seller, ops, unknown, ""]) {
    await as(id, () => denied(() => rpc()));
    await as(id, () => denied(() => rpc(false, "token")));
  }
  await as("", () => denied(() => rpc()), "anon");
  const before = await snapshot();
  const preview = await as(admin, () => rpc());
  assert.deepEqual(
    await snapshot(),
    before,
    "dry run must not write reasons, timestamps or status",
  );
  assert.equal(preview.review_date, today);
  assert.equal(preview.services.pending, 10);
  assert.equal(preview.services.eligible, 4);
  assert.equal(preview.services.remaining, 6);
  assert.equal(
    preview.templates.eligible,
    1,
    "simulate same-batch service approvals, including hotel and module",
  );
  assert.equal(preview.templates.items.find((t) => t.id === goodTemplate).reasons.length, 0);
  assert(
    preview.templates.items
      .filter((t) => t.code.startsWith("UNLINKED_TEMPLATE_"))
      .every((t) => t.reasons.some((reason) => reason.includes("sin vínculo al catálogo"))),
    "a snapshot without a catalog service cannot count as an approved service",
  );
  assert(
    preview.templates.items.filter((t) => t.id !== goodTemplate).every((t) => t.reasons.length),
  );
  await as(admin, () => invalid(() => rpc(false)));
  await as(admin, () => invalid(() => rpc(null)));
  await db.query("update public.service_rates set price_net=11 where service_id=$1", [net]);
  const changed = await snapshot();
  await as(admin, () => invalid(() => rpc(false, preview.fingerprint)));
  assert.deepEqual(await snapshot(), changed, "stale preview must not approve anything");
  const fresh = await as(admin, () => rpc());

  // Force a failure after the services update, proving all-or-nothing rollback.
  await db.exec(`create function public.test_reject_template() returns trigger language plpgsql as $$
    begin raise exception 'Forced apply failure'; end $$;
    create trigger test_reject_template before update on public.itinerary_templates
    for each row execute function public.test_reject_template();`);
  await as(admin, () =>
    assert.rejects(() => rpc(false, fresh.fingerprint), /Forced apply failure/),
  );
  assert.deepEqual(
    await snapshot(),
    changed,
    "template failure must roll back service approvals too",
  );
  await db.exec(
    "drop trigger test_reject_template on public.itinerary_templates; drop function public.test_reject_template();",
  );

  await as(seller, async () => {
    assert.equal(
      (await one("select count(*)::int n from public.services where id=$1", [net])).n,
      0,
    );
    assert.equal(
      (
        await one("select count(*)::int n from public.itinerary_templates where id=$1", [
          goodTemplate,
        ])
      ).n,
      0,
    );
  });
  const applied = await as(admin, () => rpc(false, fresh.fingerprint));
  assert.equal(applied.dry_run, false);
  assert.deepEqual(applied.services, fresh.services);
  assert.deepEqual(applied.templates, fresh.templates);
  for (const item of [...applied.services.items, ...applied.templates.items]) {
    const table = applied.services.items.includes(item) ? "services" : "itinerary_templates";
    const row = await one(`select status, approval_issues from public.${table} where id=$1`, [
      item.id,
    ]);
    assert.equal(row.status, item.reasons.length ? "pendiente" : "activo");
    assert.deepEqual(row.approval_issues, item.reasons);
  }
  assert.equal(
    (await one("select import_issues from public.services where id=$1", [net])).import_issues,
    "Preservar nota de importación",
  );
  assert.equal(
    (await one("select status from public.services where id=$1", [inactive])).status,
    "inactivo",
  );
  assert.equal(
    (await one("select status from public.day_blocks where id=$1", [goodBlock])).status,
    "pendiente",
  );
  await as(seller, async () => {
    assert.equal(
      (await one("select count(*)::int n from public.services where id=$1", [net])).n,
      1,
    );
    assert.equal(
      (await one("select count(*)::int n from public.service_rates where service_id=$1", [net])).n,
      1,
    );
    assert.equal(
      (
        await one("select count(*)::int n from public.itinerary_templates where id=$1", [
          goodTemplate,
        ])
      ).n,
      1,
    );
    assert.equal(
      (
        await one(
          `select count(*)::int n from public.template_days d join public.day_blocks b on b.id=d.block_id where d.template_id=$1`,
          [goodTemplate],
        )
      ).n,
      3,
    );
    assert.equal(
      (
        await one(
          `select count(*)::int n from public.day_block_modules m join public.activity_modules a on a.id=m.module_id
      join public.activity_module_items i on i.module_id=a.id where m.block_id=$1`,
          [moduleBlock],
        )
      ).n,
      1,
    );
    assert.equal(
      (await one("select count(*)::int n from public.services where id=$1", [missingUnit])).n,
      0,
    );
    assert.equal(
      (await one("select count(*)::int n from public.day_blocks where code='EMPTY'")).n,
      0,
    );
    await db.query("update public.day_blocks set status='activo' where id=$1", [goodBlock]);
    await denied(() => rpc(false, fresh.fingerprint));
  });
  assert.equal(
    (await one("select status from public.day_blocks where id=$1", [goodBlock])).status,
    "pendiente",
    "read policy must not grant write access",
  );
  const again = await as(admin, () => rpc());
  assert.equal(again.services.eligible, 0);
  assert.equal(again.templates.eligible, 0);
  await db.query("update public.services set pricing_unit='per_person' where id=$1", [missingUnit]);
  const repaired = await as(admin, () => rpc());
  await as(admin, () => rpc(false, repaired.fingerprint));
  assert.deepEqual(
    (await one("select approval_issues from public.services where id=$1", [missingUnit]))
      .approval_issues,
    [],
  );
  console.log(
    "PASS import approval: Admin-only, read-only simulation, date/cost/unit validation, all template dependencies, stale preview, atomic rollback, persisted reasons, seller visibility and no write escalation.",
  );
} finally {
  await db.close();
}
