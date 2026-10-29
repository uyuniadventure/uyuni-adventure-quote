import { db } from "../db";
import type { Tables } from "@/types/db";
import { matchesSuggestionRoute, resolveSuggestionRoute } from "./suggestion-route";

type Scenario = Pick<
  Tables<"tour_cost_scenarios">,
  | "id"
  | "template_id"
  | "tour_sku"
  | "rate_year"
  | "season"
  | "pax"
  | "approved_cost_usd"
  | "detail_cost_usd"
  | "cost_difference_usd"
  | "reconciliation_status"
  | "source_ref"
>;

type ScenarioDay = Pick<
  Tables<"tour_cost_scenario_days">,
  "scenario_id" | "day_number" | "route_from" | "route_to"
>;

export interface ScenarioSuggestionBasics {
  route_from?: string | null;
  route_to?: string | null;
  start_date?: string | null;
  pax_paying?: string | number | null;
}

function scenarioStructuredRoute(scenarioId: string, days: readonly ScenarioDay[]) {
  const ordered = days
    .filter((day) => day.scenario_id === scenarioId)
    .slice()
    .sort((a, b) => a.day_number - b.day_number);
  const route_from = ordered[0]?.route_from?.trim() || null;
  const route_to = ordered.at(-1)?.route_to?.trim() || null;
  return { route_from, route_to };
}

export function scenarioYear(startDate: string | null | undefined) {
  const match = startDate?.match(/^(\d{4})-/);
  return match ? Number(match[1]) : null;
}

export function filterScenarioSuggestions(
  scenarios: readonly Scenario[],
  days: readonly ScenarioDay[],
  locationCodes: readonly string[],
  basics: ScenarioSuggestionBasics,
) {
  const pax = Number(basics.pax_paying);
  const year = scenarioYear(basics.start_date);
  return scenarios.flatMap((scenario) => {
    if (scenario.pax !== pax || (year != null && scenario.rate_year !== year)) return [];
    const structured = scenarioStructuredRoute(scenario.id, days);
    const candidate = { ...structured, sku: scenario.tour_sku };
    if (!matchesSuggestionRoute(candidate, basics, locationCodes)) return [];
    const route = resolveSuggestionRoute(candidate, locationCodes);
    if (!route) return [];
    return [{ ...scenario, suggested_route_from: route.route_from, suggested_route_to: route.route_to }];
  });
}

export async function suggestCostScenarios(basics: ScenarioSuggestionBasics) {
  const pax = Number(basics.pax_paying);
  const year = scenarioYear(basics.start_date);
  let query = db
    .from("tour_cost_scenarios")
    .select("id,template_id,tour_sku,rate_year,season,pax,approved_cost_usd,detail_cost_usd,cost_difference_usd,reconciliation_status,source_ref")
    .eq("status", "activo")
    .eq("pax", pax)
    .order("tour_sku")
    .order("rate_year")
    .order("season");
  if (year != null) query = query.eq("rate_year", year);
  const scenarios = await query;
  if (scenarios.error) throw scenarios.error;
  const ids = (scenarios.data ?? []).map((scenario) => scenario.id);
  const days = ids.length
    ? await db
        .from("tour_cost_scenario_days")
        .select("scenario_id,day_number,route_from,route_to")
        .in("scenario_id", ids)
        .order("day_number")
    : { data: [] as ScenarioDay[], error: null };
  if (days.error) throw days.error;
  const locations = await db.from("location_codes").select("code").order("code");
  if (locations.error) throw locations.error;
  return filterScenarioSuggestions(
    scenarios.data ?? [],
    days.data ?? [],
    (locations.data ?? []).map((location) => location.code),
    basics,
  );
}

export function scenariosForTemplate<
  T extends Pick<Scenario, "id" | "template_id" | "tour_sku" | "season">,
>(template: { id: string; sku: string }, scenarios: readonly T[]) {
  return scenarios
    .filter(
      (scenario) =>
        scenario.tour_sku === template.sku &&
        (scenario.template_id == null || scenario.template_id === template.id),
    )
    .slice()
    .sort((a, b) => a.season.localeCompare(b.season) || a.id.localeCompare(b.id));
}
