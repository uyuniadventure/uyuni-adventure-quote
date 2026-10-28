import { db, json, unwrap } from "../db";
import { resolvePricingPolicy, dateForDay } from "../pricing";
import { initialRoomAlternatives } from "./room-defaults";
import { proposeRooming } from "./selection-model";
import { parsePricingConfig } from "../pricing/config";
import type { Tables, Enums, Json } from "../../types/db";
import {
  calculateSavedQuote,
  type QuoteBasics,
  type QuoteItemInput,
  type loadQuote,
} from "./index";
import { snapshotBlock, groupCoveredDays } from "./day-content";
import { applyTemplateDefaults } from "./template-defaults";
import { loadTemplateSource, type TemplateSource } from "./template-source";
import { prepareDayText } from "./day-text";

export type TemplateQuoteBasics = Pick<
  QuoteBasics,
  "client_id" | "language" | "start_date" | "pax_paying"
> &
  Partial<Omit<QuoteBasics, "client_id" | "language" | "start_date" | "pax_paying">>;

export function serviceItem(
  row: {
    slot_key?: string;
    is_default?: boolean;
    billing?: string;
    span_days?: number;
    tc_policy?: string;
    margin_mode?: string;
    margin_pct?: number | null;
    service_id: string | null;
    qty: number;
    applies_tc: boolean | null;
    margin_applicable: boolean | null;
    included?: boolean;
    is_optional?: boolean;
    multi_day_span?: number;
    coverage_key?: string | null;
    coverage_start_day?: number | null;
    pricing_config?: Json;
    item_snapshot?: Json | null;
    source_kind?: "hotel";
  },
  day: number,
  source: Pick<TemplateSource, "services" | "rates">,
): QuoteItemInput {
  if (row.item_snapshot) {
    const {
      id: _id,
      quote_day_id: _day,
      created_at: _created,
      updated_at: _updated,
      ...saved
    } = row.item_snapshot as unknown as Tables<"quote_items">;
    const frozen = saved.pricing_snapshot as Record<string, unknown>;
    const override = (row.pricing_config ?? {}) as Record<string, unknown>;
    const unit = (override["pricing_unit"] ?? saved.pricing_unit) as Enums<"pricing_unit">;
    const config = { ...(frozen["pricing_config"] as object), ...override };
    return {
      ...saved,
      is_default: row.is_default ?? saved.is_default,
      selected: row.is_default ?? saved.selected,
      qty: row.qty,
      pricing_unit: unit,
      applies_tc: row.applies_tc ?? saved.applies_tc,
      margin_applicable: row.margin_applicable ?? saved.margin_applicable,
      included: row.included ?? saved.included,
      day_span: row.multi_day_span ?? saved.day_span,
      adjustment_pct: 0,
      adjustment_note: null,
      pricing_snapshot: json({
        ...frozen,
        ...override,
        pricing_config: parsePricingConfig(
          unit,
          Object.fromEntries(
            Object.entries(config).filter(([key]) =>
              ["room_type", "nights", "vehicle_segment", "rate_band", "staff_type"].includes(key),
            ),
          ),
        ),
        coverage_key: row.coverage_key ?? frozen["coverage_key"],
        coverage_start_day: row.coverage_start_day ?? day,
        _source_link: row,
        _source_pricing_config: row.pricing_config ?? {},
      }),
    };
  }
  if (!row.service_id) throw new Error("Service or frozen snapshot required");
  const s = source.services.find((s) => s.id === row.service_id);
  if (!s) throw new Error("Servicio no accesible en el catálogo");
  if (!["activo", "pendiente"].includes(s.status)) throw new Error(`Servicio inactivo: ${s.sku}`);
  if (!s.pricing_unit || !s.currency)
    throw new Error(`Approve missing pricing unit/currency: ${s.sku}`);
  const rates = source.rates.filter((r) => r.service_id === s.id && r.pricing_enabled !== false);
  const config = (row.pricing_config ?? {}) as {
    pricing_unit?: Enums<"pricing_unit">;
    description?: string;
  };
  if (
    config.pricing_unit &&
    !["per_person", "per_group", "per_room", "per_vehicle", "per_staff", "per_unit"].includes(
      config.pricing_unit,
    )
  )
    throw new Error(`Invalid template pricing unit: ${s.sku}`);
  const unit = config.pricing_unit ?? s.pricing_unit;
  // Older link JSON also holds import provenance/description/unit overrides.
  // Validate only the calculation fields, preserving that metadata separately.
  const raw = row.pricing_config as Record<string, unknown> | null;
  const calculationConfig = parsePricingConfig(
    unit,
    Object.fromEntries(
      Object.entries(raw ?? {}).filter(([key]) =>
        ["room_type", "nights", "vehicle_segment", "rate_band", "staff_type"].includes(key),
      ),
    ),
  );
  const span =
    row.billing === "per_service" ? (row.span_days ?? 1) : (row.multi_day_span ?? s.multi_day_span);
  return {
    ...(row.slot_key
      ? {
          slot_key: row.slot_key,
          is_default: row.is_default ?? true,
          selected: row.is_default ?? true,
          billing: row.billing ?? "per_day",
          span_days: span,
          tc_policy: row.applies_tc === true ? "charged" : (row.tc_policy ?? "free"),
          margin_mode: row.margin_mode ?? "inherit",
          margin_pct: row.margin_pct ?? null,
        }
      : {}),
    service_id: s.id,
    sku: s.sku,
    description: config.description ?? s.name,
    type: s.type,
    pricing_unit: unit,
    qty: row.qty,
    unit_cost_original: 0,
    unit_cost_usd: 0,
    currency: s.currency,
    supplier_id: s.supplier_id,
    applies_tc: row.applies_tc ?? s.applies_tc_default,
    margin_applicable: row.margin_applicable ?? s.margin_applicable_default,
    included: row.included ?? true,
    day_span: span,
    meal_plan: s.meal_plan,
    pricing_snapshot: json({
      _source_link: row,
      _source_pricing_config: row.pricing_config ?? {},
      is_optional: row.is_optional ?? false,
      rates,
      room_type: s.room_type,
      lodging_key:
        unit === "per_room"
          ? `${s.supplier_id ?? s.id}:${s.source ?? ""}:${s.location ?? ""}`
          : undefined,
      // A day→hotel link covers that day's night unless explicitly configured.
      nights: unit === "per_room" ? 1 : undefined,
      vehicle_segment: s.vehicle_type,
      vehicle_max_pax: s.capacity ?? s.vehicle_max_pax,
      capacity: s.capacity,
      coverage_key: row.coverage_key ?? (span > 1 ? `${s.id}:${day}` : undefined),
      coverage_start_day: row.coverage_start_day ?? day,
      ...(typeof row.pricing_config === "object" ? row.pricing_config : {}),
      pricing_config: calculationConfig,
      service: s,
    }),
  };
}

function prepareDraftServiceItem(
  row: Parameters<typeof serviceItem>[0],
  day: number,
  source: Pick<TemplateSource, "services" | "rates">,
): { item?: QuoteItemInput; issue?: string } {
  if (!row.item_snapshot && row.service_id) {
    const service = source.services.find((candidate) => candidate.id === row.service_id);
    if (service && (!service.pricing_unit || !service.currency)) {
      const missing = [
        !service.pricing_unit ? "unidad de cobro" : null,
        !service.currency ? "moneda" : null,
      ].filter(Boolean);
      return {
        issue: `${service.sku}: falta ${missing.join(" y ")}; selecciona un servicio válido en el borrador.`,
      };
    }
  }
  return { item: serviceItem(row, day, source) };
}

function forceIncompleteDraft(result: ReturnType<typeof calculateSavedQuote>, warnings: string[]) {
  if (!warnings.length) return result;
  result.status = "error";
  result.warnings = [...new Set([...result.warnings, ...warnings])];
  result.total_cost_usd = null;
  result.total_adjustments_usd = null;
  result.total_margin_usd = null;
  result.total_commission_usd = null;
  result.rounding_adjustment_usd = null;
  result.total_price_usd = null;
  result.price_per_pax_usd = null;
  result.single_supplement_pp = null;
  result.days = result.days.map((day) => ({
    ...day,
    total_cost_usd: null,
    total_margin_usd: null,
  }));
  result.scenarios = result.scenarios.map((scenario) => ({
    ...scenario,
    status: "error",
    total_cost_usd: null,
    total_adjustments_usd: null,
    total_margin_usd: null,
    total_commission_usd: null,
    rounding_adjustment_usd: null,
    total_price_usd: null,
    price_per_pax_usd: null,
    single_supplement_pp: null,
  }));
  return result;
}

/** All preparation is read-only; one RPC commits the snapshot and calculation. */
export async function createQuoteFromTemplate(
  templateId: string,
  input: TemplateQuoteBasics,
): Promise<Tables<"quotes">> {
  const source = await loadTemplateSource(templateId, input.client_id);
  const { template, client } = source;
  const fx: Record<string, number> = { USD: 1 };
  for (const rate of [...source.fx].sort((a, b) => a.valid_from.localeCompare(b.valid_from))) {
    if (rate.valid_from.slice(0, 10) <= input.start_date) fx[rate.currency] = rate.rate_to_usd;
  }
  const category = input.category ?? template.category;
  if (!category)
    throw new Error("La categoría comercial de origen no tiene equivalencia autorizada");
  const basics = applyTemplateDefaults(
    {
      ...input,
      client_type: client.type,
      category,
      tour_sku: template.sku,
      tc_count: input.tc_count ?? 0,
      rooming: input.rooming ?? { paying: {}, tc: {} },
      vehicles: input.vehicles ?? {},
      fx_snapshot: input.fx_snapshot ?? fx,
      rounding_rule: input.rounding_rule ?? { mode: "none", increment: 1 },
    },
    template.quote_defaults,
  );
  const settings = source.settings[0];
  if (template.import_v2_route && !input.rooming) {
    basics.rooming = { paying: {}, tc: {} };
    for (const r of proposeRooming(basics.pax_paying, basics.tc_count)) {
      const group = r.for_tc ? basics.rooming.tc : basics.rooming.paying;
      group[r.room_type] = (group[r.room_type] ?? 0) + r.count;
    }
  }
  if (!settings) throw new Error("Falta la configuración global de precios");
  const policy = resolvePricingPolicy({
    ...basics,
    client_pricing: client,
    admin_pricing: settings,
  });
  const quote = {
    ...basics,
    ...policy,
    template_id: templateId,
    staff: input.staff ?? basics.staff ?? { drivers: 0, guides: 0 },
    pricing_config: {
      seasons: basics.seasons ?? [],
      single_supplements: basics.single_supplements ?? [],
      unresolved: template.import_warnings,
      source_template: template,
    },
  };
  const ordered = [...source.templateDays].sort((a, b) => a.day_number - b.day_number);
  if (ordered.length !== template.days || ordered.some((d, i) => d.day_number !== i + 1))
    throw new Error("La plantilla no tiene todos sus días consecutivos");
  const days = ordered.map((td) => {
    const block = source.blocks.find((b) => b.id === td.block_id);
    if (!block || block.status === "inactivo")
      throw new Error(`Día ${td.day_number}: bloque no disponible`);
    const frozenBlock = snapshotBlock(block, source);
    const text = prepareDayText(frozenBlock, basics.language);
    const dayOverrides = {
      ...text.overrides,
      ...(td.import_title ? { title: { [basics.language]: td.import_title } } : {}),
      ...(td.import_lodging
        ? { accommodation_text: { [basics.language]: td.import_lodging } }
        : {}),
      ...(td.import_meals ? { meals: td.import_meals.split(/\s*·\s*/).filter(Boolean) } : {}),
      ...(td.import_note ? { client_note: { [basics.language]: td.import_note } } : {}),
    };
    const rows = source.items.filter(
      (i) => i.block_id === block.id && (i.variant_key == null || i.variant_key === td.variant_key),
    );
    const imported = source.importLinks.filter((i) => i.day_number === td.day_number);
    const preparedItems = [...rows, ...imported].map((i) =>
      prepareDraftServiceItem(i, td.day_number, source),
    );
    const omittedEconomicItems = preparedItems.flatMap(({ issue }) => (issue ? [issue] : []));
    const items = initialRoomAlternatives(
      preparedItems.flatMap(({ item }) => (item ? [item] : [])),
      basics.rooming,
      basics.pax_paying,
      basics.tc_count,
      dateForDay(basics.start_date, td.day_number),
    );
    if (template.import_v2_route) {
      const people =
        basics.pax_paying +
        basics.tc_count +
        Number(quote.staff.drivers ?? 0) +
        Number(quote.staff.guides ?? 0);
      const segmentVehicles = Math.max(
        1,
        ...source.importLinks
          .filter((l) => l.billing === "per_service")
          .map((l) =>
            Math.ceil(
              people / (source.services.find((s) => s.id === l.service_id)?.capacity ?? people),
            ),
          ),
      );
      for (const i of items) {
        if (i.pricing_unit === "per_vehicle") {
          const s = source.services.find((s) => s.id === i.service_id);
          i.qty_override = Math.ceil(people / (s?.capacity ?? people));
        }
        if (i.slot_key === "STAFF") i.qty_override = segmentVehicles;
      }
      const border = items.filter((i) => i.slot_key === "TRASLADO_FRONTERA");
      const available = border.filter((i) => {
        const snap = i.pricing_snapshot as unknown as {
          rates: {
            pax_min: number | null;
            pax_max: number | null;
            valid_from: string | null;
            valid_to: string | null;
          }[];
        };
        const date = dateForDay(basics.start_date, td.day_number);
        return snap.rates.some(
          (r) =>
            (r.pax_min ?? 1) <= people &&
            (r.pax_max ?? Infinity) >= people &&
            (!r.valid_from || r.valid_from <= date) &&
            (!r.valid_to || r.valid_to >= date),
        );
      });
      const preferred = available.find((i) => i.is_default) ?? available[0];
      if (border.length && !preferred)
        throw new Error(`Traslado frontera sin tarifa autorizada para ${people} pasajero(s)`);
      border.forEach((i) => {
        i.selected = i === preferred;
        i.selection_source = "auto";
      });
    }
    const links = source.links
      .filter((l) => l.block_id === block.id)
      .sort((a, b) => a.order - b.order);
    for (const link of links) {
      const module = source.modules.find((m) => m.id === link.module_id);
      const mi = source.moduleItems.filter((i) => i.module_id === link.module_id);
      if (!module || module.status === "inactivo" || !mi.length)
        throw new Error(`Día ${td.day_number}: módulo vacío o no disponible`);
      const preparedModuleItems = mi.map((i) => prepareDraftServiceItem(i, td.day_number, source));
      omittedEconomicItems.push(
        ...preparedModuleItems.flatMap(({ issue }) => (issue ? [issue] : [])),
      );
      items.push(...preparedModuleItems.flatMap(({ item }) => (item ? [item] : [])));
    }
    if (block.hotel_service_id && !items.some((i) => i.service_id === block.hotel_service_id)) {
      const preparedHotel = prepareDraftServiceItem(
        {
          service_id: block.hotel_service_id,
          source_kind: "hotel",
          qty: 1,
          applies_tc: null,
          margin_applicable: null,
          multi_day_span: 1,
        },
        td.day_number,
        source,
      );
      if (preparedHotel.item) items.push(preparedHotel.item);
      if (preparedHotel.issue) omittedEconomicItems.push(preparedHotel.issue);
    }
    const ownItemCount = items.filter((item) => {
      const start = (item.pricing_snapshot as { coverage_start_day?: number }).coverage_start_day;
      return start == null || start === td.day_number;
    }).length;
    const requiredServiceCount =
      omittedEconomicItems.length > 0 || ownItemCount === 0
        ? Math.max(1, ownItemCount + omittedEconomicItems.length)
        : undefined;
    return {
      day_number: td.day_number,
      source_block_id: block.id,
      block_snapshot: json(frozenBlock),
      overrides: json(dayOverrides),
      title: td.import_title || text.title,
      description: text.description,
      includes: text.includes,
      excludes: text.excludes,
      route_from: block.route_from ?? (td.day_number === 1 ? template.route_from : null),
      route_to: block.route_to ?? (td.day_number === template.days ? template.route_to : null),
      snapshot: json({
        reviewed: text.reviewed,
        source_language: text.source_language,
        language: basics.language,
        places: block.places,
        hotel_service_id: block.hotel_service_id,
        hotel_name: td.import_lodging,
        meals: td.import_meals,
        note: td.import_note,
        omitted_economic_items: omittedEconomicItems,
        ...(requiredServiceCount ? { required_service_count: requiredServiceCount } : {}),
        source_day: td,
        block,
        translation: text.translation,
        modules: links.map((l) => ({
          link: l,
          module: source.modules.find((m) => m.id === l.module_id),
          translations: source.moduleTexts.filter((t) => t.module_id === l.module_id),
        })),
      }),
      items,
    };
  });
  for (const day of days) {
    for (const item of [...day.items]) {
      if ((item.day_span ?? 1) <= 1) continue;
      // Package segments are one purchase on day_from. Later days display a
      // coverage label; no extra quote_item is persisted for those days.
      if (template.import_v2_route && item.billing === "per_service") continue;
      const pricing = item.pricing_snapshot as { coverage_key: string; coverage_start_day: number };
      if (day.day_number !== pricing.coverage_start_day) continue;
      for (let n = day.day_number + 1; n < day.day_number + (item.day_span ?? 1); n++) {
        const target = days.find((d) => d.day_number === n);
        if (!target) throw new Error(`Servicio multi-día fuera del itinerario: ${item.sku}`);
        if (
          !target.items.some(
            (i) =>
              (i.pricing_snapshot as { coverage_key?: string })?.coverage_key ===
              pricing.coverage_key,
          )
        )
          target.items.push(structuredClone(item));
      }
    }
  }
  // Temporary identifiers are mapped to database-generated item IDs inside the RPC.
  let creationOrder = 0;
  const prepared = groupCoveredDays(days).map((d) => ({
    ...d,
    id: crypto.randomUUID(),
    items: d.items.map((i) => {
      const id = crypto.randomUUID();
      return {
        ...i,
        id,
        adjustment_pct: 0,
        adjustment_note: null,
        pricing_snapshot: json({
          ...(i.pricing_snapshot as object),
          _creation_item_id: id,
          _creation_order: creationOrder++,
        }),
      };
    }),
  }));
  const data = {
    quote,
    days: prepared,
    items: prepared.flatMap((d) => d.items.map((i) => ({ ...i, quote_day_id: d.id }))),
  } as unknown as Awaited<ReturnType<typeof loadQuote>>;
  const incompleteWarnings = days.flatMap((day) => {
    const omitted = (day.snapshot as { omitted_economic_items?: string[] }).omitted_economic_items;
    return omitted ?? [];
  });
  const result = forceIncompleteDraft(calculateSavedQuote(data), incompleteWarnings);
  return unwrap(
    await db.rpc("create_quote_from_template", {
      p_template: templateId,
      p_quote: json(quote),
      p_days: json(prepared),
      p_source: json(source),
      p_result: json(result),
    }),
  );
}
