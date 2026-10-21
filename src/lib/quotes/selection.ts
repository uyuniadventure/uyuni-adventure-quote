import { db, json, unwrap } from "../db";
import { calculateSavedQuote, type loadQuote } from "./index";
import type { RoomRow } from "./selection-model";
export {
  proposeRooming,
  proposeTransport,
  roomingWarnings,
  transportWarning,
} from "./selection-model";
/** Queue these calls in useQuoteActions, just like other quote mutations. */
async function mutate(quoteId: string, operation: string, payload: object) {
  const args = { p_id: quoteId, p_operation: operation, p_payload: json(payload) };
  const prepared = unwrap(await db.rpc("edit_quote_selection", args)) as unknown as Awaited<
    ReturnType<typeof loadQuote>
  >;
  const result = calculateSavedQuote(prepared);
  return unwrap(
    await db.rpc("edit_quote_selection", {
      ...args,
      p_payload: json({ ...payload, expected: prepared }),
      p_updated_at: prepared.quote.updated_at,
      p_result: json(result),
    }),
  );
}
export function selectAlternatives(
  quoteId: string,
  dayId: string,
  slotKey: string,
  selections: { serviceId: string; qty: number }[],
) {
  return mutate(quoteId, "alternatives", {
    day_id: dayId,
    slot_key: slotKey,
    selections: selections.map((s) => ({ ...s, id: crypto.randomUUID() })),
  });
}
export function setRooming(quoteId: string, rows: RoomRow[]) {
  return mutate(quoteId, "rooming", { rows });
}
