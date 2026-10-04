/**
 * Operaciones de edición de días que src/lib aún no expone (agregar bloque a una
 * cotización existente, quitar/reordenar días, reemplazar hotel). Los ítems se
 * insertan siempre vía addQuoteItem (RPC edit_quote_item); aquí no se calcula precio.
 * TODO(Codex): mover a src/lib/quotes como addBlockDay/removeDay/moveDay/replaceDayHotel.
 */
import { db, json, unwrap } from "@/lib/db";
import { addQuoteItem, type QuoteItemInput } from "@/lib/quotes";
import type { Tables } from "@/types/db";

type QuoteDay = Tables<"quote_days">;

function dateFor(start: string, day: number) {
  return new Date(Date.parse(start + "T00:00:00Z") + (day - 1) * 86400000).toISOString().slice(0, 10);
}

/** Construye el ítem congelado desde un servicio del tarifario (mismo formato que createQuoteFromTemplate). */
export async function serviceToItem(
  serviceId: string,
  opts: { qty?: number; applies_tc?: boolean | null; margin_applicable?: boolean | null; included?: boolean; is_optional?: boolean; maxSpan?: number },
): Promise<QuoteItemInput> {
  const s = unwrap(await db.from("services").select("*").eq("id", serviceId).single());
  if (!s.pricing_unit || !s.currency) throw new Error(`El servicio ${s.sku} no tiene unidad de precio o moneda; apruébalo en el tarifario.`);
  const rates = unwrap(await db.from("service_rates").select("*").eq("service_id", s.id));
  const span = Math.max(1, Math.min(s.multi_day_span, opts.maxSpan ?? s.multi_day_span));
  return {
    service_id: s.id, sku: s.sku, description: s.name, type: s.type, pricing_unit: s.pricing_unit,
    qty: opts.qty ?? 1, unit_cost_original: 0, unit_cost_usd: 0, currency: s.currency, supplier_id: s.supplier_id,
    applies_tc: opts.applies_tc ?? s.applies_tc_default,
    margin_applicable: opts.margin_applicable ?? s.margin_applicable_default,
    included: opts.included ?? true, day_span: span, meal_plan: s.meal_plan,
    pricing_snapshot: json({ is_optional: opts.is_optional ?? false, rates, room_type: s.room_type, vehicle_segment: s.vehicle_type, service: s }),
  };
}

async function translation<T extends { lang: string }>(rows: T[], lang: string) {
  return rows.find((r) => r.lang === lang) ?? rows.find((r) => r.lang === "es") ?? rows[0] ?? null;
}

/** Agrega un bloque diario como último día de la cotización. */
export async function addBlockDay(quote: Tables<"quotes">, days: QuoteDay[], blockId: string) {
  const block = unwrap(await db.from("day_blocks").select("*").eq("id", blockId).single());
  const trs = unwrap(await db.from("day_block_translations").select("*").eq("block_id", blockId));
  const tr = await translation(trs, quote.language);
  const links = unwrap(await db.from("day_block_modules").select("*").eq("block_id", blockId).order("order"));
  const moduleTexts: string[] = [];
  let reviewed = !!tr && tr.lang === quote.language && tr.reviewed;
  const moduleItems: Tables<"activity_module_items">[] = [];
  for (const l of links) {
    const mt = await translation(unwrap(await db.from("activity_module_translations").select("*").eq("module_id", l.module_id)), quote.language);
    if (mt) moduleTexts.push(`${mt.title}\n${mt.description}`);
    reviewed = reviewed && !!mt && mt.lang === quote.language && mt.reviewed;
    moduleItems.push(...unwrap(await db.from("activity_module_items").select("*").eq("module_id", l.module_id)));
  }
  const dayNumber = days.length + 1;
  const day = unwrap(
    await db.from("quote_days").insert({
      quote_id: quote.id, day_number: dayNumber, date: dateFor(quote.start_date, dayNumber),
      title: tr?.title ?? block.code, description: [tr?.description ?? "", ...moduleTexts].filter(Boolean).join("\n\n"),
      includes: tr?.includes ?? null, excludes: tr?.excludes ?? null, route_from: block.route_from, route_to: block.route_to,
      snapshot: json({ reviewed, language: quote.language, places: block.places, hotel_service_id: block.hotel_service_id, block_id: block.id }),
    }).select("*").single(),
  );
  const blockItems = unwrap(await db.from("day_block_items").select("*").eq("block_id", blockId));
  for (const r of [...blockItems, ...moduleItems]) {
    if (!r.service_id) continue;
    const item = await serviceToItem(r.service_id, {
      qty: r.qty, applies_tc: r.applies_tc, margin_applicable: r.margin_applicable,
      included: "included" in r ? r.included : true, is_optional: "is_optional" in r ? r.is_optional : false, maxSpan: 1,
    });
    await addQuoteItem(day.id, item, false);
  }
  return day;
}

export async function removeDay(quote: Tables<"quotes">, days: QuoteDay[], dayId: string) {
  const idx = days.findIndex((d) => d.id === dayId);
  unwrap(await db.from("quote_days").delete().eq("id", dayId).select("id"));
  for (const d of days.slice(idx + 1)) {
    const n = d.day_number - 1;
    unwrap(await db.from("quote_days").update({ day_number: n, date: dateFor(quote.start_date, n) }).eq("id", d.id).select("id"));
  }
}

/** Mueve un día de la posición `from` a `to` (índices 0-based), renumerando con un hueco temporal. */
export async function moveDay(quote: Tables<"quotes">, days: QuoteDay[], from: number, to: number) {
  const order = [...days];
  const [m] = order.splice(from, 1);
  order.splice(to, 0, m!);
  const offset = 1000;
  for (const d of order) unwrap(await db.from("quote_days").update({ day_number: d.day_number + offset }).eq("id", d.id).select("id"));
  for (const [i, d] of order.entries())
    unwrap(await db.from("quote_days").update({ day_number: i + 1, date: dateFor(quote.start_date, i + 1) }).eq("id", d.id).select("id"));
}

export async function deleteItem(itemId: string) {
  unwrap(await db.from("quote_items").delete().eq("id", itemId).select("id"));
}

/** Reemplaza los ítems de alojamiento del día por los tipos de habitación elegidos. */
export async function replaceDayHotel(dayId: string, currentHotelItemIds: string[], serviceIds: string[]) {
  for (const id of currentHotelItemIds) await deleteItem(id);
  for (const sid of serviceIds) await addQuoteItem(dayId, await serviceToItem(sid, { maxSpan: 1 }), false);
}

/** Tasas de cambio vigentes (solo visibles para admin; para otros roles devuelve {}). */
export async function latestFx(): Promise<Record<string, number>> {
  const { data } = await db.from("exchange_rates").select("currency, rate_to_usd, valid_from").order("valid_from", { ascending: false });
  const fx: Record<string, number> = { USD: 1 };
  for (const r of data ?? []) if (!(r.currency in fx)) fx[r.currency] = Number(r.rate_to_usd);
  return fx;
}
