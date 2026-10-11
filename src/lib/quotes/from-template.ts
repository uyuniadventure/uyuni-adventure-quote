import { db, json, unwrap } from "../db";
import { calculateQuote, assertCompleteCalculation, resolvePricingPolicy } from "../pricing";
import { parsePricingConfig } from "../pricing/config";
import type { Tables, Enums, Json } from "../../types/db";
import { quotePricingInput, type QuoteBasics, type QuoteItemInput, type loadQuote } from "./index";
import { applyTemplateDefaults } from "./template-defaults";
import { loadTemplateSource, type TemplateSource } from "./template-source";

export type TemplateQuoteBasics = Pick<
  QuoteBasics,
  "client_id" | "language" | "start_date" | "pax_paying"
> &
  Partial<Omit<QuoteBasics, "client_id" | "language" | "start_date" | "pax_paying">>;

function serviceItem(
  row: {
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
  source: TemplateSource,
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
        _source_link: row,
        _source_pricing_config: row.pricing_config ?? {},
      }),
    };
  }
  if (!row.service_id) throw new Error("Service or frozen snapshot required");
  const s = source.services.find((s) => s.id === row.service_id);
  if (!s) throw new Error("Servicio no accesible en el catálogo");
  if (!s.pricing_unit || !s.currency)
    throw new Error(`Approve missing pricing unit/currency: ${s.sku}`);
  const rates = source.rates.filter((r) => r.service_id === s.id);
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
  const span = row.multi_day_span ?? s.multi_day_span;
  return {
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
      vehicle_max_pax: s.vehicle_max_pax,
      coverage_key: row.coverage_key ?? (span > 1 ? `${s.id}:${day}` : undefined),
      coverage_start_day: row.coverage_start_day ?? day,
      ...(typeof row.pricing_config === "object" ? row.pricing_config : {}),
      pricing_config: calculationConfig,
      service: s,
    }),
  };
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
  const basics = applyTemplateDefaults(
    {
      ...input,
      client_type: client.type,
      category: template.category,
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
    const text = source.texts.find((t) => t.block_id === block.id && t.lang === basics.language);
    if (!text) throw new Error(`Día ${td.day_number}: falta traducción ${basics.language}`);
    const rows = source.items.filter((i) => i.block_id === block.id);
    const items = rows.map((i) => serviceItem(i, td.day_number, source));
    const links = source.links
      .filter((l) => l.block_id === block.id)
      .sort((a, b) => a.order - b.order);
    const moduleTexts: string[] = [];
    let reviewed = text.reviewed;
    for (const link of links) {
      const module = source.modules.find((m) => m.id === link.module_id);
      const mt = source.moduleTexts.find(
        (t) => t.module_id === link.module_id && t.lang === basics.language,
      );
      const mi = source.moduleItems.filter((i) => i.module_id === link.module_id);
      if (!module || module.status === "inactivo" || !mi.length)
        throw new Error(`Día ${td.day_number}: módulo vacío o no disponible`);
      if (!mt)
        throw new Error(`Día ${td.day_number}: falta traducción de módulo ${basics.language}`);
      reviewed = reviewed && mt.reviewed;
      moduleTexts.push(`${mt.title}\n${mt.description}`);
      items.push(...mi.map((i) => serviceItem(i, td.day_number, source)));
    }
    if (block.hotel_service_id && !items.some((i) => i.service_id === block.hotel_service_id)) {
      items.push(
        serviceItem(
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
        ),
      );
    }
    if (!items.length) throw new Error(`Día ${td.day_number}: sin servicios`);
    return {
      day_number: td.day_number,
      title: text.title,
      description: [text.description, ...moduleTexts].join("\n\n"),
      includes: text.includes,
      excludes: text.excludes,
      route_from: block.route_from,
      route_to: block.route_to,
      snapshot: json({
        reviewed,
        language: basics.language,
        places: block.places,
        hotel_service_id: block.hotel_service_id,
        source_day: td,
        block,
        translation: text,
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
  const prepared = days.map((d) => ({
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
  const result = calculateQuote(quotePricingInput(data));
  assertCompleteCalculation(result);
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
