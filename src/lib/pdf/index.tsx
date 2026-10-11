import { pdf } from "@react-pdf/renderer";
import { db, unwrap } from "../db";
import { loadQuote, quotePricingInput } from "../quotes";
import { calculateQuote, assertCompleteCalculation, type QuoteResult } from "../pricing";
import { QuoteDocument, type DocumentContent } from "./document";

export async function generateQuotePdf(quoteId: string): Promise<Blob> {
  const data = await loadQuote(quoteId);
  const q = data.quote;
  if (!q.calculation || !data.days.length)
    throw new Error("Recalculate a complete itinerary before PDF generation");
  const calculation = q.calculation as unknown as QuoteResult;
  assertCompleteCalculation(calculation);
  if (data.days.some((d) => (d.snapshot as { reviewed?: boolean })?.reviewed !== true))
    throw new Error("Review translated texts before generating the client PDF");
  const content = q.document_snapshot as unknown as DocumentContent;
  if (!content.client_name || (q.client_type === "B2B" ? !content.terms : !content.terms_url))
    throw new Error("Client name and localized terms are required in document_snapshot");
  const input = quotePricingInput(data);
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
        content,
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
