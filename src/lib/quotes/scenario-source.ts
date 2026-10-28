import { db } from "../db";
import type { Tables } from "../../types/db";

export interface CostScenarioRequest {
  tour_sku: string;
  year: number;
  season: string;
  pax: number;
}

export interface CostScenarioSource {
  scenario: Tables<"tour_cost_scenarios">;
  days: Tables<"tour_cost_scenario_days">[];
  lines: Tables<"tour_cost_scenario_lines">[];
  issues: Tables<"tour_cost_scenario_issues">[];
}

const PAGE_SIZE = 500;

async function allPages<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
): Promise<T[]> {
  const result: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    result.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE_SIZE) return result;
  }
}

/** Loads an exact scenario with bounded set queries; it never falls back to a nearby dimension. */
export async function loadCostScenarioSource(
  key: CostScenarioRequest,
): Promise<CostScenarioSource> {
  const tour_sku = key.tour_sku.trim();
  const season = key.season.trim().toUpperCase();
  if (!tour_sku || !season || !Number.isInteger(key.year) || !Number.isInteger(key.pax))
    throw new Error("Identidad de escenario inválida");
  const { data: scenario, error } = await db
    .from("tour_cost_scenarios")
    .select("*")
    .eq("tour_sku", tour_sku)
    .eq("rate_year", key.year)
    .eq("season", season)
    .eq("pax", key.pax)
    .eq("status", "activo")
    .single();
  if (error || !scenario) throw new Error("No existe un escenario activo exacto para la selección");

  const days = await allPages<Tables<"tour_cost_scenario_days">>((from, to) =>
    db
      .from("tour_cost_scenario_days")
      .select("*")
      .eq("scenario_id", scenario.id)
      .order("day_number")
      .range(from, to),
  );
  if (!days.length) throw new Error("El escenario no contiene días");
  const dayIds = days.map((day) => day.id);
  const lines = await allPages<Tables<"tour_cost_scenario_lines">>((from, to) =>
    db
      .from("tour_cost_scenario_lines")
      .select("*")
      .in("scenario_day_id", dayIds)
      .order("scenario_day_id")
      .order("line_key")
      .range(from, to),
  );
  const issues = await allPages<Tables<"tour_cost_scenario_issues">>((from, to) =>
    db
      .from("tour_cost_scenario_issues")
      .select("*")
      .eq("scenario_id", scenario.id)
      .order("created_at")
      .range(from, to),
  );
  return { scenario, days, lines, issues };
}
