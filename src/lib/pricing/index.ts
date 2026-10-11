import type { Enums } from "../../types/db";
import { marginAmount, resolvePricingPolicy, type PricingPolicyInput } from "./policy";
import { adjustedCost, adjustmentPctSchema } from "./adjustment";
import {
  normalizeRooms,
  occupancyType,
  parsePricingConfig,
  resolveRooming,
  type PartialPricingConfig,
} from "./config";
export { pricingConfigSchema, pricingConfigSchemas, parsePricingConfig } from "./config";
export { DEFAULT_PRICING, resolvePricingPolicy } from "./policy";
export type { MarginMode, CommissionMode, ClientPricing, AdminPricing } from "./policy";

export interface Rate {
  id?: string;
  season: Enums<"season">;
  valid_from: string | null;
  valid_to: string | null;
  pax_min: number | null;
  pax_max: number | null;
  price_net: number | null;
  price_rack?: number | null;
  // Historical import flag; current availability is determined by the prices.
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
  pricing_config?: unknown;
  label?: string;
  lodging_key?: string;
  room_type?: string;
  vehicle_segment?: string;
  vehicle_max_pax?: number | null;
  rate_band?: PartialPricingConfig["rate_band"];
  staff_type?: "drivers" | "guides";
  nights?: number;
  day_span?: number;
  // Shared by the copies of ONE multi-day purchase, not all purchases of a SKU.
  coverage_key?: string;
  coverage_start_day?: number;
  price_overridden?: boolean;
  override_note?: string;
  unit_cost_original?: number;
  adjustment_pct?: number;
  adjustment_note?: string | null;
}
export interface PaxScenario {
  pax_paying: number;
  tc_count: number;
  rooming: Rooming;
  vehicles: Record<string, number>;
  staff?: { drivers: number; guides: number };
}
export interface QuoteInput extends PaxScenario, PricingPolicyInput {
  start_date: string;
  fx_snapshot: Record<string, number>;
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
  status: "ok" | "error";
  id: string;
  day_number: number;
  date: string;
  quantity: number;
  unit_cost_original?: number;
  unit_cost_usd: number | null;
  base_cost_usd: number | null;
  adjustment_pct: number;
  adjustment_amount_usd: number | null;
  total_cost_usd: number | null;
  total_margin_usd: number | null;
  covered: boolean;
  warning?: string;
  pricing_config?: PartialPricingConfig;
  room_breakdown?: {
    room_type: string;
    quantity: number;
    unit_cost_original: number;
    total_cost_usd: number;
  }[];
}
export interface QuoteTotals {
  total_cost_usd: number;
  total_margin_usd: number;
  total_commission_usd: number;
  rounding_adjustment_usd: number;
  total_price_usd: number;
  price_per_pax_usd: number;
  single_supplement_pp: number;
}
type NullableTotals = { [K in keyof QuoteTotals]: number | null };
export interface QuoteResult extends NullableTotals {
  status: "ok" | "error";
  pricing_policy: ReturnType<typeof resolvePricingPolicy>;
  effective_rooming?: Rooming;
  items: ItemResult[];
  days: { day_number: number; total_cost_usd: number | null; total_margin_usd: number | null }[];
  warnings: string[];
  scenarios: (NullableTotals & {
    status: "ok" | "error";
    warnings: string[];
    pax_paying: number;
    tc_count: number;
  })[];
}

export type CompleteQuoteResult = Omit<QuoteResult, "scenarios"> &
  QuoteTotals & {
    scenarios: (QuoteResult["scenarios"][number] & QuoteTotals)[];
  };
export function assertCompleteCalculation(
  result: QuoteResult,
): asserts result is CompleteQuoteResult {
  const hasMissingTotal = (totals: NullableTotals) =>
    [
      totals.total_cost_usd,
      totals.total_margin_usd,
      totals.total_price_usd,
      totals.price_per_pax_usd,
      totals.single_supplement_pp,
    ].some((n) => n == null || !Number.isFinite(n)) ||
    // Older saved calculations predate these fields and have no commission.
    (["total_commission_usd", "rounding_adjustment_usd"] as const).some(
      (key) => key in totals && (totals[key] == null || !Number.isFinite(totals[key])),
    );
  if (
    result.status === "error" ||
    result.items.some((i) => i.status === "error") ||
    result.scenarios.some((s) => s.status === "error" || hasMissingTotal(s)) ||
    hasMissingTotal(result)
  ) {
    throw new Error(
      "Cotización con errores de cálculo: corrige las tarifas sin costo neto ni rack antes de continuar",
    );
  }
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
      (!r.room_type ||
        (occupancyType(r.room_type) ?? r.room_type) ===
          (occupancyType(item.room_type) ?? item.room_type)) &&
      (!item.rate_band ||
        (r.pax_min === item.rate_band.pax_min && r.pax_max === item.rate_band.pax_max)) &&
      (r.season === "ALL" ||
        active.includes(r.season) ||
        (seasons.length === 0 && !!r.valid_from && !!r.valid_to)),
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
      const type = occupancyType(item.room_type) ?? item.room_type;
      const paying = normalizeRooms(input.rooming.paying)[type] ?? 0;
      const tc = item.applies_tc ? (normalizeRooms(input.rooming.tc)[type] ?? 0) : 0;
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
  const policy = resolvePricingPolicy(input);
  validDate(input.start_date);
  const hasHotels = input.days.some((d) =>
    d.items.some((i) => i.included && i.pricing_unit === "per_room"),
  );
  const rooms = hasHotels
    ? resolveRooming(input.rooming, input.pax_paying, input.tc_count)
    : undefined;
  // Do not mutate the caller or freeze automatic room counts into explicit ones.
  const configuredInput = rooms ? { ...input, rooming: rooms.rooming } : input;
  const ids = new Set<string>(),
    dayNumbers = new Set<number>(),
    coverages = new Map<string, string>();
  const items: ItemResult[] = [];
  for (const day of [...input.days].sort((a, b) => a.day_number - b.day_number)) {
    if (dayNumbers.has(day.day_number)) throw new Error("Duplicate day number");
    dayNumbers.add(day.day_number);
    const date = dateForDay(input.start_date, day.day_number);
    // A requested room variant must not silently disappear because a template
    // only linked DBL/SGL. Generic hotel rates can cover all requested types.
    const hotels = new Map<string, PricingItem[]>();
    for (const i of day.items.filter(
      (i) => i.included && i.pricing_unit === "per_room" && i.lodging_key,
    )) {
      const group = hotels.get(i.lodging_key!) ?? [];
      group.push(i);
      hotels.set(i.lodging_key!, group);
    }
    for (const hotel of hotels.values()) {
      const types = hotel.map((i) =>
        occupancyType(
          parsePricingConfig(i.pricing_unit, i.pricing_config).room_type ?? i.room_type,
        ),
      );
      if (types.some((t) => !t)) continue;
      const requested = { ...configuredInput.rooming.paying };
      if (hotel.some((i) => i.applies_tc))
        for (const [type, n] of Object.entries(configuredInput.rooming.tc))
          requested[type] = (requested[type] ?? 0) + n;
      // Old pilot room keys also encode hotel/category; preserve those snapshots.
      if (Object.keys(requested).some((t) => !occupancyType(t))) continue;
      for (const [type, n] of Object.entries(requested))
        if (n > 0 && !types.includes(occupancyType(type)))
          throw new Error(
            `Falta tarifa de habitación ${type}: ${hotel[0]!.label ?? hotel[0]!.id} (día ${day.day_number})`,
          );
    }
    for (const original of day.items) {
      const item = {
        ...original,
        adjustment_pct: adjustmentPctSchema.parse(original.adjustment_pct ?? 0),
        adjustment_note: original.adjustment_note ?? null,
      };
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
        const signature = JSON.stringify({
          ...item,
          id: undefined,
          unit_cost_original: item.price_overridden ? item.unit_cost_original : undefined,
        });
        const previous = coverages.get(item.coverage_key);
        if (previous && previous !== signature) throw new Error("Inconsistent multi-day copies");
        if (!previous && day.day_number !== item.coverage_start_day)
          throw new Error("Missing multi-day first item");
        coverages.set(item.coverage_key, signature);
        covered = day.day_number !== item.coverage_start_day;
      }
      if (!item.included || covered) {
        items.push({
          status: "ok",
          id: item.id,
          day_number: day.day_number,
          date,
          quantity: 0,
          unit_cost_original: 0,
          unit_cost_usd: 0,
          base_cost_usd: 0,
          adjustment_pct: item.adjustment_pct,
          adjustment_amount_usd: 0,
          total_cost_usd: 0,
          total_margin_usd: 0,
          covered,
        });
        continue;
      }
      const warnings: string[] = [];
      const label = item.label ?? item.id;
      const config = parsePricingConfig(item.pricing_unit, item.pricing_config);
      nonnegative(item.qty, "qty");
      Object.assign(item, config);
      const ratePax =
        item.pricing_unit === "per_vehicle"
          ? input.pax_paying +
            input.tc_count +
            count(input.staff?.drivers ?? 0, "drivers") +
            count(input.staff?.guides ?? 0, "guides")
          : input.pax_paying + (item.applies_tc ? input.tc_count : 0);
      let autoVehicleRate: Rate | undefined;
      if (
        item.pricing_unit === "per_vehicle" &&
        (!item.vehicle_segment || input.vehicles[item.vehicle_segment] === undefined)
      ) {
        autoVehicleRate = selectRate(item, date, ratePax, input.seasons);
        const capacity = autoVehicleRate.pax_max ?? item.vehicle_max_pax;
        if (capacity != null && capacity < ratePax)
          throw new Error(`Vehicle rate band/capacity required: ${label} (${ratePax} personas)`);
        item.vehicle_segment ??= `auto:${item.coverage_key ?? item.id}`;
        config.vehicle_segment = item.vehicle_segment;
        config.rate_band = { pax_min: autoVehicleRate.pax_min, pax_max: autoVehicleRate.pax_max };
        warnings.push(
          `${label}: vehículo por defecto, 1 unidad; tramo ${autoVehicleRate.pax_min ?? 0}–${capacity ?? "sin límite informado"} para ${ratePax} personas (pagantes + TC + staff).${capacity == null ? " Revisar la capacidad del vehículo." : ""}`,
        );
      }
      let roomParts: { type: string; quantity: number }[] | undefined;
      if (item.pricing_unit === "per_room") {
        if (item.nights == null) {
          item.nights = 1;
          warnings.push(`${label}: 1 noche por defecto.`);
        }
        if (count(item.nights, "nights") < 1) throw new Error(`Invalid nights: ${label}`);
        const type = occupancyType(item.room_type);
        // Legacy non-occupancy labels (e.g. STANDARD) may be explicitly present
        // in older rooming. Otherwise this service prices the selected rooms.
        const legacySelected =
          item.room_type &&
          ((configuredInput.rooming.paying[item.room_type] ?? 0) > 0 ||
            (configuredInput.rooming.tc[item.room_type] ?? 0) > 0);
        if (type || legacySelected || item.room_type === "QUAD") {
          if (type) item.room_type = type;
          roomParts = [{ type: item.room_type!, quantity: quantity(configuredInput, item) }];
        } else {
          warnings.push(
            `${label}: sin tipo de ocupación; se usa la distribución de la cotización o DBL/SGL por defecto con las tarifas disponibles.`,
          );
          const types = new Set([
            ...Object.keys(configuredInput.rooming.paying),
            ...Object.keys(configuredInput.rooming.tc),
          ]);
          roomParts = [...types].map((type) => ({
            type,
            quantity: quantity(configuredInput, { ...item, room_type: type }),
          }));
        }
        config.nights = item.nights;
        const resolvedType =
          occupancyType(item.room_type) ?? roomParts.find((r) => r.quantity > 0)?.type;
        if (resolvedType && ["SGL", "DBL", "TPL", "MAT"].includes(resolvedType))
          config.room_type = resolvedType as NonNullable<PartialPricingConfig["room_type"]>;
      }
      const qty = roomParts
        ? roomParts.reduce((n, r) => n + r.quantity, 0)
        : autoVehicleRate
          ? 1
          : quantity(configuredInput, item);
      // An unused room variant has no cost and requires no matching rate.
      if (qty === 0) {
        items.push({
          status: "ok",
          id: item.id,
          day_number: day.day_number,
          date,
          quantity: 0,
          unit_cost_original: 0,
          unit_cost_usd: 0,
          base_cost_usd: 0,
          adjustment_pct: item.adjustment_pct,
          adjustment_amount_usd: 0,
          total_cost_usd: 0,
          total_margin_usd: 0,
          covered: false,
          ...(warnings.length ? { warning: warnings.join(" ") } : {}),
        });
        continue;
      }
      let native: number;
      const roomBreakdown: NonNullable<ItemResult["room_breakdown"]> = [];
      if (item.price_overridden) {
        if (!item.override_note?.trim() || item.unit_cost_original === undefined)
          throw new Error("Override requires price and note");
        native = nonnegative(item.unit_cost_original, "override");
      } else {
        const parts = roomParts?.filter((r) => r.quantity > 0) ?? [
          { type: undefined, quantity: qty },
        ];
        let totalNative = 0;
        let missingPrice = false;
        for (const part of parts) {
          const rate =
            autoVehicleRate ??
            selectRate(
              part.type ? { ...item, room_type: part.type } : item,
              date,
              ratePax,
              input.seasons,
            );
          const price = rate.price_net ?? rate.price_rack;
          if (price == null) {
            missingPrice = true;
            break;
          }
          nonnegative(price, "price");
          totalNative += price * part.quantity;
          if (part.type)
            roomBreakdown.push({
              room_type: part.type,
              quantity: part.quantity,
              unit_cost_original: price,
              total_cost_usd: adjustedCost(
                (price * part.quantity) / fx(input, item.currency),
                item.adjustment_pct,
              ),
            });
        }
        if (missingPrice) {
          items.push({
            status: "error",
            id: item.id,
            day_number: day.day_number,
            date,
            quantity: qty,
            unit_cost_usd: null,
            base_cost_usd: null,
            adjustment_pct: item.adjustment_pct,
            adjustment_amount_usd: null,
            total_cost_usd: null,
            total_margin_usd: null,
            covered: false,
            warning: [`${item.id}: sin costo neto ni rack`, ...warnings].join(" "),
          });
          continue;
        }
        native = totalNative / qty;
      }
      const usd = native / fx(input, item.currency),
        baseCost = qty * usd,
        cost = adjustedCost(baseCost, item.adjustment_pct);
      items.push({
        status: "ok",
        id: item.id,
        day_number: day.day_number,
        date,
        quantity: qty,
        unit_cost_original: native,
        unit_cost_usd: usd,
        base_cost_usd: baseCost,
        adjustment_pct: item.adjustment_pct,
        adjustment_amount_usd: cost - baseCost,
        total_cost_usd: cost,
        // Andrea: the adjustment is passed through without margin (2026-10-11).
        total_margin_usd: item.margin_applicable
          ? marginAmount(baseCost, policy.margin_pct, policy.margin_mode)
          : 0,
        covered: false,
        ...(item.pricing_unit === "per_room" || item.pricing_unit === "per_vehicle"
          ? { pricing_config: config }
          : {}),
        ...(roomBreakdown.length ? { room_breakdown: roomBreakdown } : {}),
        ...(warnings.length ? { warning: warnings.join(" ") } : {}),
      });
    }
  }
  // Known amounts are used only when every billable item and scenario is valid.
  const cost = items.reduce((n, i) => n + (i.total_cost_usd ?? 0), 0),
    margin = items.reduce((n, i) => n + (i.total_margin_usd ?? 0), 0);
  const gross = (cost + margin) / (1 - policy.commission_pct / 100);
  const commission = gross - (cost + margin);
  const per = input.rounding_rule.per_pax
    ? round(gross / input.pax_paying, input.rounding_rule)
    : cents(round(gross, input.rounding_rule) / input.pax_paying);
  const total = input.rounding_rule.per_pax
    ? cents(per * input.pax_paying)
    : round(gross, input.rounding_rule);
  const single = (input.single_supplements ?? []).reduce(
    (sum, s) =>
      sum +
      (((nonnegative(s.single_cost, "single") - nonnegative(s.double_cost, "double") / 2) /
        fx(input, s.currency)) *
        count(s.nights, "nights") *
        (s.margin_applicable ? 1 + marginAmount(1, policy.margin_pct, policy.margin_mode) : 1)) /
        (1 - policy.commission_pct / 100),
    0,
  );
  const scenarios = (input.pax_scenarios ?? []).map((s) => {
    const result = calculateQuote({ ...input, ...s, pax_scenarios: [] });
    return {
      status: result.status,
      warnings: result.warnings,
      pax_paying: s.pax_paying,
      tc_count: s.tc_count,
      total_cost_usd: result.total_cost_usd,
      total_margin_usd: result.total_margin_usd,
      total_commission_usd: result.total_commission_usd,
      rounding_adjustment_usd: result.rounding_adjustment_usd,
      total_price_usd: result.total_price_usd,
      price_per_pax_usd: result.price_per_pax_usd,
      single_supplement_pp: result.single_supplement_pp,
    };
  });
  const failed =
    items.some((i) => i.status === "error") || scenarios.some((s) => s.status === "error");
  return {
    status: failed ? "error" : "ok",
    pricing_policy: policy,
    ...(rooms ? { effective_rooming: rooms.rooming } : {}),
    total_cost_usd: failed ? null : cents(cost),
    total_margin_usd: failed ? null : cents(margin),
    total_commission_usd: failed ? null : cents(commission),
    rounding_adjustment_usd: failed
      ? null
      : cents(total - cents(cost) - cents(margin) - cents(commission)) || 0,
    total_price_usd: failed ? null : total,
    price_per_pax_usd: failed ? null : per,
    single_supplement_pp: failed ? null : cents(single),
    items,
    days: [...dayNumbers].map((day_number) => {
      const dayItems = items.filter((i) => i.day_number === day_number);
      const failedDay = dayItems.some((i) => i.status === "error");
      return {
        day_number,
        total_cost_usd: failedDay
          ? null
          : cents(dayItems.reduce((n, i) => n + (i.total_cost_usd ?? 0), 0)),
        total_margin_usd: failedDay
          ? null
          : cents(dayItems.reduce((n, i) => n + (i.total_margin_usd ?? 0), 0)),
      };
    }),
    warnings: [
      ...(rooms?.warnings ?? []),
      ...items.flatMap((i) => (i.warning ? [i.warning] : [])),
      ...scenarios.flatMap((s) =>
        s.warnings.map((w) => `Escenario ${s.pax_paying}+${s.tc_count} TC: ${w}`),
      ),
    ],
    scenarios,
  };
}
