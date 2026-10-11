import { db, json, unwrap } from "../db";
import { calculateQuote, type QuoteInput, type QuoteResult, type PricingItem } from "../pricing";
import type { Tables, TablesInsert, TablesUpdate, Enums, Json } from "../../types/db";
import { applyTemplateDefaults } from "./template-defaults";

export interface QuoteBasics extends Omit<QuoteInput, "days"> {
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
type DayInput = Omit<TablesInsert<"quote_days">, "quote_id"> & { items: QuoteItemInput[] };
function basicsPayload(b: QuoteBasics) {
  return {
    ...b,
    pricing_config: { seasons: b.seasons ?? [], single_supplements: b.single_supplements ?? [] },
  };
}
async function create(b: QuoteBasics, days: DayInput[], template?: Tables<"itinerary_templates">) {
  const payload = {
    ...basicsPayload(b),
    ...(template
      ? {
          template_id: template.id,
          tour_sku: template.sku,
          pricing_config: {
            ...basicsPayload(b).pricing_config,
            unresolved: template.import_warnings,
          },
        }
      : {}),
  };
  const q = unwrap(
    await db.rpc("create_quote_snapshot", { p_quote: json(payload), p_days: json(days) }),
  );
  return q;
}
export async function createEmptyQuote(basics: QuoteBasics): Promise<Tables<"quotes">> {
  return create(basics, []);
}

async function translatedBlock(blockId: string, language: string) {
  let result = unwrap(
    await db
      .from("day_block_translations")
      .select("*")
      .eq("block_id", blockId)
      .eq("lang", language),
  );
  if (!result.length) {
    const translated = await db.functions.invoke("translate-block", {
      body: { kind: "day_block", id: blockId, language },
    });
    if (translated.error) throw new Error(translated.error.message);
    result = unwrap(
      await db
        .from("day_block_translations")
        .select("*")
        .eq("block_id", blockId)
        .eq("lang", language),
    );
  }
  if (!result[0]) throw new Error(`Missing ${language} translation: ${blockId}`);
  return result[0];
}
async function serviceItem(
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
  },
  day: number,
): Promise<QuoteItemInput> {
  if (row.item_snapshot) {
    const {
      id: _id,
      quote_day_id: _day,
      created_at: _created,
      updated_at: _updated,
      ...saved
    } = row.item_snapshot as unknown as Tables<"quote_items">;
    return saved;
  }
  if (!row.service_id) throw new Error("Service or frozen snapshot required");
  const s = unwrap(await db.from("services").select("*").eq("id", row.service_id).single());
  if (!s.pricing_unit || !s.currency)
    throw new Error(`Approve missing pricing unit/currency: ${s.sku}`);
  const rates = unwrap(await db.from("service_rates").select("*").eq("service_id", s.id));
  const config = (row.pricing_config ?? {}) as { pricing_unit?: Enums<"pricing_unit">; description?: string };
  if (config.pricing_unit && !["per_person", "per_group", "per_room", "per_vehicle", "per_staff", "per_unit"].includes(config.pricing_unit))
    throw new Error(`Invalid template pricing unit: ${s.sku}`);
  const span = row.multi_day_span ?? s.multi_day_span;
  return {
    service_id: s.id,
    sku: s.sku,
    description: config.description ?? s.name,
    type: s.type,
    pricing_unit: config.pricing_unit ?? s.pricing_unit,
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
      is_optional: row.is_optional ?? false,
      rates,
      room_type: s.room_type,
      vehicle_segment: s.vehicle_type,
      coverage_key: row.coverage_key ?? (span > 1 ? `${s.id}:${day}` : undefined),
      coverage_start_day: row.coverage_start_day ?? day,
      ...(typeof row.pricing_config === "object" ? row.pricing_config : {}),
      service: s,
    }),
  };
}
export async function createQuoteFromTemplate(
  templateId: string,
  basics: QuoteBasics,
): Promise<Tables<"quotes">> {
  const template = unwrap(
    await db.from("itinerary_templates").select("*").eq("id", templateId).single(),
  );
  basics = applyTemplateDefaults(basics, template.quote_defaults);
  const templateDays = unwrap(
    await db.from("template_days").select("*").eq("template_id", templateId).order("day_number"),
  );
  const days: DayInput[] = [];
  for (const td of templateDays) {
    const block = unwrap(await db.from("day_blocks").select("*").eq("id", td.block_id).single());
    const translated = await translatedBlock(block.id, basics.language);
    const rows = unwrap(await db.from("day_block_items").select("*").eq("block_id", block.id));
    const items = await Promise.all(rows.map((r) => serviceItem(r, td.day_number)));
    const links = unwrap(
      await db.from("day_block_modules").select("*").eq("block_id", block.id).order("order"),
    );
    const moduleTexts: string[] = [];
    let reviewed = translated.reviewed;
    for (const link of links) {
      let texts = unwrap(
        await db
          .from("activity_module_translations")
          .select("*")
          .eq("module_id", link.module_id)
          .eq("lang", basics.language),
      );
      if (!texts.length) {
        const result = await db.functions.invoke("translate-block", {
          body: { kind: "activity_module", id: link.module_id, language: basics.language },
        });
        if (result.error) throw result.error;
        texts = unwrap(
          await db
            .from("activity_module_translations")
            .select("*")
            .eq("module_id", link.module_id)
            .eq("lang", basics.language),
        );
      }
      if (!texts[0]) throw new Error("Module translation missing");
      reviewed = reviewed && texts[0].reviewed;
      moduleTexts.push(`${texts[0].title}\n${texts[0].description}`);
      const moduleItems = unwrap(
        await db.from("activity_module_items").select("*").eq("module_id", link.module_id),
      );
      items.push(...(await Promise.all(moduleItems.map((r) => serviceItem(r, td.day_number)))));
    }
    days.push({
      day_number: td.day_number,
      title: translated.title,
      description: [translated.description, ...moduleTexts].join("\n\n"),
      includes: translated.includes,
      excludes: translated.excludes,
      route_from: block.route_from,
      route_to: block.route_to,
      snapshot: json({
        reviewed,
        language: basics.language,
        places: block.places,
        hotel_service_id: block.hotel_service_id,
      }),
      items,
    });
  }
  // A module may introduce a multi-day purchase outside the imported budget links.
  for (const day of days) {
    for (const item of [...day.items]) {
      if ((item.day_span ?? 1) <= 1) continue;
      const pricing = item.pricing_snapshot as { coverage_key: string; coverage_start_day: number };
      if (day.day_number !== pricing.coverage_start_day) continue;
      for (let n = day.day_number + 1; n < day.day_number + (item.day_span ?? 1); n++) {
        const target = days.find((d) => d.day_number === n);
        if (!target) throw new Error(`Multi-day service extends beyond itinerary: ${item.sku}`);
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
  return create(basics, days, template);
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
  return { quote, days, items };
}
export function quotePricingInput(data: Awaited<ReturnType<typeof loadQuote>>): QuoteInput {
  const { quote: q, days, items } = data;
  return {
    start_date: q.start_date,
    pax_paying: q.pax_paying,
    tc_count: q.tc_count,
    rooming: q.rooming,
    vehicles: q.vehicles,
    staff: q.staff,
    margin_pct: q.margin_pct,
    fx_snapshot: q.fx_snapshot,
    rounding_rule: q.rounding_rule,
    pax_scenarios: q.pax_scenarios ?? [],
    ...(q.pricing_config as object),
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
