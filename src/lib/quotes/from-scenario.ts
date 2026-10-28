import { prepareScenarioLines } from "../catalog/tour-scenarios";
import { db, json, unwrap } from "../db";
import { resolvePricingPolicy } from "../pricing";
import type { Json, Tables } from "../../types/db";
import { calculateSavedQuote, type QuoteBasics, type loadQuote } from "./index";
import { loadCostScenarioSource, type CostScenarioRequest, type CostScenarioSource } from "./scenario-source";
import { SCENARIO_IMPORT_OVERRIDE_NOTE } from "./scenario-origin";
import { splitDescriptiveLodging } from "./document-model";

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
export function buildScenarioDays(source: CostScenarioSource) {
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
        block_snapshot: json({}),
        overrides: json({
          ...(lodging.accommodation
            ? { accommodation_text: { es: lodging.accommodation } }
            : {}),
          ...(lodging.meals ? { meals: [lodging.meals] } : {}),
        }),
        title: day.title,
        description: day.description,
        includes: null,
        excludes: null,
        route_from: null,
        route_to: null,
        snapshot: json({
          cost_scenario_day_id: day.id,
          visible_code: day.visible_code,
          source_ref: day.source_ref,
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
): Promise<Tables<"quotes">> {
  const scenario = unwrap(
    await db.from("tour_cost_scenarios").select("*").eq("id", scenarioId).eq("status", "activo").single(),
  );
  if (scenario.pax !== input.pax_paying)
    throw new Error("Los pasajeros no coinciden con el escenario exacto");
  const [source, client, settings] = await Promise.all([
    loadCostScenarioSource(scenarioRequestFromId(scenario)),
    db.from("clients").select("*").eq("id", input.client_id).single().then(unwrap),
    db.from("pricing_settings").select("*").order("id").then(unwrap),
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
  const days = buildScenarioDays(source);
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
