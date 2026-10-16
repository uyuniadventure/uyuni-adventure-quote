import { db, json, unwrap } from "../db";
import { z } from "zod";
import { documentContentPatchSchema, type DocumentContentPatch } from "./document-model";

async function quoteRevision(quoteId: string) {
  const quote = unwrap(await db.from("quotes").select("updated_at").eq("id", quoteId).single());
  return quote.updated_at;
}

/** Save editable document text in one guarded database transaction. */
export async function saveQuoteDocument(quoteId: string, patch: DocumentContentPatch) {
  const validated = documentContentPatchSchema.parse(patch);
  const updatedAt = await quoteRevision(quoteId);
  return unwrap(
    await db.rpc("save_quote_document", {
      p_quote_id: quoteId,
      p_updated_at: updatedAt,
      p_patch: json(validated),
    }),
  );
}

const itemLabelSchema = z.string().trim().max(200);

/** Store a client-facing service label by quote item id, leaving the tariff intact. */
export async function saveItemLabel(quoteId: string, itemId: string, label: string) {
  const validated = itemLabelSchema.parse(label.trim());
  const updatedAt = await quoteRevision(quoteId);
  return unwrap(
    await db.rpc("save_quote_item_label", {
      p_quote_id: quoteId,
      p_item_id: itemId,
      p_updated_at: updatedAt,
      p_label: validated,
    }),
  );
}
