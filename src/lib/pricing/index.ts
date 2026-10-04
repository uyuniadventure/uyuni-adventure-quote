import type { Enums } from "../../types/db";

export interface Rate {
  id?: string;
  season: Enums<"season">;
  valid_from: string | null;
  valid_to: string | null;
  pax_min: number | null;
  pax_max: number | null;
  price_net: number | null;
  price_rack?: number | null;
  net_cost_missing?: boolean;
  room_type?: string | null;
}
export interface Rooming {
  paying: Record<string, number>;
  tc: Record<string, number>;
}
export interface PricingItem {
  id: string;
  pricing_unit: Enums<"pricing_unit">;
  currency: string;
  qty: number;
  rates: Rate[];
  applies_tc: boolean;
  margin_applicable: boolean;
  included: boolean;
  room_type?: string;
  vehicle_segment?: string;
  staff_type?: "drivers" | "guides";
  nights?: number;
  day_span?: number;
  // Shared by the copies of ONE multi-day purchase, not all purchases of a SKU.
  coverage_key?: string;
  coverage_start_day?: number;
  price_overridden?: boolean;
  override_note?: string;
  unit_cost_original?: number;
}
export interface PaxScenario {
  pax_paying: number;
  tc_count: number;
  rooming: Rooming;
  vehicles: Record<string, number>;
  staff?: { drivers: number; guides: number };
}
export interface QuoteInput extends PaxScenario {
  start_date: string;
  fx_snapshot: Record<string, number>;
  margin_pct: number; // percentage points: 20 means 20%, never 0.20
  rounding_rule: { increment: number; mode: "ceil" | "nearest" | "none"; per_pax?: boolean };
  days: { day_number: number; items: PricingItem[] }[];
  // Seasons are configured per itinerary; do not invent DRY/RAIN dates.
  seasons?: { from: string; to: string; season: Enums<"season"> }[];
  single_supplements?: {
    single_cost: number;
    double_cost: number;
    currency: string;
    nights: number;
    margin_applicable: boolean;
  }[];
  pax_scenarios?: PaxScenario[];
}
export interface ItemResult {
  id: string;
  day_number: number;
  date: string;
  quantity: number;
  unit_cost_original: number;
  unit_cost_usd: number;
  total_cost_usd: number;
  total_margin_usd: number;
  covered: boolean;
  warning?: string;
}
export interface QuoteTotals {
  total_cost_usd: number;
  total_margin_usd: number;
  total_price_usd: number;
  price_per_pax_usd: number;
  single_supplement_pp: number;
}
export interface QuoteResult extends QuoteTotals {
  items: ItemResult[];
  days: { day_number: number; total_cost_usd: number; total_margin_usd: number }[];
  warnings: string[];
  scenarios: (QuoteTotals & { pax_paying: number; tc_count: number })[];
}

function nonnegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid ${label}`);
  return value;
}
function count(value: number, label: string): number {
  nonnegative(value, label);
  if (!Number.isInteger(value)) throw new Error(`Invalid ${label}`);
  return value;
}
function validDate(value: string): string {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    throw new Error(`Invalid date: ${value}`);
  return value;
}
export function dateForDay(start: string, day: number): string {
  validDate(start);
  if (count(day, "day") < 1) throw new Error("Day must be positive");
  return new Date(Date.parse(start + "T00:00:00Z") + (day - 1) * 86400000)
    .toISOString()
    .slice(0, 10);
}
function fx(input: QuoteInput, currency: string): number {
  const rate = input.fx_snapshot[currency];
  if (rate === undefined || !Number.isFinite(rate) || rate <= 0)
    throw new Error(`Missing/invalid FX: ${currency}`);
  return rate;
}
export function selectRate(
  item: PricingItem,
  date: string,
  pax: number,
  seasons: QuoteInput["seasons"] = [],
): Rate {
  const active = seasons
    .filter((s) => validDate(s.from) <= date && validDate(s.to) >= date)
    .map((s) => s.season);
  const candidates = item.rates.filter(
    (r) =>
      (!r.valid_from || validDate(r.valid_from) <= date) &&
      (!r.valid_to || validDate(r.valid_to) >= date) &&
      (r.pax_min === null || pax >= r.pax_min) &&
      (r.pax_max === null || pax <= r.pax_max) &&
      (!r.room_type || r.room_type === item.room_type) &&
      (r.season === "ALL" || active.includes(r.season)),
  );
  const seasonal = candidates.filter((r) => r.season !== "ALL");
  const chosen = seasonal.length ? seasonal : candidates;
  if (chosen.length !== 1)
    throw new Error(
      `${chosen.length ? "Ambiguous" : "Missing"} rate: ${item.id} (${date}, ${pax} pax)`,
    );
  return chosen[0]!;
}
function quantity(input: QuoteInput, item: PricingItem): number {
  nonnegative(item.qty, "qty");
  switch (item.pricing_unit) {
    case "per_person":
      return input.pax_paying + (item.applies_tc ? input.tc_count : 0);
    case "per_group":
    case "per_unit":
      return item.qty;
    case "per_vehicle": {
      const n = item.vehicle_segment ? input.vehicles[item.vehicle_segment] : undefined;
      if (n === undefined) throw new Error(`Vehicle count required: ${item.id}`);
      return count(n, "vehicles");
    }
    case "per_room": {
      if (!item.room_type) throw new Error(`Room type required: ${item.id}`);
      const paying = input.rooming.paying[item.room_type] ?? 0;
      const tc = item.applies_tc ? (input.rooming.tc[item.room_type] ?? 0) : 0;
      return (count(paying, "rooms") + count(tc, "TC rooms")) * count(item.nights ?? 1, "nights");
    }
    case "per_staff": {
      if (!item.staff_type || !input.staff)
        throw new Error(`Staff configuration required: ${item.id}`);
      return count(input.staff[item.staff_type], "staff") * item.qty;
    }
    default:
      throw new Error("Unknown pricing unit");
  }
}
const cents = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
function round(n: number, rule: QuoteInput["rounding_rule"]): number {
  if (rule.mode === "none") return cents(n);
  if (!Number.isFinite(rule.increment) || rule.increment <= 0)
    throw new Error("Invalid rounding increment");
  const f = rule.mode === "ceil" ? Math.ceil : Math.round;
  return cents(f(n / rule.increment - 1e-10) * rule.increment);
}
export function calculateQuote(input: QuoteInput): QuoteResult {
  if (count(input.pax_paying, "pax") < 1) throw new Error("Paying pax must be positive");
  count(input.tc_count, "TC");
  nonnegative(input.margin_pct, "margin");
  validDate(input.start_date);
  const ids = new Set<string>(),
    dayNumbers = new Set<number>(),
    coverages = new Map<string, string>();
  const items: ItemResult[] = [];
  for (const day of [...input.days].sort((a, b) => a.day_number - b.day_number)) {
    if (dayNumbers.has(day.day_number)) throw new Error("Duplicate day number");
    dayNumbers.add(day.day_number);
    const date = dateForDay(input.start_date, day.day_number);
    for (const item of day.items) {
      if (ids.has(item.id)) throw new Error("Duplicate item ID");
      ids.add(item.id);
      const span = item.day_span ?? 1;
      if (count(span, "day span") < 1) throw new Error("Invalid day span");
      let covered = false;
      if (span > 1) {
        if (!item.coverage_key || !item.coverage_start_day)
          throw new Error(`Coverage required: ${item.id}`);
        if (
          day.day_number < item.coverage_start_day ||
          day.day_number >= item.coverage_start_day + span
        )
          throw new Error("Item outside coverage");
        const signature = JSON.stringify({ ...item, id: undefined });
        const previous = coverages.get(item.coverage_key);
        if (previous && previous !== signature) throw new Error("Inconsistent multi-day copies");
        if (!previous && day.day_number !== item.coverage_start_day)
          throw new Error("Missing multi-day first item");
        coverages.set(item.coverage_key, signature);
        covered = day.day_number !== item.coverage_start_day;
      }
      if (!item.included || covered) {
        items.push({
          id: item.id,
          day_number: day.day_number,
          date,
          quantity: 0,
          unit_cost_original: 0,
          unit_cost_usd: 0,
          total_cost_usd: 0,
          total_margin_usd: 0,
          covered,
        });
        continue;
      }
      const qty = quantity(input, item);
      // An unused room variant has no cost and requires no matching rate.
      if (qty === 0) {
        items.push({
          id: item.id,
          day_number: day.day_number,
          date,
          quantity: 0,
          unit_cost_original: 0,
          unit_cost_usd: 0,
          total_cost_usd: 0,
          total_margin_usd: 0,
          covered: false,
        });
        continue;
      }
      let native: number, warning: string | undefined;
      if (item.price_overridden) {
        if (!item.override_note?.trim() || item.unit_cost_original === undefined)
          throw new Error("Override requires price and note");
        native = nonnegative(item.unit_cost_original, "override");
      } else {
        const rate = selectRate(
          item,
          date,
          input.pax_paying + (item.applies_tc ? input.tc_count : 0),
          input.seasons,
        );
        const price = rate.price_net ?? rate.price_rack;
        if (price === undefined || price === null) throw new Error(`No price: ${item.id}`);
        native = nonnegative(price, "price");
        if (rate.net_cost_missing || rate.price_net === null)
          warning = `${item.id}: sin costo neto`;
      }
      const usd = native / fx(input, item.currency),
        cost = qty * usd;
      items.push({
        id: item.id,
        day_number: day.day_number,
        date,
        quantity: qty,
        unit_cost_original: native,
        unit_cost_usd: usd,
        total_cost_usd: cost,
        total_margin_usd: item.margin_applicable ? (cost * input.margin_pct) / 100 : 0,
        covered: false,
        ...(warning ? { warning } : {}),
      });
    }
  }
  const cost = items.reduce((n, i) => n + i.total_cost_usd, 0),
    margin = items.reduce((n, i) => n + i.total_margin_usd, 0);
  const per = input.rounding_rule.per_pax
    ? round((cost + margin) / input.pax_paying, input.rounding_rule)
    : cents(round(cost + margin, input.rounding_rule) / input.pax_paying);
  const total = input.rounding_rule.per_pax
    ? cents(per * input.pax_paying)
    : round(cost + margin, input.rounding_rule);
  const single = (input.single_supplements ?? []).reduce(
    (sum, s) =>
      sum +
      ((nonnegative(s.single_cost, "single") - nonnegative(s.double_cost, "double") / 2) /
        fx(input, s.currency)) *
        count(s.nights, "nights") *
        (s.margin_applicable ? 1 + input.margin_pct / 100 : 1),
    0,
  );
  return {
    total_cost_usd: cents(cost),
    total_margin_usd: cents(margin),
    total_price_usd: total,
    price_per_pax_usd: per,
    single_supplement_pp: cents(single),
    items,
    days: [...dayNumbers].map((day_number) => ({
      day_number,
      total_cost_usd: cents(
        items.filter((i) => i.day_number === day_number).reduce((n, i) => n + i.total_cost_usd, 0),
      ),
      total_margin_usd: cents(
        items
          .filter((i) => i.day_number === day_number)
          .reduce((n, i) => n + i.total_margin_usd, 0),
      ),
    })),
    warnings: items.flatMap((i) => (i.warning ? [i.warning] : [])),
    scenarios: (input.pax_scenarios ?? []).map((s) => {
      const result = calculateQuote({ ...input, ...s, pax_scenarios: [] });
      return {
        pax_paying: s.pax_paying,
        tc_count: s.tc_count,
        total_cost_usd: result.total_cost_usd,
        total_margin_usd: result.total_margin_usd,
        total_price_usd: result.total_price_usd,
        price_per_pax_usd: result.price_per_pax_usd,
        single_supplement_pp: result.single_supplement_pp,
      };
    }),
  };
}
