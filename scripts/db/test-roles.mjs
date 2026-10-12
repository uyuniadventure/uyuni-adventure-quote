import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createDatabase } from "./local-db.mjs";

const db = await createDatabase();
const ids = Object.fromEntries(
  ["admin", "operacion", "vendedor", "otro"].map((r) => [r, randomUUID()]),
);
let checks = 0;
const rows = async (sql, args = []) => (await db.query(sql, args)).rows;
const scalar = async (sql, args = []) => Object.values((await rows(sql, args))[0] ?? {})[0];
const equal = (actual, expected, label) => {
  assert.deepEqual(actual, expected, label);
  checks++;
};
const denied = async (sql, args = []) => {
  await assert.rejects(
    () => db.query(sql, args),
    (error) => ["42501", "P0001", "P0002"].includes(error.code),
  );
  checks++;
};
async function as(role) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [ids[role]]);
}
try {
  await db.exec("insert into currencies(code,name) values('USD','Dólar')");
  for (const [role, id] of Object.entries(ids)) {
    await db.query("insert into auth.users(id,email) values($1,$2)", [
      id,
      `${role}@example.invalid`,
    ]);
    await db.query("update profiles set role=$2 where id=$1", [
      id,
      role === "otro" ? "vendedor" : role,
    ]);
  }
  const supplier = await scalar(
    "insert into suppliers(name) values('Proveedor de prueba') returning id",
  );
  const service = await scalar(
    "insert into services(sku,name,type,pricing_unit,currency,status) values('RLS-TEST','Servicio de prueba','extra','per_unit','USD','activo') returning id",
  );
  const rate = await scalar(
    "insert into service_rates(service_id,price_net) values($1,100) returning id",
    [service],
  );
  const client = await scalar(
    "insert into clients(type,name) values('B2C','Cliente de prueba') returning id",
  );
  const quotes = {},
    operations = {},
    days = {};
  for (const role of ["vendedor", "otro", "operacion"]) {
    await as(role);
    quotes[role] = await scalar(
      "insert into quotes(code,client_id,client_type,start_date,pax_paying,category) values($1,$2,'B2C','2027-01-01',2,'COMFORT') returning id",
      [`RLS-${role}`, client],
    );
    days[role] = await scalar(
      "insert into quote_days(quote_id,day_number,date,title,snapshot) values($1,1,'2027-01-01','Privado','{\"reviewed\":true}') returning id",
      [quotes[role]],
    );
    await db.query(
      "insert into quote_items(quote_day_id,description,type,pricing_unit,currency,unit_cost_original,unit_cost_usd) values($1,'Privado','extra','per_unit','USD',100,100)",
      [days[role]],
    );
    await db.query(
      "insert into quote_followups(quote_id,scheduled_at,note) values($1,now(),'Privado')",
      [quotes[role]],
    );
  }
  await as("admin");
  for (const role of ["vendedor", "otro", "operacion"]) {
    operations[role] = await scalar(
      "insert into ops_services(booking_code,quote_id,client_type,start_date,end_date,pax) values($1,$2,'PRIVADO','2027-01-01','2027-01-01',2) returning id",
      [`RLS-${role}`, quotes[role]],
    );
    await db.query(
      "insert into ops_items(service_id,item_snapshot,date,type,description,supplier_id,currency,cost_usd,cost_local) values($1,'{}','2027-01-01','alojamiento','Privado',$2,'USD',100,100)",
      [operations[role], supplier],
    );
    await db.query(
      "insert into ops_supplier_payables(service_id,supplier_id,currency,cost_usd,cost_local) values($1,$2,'USD',100,100)",
      [operations[role], supplier],
    );
    await db.query(
      "insert into ops_communications(service_id,milestone,channel,scheduled_at,message) values($1,1,'email',now(),'Privado')",
      [operations[role]],
    );
    await db.query(
      "insert into ops_passengers(service_id,full_name,passport) values($1,'Pasajero','PRIVATE')",
      [operations[role]],
    );
  }
  for (const role of ["vendedor", "operacion", "admin"]) {
    await as(role);
    const expectedQuotes = role === "admin" ? 3 : 1;
    for (const table of ["quotes", "quote_days", "quote_items", "quote_followups"])
      equal(
        await scalar(`select count(*)::int from ${table}`),
        expectedQuotes,
        `${role}: ${table} isolation`,
      );
    const expectedOps = role === "vendedor" ? 1 : 3;
    for (const table of [
      "ops_services",
      "ops_items",
      "ops_supplier_payables",
      "ops_communications",
      "ops_service_summary",
      "ops_pending_payables",
      "ops_active_accommodation_bookings",
    ])
      equal(
        await scalar(`select count(*)::int from ${table}`),
        expectedOps,
        `${role}: ${table} privacy`,
      );
    equal(
      await scalar("select count(*)::int from ops_passengers"),
      role === "vendedor" ? 0 : 3,
      `${role}: passengers`,
    );
    if (role !== "admin") {
      await denied("select public.admin_list_users()");
      equal(
        (await rows("update profiles set role='admin' where id=$1 returning id", [ids[role]]))
          .length,
        0,
        `${role} cannot escalate`,
      );
      await denied("select public.claim_quote_email($1,'x@example.invalid','s','body')", [
        quotes.otro,
      ]);
      await denied(
        "insert into quotes(code,client_id,client_type,seller_id,start_date,pax_paying,category) values('SPOOF',$1,'B2C',$2,'2027-01-01',2,'COMFORT')",
        [client, ids.otro],
      );
      equal(
        (await rows("update quotes set margin_pct=99 where id=$1 returning id", [quotes.otro]))
          .length,
        0,
        "cannot edit someone else",
      );
    } else {
      const users = await scalar("select public.admin_list_users()");
      equal(
        users.map((u) => u.email).sort(),
        Object.keys(ids)
          .map((r) => `${r}@example.invalid`)
          .sort(),
        "admin sees exact Auth emails",
      );
      equal(
        Object.keys(users[0]).sort(),
        ["id", "email", "full_name", "role", "created_at"].sort(),
        "no credentials exposed",
      );
    }
  }
  await as("vendedor");
  equal(
    (await rows("update service_rates set price_net=999 where id=$1 returning id", [rate])).length,
    0,
    "seller cannot update rate",
  );
  equal(
    (await rows("delete from service_rates where id=$1 returning id", [rate])).length,
    0,
    "seller cannot delete rate",
  );
  await denied("insert into service_rates(service_id,price_net) values($1,999)", [service]);
  const suggestion = await scalar(
    "insert into service_change_requests(rate_id,proposed_values,reason) values($1,'{\"price_net\":120}','Prueba') returning id",
    [rate],
  );
  equal(
    (
      await rows("update service_change_requests set status='aprobado' where id=$1 returning id", [
        suggestion,
      ])
    ).length,
    0,
    "seller cannot approve suggestion",
  );
  equal(
    (await rows("update services set status='inactivo' where id=$1 returning id", [service]))
      .length,
    0,
    "seller cannot change catalog status",
  );
  await denied(
    "insert into service_change_requests(rate_id,proposed_values,reason,status) values($1,'{}','Self approval','aprobado')",
    [rate],
  );
  await denied(
    "insert into service_change_requests(rate_id,proposed_values,reason,requested_by) values($1,'{}','Spoof',$2)",
    [rate, ids.otro],
  );
  equal(
    (await rows("update ops_services set status='cancelado' returning id")).length,
    0,
    "seller cannot edit operations",
  );
  for (const table of ["ops_items", "ops_supplier_payables", "ops_communications"])
    equal(
      (await rows(`delete from ${table} returning id`)).length,
      0,
      "seller cannot delete operations children",
    );
  await denied("select public.generate_communication_plan($1,'[]')", [operations.vendedor]);
  await denied("select public.build_supplier_payables($1)", [operations.vendedor]);
  await denied("select public.approve_valid_imports(true)");
  await as("otro");
  equal(
    (await rows("select * from service_change_requests where id=$1", [suggestion])).length,
    0,
    "other seller cannot read suggestion",
  );
  for (const role of ["operacion", "admin"]) {
    await as(role);
    equal(
      (await rows("update service_rates set price_net=120 where id=$1 returning id", [rate]))
        .length,
      1,
      `${role} changes rate`,
    );
    equal(
      (
        await rows(
          "update service_change_requests set status='aprobado',approved_by=auth.uid(),reviewed_at=now() where id=$1 returning id",
          [suggestion],
        )
      ).length,
      1,
      `${role} approves suggestion`,
    );
    equal(
      (await rows("update services set status='activo' where id=$1 returning id", [service]))
        .length,
      1,
      `${role} approves service`,
    );
    equal(
      (
        await rows(
          "update ops_items set booking_status='confirmado' where service_id=$1 returning id",
          [operations.otro],
        )
      ).length,
      1,
      `${role} manages operation`,
    );
  }
  // Exercise the seller's real outbox workflow, not a direct status assignment.
  await as("vendedor");
  await db.query(
    "update quotes set calculation='{}',total_cost_usd=100,total_price_usd=125 where id=$1",
    [quotes.vendedor],
  );
  const stamp = await scalar("select updated_at from quotes where id=$1", [quotes.vendedor]);
  const path = `${quotes.vendedor}/roles.pdf`;
  await db.query("insert into storage.objects(bucket_id,name) values('quote-pdfs',$1)", [path]);
  await db.query("select public.save_quote_pdf($1,$2,$3,'https://example.invalid/pdf')", [
    quotes.vendedor,
    stamp,
    path,
  ]);
  await db.query("select public.transition_quote($1,'revisada')", [quotes.vendedor]);
  const email = await scalar(
    "select to_jsonb(public.claim_quote_email($1,'client@example.invalid','Viaje','Texto'))",
    [quotes.vendedor],
  );
  await denied("select public.finish_quote_email($1,'FORGED')", [email.id]);
  await db.exec("set role service_role");
  await db.query("select public.finish_quote_email($1,'SIMULATED')", [email.id]);
  await as("vendedor");
  equal(
    await scalar("select status from quotes where id=$1", [quotes.vendedor]),
    "enviada",
    "seller can send own quote",
  );
  await as("otro");
  equal(
    (await rows("select * from quote_emails where id=$1", [email.id])).length,
    0,
    "other seller cannot read email",
  );
  equal(
    (await rows("select * from storage.objects where name=$1", [path])).length,
    0,
    "other seller cannot download PDF",
  );
  await db.exec("reset role");
  await db.query("update auth.users set email='updated@example.invalid' where id=$1", [
    ids.operacion,
  ]);
  await as("admin");
  equal(
    (await scalar("select public.admin_list_users()")).find((u) => u.id === ids.operacion).email,
    "updated@example.invalid",
    "Admin email reflects Auth changes",
  );
  await db.exec("set role anon");
  await denied("select public.admin_list_users()");
  await denied("select * from ops_service_summary");
  console.log(
    `PASS roles: ${checks} assertions; vendedor, otro vendedor, operación, admin and anon. No remote access.`,
  );
} catch (error) {
  console.error(error.message, error.code ?? "", error.query ?? "");
  process.exitCode = 1;
} finally {
  await db.close();
}
