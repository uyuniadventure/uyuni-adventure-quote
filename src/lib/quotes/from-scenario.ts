import { prepareScenarioLines } from "../catalog/tour-scenarios";
import { db, json, unwrap } from "../db";
import { resolvePricingPolicy } from "../pricing";
import type { Json, Tables } from "../../types/db";
import { calculateSavedQuote, type QuoteBasics, type loadQuote } from "./index";
import { loadCostScenarioSource, type CostScenarioRequest, type CostScenarioSource } from "./scenario-source";
import { SCENARIO_IMPORT_OVERRIDE_NOTE } from "./scenario-origin";
import { splitDescriptiveLodging } from "./document-model";
import { createQuoteFromTemplate } from "./from-template";

export interface ScenarioNarrativeDay {
  day_number: number;
  title: string;
  description: string;
  note: string | null;
  source: "template_translation";
}

const LODGING_LINE = /(?:\r?\n)+Alojamiento\s*:/i;

/** Removes only the explicit structured lodging line. No punctuation or
 * length-based narrative splitting is attempted. */
export function narrativeWithoutLodging(value: string) {
  const match = LODGING_LINE.exec(value);
  return (match ? value.slice(0, match.index) : value).trim();
}

export async function loadSeparatedTemplateNarrative(
  templateId: string,
  language: string,
): Promise<ScenarioNarrativeDay[]> {
  const templateDays = unwrap(
    await db
      .from("template_days")
      .select("day_number,block_id,import_title,import_note")
      .eq("template_id", templateId)
      .order("day_number"),
  );
  const blockIds = templateDays.map((day) => day.block_id);
  if (!blockIds.length) return [];
  const translations = unwrap(
    await db
      .from("day_block_translations")
      .select("block_id,lang,title,description")
      .in("block_id", blockIds)
      .in("lang", [...new Set([language, "es"])]),
  );
  return selectSeparatedTemplateNarrative(templateDays, translations, language);
}

export function selectSeparatedTemplateNarrative(
  templateDays: readonly {
    day_number: number;
    block_id: string;
    import_title: string | null;
    import_note: string | null;
  }[],
  translations: readonly {
    block_id: string;
    lang: string;
    title: string;
    description: string;
  }[],
  language: string,
) {
  return templateDays.flatMap((day) => {
    // Consolidated-import rows retain import_title. Those are precisely the
    // rows whose title may contain the combined narrative, so do not split or
    // reinterpret them here.
    if (day.import_title?.trim()) return [];
    const text =
      translations.find((candidate) => candidate.block_id === day.block_id && candidate.lang === language) ??
      translations.find((candidate) => candidate.block_id === day.block_id && candidate.lang === "es");
    const title = text?.title.trim() ?? "";
    const description = narrativeWithoutLodging(text?.description ?? "");
    if (!title || !description) return [];
    return [{
      day_number: day.day_number,
      title,
      description,
      note: day.import_note?.trim() || null,
      source: "template_translation" as const,
    }];
  });
}

export type ScenarioQuoteBasics = Pick<
  QuoteBasics,
  "client_id" | "language" | "start_date" | "pax_paying"
> & Partial<Omit<QuoteBasics, "client_id" | "language" | "start_date" | "pax_paying">>;

export function scenarioRequestFromId(
  scenario: Pick<Tables<"tour_cost_scenarios">, "tour_sku" | "rate_year" | "season" | "pax">,
): CostScenarioRequest {
  return {
    tour_sku: scenario.tour_sku,
    year: scenario.rate_year,
    season: scenario.season,
    pax: scenario.pax,
  };
}

/** Converts exact imported totals into frozen quote items without recalculating source quantities. */
export function buildScenarioDays(
  source: CostScenarioSource,
  narrativeDays: readonly ScenarioNarrativeDay[] = [],
) {
  const dayNumber = new Map(source.days.map((day) => [day.id, day.day_number]));
  const prepared = prepareScenarioLines(
    source.lines.map((line) => ({
      id: line.id,
      day_number: dayNumber.get(line.scenario_day_id) ?? 0,
      quantity: line.quantity,
      billing_unit: line.billing_unit as Parameters<typeof prepareScenarioLines>[0][number]["billing_unit"],
      cost_basis: line.cost_basis as "UNIT_RATE" | "LINE_TOTAL",
      original_amount: line.original_amount,
      amount_usd: line.amount_usd,
      charge_once_key: line.charge_once_key,
    })),
    source.scenario.pax,
  );
  const byId = new Map(prepared.map((line) => [line.id, line]));
  let creationOrder = 0;
  return [...source.days]
    .sort((a, b) => a.day_number - b.day_number)
    .map((day) => {
      const own = source.lines.filter((line) => line.scenario_day_id === day.id);
      const missing = own.filter((line) => line.amount_usd == null);
      const sourceRef = day.source_ref as { hotel?: unknown; meals?: unknown } | null;
      const lodging = splitDescriptiveLodging(
        typeof sourceRef?.hotel === "string" ? sourceRef.hotel : "",
        typeof sourceRef?.meals === "string" ? sourceRef.meals : "",
      );
      const narrative = narrativeDays.find((candidate) => candidate.day_number === day.day_number);
      const title = narrative?.title ?? day.title;
      const description = narrative?.description ?? day.description;
      const preservedNote = narrative?.note ??
        (narrative && day.description?.trim() && day.description.trim() !== description?.trim()
          ? day.description.trim()
          : null);
      const items = own.flatMap((line) => {
        const frozen = byId.get(line.id)!;
        if (line.amount_usd == null) return [];
        const id = crypto.randomUUID();
        return [{
          id,
          service_id: line.service_id,
          supplier_id: line.supplier_id,
          sku: line.unresolved_service_ref,
          description: line.description,
          type: "extra" as const,
          pricing_unit: "per_group" as const,
          qty: frozen.charged_quantity,
          unit_cost_original: line.amount_usd,
          unit_cost_usd: line.amount_usd,
          currency: "USD",
          applies_tc: false,
          margin_applicable: true,
          included: true,
          day_span: 1,
          price_overridden: true,
          override_note: SCENARIO_IMPORT_OVERRIDE_NOTE,
          pricing_snapshot: json({
            scenario_line_id: line.id,
            source_ref: line.source_ref,
            source_quantity: line.quantity,
            source_billing_unit: line.billing_unit,
            source_cost_basis: line.cost_basis,
            charge_once_key: line.charge_once_key,
            covered: frozen.covered,
            coverage_start_day: day.day_number,
            _creation_item_id: id,
            _creation_order: creationOrder++,
          }),
        }];
      });
      return {
        id: crypto.randomUUID(),
        day_number: day.day_number,
        source_block_id: null,
        block_snapshot: json({
          content: {
            ...(title ? { title: { es: title } } : {}),
            ...(description ? { description: { es: description } } : {}),
            ...(preservedNote ? { client_note: { es: preservedNote } } : {}),
          },
        }),
        overrides: json({
          ...(lodging.accommodation
            ? { accommodation_text: { es: lodging.accommodation } }
            : {}),
          ...(lodging.meals ? { meals: [lodging.meals] } : {}),
        }),
        title,
        description,
        includes: null,
        excludes: null,
        route_from: null,
        route_to: null,
        snapshot: json({
          cost_scenario_day_id: day.id,
          visible_code: day.visible_code,
          source_ref: day.source_ref,
          source_narrative: {
            title: day.title,
            description: day.description,
            applied_template_narrative: narrative ?? null,
          },
          omitted_economic_items: missing.map(
            (line) => `${line.description}: costo USD pendiente (${line.line_key})`,
          ),
          ...(missing.length ? { required_service_count: own.length } : {}),
        }),
        items,
      };
    });
}

export function applyScenarioReconciliation(
  scenario: Pick<Tables<"tour_cost_scenarios">, "approved_cost_usd" | "detail_cost_usd" | "cost_difference_usd" | "reconciliation_status">,
  result: ReturnType<typeof calculateSavedQuote>,
) {
  if (scenario.reconciliation_status !== "difference") return result;
  result.status = "error";
  result.warnings.push(
    `Conciliación pendiente: presupuesto aprobado USD ${scenario.approved_cost_usd ?? "—"}; ` +
      `suma del desglose USD ${scenario.detail_cost_usd ?? "—"}; ` +
      `diferencia USD ${scenario.cost_difference_usd ?? "—"}. No se modificó ni repartió la diferencia.`,
  );
  return result;
}

/** Read-only preparation followed by one transactional RPC. */
export async function createQuoteFromCostScenario(
  scenarioId: string,
  input: ScenarioQuoteBasics,
  narrativeTemplateId?: string,
): Promise<Tables<"quotes">> {
  const scenario = unwrap(
    await db.from("tour_cost_scenarios").select("*").eq("id", scenarioId).eq("status", "activo").single(),
  );
  if (scenario.pax !== input.pax_paying)
    throw new Error("Los pasajeros no coinciden con el escenario exacto");
  const [source, client, settings, narrativeDays] = await Promise.all([
    loadCostScenarioSource(scenarioRequestFromId(scenario)),
    db.from("clients").select("*").eq("id", input.client_id).single().then(unwrap),
    db.from("pricing_settings").select("*").order("id").then(unwrap),
    narrativeTemplateId
      ? loadSeparatedTemplateNarrative(narrativeTemplateId, input.language)
      : Promise.resolve([]),
  ]);
  if (!settings[0]) throw new Error("Falta la configuración global de precios");
  const base = {
    ...input,
    client_type: client.type,
    category: input.category ?? "COMFORT",
    tour_sku: scenario.tour_sku,
    tc_count: input.tc_count ?? 0,
    rooming: input.rooming ?? { paying: {}, tc: {} },
    vehicles: input.vehicles ?? {},
    staff: input.staff ?? { drivers: 0, guides: 0 },
    fx_snapshot: input.fx_snapshot ?? { USD: 1 },
    rounding_rule: input.rounding_rule ?? { mode: "none", increment: 1 },
  };
  const quote = {
    ...base,
    ...resolvePricingPolicy({ ...base, client_pricing: client, admin_pricing: settings[0] }),
    pricing_config: {
      seasons: input.seasons ?? [],
      single_supplements: input.single_supplements ?? [],
      source_scenario: scenario,
    },
  };
  const days = buildScenarioDays(source, narrativeDays);
  const data = {
    quote,
    days,
    items: days.flatMap((day) => day.items.map((item) => ({ ...item, quote_day_id: day.id }))),
    roomingRows: [],
  } as unknown as Awaited<ReturnType<typeof loadQuote>>;
  const result = applyScenarioReconciliation(scenario, calculateSavedQuote(data));
  result.warnings.push(
    ...source.issues
      .filter((issue) => !issue.resolved_at)
      .map((issue) => `${issue.code}: ${issue.detail}`),
  );
  return unwrap(
    await db.rpc("create_quote_from_cost_scenario", {
      p_scenario: scenarioId,
      p_quote: json(quote),
      p_days: json(days),
      p_result: json(result),
    }),
  );
}

/**
 * Creates from the selected template, using its exact economic scenario when
 * one was explicitly resolved. The scenario path already contains the
 * narrative day snapshots and is the only path that copies economic lines, so
 * days and services cannot be duplicated by combining two drafts.
 */
export async function createQuoteFromTemplateSelection(
  templateId: string,
  scenarioId: string | null,
  input: ScenarioQuoteBasics,
): Promise<Tables<"quotes">> {
  if (!scenarioId) return createQuoteFromTemplate(templateId, input);
  const [template, scenario] = await Promise.all([
    db
      .from("itinerary_templates")
      .select("id,sku,status")
      .eq("id", templateId)
      .single()
      .then(unwrap),
    db
      .from("tour_cost_scenarios")
      .select("id,template_id,tour_sku,rate_year,pax,status")
      .eq("id", scenarioId)
      .single()
      .then(unwrap),
  ]);
  validateTemplateScenarioSelection(template, scenario, input);
  return createQuoteFromCostScenario(scenarioId, input, templateId);
}

export function validateTemplateScenarioSelection(
  template: Pick<Tables<"itinerary_templates">, "id" | "sku" | "status">,
  scenario: Pick<
    Tables<"tour_cost_scenarios">,
    "id" | "template_id" | "tour_sku" | "rate_year" | "pax" | "status"
  >,
  input: Pick<ScenarioQuoteBasics, "start_date" | "pax_paying">,
) {
  if (!["activo", "pendiente"].includes(template.status) || scenario.status !== "activo")
    throw new Error("La plantilla o su escenario económico ya no están disponibles");
  if (
    scenario.tour_sku !== template.sku ||
    (scenario.template_id != null && scenario.template_id !== template.id)
  )
    throw new Error("El escenario económico no corresponde a la plantilla seleccionada");
  const year = Number(input.start_date.match(/^(\d{4})-/)?.[1]);
  if (!Number.isInteger(year) || scenario.rate_year !== year)
    throw new Error("El escenario económico no corresponde al año del viaje");
  if (scenario.pax !== input.pax_paying)
    throw new Error("El escenario económico no corresponde a los pasajeros seleccionados");
}
