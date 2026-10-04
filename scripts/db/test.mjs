import assert from "node:assert/strict";
import { createDatabase, seedDatabase } from "./local-db.mjs";

const db = await createDatabase();
let checks = 0;
const query = async (sql) => (await db.query(sql)).rows;
const scalar = async (sql) => Object.values((await query(sql))[0])[0];
const check = (value, message) => {
  assert.ok(value, message);
  checks++;
};
const admin = "00000000-0000-0000-0000-000000000001";
const ops = "00000000-0000-0000-0000-000000000002";
const seller = "00000000-0000-0000-0000-000000000003";
const other = "00000000-0000-0000-0000-000000000004";
async function as(id, work) {
  await db.exec(
    `set role authenticated; select set_config('request.jwt.claim.sub','${id}',false);`,
  );
  try {
    await work();
  } finally {
    await db.exec("reset role;");
  }
}
async function denied(sql) {
  await assert.rejects(
    () => db.exec(sql),
    (error) => error.code === "42501",
  );
  checks++;
}
try {
  const report = await seedDatabase(db);
  const counts = async () =>
    query(`select (select count(*)::int from public.services) services,
    (select count(*)::int from public.service_rates) rates, (select count(*)::int from public.suppliers) suppliers,
    (select count(*)::int from public.service_sku_aliases) aliases`);
  const before = await counts();
  check(
    before[0].services === report.services &&
      before[0].rates === report.rates &&
      before[0].suppliers === report.suppliers,
    "seed counts",
  );
  await seedDatabase(db);
  assert.deepEqual(await counts(), before);
  checks++;
  check(
    (await scalar(
      `select count(*)::int from public.service_rates where net_cost_missing and notes like '%sin costo neto%' and price_net = price_rack`,
    )) === report.rack_fallbacks,
    "rack provenance",
  );
  check(
    (await scalar(
      `select count(*)::int from pg_tables where schemaname='public' and not rowsecurity`,
    )) === 0,
    "RLS on every table",
  );
  check(
    (await scalar(
      `select count(*)::int from pg_tables t where t.schemaname='public' and not exists(select 1 from pg_policies p where p.schemaname=t.schemaname and p.tablename=t.tablename) and t.tablename <> 'quote_year_counters'`,
    )) === 0,
    "every exposed table has policies",
  );
  check(
    (await scalar(
      `select count(*)::int from information_schema.tables t where t.table_schema='public' and t.table_type='BASE TABLE' and (not exists(select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=t.table_name and c.column_name='created_at') or not exists(select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=t.table_name and c.column_name='updated_at'))`,
    )) === 0,
    "timestamps on every table",
  );
  check(
    (await scalar(
      `select count(*)::int from public.services s join public.service_sku_aliases a on a.service_id=s.id where a.sku='TRF_ALVARO_LPB_AIRPORT_DAY_7_9PAX_2026' and s.sku='TRF_ALVARO_LPB_AIRPORT_DAY_1_2PAX_2026'`,
    )) === 1,
    "passenger bands share a service",
  );

  await db.exec(`insert into auth.users(id,email) values
    ('${admin}','info@uyuniadventure.com'),('${ops}','ops@example.test'),
    ('${seller}','seller@example.test'),('${other}','other@example.test');`);
  check(
    (await scalar(`select role from public.profiles where id='${admin}'`)) === "vendedor",
    "unverified admin signup is not privileged",
  );
  await db.exec(
    `update auth.users set email_confirmed_at=now() where id='${admin}'; update public.profiles set role='operacion' where id='${ops}';`,
  );
  check(
    (await scalar(`select role from public.profiles where id='${admin}'`)) === "admin",
    "confirmed administrator bootstrap",
  );
  await as(seller, async () => {
    check((await scalar("select public.current_role()")) === "vendedor", "role helper");
    check((await scalar("select count(*)::int from public.profiles")) === 1, "own profile only");
    check(
      (await query(`update public.profiles set role='admin' where id='${seller}' returning id`))
        .length === 0,
      "cannot escalate role",
    );
    for (const table of [
      "currencies",
      "exchange_rates",
      "terms_conditions",
      "bank_accounts",
      "ops_passengers",
    ]) {
      check((await scalar(`select count(*)::int from public.${table}`)) === 0, `${table} private`);
    }
    await denied(
      `insert into public.services(sku,name,type,status,created_by,currency,pricing_unit) values ('BAD','Bad','extra','activo','${seller}','USD','per_unit')`,
    );
    await denied(
      `insert into public.services(sku,name,type,created_by) values ('SPOOF','Bad','extra','${other}')`,
    );
    await db.exec(
      `insert into public.services(sku,name,type,currency,pricing_unit) values ('SELLER_PENDING','Own pending','extra','USD','per_unit');`,
    );
    check(
      (await scalar(`select count(*)::int from public.services where sku='SELLER_PENDING'`)) === 1,
      "own pending visible",
    );
    check(
      (
        await query(
          `update public.services set status='activo' where sku='SELLER_PENDING' returning id`,
        )
      ).length === 0,
      "seller cannot approve",
    );
    await denied(
      `insert into public.service_rates(service_id,price_net) select id,1 from public.services where sku='SELLER_PENDING'`,
    );
    await db.exec(
      `insert into public.service_change_requests(service_id,proposed_values,reason) select id,'{"price_net": 42}','Proposed rate' from public.services where sku='SELLER_PENDING';`,
    );
    await denied(
      `insert into public.service_change_requests(service_id,proposed_values,reason,status) select id,'{}','Self approval','aprobado' from public.services where sku='SELLER_PENDING'`,
    );
  });
  await as(other, async () =>
    check(
      (await scalar(`select count(*)::int from public.services where sku='SELLER_PENDING'`)) === 0,
      "other seller cannot see pending",
    ),
  );
  await as(ops, async () => {
    await db.exec(
      `update public.services set status='activo' where sku='SELLER_PENDING'; insert into public.service_rates(service_id,price_net) select id,42 from public.services where sku='SELLER_PENDING';`,
    );
    check(
      (await scalar(`select count(*)::int from public.service_rates where price_net=42`)) > 0,
      "operations updates rates",
    );
  });
  await as(other, async () =>
    check(
      (await scalar(`select count(*)::int from public.services where sku='SELLER_PENDING'`)) === 1,
      "approved visible",
    ),
  );

  const client = await scalar(
    `insert into public.clients(type,name) values ('B2C','Fixture') returning id`,
  );
  const makeQuote = async (code, owner) =>
    scalar(
      `insert into public.quotes(code,client_id,client_type,seller_id,start_date,pax_paying,category) values ('${code}','${client}','B2C','${owner}','2026-10-04',2,'COMFORT') returning id`,
    );
  const q1 = await makeQuote("TEST-1", seller);
  const q2 = await makeQuote("TEST-2", other);
  const d1 = await scalar(
    `insert into public.quote_days(quote_id,day_number,title) values ('${q1}',1,'Snapshot') returning id`,
  );
  const d2 = await scalar(
    `insert into public.quote_days(quote_id,day_number,title) values ('${q2}',1,'Other snapshot') returning id`,
  );
  const item = await scalar(
    `insert into public.quote_items(quote_day_id,description,type,pricing_unit,unit_cost_original,currency,unit_cost_usd) values ('${d1}','Snapshot item','extra','per_unit',10,'USD',10) returning id`,
  );
  await as(seller, async () => {
    check((await scalar("select count(*)::int from public.quotes")) === 1, "seller sees own quote");
    check(
      (await scalar("select count(*)::int from public.quote_days")) === 1,
      "nested snapshot privacy",
    );
    await db.exec(`update public.quotes set margin_pct=20 where id='${q1}'`);
    await denied(`update public.quotes set seller_id='${other}' where id='${q1}'`);
    await denied(`update public.quote_items set quote_day_id='${d2}' where id='${item}'`);
    await denied(
      `insert into public.quote_payments(quote_id,amount,currency,date,method,type) values ('${q2}',1,'USD','2026-10-04','cash','deposito')`,
    );
    await db.exec(
      `insert into public.quote_payments(quote_id,amount,currency,date,method,type) values ('${q1}',1,'USD','2026-10-04','cash','deposito')`,
    );
    const codes = await query(
      `select public.next_quote_code('UYUSPA-3D2N-PTd','it') code from generate_series(1,25)`,
    );
    check(new Set(codes.map((x) => x.code)).size === 25, "unique sequence allocations");
    check(codes[0].code.endsWith("-0001") && codes[24].code.endsWith("-0025"), "sequential codes");
    await denied("update public.quote_year_counters set last_value=1");
  });
  await as(ops, async () =>
    check(
      (await scalar("select count(*)::int from public.quotes")) === 0,
      "operations quotes remain owner-scoped",
    ),
  );
  await as(admin, async () =>
    check((await scalar("select count(*)::int from public.quotes")) === 2, "admin all quotes"),
  );

  const module = await scalar(
    `insert into public.activity_modules(code,name,duration,status,created_by) values ('TEST-MOD','Module','FD','pendiente','${seller}') returning id`,
  );
  await as(seller, async () => {
    await db.exec(
      `insert into public.activity_module_translations(module_id,lang,title,description) values ('${module}','es','Title','Draft')`,
    );
    checks++;
  });
  await db.exec(`update public.activity_modules set status='activo' where id='${module}'`);
  await as(seller, async () => {
    check(
      (
        await query(
          `update public.activity_module_translations set description='Tampered' where module_id='${module}' returning id`,
        )
      ).length === 0,
      "approved child immutable to seller",
    );
    await denied(
      `insert into public.activity_module_translations(module_id,lang,title,description) values ('${module}','en','Title','Tampered')`,
    );
  });
  const op = await scalar(
    `insert into public.ops_services(booking_code,quote_id,client_type,start_date,end_date,pax) values ('TEST BOOKING','${q1}','PRIVADO','2026-10-04','2026-10-06',2) returning id`,
  );
  await db.exec(
    `insert into public.ops_passengers(service_id,full_name,passport) values ('${op}','Passenger','Sensitive');`,
  );
  await as(seller, async () => {
    check(
      (await scalar("select count(*)::int from public.ops_services")) === 1,
      "seller operations read",
    );
    check(
      (await scalar("select count(*)::int from public.ops_passengers")) === 0,
      "populated passengers still private",
    );
    check(
      (await query(`update public.ops_services set status='cancelado' returning id`)).length === 0,
      "seller operations read-only",
    );
    await denied(
      `insert into public.ops_passengers(service_id,full_name) values ('${op}','Blocked')`,
    );
  });
  await as(ops, async () => {
    check(
      (await scalar("select count(*)::int from public.ops_passengers")) === 1,
      "operations passenger access",
    );
    await db.exec(`update public.ops_passengers set dietary_restrictions='vegetarian'`);
  });
  check(
    (await scalar(`select count(*)::int from pg_constraint c
      join pg_namespace n on n.oid=c.connamespace
      where c.contype='f' and n.nspname='public' and not exists(
        select 1 from pg_index i where i.indrelid=c.conrelid and i.indkey[0]=c.conkey[1]
      )`)) === 0,
    "every foreign key has a leading-column index",
  );
  await db.exec(`insert into public.bank_accounts(entity,bank_name,account_holder,account_number,currency)
    values ('Fixture','Bank','Holder','TEST','USD');
    insert into public.terms_conditions(scope,lang,content) values ('B2C_general','es','Private terms');
    update public.quote_year_counters set last_value=9999;`);
  await as(seller, async () => {
    check(
      (await scalar("select count(*)::int from public.bank_accounts")) === 0,
      "populated banking private",
    );
    check(
      (await scalar("select count(*)::int from public.terms_conditions")) === 0,
      "populated terms private",
    );
    check(
      (await scalar("select public.next_quote_code('SKU','en')")).endsWith("-10000"),
      "counter never truncates after 9999",
    );
  });
  await as(ops, async () => {
    check(
      (await scalar("select count(*)::int from public.bank_accounts")) === 0,
      "operations cannot read banking",
    );
    await denied(
      "insert into public.exchange_rates(currency,rate_to_usd,valid_from) values ('EUR',1,'2026-10-04')",
    );
  });
  await as(admin, async () => {
    check(
      (await scalar("select count(*)::int from public.bank_accounts")) === 1,
      "admin banking access",
    );
  });
  await as("00000000-0000-0000-0000-000000000099", async () => {
    check(
      (await scalar("select count(*)::int from public.services")) === 0,
      "profileless user denied",
    );
    check(
      (await scalar("select count(*)::int from public.ops_service_summary")) === 0,
      "view honors caller RLS",
    );
    await denied("select public.next_quote_code('SKU','es')");
  });
  const previousTimestamp = await scalar(
    `select updated_at from public.services where sku='SELLER_PENDING'`,
  );
  await db.exec("update public.services set name='Updated name' where sku='SELLER_PENDING'");
  check(
    (await scalar(`select updated_at from public.services where sku='SELLER_PENDING'`)) >
      previousTimestamp,
    "timestamp trigger updates on mutation",
  );
  await db.exec("set role anon");
  await denied("select * from public.quotes");
  await denied(`select public.next_quote_code('SKU','es')`);
  await db.exec("reset role");
  console.log(`PASS: ${checks} schema, seed-idempotency and role/security checks`);
} finally {
  await db.close();
}
