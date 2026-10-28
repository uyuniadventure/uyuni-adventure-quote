import type { Tables } from "../../types/db";

export const SCENARIO_IMPORT_OVERRIDE_NOTE = "Costo total aprobado en escenario consolidado";
const MANUAL_SCENARIO_PREFIX = "Modificación manual: ";

type ScenarioItem = Pick<Tables<"quote_items">, "price_overridden" | "override_note" | "pricing_snapshot">;

export function isScenarioItem(item: ScenarioItem) {
  const snapshot = item.pricing_snapshot as { scenario_line_id?: unknown } | null;
  return typeof snapshot?.scenario_line_id === "string" && snapshot.scenario_line_id.length > 0;
}

export function quoteItemCostLabel(item: ScenarioItem) {
  if (!item.price_overridden) return null;
  return isScenarioItem(item) && item.override_note === SCENARIO_IMPORT_OVERRIDE_NOTE
    ? "Costo importado del escenario"
    : "Precio manual";
}

export function manualOverrideNote(item: ScenarioItem, note: string) {
  const trimmed = note.trim();
  if (!isScenarioItem(item) || trimmed.startsWith(MANUAL_SCENARIO_PREFIX)) return trimmed;
  return `${MANUAL_SCENARIO_PREFIX}${trimmed}`;
}

export function hasCatalogRateSnapshot(item: Pick<Tables<"quote_items">, "pricing_snapshot">) {
  const snapshot = item.pricing_snapshot as { rates?: unknown } | null;
  return Array.isArray(snapshot?.rates) && snapshot.rates.length > 0;
}
