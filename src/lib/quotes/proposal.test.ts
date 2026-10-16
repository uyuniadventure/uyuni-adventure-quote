import { proposalFixture } from "../../test/proposal-fixture";
// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  renderProposalContent,
  PROPOSAL_VARIABLES,
} from "../../../supabase/functions/_shared/proposal";
import { sanitizeProposalHtml, plainText } from "../../../supabase/functions/_shared/proposal-html";

describe("constructor de propuesta", () => {
  it("PDF y email usan el orden visible y los mismos datos de T01d", () => {
    const ctx = proposalFixture();
    ctx.sections[0]!.sort = 10;
    ctx.sections[2]!.sort = 0;
    ctx.sections.push({
      ...ctx.sections[0]!,
      id: "hidden",
      hidden: true,
      snapshot: {
        ...ctx.sections[0]!.snapshot,
        code: "HIDDEN",
        translations: [{ lang: "es", title: "No mostrar", body_html: "OCULTO", reviewed: true }],
      },
    });
    const pdf = renderProposalContent(ctx, { target: "pdf", lang: "es" });
    const email = renderProposalContent(ctx, { target: "email", lang: "es" });
    expect(pdf.avisos).toEqual([]);
    expect(pdf.html).toBe(email.html);
    expect(pdf.html.indexOf("Precio y condiciones")).toBeLessThan(pdf.html.indexOf("Itinerario"));
    expect(pdf.html.indexOf("Itinerario")).toBeLessThan(pdf.html.indexOf("Hola"));
    expect(pdf.html).toContain("Texto propio T01d");
    expect(pdf.html).not.toContain("OCULTO");
  });
  it("resuelve la lista cerrada de variables con escape de HTML y bloquea nombres internos", () => {
    const ctx = proposalFixture();
    ctx.quote.document_snapshot.client_name = "<img src=x onerror=bad()>";
    ctx.sections[0]!.snapshot.translations[0]!.body_html = `<p>${PROPOSAL_VARIABLES.map((v) => `{{${v}}}`).join(" / ")}</p><p>{{costo}} {{constructor}} {{toString}}</p>`;
    const result = renderProposalContent(ctx, { target: "email", lang: "es" });
    expect(result.html).toContain("&lt;img");
    expect(result.html).not.toContain("<img");
    expect(result.avisos.filter((n) => n.code === "variable")).toHaveLength(3);
    expect(result.html).toContain("USD 850.00");
    expect(result.html).toContain("2027-01-15");
  });
  it.each([
    '<script>alert(1)</script><p onclick="evil()">Sí</p>',
    '<svg><a href="javascript:evil()">mal</a></svg><iframe srcdoc="evil"/>',
    '<a href="jav&#x61;script:evil()">mal</a><img src="https://evil.invalid">',
    '<math><mtext><table><mglyph><style><!--</style><img title="--><img src=1 onerror=evil()>">',
  ])("sanitiza HTML5 hostil: %s", (html) => {
    const result = sanitizeProposalHtml(html);
    expect(result).not.toMatch(
      /<(script|svg|iframe|img|math)|onclick=|onerror=|href="javascript:/i,
    );
    expect(sanitizeProposalHtml(result)).toBe(result);
  });
  it("conserva formato permitido y elimina estilos y atributos ajenos", () => {
    expect(
      sanitizeProposalHtml(
        '<div style="color:red"><b>Hola</b><i>mundo</i><u>sí</u></div><p class="align-center" onclick="x()">Centro</p><a href="https://example.invalid/?a=1&amp;b=2" target="_blank">Ir</a>',
      ),
    ).toBe(
      '<p><strong>Hola</strong><em>mundo</em><u>sí</u></p><p class="align-center">Centro</p><a href="https://example.invalid/?a=1&amp;b=2">Ir</a>',
    );
  });
  it("TYC es obligatorio; permite enlace, texto o ambos", () => {
    const ctx = proposalFixture();
    const tyc = ctx.sections[3]!;
    tyc.options = { mode: "link", url: "https://example.invalid/terms" };
    tyc.snapshot.translations = [];
    expect(renderProposalContent(ctx, { target: "pdf", lang: "es" }).avisos).toEqual([]);
    tyc.hidden = true;
    expect(renderProposalContent(ctx, { target: "pdf", lang: "es" }).avisos).toContainEqual(
      expect.objectContaining({ code: "required" }),
    );
    tyc.hidden = false;
    tyc.options = { mode: "both", url: "javascript:alert(1)" };
    const errors = renderProposalContent(ctx, { target: "pdf", lang: "es" }).avisos;
    expect(errors.map((n) => n.code)).toEqual(
      expect.arrayContaining(["review", "empty", "terms_link"]),
    );
  });
  it("bloquea textos visibles sin revisar y sin traducción en el idioma de la cotización", () => {
    const ctx = proposalFixture();
    ctx.quote.language = "it";
    expect(
      renderProposalContent(ctx, { target: "pdf", lang: "it" }).avisos.map((n) => n.code),
    ).toContain("review");
    ctx.quote.language = "es";
    ctx.days[0]!.snapshot = { reviewed: false };
    expect(
      renderProposalContent(ctx, { target: "pdf", lang: "es" }).avisos.map((n) => n.code),
    ).toContain("days_review");
  });
  it("edición local y restauración usan el snapshot, sin biblioteca viva", () => {
    const ctx = proposalFixture();
    const s = ctx.sections[0]!;
    s.override_lang = "es";
    s.title_override = "Propio";
    s.body_override_html = "<p>Editado</p>";
    s.reviewed = true;
    expect(renderProposalContent(ctx, { target: "pdf", lang: "es" }).html).toContain("Editado");
    s.body_override_html = null;
    s.title_override = null;
    expect(renderProposalContent(ctx, { target: "pdf", lang: "es" }).html).toContain(
      "Hola Cliente",
    );
  });
  it("B2B exporta los tramos guardados sin costos, márgenes ni ajustes", () => {
    const ctx = proposalFixture("B2B");
    ctx.items[0]!.type = "alojamiento";
    ctx.items[0]!.room_distribution = { DBL: 2, total_cost_usd: "SECRET_ROOM_COST" };
    for (const [code, key] of [
      ["HOTELES", "hoteles"],
      ["INCLUYE", "incluye"],
    ])
      ctx.sections.push({
        ...ctx.sections[1]!,
        id: code!,
        sort: 8,
        snapshot: { ...ctx.sections[1]!.snapshot, code: code!, data_key: key! },
      });
    const result = renderProposalContent(ctx, { target: "pdf", lang: "es" });
    expect(result.html).toContain("2 DBL");
    expect(result.html).toContain("Servicio para viajeros");
    expect(result.html).toContain("USD 1600.00");
    expect(result.html).toContain("Total neto agencia");
    expect(result.html).not.toMatch(/SECRET_|INTERNAL_|total_cost|margin|adjustment/);
    ctx.quote.calculation!.scenarios![0]!.total_price_usd = null;
    expect(
      renderProposalContent(ctx, { target: "pdf", lang: "es" }).avisos.map((n) => n.code),
    ).toContain("tiers");
  });
  it("la copia enviada no cambia con datos, pagos o idioma posteriores", () => {
    const ctx = proposalFixture();
    const before = renderProposalContent(ctx, { target: "pdf", lang: "es" });
    ctx.frozen = { html: before.html, lang: "es", frozen_at: "2026-10-16" };
    ctx.quote.total_price_usd = 99999;
    ctx.payments.paid_usd = 990;
    ctx.sections = [];
    expect(renderProposalContent(ctx, { target: "email", lang: "en" })).toMatchObject({
      html: before.html,
      avisos: [],
      frozen: true,
    });
  });
  it("solo inserta imágenes resueltas desde Media; rechaza URL remota", () => {
    const ctx = proposalFixture();
    ctx.sections[0]!.options = { media_ids: ["photo"] };
    ctx.media = { photo: { data: "https://evil.invalid/image.png", label: "mal" } };
    expect(
      renderProposalContent(ctx, { target: "pdf", lang: "es" }).avisos.map((n) => n.code),
    ).toContain("media");
    ctx.media["photo"] = { data: "data:image/png;base64,AAAA", label: "Salar" };
    expect(renderProposalContent(ctx, { target: "pdf", lang: "es" }).html).toContain(
      '<img src="data:image/png;base64,AAAA"',
    );
  });
  it.each(["B2C", "B2B"])("snapshot HTML sintético %s", (channel) => {
    const result = renderProposalContent(proposalFixture(channel), { target: "pdf", lang: "es" });
    expect(result.html).toMatchSnapshot();
    expect(plainText(result.html)).toContain("USD 300.00");
  });
});
