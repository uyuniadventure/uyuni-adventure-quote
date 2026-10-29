import { pdf } from "@react-pdf/renderer";
import { db, unwrap } from "../db";
import {
  buildQuoteDocumentModel,
  loadQuote,
  quotePricingInput,
  unreviewedDaysMessage,
  type DocumentContent,
} from "../quotes";
import { calculateQuote, assertCompleteCalculation, type QuoteResult } from "../pricing";
import { QuoteDocument } from "./document";
import { ProposalDocument } from "./proposal-document";
import { renderProposal, listDocSections } from "../quotes/document";

export async function generateQuotePdf(quoteId: string): Promise<Blob> {
  let data: Awaited<ReturnType<typeof loadQuote>>;
  try {
    data = await loadQuote(quoteId);
  } catch (error) {
    throw new Error(`No se pudo acceder a la cotización ${quoteId}. Verifica que exista y que tengas permiso para verla. ${error instanceof Error ? error.message : ""}`.trim());
  }
  const q = data.quote;
  let sections: Awaited<ReturnType<typeof listDocSections>>;
  try {
    sections = await listDocSections(quoteId);
  } catch (error) {
    throw new Error(`No se pudieron recuperar las secciones de la propuesta. ${error instanceof Error ? error.message : ""}`.trim());
  }
  if (sections.length) {
    const proposal = await renderProposal(quoteId, { target: "pdf", lang: q.language });
    if (!proposal) throw new Error("La propuesta no tiene secciones.");
    const errors = proposal.avisos.filter((a) => a.level === "error");
    if (errors.length) throw new Error(errors.map((a) => a.message).join(" "));
    if (!proposal.frozen) {
      assertCompleteCalculation(q.calculation as unknown as QuoteResult);
      const pending = unreviewedDaysMessage(data.days, q.language);
      if (pending) throw new Error(pending);
    }
    const blob = await pdf(<ProposalDocument html={proposal.html} />).toBlob();
    if (proposal.frozen) return blob;
    const path = `${q.id}/${crypto.randomUUID()}.pdf`;
    const uploaded = await db.storage
      .from("quote-pdfs")
      .upload(path, blob, { contentType: "application/pdf", upsert: false });
    if (uploaded.error) throw new Error(`No se pudo guardar el archivo PDF. ${uploaded.error.message}`);
    const signedResult = await db.storage.from("quote-pdfs").createSignedUrl(path, 604800);
    if (signedResult.error || !signedResult.data)
      throw new Error(`No se pudo crear el enlace de descarga del PDF. ${signedResult.error?.message ?? "Respuesta vacía."}`);
    const saved = await db.rpc("save_quote_pdf", {
      p_id: q.id,
      p_updated_at: q.updated_at,
      p_path: path,
      p_url: signedResult.data.signedUrl,
    });
    // save_quote_pdf returns void, therefore a successful PostgREST response has data: null.
    if (saved.error) throw new Error(`No se pudo asociar el PDF a la cotización. ${saved.error.message}`);
    return blob;
  }
  const reviewMessage = unreviewedDaysMessage(data.days, q.language);
  if (reviewMessage) throw new Error(reviewMessage);
  if (!q.calculation || !data.days.length)
    throw new Error("Recalculate a complete itinerary before PDF generation");
  const calculation = q.calculation as unknown as QuoteResult;
  assertCompleteCalculation(calculation);
  const content = q.document_snapshot as unknown as DocumentContent;
  if (!content.client_name || (q.client_type === "B2B" ? !content.terms : !content.terms_url))
    throw new Error("Client name and localized terms are required in document_snapshot");
  const input = quotePricingInput(data);
  const model = buildQuoteDocumentModel(
    {
      ...data,
      content,
    },
    q.language,
  );
  const optional_prices: Record<string, number> = {};
  for (const day of input.days) {
    for (const item of day.items.filter((i) => !i.included)) {
      const saved = data.items.find((i) => i.id === item.id);
      if (!(saved?.pricing_snapshot as { is_optional?: boolean })?.is_optional) continue;
      // Only explicitly priced options appear; free exclusions remain in 'not included'.
      if (!item.rates?.length && !item.price_overridden) continue;
      const result = calculateQuote({
        ...input,
        pax_scenarios: [],
        days: [{ day_number: day.day_number, items: [{ ...item, included: true, day_span: 1 }] }],
      });
      assertCompleteCalculation(result);
      optional_prices[item.id] = result.total_price_usd;
    }
  }
  const blob = await pdf(
    <QuoteDocument
      data={{
        ...data,
        model,
        calculation,
        optional_prices,
      }}
    />,
  ).toBlob();
  const path = `${q.id}/${crypto.randomUUID()}.pdf`;
  unwrap(
    await db.storage
      .from("quote-pdfs")
      .upload(path, blob, { contentType: "application/pdf", upsert: false }),
  );
  const signed = unwrap(await db.storage.from("quote-pdfs").createSignedUrl(path, 604800));
  const saved = await db.rpc("save_quote_pdf", {
    p_id: q.id,
    p_updated_at: q.updated_at,
    p_path: path,
    p_url: signed.signedUrl,
  });
  if (saved.error) throw new Error(saved.error.message);
  return blob;
}
