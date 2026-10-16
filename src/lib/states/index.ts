import { db, unwrap } from "../db";
import type { Enums, Tables } from "../../types/db";
import { listDocSections, renderProposal } from "../quotes/document";
/** Postgres validates the current state under a row lock, including permissions,
 * blocking errors and the deposit/admin requirement, and records the audit row. */
export async function transitionQuote(
  quoteId: string,
  to: Enums<"quote_status">,
  note?: string,
): Promise<Tables<"quotes">> {
  if (["revisada", "enviada"].includes(to) && (await listDocSections(quoteId)).length) {
    const q = unwrap(await db.from("quotes").select("language").eq("id", quoteId).single());
    const proposal = await renderProposal(quoteId, { target: "pdf", lang: q.language });
    const errors = proposal?.avisos.filter((a) => a.level === "error") ?? [];
    if (errors.length) throw new Error(errors.map((a) => a.message).join(" "));
  }
  return unwrap(
    await db.rpc("transition_quote", {
      p_id: quoteId,
      p_to: to,
      p_note: note?.trim() ?? "",
    }),
  );
}

/** Returns the editable quote id. Sent quotes are copied atomically to a draft;
 * the previous version remains archived and read-only. */
export async function beginQuoteEdit(quoteId: string): Promise<string> {
  return unwrap(await db.rpc("version_quote", { p_id: quoteId }));
}
