// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createDatabase } from "../../../scripts/db/local-db.mjs";
import {
  seedLargeCatalog,
  catalogOtherSeller,
  catalogSeller,
} from "../../../tests/fixtures/large-catalog.mjs";
import { pgliteSupabase } from "../../test/pglite-supabase";
import type { QuoteResult } from "../pricing";
import { readFile } from "node:fs/promises";
import { renderToBuffer } from "@react-pdf/renderer";
import { ProposalDocument } from "../pdf/proposal-document";
import {
  renderProposalContent,
  type ProposalContext,
} from "../../../supabase/functions/_shared/proposal";

const transport = vi.hoisted(() => ({ client: null as ReturnType<typeof pgliteSupabase> | null }));
vi.mock("../db", () => ({
  db: {
    from: (...args: Parameters<ReturnType<typeof pgliteSupabase>["from"]>) =>
      transport.client!.from(...args),
    rpc: (...args: Parameters<ReturnType<typeof pgliteSupabase>["rpc"]>) =>
      transport.client!.rpc(...args),
  },
  json: (value: unknown) => JSON.parse(JSON.stringify(value)),
  unwrap: ({ data, error }: { data: unknown; error: { message: string } | null }) => {
    if (error) throw new Error(error.message);
    if (data == null) throw new Error("Record not found or inaccessible");
    return data;
  },
}));
import { createQuoteFromTemplate, loadQuote, recalculateQuote, updateQuoteItem } from "./index";
import { addBlockDay, addBlockDays, resolveDay, reviewQuoteDays } from "./days";
import { transitionQuote } from "../states";

let pg: Awaited<ReturnType<typeof createDatabase>>;
let catalog: { template_id: string; client_id: string; block_ids: string[] };
const basics = () => ({
  client_id: catalog.client_id,
  language: "es",
  start_date: "2026-11-04",
  pax_paying: 2,
});
beforeAll(async () => {
  pg = await createDatabase();
  catalog = await seedLargeCatalog(pg);
  transport.client = pgliteSupabase(pg);
}, 60000);
afterAll(async () => pg?.close());

describe("T01s · catálogo realista con RLS de vendedor", () => {
  it("creates a pending template, appends four blocks under 2 s and keeps the calculated total on reload", async () => {
    const counts = (
      await pg.query<{ services: number; rates: number; blocks: number }>(`select
      (select count(*)::int from services) services,(select count(*)::int from service_rates) rates,
      (select count(*)::int from day_blocks) blocks`)
    ).rows[0]!;
    expect(counts.services).toBeGreaterThanOrEqual(300);
    expect(counts.rates).toBeGreaterThanOrEqual(1000);
    expect(counts.blocks).toBeGreaterThanOrEqual(100);
    const q = await createQuoteFromTemplate(catalog.template_id, basics());
    expect(q.status).toBe("borrador");
    expect((q.calculation as unknown as QuoteResult).status).toBe("ok");
    const before = performance.now();
    const result = await addBlockDays(q.id, catalog.block_ids.slice(4, 8));
    const elapsed = performance.now() - before;
    console.info(
      `T01s addBlockDays(4), 360 servicios / 1440 tarifas / 120 bloques: ${elapsed.toFixed(1)} ms`,
    );
    expect(elapsed).toBeLessThan(2000);
    const saved = await loadQuote(q.id);
    expect(saved.days).toHaveLength(8);
    expect(result.calculation.status).toBe("ok");
    expect(result.calculation.total_price_usd).toBeGreaterThan(q.total_price_usd!);
    expect(saved.quote.calculation).toEqual(result.calculation);
    expect(saved.quote.total_price_usd).toBe(result.calculation.total_price_usd);
  }, 30000);

  it("creates SPASPA on 04-11-2026 / 2 pax with an expired rate and recovers through Precio manual", async () => {
    await pg.exec("reset role");
    const original = (
      await pg.query(
        "select id,valid_from,valid_to from service_rates where service_id=md5('large-service-1')::uuid",
      )
    ).rows;
    let quoteId: string;
    try {
      await pg.exec(
        "update service_rates set valid_from='2025-01-01',valid_to='2025-12-31' where service_id=md5('large-service-1')::uuid; set role authenticated",
      );
      const q = await createQuoteFromTemplate(catalog.template_id, basics());
      quoteId = q.id;
      expect(q.status).toBe("borrador");
      expect(q.total_price_usd).toBeNull();
      const calculation = q.calculation as unknown as QuoteResult;
      expect(calculation.status).toBe("error");
      expect(calculation.items.find((i) => i.status === "error")!.warning).toContain(
        "Día 1 · CAT-001: sin tarifa para 04-11-2026 y 2 pax",
      );
      const saved = await loadQuote(q.id);
      const line = saved.items.find((i) => i.sku === "CAT-001")!;
      expect(line.total_cost_usd).toBeNull();
      expect(calculation.items.find((i) => i.status === "error")!.id).toBe(line.id);
      await updateQuoteItem(line.id, {
        price_overridden: true,
        unit_cost_original: 50,
        override_note: "Proveedor confirmó precio",
      });
      expect((await recalculateQuote(q.id)).status).toBe("ok");
    } finally {
      await pg.exec("reset role");
      await pg.query(
        `update service_rates r set valid_from=x.valid_from,valid_to=x.valid_to
        from jsonb_to_recordset($1) x(id uuid,valid_from date,valid_to date) where r.id=x.id`,
        [JSON.stringify(original)],
      );
      await pg.exec("set role authenticated");
    }
    expect((await loadQuote(quoteId!)).quote.total_price_usd).toBeGreaterThan(0);
  }, 30000);

  it("runs template → four blocks → reviewed text → real PDF through the proposal builder", async () => {
    const q = await createQuoteFromTemplate(catalog.template_id, basics());
    await addBlockDays(q.id, catalog.block_ids.slice(4, 8));
    await reviewQuoteDays(q.id);
    await pg.query("select ensure_quote_doc_sections($1)", [q.id]);
    const { rows: sections } = await pg.query<{
      id: string;
      snapshot: { kind: string; code: string; data_key: string | null };
    }>("select id,snapshot from quote_doc_sections where quote_id=$1", [q.id]);
    for (const section of sections.filter((s) => s.snapshot.kind === "static"))
      await pg.query("select edit_quote_doc_section($1,'text',$2,$3)", [
        q.id,
        section.id,
        {
          title: section.snapshot.code,
          body_html: "<p>Texto revisado de prueba.</p>",
          reviewed: true,
        },
      ]);
    await pg.query("select edit_quote_doc_section($1,'options',$2,$3)", [
      q.id,
      sections.find((s) => s.snapshot.code === "TYC")!.id,
      { mode: "full" },
    ]);
    await pg.query("select edit_quote_doc_section($1,'options',$2,$3)", [
      q.id,
      sections.find((s) => s.snapshot.data_key === "validez")!.id,
      { valid_until: "2026-11-01T18:00:00Z" },
    ]);
    const context = (
      await pg.query<{ ctx: ProposalContext & { source_hash: string } }>(
        "select quote_proposal_context($1) ctx",
        [q.id],
      )
    ).rows[0]!.ctx;
    const proposal = renderProposalContent(context, { target: "pdf", lang: "es" });
    expect(proposal.avisos.filter((a) => a.level === "error")).toEqual([]);
    expect(proposal.html).toContain("Día 3 en");
    const bytes = await renderToBuffer(ProposalDocument({ html: proposal.html }));
    expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
    expect(bytes.length).toBeGreaterThan(1500);
    // Only the Edge service may persist its trusted render. Model that boundary
    // with the local database owner, then return to seller RLS for saving the PDF.
    await pg.exec("reset role");
    try {
      await pg.query("select store_rendered_proposal($1,$2,'es',$3)", [
        q.id,
        context.source_hash,
        proposal.html,
      ]);
    } finally {
      await pg.exec("set role authenticated");
    }
    const saved = await loadQuote(q.id);
    const path = `${q.id}/${crypto.randomUUID()}.pdf`;
    await pg.query("insert into storage.objects(bucket_id,name) values('quote-pdfs',$1)", [path]);
    await pg.query("select save_quote_pdf($1,$2,$3,$4)", [
      q.id,
      saved.quote.updated_at,
      path,
      `https://example.invalid/${path}`,
    ]);
    expect((await loadQuote(q.id)).quote.pdf_path).toBe(path);
    await expect(pg.query("select transition_quote($1,'revisada')", [q.id])).resolves.toBeDefined();
  }, 30000);

  it("invalidates once per statement and preserves old day rows during append", async () => {
    const q = await createQuoteFromTemplate(catalog.template_id, basics());
    const before = await loadQuote(q.id);
    await pg.exec(`reset role;
      create table t01s_quote_update_log(quote_id uuid);
      create function t01s_log_quote_update() returns trigger language plpgsql security definer set search_path='' as $$
        begin insert into public.t01s_quote_update_log values(new.id); return new; end $$;
      create trigger t01s_log_update after update on quotes for each row execute function t01s_log_quote_update();
      grant select on t01s_quote_update_log to authenticated;
      set role authenticated;`);
    try {
      await addBlockDays(q.id, catalog.block_ids.slice(4, 8));
      expect(
        (
          await pg.query<{ count: number }>(
            "select count(*)::int from t01s_quote_update_log where quote_id=$1",
            [q.id],
          )
        ).rows[0]!.count,
      ).toBe(2);
      const saved = await loadQuote(q.id);
      expect(saved.days.slice(0, 4)).toEqual(before.days);
      await pg.query("update quote_days set title=title || ' editado' where quote_id=$1", [q.id]);
      const first = (await loadQuote(q.id)).quote;
      expect(first.calculation).toBeNull();
      await pg.query("update quote_days set title=title || ' otra vez' where quote_id=$1", [q.id]);
      expect((await loadQuote(q.id)).quote.updated_at).not.toBe(first.updated_at);
    } finally {
      await pg.exec(
        "reset role; drop trigger t01s_log_update on quotes; drop function t01s_log_quote_update(); drop table t01s_quote_update_log; set role authenticated",
      );
    }
  }, 30000);

  it("the production diagnostic executes entirely in a read-only transaction", async () => {
    const sql = await readFile(
      new URL("../../../docs/consultas/diagnostico_timeout.sql", import.meta.url),
      "utf8",
    );
    await pg.exec("reset role");
    try {
      await pg.exec(sql);
    } finally {
      await pg.exec("rollback; set role authenticated");
      await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [catalogSeller]);
    }
  });

  it("uses EN, IT and block code without inventing reviewed Spanish, including module fallback", async () => {
    const q = await createQuoteFromTemplate(catalog.template_id, basics());
    let data = await loadQuote(q.id);
    expect(data.days[2]!.snapshot).toMatchObject({ reviewed: false, source_language: "en" });
    expect(resolveDay(data.days[2]!).title?.["es"]).toBe("Día 3 en");
    expect(resolveDay(data.days[3]!).description?.["es"]).toContain("Module description 1");
    expect(data.days[3]!.snapshot).toMatchObject({ reviewed: false });
    await addBlockDays(q.id, [catalog.block_ids[4]!, catalog.block_ids[9]!]);
    data = await loadQuote(q.id);
    expect(resolveDay(data.days[4]!).title?.["es"]).toBe("Día 5 it");
    expect(resolveDay(data.days[5]!).title?.["es"]).toBe("CAT-DAY-010");
    expect(
      data.days.slice(4).every((d) => (d.snapshot as { reviewed: boolean }).reviewed === false),
    ).toBe(true);
    await expect(transitionQuote(q.id, "revisada")).rejects.toThrow("Faltan revisar");
  }, 30000);

  it("saves expired rates as a recoverable error through single and multiple block insertion", async () => {
    const q = await createQuoteFromTemplate(catalog.template_id, basics());
    const result = await addBlockDay(q.id, catalog.block_ids[42]!);
    expect(result.calculation.status).toBe("error");
    expect(result.calculation.total_price_usd).toBeNull();
    const saved = await loadQuote(q.id);
    const failed = result.calculation.items.find((i) => i.status === "error")!;
    expect(failed.rate_error).toMatchObject({
      code: "missing",
      day: 5,
      date: "2026-11-08",
      pax: 2,
    });
    expect(failed.warning).toContain("CAT-");
    expect(failed.warning).not.toContain(failed.id);
    expect(saved.items.find((i) => i.id === failed.id)!.total_cost_usd).toBeNull();
    await reviewQuoteDays(q.id);
    await expect(transitionQuote(q.id, "revisada")).rejects.toThrow(/errores|errors/i);
    const path = `${q.id}/${crypto.randomUUID()}.pdf`;
    await pg.query("insert into storage.objects(bucket_id,name) values('quote-pdfs',$1)", [path]);
    await expect(
      pg.query("select save_quote_pdf($1,$2,$3,'https://example.invalid/test.pdf')", [
        q.id,
        (await loadQuote(q.id)).quote.updated_at,
        path,
      ]),
    ).rejects.toThrow("Cotización con errores de cálculo");
    for (const line of result.calculation.items.filter((i) => i.status === "error"))
      await updateQuoteItem(line.id, {
        price_overridden: true,
        unit_cost_original: 50,
        override_note: "Tarifa confirmada para esta cotización",
      });
    expect((await recalculateQuote(q.id)).status).toBe("ok");
    const again = await addBlockDays(q.id, [catalog.block_ids[43]!, catalog.block_ids[44]!]);
    expect(again.calculation.status).toBe("error");
    expect((await loadQuote(q.id)).days).toHaveLength(7);
  }, 30000);

  it("still denies another seller's pending template", async () => {
    await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [catalogOtherSeller]);
    try {
      await expect(createQuoteFromTemplate(catalog.template_id, basics())).rejects.toThrow();
    } finally {
      await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [catalogSeller]);
    }
  });
});
