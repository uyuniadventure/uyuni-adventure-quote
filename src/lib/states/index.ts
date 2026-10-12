import { db, unwrap } from "../db";
import type { Enums, Tables } from "../../types/db";
/** Postgres validates the current state under a row lock, including permissions,
 * blocking errors and the deposit/admin requirement, and records the audit row. */
export async function transitionQuote(
  quoteId: string,
  to: Enums<"quote_status">,
  note?: string,
): Promise<Tables<"quotes">> {
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
