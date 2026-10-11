import { db, json, unwrap } from "../db";
import { calculateQuote, type QuoteInput, type QuoteResult, type PricingItem } from "../pricing";
import type { Tables, TablesInsert, TablesUpdate, Enums, Json } from "../../types/db";
export { createQuoteFromTemplate, type TemplateQuoteBasics } from "./from-template";

import { adjustmentPctSchema } from "../pricing/adjustment";
import { adjustmentTargets, type AdjustmentFilter } from "./adjustment-filter";
export type { AdjustmentFilter } from "./adjustment-filter";

export interface QuoteBasics extends Omit<
  QuoteInput,
  "days" | "client_pricing" | "admin_pricing" | "commission_mode" | "commission_pct"
> {
  client_id: string;
  client_type: Enums<"client_type">;
  language: string;
  category: Enums<"tour_category">;
  tour_sku: string;
  deposit_pct?: number;
  balance_due_days?: number;
  card_surcharge_pct?: number;
  payment_schedule?: Json;
  document_snapshot?: Json;
}
export type QuoteItemInput = Omit<
  TablesInsert<"quote_items">,
  "id" | "quote_day_id" | "created_at" | "updated_at"
>;
export type QuoteItemChanges = Omit<
  TablesUpdate<"quote_items">,
  | "id"
  | "quote_day_id"
  | "service_id"
  | "supplier_id"
  | "created_at"
  | "updated_at"
  | "total_cost_usd"
  | "total_cost_local"
  | "promote_to_master"
>;
export async function createEmptyQuote(basics: QuoteBasics): Promise<Tables<"quotes">> {
  return unwrap(
    await db.rpc("create_quote_snapshot", {
      p_quote: json({
        ...basics,
        pricing_config: {
          seasons: basics.seasons ?? [],
          single_supplements: basics.single_supplements ?? [],
        },
      }),
      p_days: [],
    }),
  );
}

export async function updateQuoteItem(
  itemId: string,
  changes: QuoteItemChanges,
): Promise<{ quote_id: string; item: Tables<"quote_items"> }> {
  if (changes.price_overridden && !changes.override_note?.trim())
    throw new Error("Price override requires a note");
  return unwrap(
    await db.rpc("edit_quote_item", { p_id: itemId, p_changes: json(changes) }),
  ) as unknown as { quote_id: string; item: Tables<"quote_items"> };
}
export async function addQuoteItem(
  quoteDayId: string,
  item: QuoteItemInput,
  promoteToMaster: boolean,
): Promise<{ quote_id: string; item: Tables<"quote_items"> }> {
  return unwrap(
    await db.rpc("edit_quote_item", {
      p_id: quoteDayId,
      p_changes: json(item),
      p_add: true,
      p_promote: promoteToMaster,
    }),
  ) as unknown as { quote_id: string; item: Tables<"quote_items"> };
}
export async function loadQuote(quoteId: string) {
  const quote = unwrap(await db.from("quotes").select("*").eq("id", quoteId).single());
  const days = unwrap(
    await db.from("quote_days").select("*").eq("quote_id", quoteId).order("day_number"),
  );
  const items = days.length
    ? unwrap(
        await db
          .from("quote_items")
          .select("*")
          .in(
            "quote_day_id",
            days.map((d) => d.id),
          )
          .order("created_at"),
      )
    : [];
  items.sort(
    (a, b) =>
      a.created_at.localeCompare(b.created_at) ||
      ((a.pricing_snapshot as { _creation_order?: number })._creation_order ?? 0) -
        ((b.pricing_snapshot as { _creation_order?: number })._creation_order ?? 0) ||
      a.id.localeCompare(b.id),
  );
  return { quote, days, items };
}
export function quotePricingInput(data: Awaited<ReturnType<typeof loadQuote>>): QuoteInput {
  const { quote: q, days, items } = data;
  return {
    ...(q.pricing_config as object),
    start_date: q.start_date,
    pax_paying: q.pax_paying,
    tc_count: q.tc_count,
    rooming: q.rooming,
    vehicles: q.vehicles,
    staff: q.staff,
    margin_pct: q.margin_pct,
    margin_mode: q.margin_mode,
    client_type: q.client_type,
    commission_mode: q.commission_mode,
    commission_pct: q.commission_pct,
    fx_snapshot: q.fx_snapshot,
    rounding_rule: q.rounding_rule,
    pax_scenarios: q.pax_scenarios ?? [],
    days: days.map((d) => ({
      day_number: d.day_number,
      items: items
        .filter((i) => i.quote_day_id === d.id)
        .map(
          (i) =>
            ({
              ...Object.fromEntries(
                Object.entries(i.pricing_snapshot as object).filter(
                  ([key]) => !key.startsWith("_") && key !== "service",
                ),
              ),
              id: i.id,
              label: i.sku ?? i.description,
              pricing_unit: i.pricing_unit,
              currency: i.currency,
              qty: i.qty,
              applies_tc: i.applies_tc,
              margin_applicable: i.margin_applicable,
              included: i.included,
              day_span: i.day_span,
              price_overridden: i.price_overridden,
              override_note: i.override_note ?? undefined,
              unit_cost_original: i.unit_cost_original,
              adjustment_pct: i.adjustment_pct ?? 0,
              adjustment_note: i.adjustment_note ?? null,
            }) as PricingItem,
        ),
    })),
  } as unknown as QuoteInput;
}
export async function recalculateQuote(quoteId: string): Promise<QuoteResult> {
  const data = await loadQuote(quoteId);
  const result = calculateQuote(quotePricingInput(data));
  unwrap(
    await db.rpc("save_quote_calculation", {
      p_id: quoteId,
      p_updated_at: data.quote.updated_at,
      p_result: json(result),
    }),
  );
  return result;
}
/** Replace (never compound) adjustments and save the recalculation in one RPC. */
export async function applyAdjustmentBulk(
  quoteId: string,
  filter: AdjustmentFilter,
  pct: number,
  note?: string | null,
) {
  adjustmentPctSchema.parse(pct);
  const data = await loadQuote(quoteId);
  if (data.quote.archived_at || !["borrador", "revisada"].includes(data.quote.status))
    throw new Error("Crea una nueva versión antes de ajustar una cotización enviada");
  const { matchedIds, affectedIds } = adjustmentTargets(data.days, data.items, filter);
  const adjustmentNote = note?.trim() || null;
  const updated = {
    ...data,
    items: data.items.map((i) =>
      affectedIds.includes(i.id)
        ? { ...i, adjustment_pct: pct, adjustment_note: adjustmentNote }
        : i,
    ),
  };
  const result = calculateQuote(quotePricingInput(updated));
  if (result.status !== "ok")
    throw new Error(result.warnings.join("; ") || "No se puede recalcular la cotización");
  unwrap(
    await db.rpc("apply_quote_adjustment_bulk", {
      p_id: quoteId,
      p_filter: json(filter),
      p_pct: pct,
      p_note: adjustmentNote ?? "",
      p_updated_at: data.quote.updated_at,
      p_result: json(result),
    }),
  );
  return {
    quote_id: quoteId,
    matched_item_ids: matchedIds,
    affected_item_ids: affectedIds,
    calculation: result,
  };
}
export async function generateQuoteCode(quote: {
  tour_sku: string;
  language: string;
}): Promise<string> {
  return unwrap(
    await db.rpc("next_quote_code", { p_sku: quote.tour_sku, p_language: quote.language }),
  );
}
export async function promoteQuoteToTemplate(quoteId: string): Promise<string> {
  return unwrap(await db.rpc("promote_quote_template", { p_id: quoteId }));
}
