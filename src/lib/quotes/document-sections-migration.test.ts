// @vitest-environment node
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createDatabase } from "../../../scripts/db/local-db.mjs";
import {
  renderProposalContent,
  type DocSection,
  type ProposalContext,
} from "../../../supabase/functions/_shared/proposal";
import { plainText } from "../../../supabase/functions/_shared/proposal-html";

let pg: Awaited<ReturnType<typeof createDatabase>>;
const seller = "74000000-0000-0000-0000-000000000001";
let legacy: string, existing: string, identical: string, frozen: string, client: string;
let frozenBefore: unknown;
const original = {
  introduction: 'Intro <literal> & "comillas"\nSegunda línea',
  payment_text: "Pago pactado único",
  cancellation: "Cancelación pactada única",
  terms: "Condiciones completas guardadas",
  terms_url: "https://example.invalid/original",
  info: [
    { title: "Altitud", content: "Primer bloque" },
    { title: "Altitud", content: "Segundo bloque" },
  ],
};
async function scalar<T = string>(sql: string, args: unknown[] = []): Promise<T> {
  return Object.values((await pg.query(sql, args)).rows[0]!)[0] as T;
}
async function sections(id: string) {
  return (
    await pg.query<DocSection>(
      "select * from quote_doc_sections where quote_id=$1 order by sort,id",
      [id],
    )
  ).rows;
}
async function asSeller() {
  await pg.exec(
    `set role authenticated;select set_config('request.jwt.claim.sub','${seller}',false)`,
  );
}
async function quote(code: string, content: unknown = original, language = "es") {
  return scalar(
    "insert into quotes(code,client_id,seller_id,client_type,start_date,pax_paying,category,language,document_snapshot) values($1,$2,$3,'B2C','2027-01-01',2,'COMFORT',$4,$5) returning id",
    [code, client, seller, language, content],
  );
}
beforeAll(async () => {
  pg = await createDatabase({ throughMigration: "20261016000200_proposal_builder.sql" });
  await pg.query("insert into auth.users(id,email) values($1,'migration@test.invalid')", [seller]);
  client = await scalar("insert into clients(type,name) values('B2C','Migration') returning id");
  legacy = await quote("LEGACY-DOCUMENT");
  existing = await quote("EXISTING-BUILDER");
  frozen = await quote("FROZEN-DOCUMENT");
  identical = await quote("ALREADY-COPIED", { introduction: "Texto idéntico" });
  await asSeller();
  for (const id of [existing, frozen]) await pg.query("select ensure_quote_doc_sections($1)", [id]);
  await pg.query("select ensure_quote_doc_sections($1)", [identical]);
  const sameIntro = (await sections(identical)).find((s) => s.snapshot.code === "INTRO")!;
  await pg.query("select edit_quote_doc_section($1,'text',$2,$3)", [
    identical,
    sameIntro.id,
    { title: "Intro", body_html: "<p>Texto idéntico</p>", reviewed: true },
  ]);
  for (const code of ["INTRO", "TYC"]) {
    const section = (await sections(existing)).find((s) => s.snapshot.code === code)!;
    await pg.query("select edit_quote_doc_section($1,'text',$2,$3)", [
      existing,
      section.id,
      { title: code, body_html: `<p>Edición T13 ${code}</p>`, reviewed: true },
    ]);
    if (code === "TYC")
      await pg.query("select edit_quote_doc_section($1,'options',$2,$3)", [
        existing,
        section.id,
        { mode: "both", url: "https://example.invalid/t13" },
      ]);
  }
  await pg.exec("reset role");
  await pg.query(
    "update quotes set calculation='{}',total_price_usd=1234,price_per_pax_usd=617 where id=$1",
    [legacy],
  );
  // Historical sent fixture: no remote data or delivery; preserve its exact stored render.
  await pg.exec("alter table quotes disable trigger user");
  await pg.query(
    "update quotes set status='enviada',pdf_path='historical.pdf',pdf_url='https://example.invalid/pdf' where id=$1",
    [frozen],
  );
  await pg.exec("alter table quotes enable trigger user");
  await pg.query(
    "insert into quote_proposals(quote_id,html,sections,source_hash,lang,frozen_at,pdf_path) values($1,'<p>Enviado sin cambios</p>',$2,'old','es',now(),'historical.pdf')",
    [frozen, await sections(frozen)],
  );
  frozenBefore = await scalar("select to_jsonb(p) from quote_proposals p where quote_id=$1", [
    frozen,
  ]);
  await pg.exec(
    await readFile(
      new URL(
        "../../../supabase/migrations/20261016000300_quote_document_text_sections.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await asSeller();
}, 60_000);
afterAll(async () => pg?.close());

it("backfills every saved text, repeated info titles and T&C into editable snapshots without touching totals", async () => {
  const rows = await sections(legacy);
  const migrated = rows.filter((s) => "legacy_document_key" in s.snapshot);
  expect(migrated).toHaveLength(6);
  const bodies = migrated.map(
    (s) => s.snapshot.translations.find((t) => t.lang === "es")!.body_html,
  );
  expect(bodies).toContain(
    "<p>Intro &lt;literal&gt; &amp; &quot;comillas&quot;<br>Segunda línea</p>",
  );
  for (const text of [
    original.payment_text,
    original.cancellation,
    original.terms,
    ...original.info.map((i) => i.content),
  ])
    expect(bodies).toContain(`<p>${text}</p>`);
  expect(
    migrated
      .filter((s) => s.snapshot.code === "INFO_PRACTICA")
      .map((s) => plainText(s.snapshot.translations.find((t) => t.lang === "es")!.body_html)),
  ).toEqual(["Primer bloque", "Segundo bloque"]);
  expect(rows.find((s) => s.snapshot.code === "TYC")!.options).toEqual({
    mode: "both",
    url: original.terms_url,
  });
  expect(Number(await scalar("select total_price_usd from quotes where id=$1", [legacy]))).toBe(
    1234,
  );
  expect(await scalar("select calculation from quotes where id=$1", [legacy])).toEqual({});
  expect(await scalar("select document_snapshot from quotes where id=$1", [legacy])).toEqual({
    ...original,
    text_sections_migrated: true,
  });
  expect(
    migrated.every((s) => !s.snapshot.translations.find((t) => t.lang === "es")!.reviewed),
  ).toBe(true);
});

it("keeps T13 edits and their link while recovering legacy text beside them", async () => {
  const rows = await sections(existing);
  for (const code of ["INTRO", "TYC"]) {
    const edited = rows.find((s) => s.body_override_html === `<p>Edición T13 ${code}</p>`)!;
    expect(edited.reviewed).toBe(true);
    if (code === "TYC")
      expect(edited.options).toEqual({ mode: "both", url: "https://example.invalid/t13" });
    expect(rows.some((s) => s.snapshot.code === code && "legacy_document_key" in s.snapshot)).toBe(
      true,
    );
  }
  expect(rows.some((s) => s.options["url"] === original.terms_url)).toBe(true);
  const copies = (await sections(identical)).filter((s) => s.snapshot.code === "INTRO");
  expect(copies).toHaveLength(1);
  expect(copies[0]!.body_override_html).toBe("<p>Texto idéntico</p>");
  expect(copies[0]!.reviewed).toBe(true);
});

it("renders migrated payment/cancellation once in PDF and email; edits and hiding do not revive old text", async () => {
  const ctx = await scalar<ProposalContext>("select quote_proposal_context($1)", [legacy]);
  const pdf = renderProposalContent(ctx, { target: "pdf", lang: "es" });
  expect(renderProposalContent(ctx, { target: "email", lang: "es" }).html).toBe(pdf.html);
  expect(pdf.html.split(original.payment_text)).toHaveLength(2);
  expect(pdf.html.split(original.cancellation)).toHaveLength(2);
  const pay = ctx.sections.find((s) => s.snapshot.code === "PAGO_TEXTO")!;
  await pg.query("select edit_quote_doc_section($1,'text',$2,$3)", [
    legacy,
    pay.id,
    { title: "Pago", body_html: "<p>Pago editado</p>", reviewed: true },
  ]);
  let fresh = await scalar<ProposalContext>("select quote_proposal_context($1)", [legacy]);
  expect(renderProposalContent(fresh, { target: "pdf", lang: "es" }).html).toContain(
    "Pago editado",
  );
  expect(renderProposalContent(fresh, { target: "pdf", lang: "es" }).html).not.toContain(
    original.payment_text,
  );
  await pg.query("select edit_quote_doc_section($1,'hide',$2,$3)", [
    legacy,
    pay.id,
    { hidden: true },
  ]);
  fresh = await scalar<ProposalContext>("select quote_proposal_context($1)", [legacy]);
  expect(renderProposalContent(fresh, { target: "pdf", lang: "es" }).html).not.toMatch(
    /Pago editado|Pago pactado único/,
  );
  expect(await scalar("select calculation from quotes where id=$1", [legacy])).toEqual({});
});

it("does not duplicate or resurrect recovered text after reopen, deletion or replacing a layout", async () => {
  const before = await sections(existing);
  await pg.query("select ensure_quote_doc_sections($1)", [existing]);
  expect(await sections(existing)).toEqual(before);
  const info = before.find((s) => s.snapshot.code === "INFO_PRACTICA")!;
  await pg.query("select edit_quote_doc_section($1,'remove',$2)", [existing, info.id]);
  await pg.query("select ensure_quote_doc_sections($1)", [existing]);
  expect((await sections(existing)).some((s) => s.id === info.id)).toBe(false);
  const layout = await scalar("select id from doc_layouts where channel='b2c' and is_default");
  await pg.query("select ensure_quote_doc_sections($1,$2)", [existing, layout]);
  expect((await sections(existing)).some((s) => "legacy_document_key" in s.snapshot)).toBe(false);
});

it("preserves the sent render and migrates only its new draft version", async () => {
  expect(
    await scalar("select to_jsonb(p) from quote_proposals p where quote_id=$1", [frozen]),
  ).toEqual(frozenBefore);
  expect(await scalar("select document_snapshot from quotes where id=$1", [frozen])).toEqual(
    original,
  );
  expect((await sections(frozen)).some((s) => "legacy_document_key" in s.snapshot)).toBe(false);
  const next = await scalar("select version_quote($1)", [frozen]);
  expect((await sections(next)).filter((s) => "legacy_document_key" in s.snapshot)).toHaveLength(6);
  expect(
    await scalar("select to_jsonb(p) from quote_proposals p where quote_id=$1", [frozen]),
  ).toEqual(frozenBefore);
});

it("initializes future quotes in their language and restores migrated text from its snapshot", async () => {
  const id = await quote(
    "NEW-ITALIAN",
    { introduction: "Testo italiano", info: [{ title: "Informazioni", content: "Testo pratico" }] },
    "it",
  );
  await pg.query("select ensure_quote_doc_sections($1)", [id]);
  const intro = (await sections(id)).find((s) => s.snapshot.code === "INTRO")!;
  expect(intro.snapshot.translations.find((t) => t.lang === "it")!.body_html).toBe(
    "<p>Testo italiano</p>",
  );
  await pg.query("select edit_quote_doc_section($1,'text',$2,$3)", [
    id,
    intro.id,
    { title: "Modifica", body_html: "<p>Nuovo</p>", reviewed: true },
  ]);
  await pg.query("select edit_quote_doc_section($1,'reset',$2)", [id, intro.id]);
  expect((await sections(id)).find((s) => s.id === intro.id)!.snapshot).toEqual(intro.snapshot);
});

it.each([
  null,
  {},
  [null],
  ["text"],
  [[]],
  [{ title: "a", content: "b", extra: true }],
  [{ title: "", content: "b" }],
  [{ title: "a", content: null }],
])("rejects malformed info without a SQL type error: %j", async (info) => {
  expect(await scalar("select validate_quote_document_patch($1)", [{ info }])).toBe(false);
});

it("accepts an empty info array and denies direct access to migration helpers", async () => {
  expect(await scalar("select validate_quote_document_patch($1)", [{ info: [] }])).toBe(true);
  await expect(pg.query("select _migrate_quote_document_texts($1)", [legacy])).rejects.toThrow(
    /permission denied/,
  );
});
