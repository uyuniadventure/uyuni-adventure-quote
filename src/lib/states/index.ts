import { db, unwrap } from "../db";
import type { Enums, Tables } from "../../types/db";
const transitions: Record<Enums<"quote_status">, Enums<"quote_status">[]> = {
  borrador: ["revisada"],
  revisada: ["enviada"],
  enviada: ["vendida", "perdida"],
  vendida: [],
  perdida: [],
};
export async function transitionQuote(
  quoteId: string,
  to: Enums<"quote_status">,
  note?: string,
): Promise<Tables<"quotes">> {
  const q = unwrap(await db.from("quotes").select("status").eq("id", quoteId).single());
  if (!transitions[q.status].includes(to))
    throw new Error(`Invalid transition: ${q.status} → ${to}`);
  if (to === "perdida" && !note?.trim()) throw new Error("Lost reason required");
  return unwrap(
    await db.rpc("transition_quote", {
      p_id: quoteId,
      p_to: to,
      ...(note ? { p_note: note } : {}),
    }),
  );
}
