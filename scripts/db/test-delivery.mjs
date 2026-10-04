import assert from "node:assert/strict";
import { createDatabase, seedDatabase } from "./local-db.mjs";
const db = await createDatabase();
const scalar = async (sql, args = []) =>
  Object.values((await db.query(sql, args)).rows[0] || {})[0];
const seller = "00000000-0000-0000-0000-000000000001";
try {
  await seedDatabase(db);
  await db.exec(
    `insert into auth.users(id,email)values('${seller}','seller@test.invalid');set role authenticated;select set_config('request.jwt.claim.sub','${seller}',false)`,
  );
  const cid = await scalar("insert into clients(type,name)values('B2C','Client')returning id");
  const q = await scalar(
    "insert into quotes(code,client_id,client_type,start_date,pax_paying,category)values('EMAIL-TEST',$1,'B2C','2027-01-01',2,'COMFORT')returning id",
    [cid],
  );
  await db.query(
    "insert into quote_days(quote_id,day_number,date,title,snapshot)values($1,1,'2027-01-01','Day','{\"reviewed\":true}')",
    [q],
  );
  await db.query(
    "update quotes set calculation='{}',total_cost_usd=100,total_price_usd=120 where id=$1",
    [q],
  );
  const stamp = await scalar("select updated_at from quotes where id=$1", [q]);
  const path = q + "/test.pdf";
  await db.query("insert into storage.objects(bucket_id,name)values('quote-pdfs',$1)", [path]);
  await assert.rejects(
    () =>
      db.query(
        "insert into storage.objects(bucket_id,name)values('quote-pdfs','someone-else/test.pdf')",
      ),
    /row-level/,
  );
  await db.query("select public.save_quote_pdf($1,$2,$3,$4)", [
    q,
    stamp,
    path,
    "https://example.invalid/signed",
  ]);
  assert.notEqual(await scalar("select calculation from quotes where id=$1", [q]), null);
  await db.query("select public.transition_quote($1,'revisada')", [q]);
  const payload = [q, "client@example.invalid", "Your trip", "Localized body"];
  const email = await scalar("select to_jsonb(public.claim_quote_email($1,$2,$3,$4))", payload);
  const retry = await scalar("select to_jsonb(public.claim_quote_email($1,$2,$3,$4))", payload);
  assert.equal(retry.id, email.id);
  await assert.rejects(
    () =>
      db.query("select public.claim_quote_email($1,$2,$3,$4)", [
        q,
        "changed@example.invalid",
        "Your trip",
        "Localized body",
      ]),
    /original email/,
  );
  await assert.rejects(
    () => db.query("update quotes set margin_pct=50 where id=$1", [q]),
    /pending/,
  );
  await assert.rejects(
    () => db.query("select public.finish_quote_email($1,$2)", [email.id, "receipt"]),
    /permission denied/,
  );
  await db.exec("set role service_role");
  await db.query("select public.finish_quote_email($1,$2)", [email.id, "receipt"]);
  await db.query("select public.finish_quote_email($1,$2)", [email.id, "receipt"]);
  await db.exec("set role authenticated");
  assert.equal(await scalar("select status from quotes where id=$1", [q]), "enviada");
  assert.equal(
    await scalar(
      "select count(*)::int from quote_status_history where new_status='enviada' and quote_id=$1",
      [q],
    ),
    1,
  );
  assert.equal(await scalar("select status from quote_emails where id=$1", [email.id]), "enviado");
  assert.equal(await scalar("select count(*)::int from storage.objects"), 1);
  await db.exec("set role service_role");
  const due = await scalar("select public.due_followups()");
  assert.equal(due.length, 0);
  console.log(
    "PASS delivery: private Storage, PDF freshness, immutable outbox, safe retry, service-only completion",
  );
} catch (e) {
  console.error(e.message, e.detail || "");
  process.exitCode = 1;
} finally {
  await db.close();
}
