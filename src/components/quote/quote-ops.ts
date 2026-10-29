/** UI adapters. Atomic day operations and calculation live in src/lib/quotes/days. */
import { db, json, unwrap } from "@/lib/db";
import { addQuoteItem, type QuoteItemInput } from "@/lib/quotes";
import type { Tables } from "@/types/db";

import { addBlockDay as appendBlock, deleteDay, moveDay as moveQuoteDay } from "@/lib/quotes/days";

type QuoteDay = Tables<"quote_days">;

/** Exact P2/P3 catalog variants carry a group total despite their imported per_person label. */
export function catalogSelectionPricing(
  service: Pick<Tables<"services">, "sku"> & {
    pricing_unit: NonNullable<Tables<"services">["pricing_unit"]>;
  },
  rates: Tables<"service_rates">[],
) {
  const suffixPax = Number(service.sku.match(/^(?:ALM_LH_UTU|BIKE_LH)_(\d+)$/i)?.[1]);
  const exact = rates.length === 1 && rates[0]!.pax_min === suffixPax && rates[0]!.pax_max === suffixPax;
  return service.pricing_unit === "per_person" && suffixPax > 1 && exact
    ? { pricing_unit: "per_group" as const, source_pricing_unit: service.pricing_unit }
    : { pricing_unit: service.pricing_unit, source_pricing_unit: service.pricing_unit };
}

/** Construye el ítem congelado desde un servicio del tarifario (mismo formato que createQuoteFromTemplate). */
export async function serviceToItem(
  serviceId: string,
  opts: {
    qty?: number;
    applies_tc?: boolean | null;
    margin_applicable?: boolean | null;
    included?: boolean;
    is_optional?: boolean;
    maxSpan?: number;
  },
): Promise<QuoteItemInput> {
  const s = unwrap(await db.from("services").select("*").eq("id", serviceId).single());
  if (!s.pricing_unit || !s.currency)
    throw new Error(
      `El servicio ${s.sku} no tiene unidad de precio o moneda; apruébalo en el tarifario.`,
    );
  const rates = unwrap(await db.from("service_rates").select("*").eq("service_id", s.id));
  const selectedPricing = catalogSelectionPricing(
    { sku: s.sku, pricing_unit: s.pricing_unit },
    rates,
  );
  const span = Math.max(1, Math.min(s.multi_day_span, opts.maxSpan ?? s.multi_day_span));
  return {
    service_id: s.id,
    sku: s.sku,
    description: s.name,
    type: s.type,
    pricing_unit: selectedPricing.pricing_unit,
    qty: opts.qty ?? 1,
    unit_cost_original: 0,
    unit_cost_usd: 0,
    currency: s.currency,
    supplier_id: s.supplier_id,
    applies_tc: opts.applies_tc ?? s.applies_tc_default,
    margin_applicable: opts.margin_applicable ?? s.margin_applicable_default,
    included: opts.included ?? true,
    day_span: span,
    meal_plan: s.meal_plan,
    pricing_snapshot: json({
      is_optional: opts.is_optional ?? false,
      rates,
      source_pricing_unit: selectedPricing.source_pricing_unit,
      room_type: s.room_type,
      vehicle_segment: s.vehicle_type,
      service: s,
    }),
  };
}

export async function addBlockDay(quote: Tables<"quotes">, _days: QuoteDay[], blockId: string) {
  return appendBlock(quote.id, blockId);
}
export async function removeDay(quote: Tables<"quotes">, _days: QuoteDay[], dayId: string) {
  return deleteDay(quote.id, dayId);
}
export async function moveDay(quote: Tables<"quotes">, days: QuoteDay[], from: number, to: number) {
  const day = days[from]!;
  const members = days.filter(
    (d) => d.id === day.id || (day.group_id && d.group_id === day.group_id),
  );
  const target =
    to < from
      ? Math.min(...members.map((d) => d.day_number)) - 1
      : Math.max(...members.map((d) => d.day_number)) + 1;
  if (target < 1 || target > days.length) return;
  return moveQuoteDay(quote.id, day.id, target);
}

export async function deleteItem(itemId: string) {
  unwrap(await db.from("quote_items").delete().eq("id", itemId).select("id"));
}

/** Reemplaza los ítems de alojamiento del día por los tipos de habitación elegidos. */
export async function replaceDayHotel(
  dayId: string,
  currentHotelItemIds: string[],
  serviceIds: string[],
) {
  for (const id of currentHotelItemIds) await deleteItem(id);
  for (const sid of serviceIds)
    await addQuoteItem(dayId, await serviceToItem(sid, { maxSpan: 1 }), false);
}

/** Tasas de cambio vigentes (solo visibles para admin; para otros roles devuelve {}). */
export async function latestFx(): Promise<Record<string, number>> {
  const { data } = await db
    .from("exchange_rates")
    .select("currency, rate_to_usd, valid_from")
    .order("valid_from", { ascending: false });
  const fx: Record<string, number> = { USD: 1 };
  for (const r of data ?? []) if (!(r.currency in fx)) fx[r.currency] = Number(r.rate_to_usd);
  return fx;
}
