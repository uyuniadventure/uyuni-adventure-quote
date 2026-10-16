import assert from "node:assert/strict";
import { createDatabase } from "./local-db.mjs";
const db = await createDatabase();
const scalar = async (sql, args = []) =>
  Object.values((await db.query(sql, args)).rows[0] ?? {})[0];
const seller = "00000000-0000-0000-0000-000000000001";
const other = "00000000-0000-0000-0000-000000000002";
const adminId = "00000000-0000-0000-0000-000000000003";
const as = async (id) =>
  db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${id}',false)`);
let checks = 0;
const check = (actual, expected) => {
  assert.deepEqual(actual, expected);
  checks++;
};
const reject = async (fn, regex) => {
  await assert.rejects(fn, regex);
  checks++;
};
try {
  await db.exec(
    `insert into auth.users(id,email) values('${seller}','seller@test.invalid'),('${other}','other@test.invalid'),('${adminId}','admin@test.invalid');update profiles set role='admin' where id='${adminId}';`,
  );
  await as(seller);
  const cid = await scalar("insert into clients(type,name) values('B2C','Prueba') returning id");
  const q = await scalar(
    "insert into quotes(code,client_id,client_type,start_date,pax_paying,category) values('PROPOSAL-TEST',$1,'B2C','2027-01-20',2,'COMFORT') returning id",
    [cid],
  );
  await db.query(
    "insert into quote_days(quote_id,day_number,date,title,snapshot) values($1,1,'2027-01-20','Día','{\"reviewed\":true}')",
    [q],
  );
  await db.query(
    "update quotes set calculation='{}',total_cost_usd=100,total_price_usd=1000,price_per_pax_usd=500 where id=$1",
    [q],
  );
  await db.query("select ensure_quote_doc_sections($1)", [q]);
  const rows = (
    await db.query("select * from quote_doc_sections where quote_id=$1 order by sort", [q])
  ).rows;
  check(rows.length, 12);
  check(await scalar("select calculation from quotes where id=$1", [q]), {});
  await db.query("select ensure_quote_doc_sections($1)", [q]);
  check(await scalar("select count(*)::int from quote_doc_sections where quote_id=$1", [q]), 12);
  const tyc = rows.find((s) => s.snapshot.code === "TYC");
  const intro = rows.find((s) => s.snapshot.code === "INTRO");
  for (const action of ["hide", "remove"])
    await reject(
      () =>
        db.query("select edit_quote_doc_section($1,$2,$3,$4)", [
          q,
          action,
          tyc.id,
          { hidden: true },
        ]),
      /obligatoria/,
    );
  await db.query("select edit_quote_doc_section($1,'text',$2,$3)", [
    q,
    tyc.id,
    { title: "Mis términos", body_html: "<p>Condiciones de la cotización.</p>", reviewed: true },
  ]);
  check(await scalar("select reviewed from quote_doc_sections where id=$1", [tyc.id]), true);
  await reject(
    () =>
      db.query("select edit_quote_doc_section($1,'text',$2,$3)", [
        q,
        tyc.id,
        { title: "mal", body_html: '<p onclick="alert(1)">mal</p>' },
      ]),
    /no permitido/,
  );
  await reject(
    () => db.query("update quote_doc_sections set hidden=true where id=$1", [tyc.id]),
    /permission denied/,
  );
  await reject(
    () => db.query("insert into doc_blocks(code,kind) values('VENDEDOR','static')"),
    /row-level/,
  );
  const saved = await scalar("select save_doc_section_as_block($1,$2,$3)", [
    q,
    tyc.id,
    "TYC_NUEVO",
  ]);
  check(await scalar("select status from doc_blocks where id=$1", [saved]), "pendiente");
  await as(other);
  check(await scalar("select count(*)::int from quote_doc_sections where quote_id=$1", [q]), 0);
  await reject(() => db.query("select quote_proposal_context($1)", [q]), /permiso/);
  await reject(
    () => db.query("select edit_quote_doc_section($1,'reset',$2)", [q, tyc.id]),
    /permiso/,
  );
  await as(adminId);
  await db.query(
    "update doc_block_translations set body_html='<p>CAMBIO BIBLIOTECA</p>',reviewed=true where block_id=$1 and lang='es'",
    [intro.block_id],
  );
  await as(seller);
  check(
    await scalar(
      "select snapshot->'translations'->0->>'body_html' from quote_doc_sections where id=$1",
      [intro.id],
    ),
    "",
  );
  const reverse = rows.map((s) => s.id).reverse();
  await db.query("select edit_quote_doc_section($1,'reorder',null,$2)", [q, { ids: reverse }]);
  check(
    (
      await db.query("select id from quote_doc_sections where quote_id=$1 order by sort", [q])
    ).rows.map((s) => s.id),
    reverse,
  );
  await reject(
    () =>
      db.query("select edit_quote_doc_section($1,'reorder',null,$2)", [
        q,
        { ids: [tyc.id, tyc.id] },
      ]),
    /lista/,
  );
  const context = await scalar("select quote_proposal_context($1)", [q]);
  check(context.payments.deposit_required_usd, 300);
  await reject(
    () =>
      db.query("select store_rendered_proposal($1,$2,$3,$4)", [
        q,
        context.source_hash,
        "es",
        "<p>Propuesta</p>",
      ]),
    /permission denied/,
  );
  await db.exec("set role service_role");
  await reject(
    () =>
      db.query("select store_rendered_proposal($1,$2,$3,$4)", [
        q,
        "stale",
        "es",
        "<p>Propuesta</p>",
      ]),
    /cambió/,
  );
  await db.query("select store_rendered_proposal($1,$2,$3,$4)", [
    q,
    context.source_hash,
    "es",
    "<p>Propuesta</p>",
  ]);
  await as(seller);
  // An edit removes the prepared document and only the PDF, not the saved calculation.
  await db.query("select edit_quote_doc_section($1,'reset',$2)", [q, intro.id]);
  check(await scalar("select count(*)::int from quote_proposals where quote_id=$1", [q]), 0);
  check(await scalar("select calculation from quotes where id=$1", [q]), {});
  await reject(() => db.query("select transition_quote($1,'revisada')", [q]), /prepara/);
  const fresh = await scalar("select quote_proposal_context($1)", [q]);
  await db.exec("set role service_role");
  await db.query("select store_rendered_proposal($1,$2,$3,$4)", [
    q,
    fresh.source_hash,
    "es",
    "<p>Propuesta</p>",
  ]);
  await as(seller);
  const path = `${q}/proposal.pdf`;
  await db.query("insert into storage.objects(bucket_id,name)values('quote-pdfs',$1)", [path]);
  await db.query("select save_quote_pdf($1,$2,$3,$4)", [
    q,
    await scalar("select updated_at from quotes where id=$1", [q]),
    path,
    "https://example.invalid/pdf",
  ]);
  check(await scalar("select pdf_path from quote_proposals where quote_id=$1", [q]), path);
  await db.exec("set role service_role");
  await db.query("select store_rendered_proposal($1,$2,$3,$4)", [
    q,
    fresh.source_hash,
    "es",
    "<p>Propuesta</p>",
  ]);
  await as(seller);
  check(await scalar("select pdf_path from quote_proposals where quote_id=$1", [q]), path);
  await db.query("select transition_quote($1,'revisada')", [q]);
  await reject(
    () => db.query("select edit_quote_doc_section($1,'reset',$2)", [q, intro.id]),
    /borrador/,
  );
  await reject(
    () =>
      db.query("select claim_quote_email($1,$2,$3,$4)", [
        q,
        "client@test.invalid",
        "Propuesta",
        "<p>OTRO CONTENIDO</p>",
      ]),
    /correo y el PDF/,
  );
  const payload = [q, "client@test.invalid", "Propuesta", "<p>Propuesta</p>"];
  const outbox = await scalar("select to_jsonb(claim_quote_email($1,$2,$3,$4))", payload);
  const retry = await scalar("select to_jsonb(claim_quote_email($1,$2,$3,$4))", payload);
  check(outbox.id, retry.id);
  assert.ok(await scalar("select frozen_at from quote_proposals where quote_id=$1", [q]));
  checks++;
  await db.exec("set role service_role");
  await db.query("select finish_quote_email($1,$2)", [outbox.id, "provider-receipt"]);
  await as(seller);
  check(await scalar("select status from quotes where id=$1", [q]), "enviada");
  const next = await scalar("select version_quote($1)", [q]);
  check(await scalar("select count(*)::int from quote_doc_sections where quote_id=$1", [next]), 12);
  check(await scalar("select count(*)::int from quote_proposals where quote_id=$1", [next]), 0);
  check(
    await scalar(
      "select body_override_html from quote_doc_sections where quote_id=$1 and block_id=$2",
      [next, tyc.block_id],
    ),
    "<p>Condiciones de la cotización.</p>",
  );
  await db.query(
    "select edit_quote_doc_section($1,'text',(select id from quote_doc_sections where quote_id=$1 and block_id=$2),$3)",
    [next, tyc.block_id, { title: "Nueva versión", body_html: "<p>Nuevo</p>", reviewed: true }],
  );
  check((await scalar("select quote_proposal_context($1)", [q])).frozen.html, "<p>Propuesta</p>");
  console.log(
    `PASS proposals: ${checks} assertions (RLS, D6, snapshots, sanitization, stale render, PDF/email identity, freeze, retry, versions)`,
  );
} catch (e) {
  console.error(e.message, e.detail ?? "", e.where ?? "");
  process.exitCode = 1;
} finally {
  await db.close();
}
