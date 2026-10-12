import { db, unwrap } from "../db";

/** The edge function owns the outbox, provider receipt and state transition. */
export async function sendQuoteEmail(quoteId: string) {
  const { data, error } = await db.functions.invoke("send-quote-email", {
    body: { quoteId },
  });
  if (error) throw new Error(error.message);
  if (data?.status !== "enviado")
    throw new Error(data?.error ?? "El proveedor no confirmó el envío. Reintenta el mismo correo.");
  return data as { id: string; status: "enviado" };
}

export async function saveQuoteTermsUrl(quoteId: string, value: string) {
  const url = new URL(value);
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("URL de términos inválida");
  const quote = unwrap(
    await db.from("quotes").select("document_snapshot,updated_at").eq("id", quoteId).single(),
  );
  unwrap(
    await db
      .from("quotes")
      .update({
        document_snapshot: { ...(quote.document_snapshot as object), terms_url: url.href },
      })
      .eq("id", quoteId)
      .eq("updated_at", quote.updated_at)
      .select("id")
      .single(),
  );
}
