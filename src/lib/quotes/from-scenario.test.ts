import { describe, expect, it } from "vitest";
import { applyScenarioReconciliation, buildScenarioDays } from "./from-scenario";
import type { CostScenarioSource } from "./scenario-source";

function source(): CostScenarioSource {
  return {
    scenario: { id: "scenario", tour_sku: "UYU3D", rate_year: 2026, season: "DRY", pax: 3 } as CostScenarioSource["scenario"],
    days: [
      { id: "day-1", scenario_id: "scenario", day_number: 1, visible_code: "UYU3D-D1", title: "Día 1", description: null, source_ref: { hotel: "Hotel informado por Andrea Comidas incluidas: texto duplicado", meals: "Almuerzo." } },
      { id: "day-2", scenario_id: "scenario", day_number: 2, visible_code: "UYU3D-D2", title: "Día 2", description: null, source_ref: {} },
    ] as CostScenarioSource["days"],
    lines: [
      { id: "line-1", scenario_day_id: "day-1", line_key: "L1", service_id: null, supplier_id: null, unresolved_service_ref: "VISIBLE-1", description: "Paquete", quantity: 3, billing_unit: "PER_PERSON", cost_basis: "LINE_TOTAL", original_amount: 120, original_currency: "USD", amount_usd: 120, charge_once_key: "package", source_ref: {}, resolution_issue: null },
      { id: "line-2", scenario_day_id: "day-2", line_key: "L2", service_id: null, supplier_id: null, unresolved_service_ref: "VISIBLE-2", description: "Paquete cubierto", quantity: 3, billing_unit: "PER_PERSON", cost_basis: "LINE_TOTAL", original_amount: 120, original_currency: "USD", amount_usd: 120, charge_once_key: "package", source_ref: {}, resolution_issue: null },
      { id: "line-3", scenario_day_id: "day-2", line_key: "L3", service_id: null, supplier_id: null, unresolved_service_ref: "VISIBLE-3", description: "Pendiente", quantity: 1, billing_unit: "PER_GROUP", cost_basis: "LINE_TOTAL", original_amount: null, original_currency: "USD", amount_usd: null, charge_once_key: null, source_ref: {}, resolution_issue: "sin precio" },
      { id: "line-4", scenario_day_id: "day-1", line_key: "L4", service_id: null, supplier_id: null, unresolved_service_ref: "VISIBLE-4", description: "Cero aprobado", quantity: 1, billing_unit: "PER_GROUP", cost_basis: "LINE_TOTAL", original_amount: 0, original_currency: "USD", amount_usd: 0, charge_once_key: null, source_ref: {}, resolution_issue: "referencia ambigua" },
    ] as CostScenarioSource["lines"],
    issues: [],
  };
}

describe("buildScenarioDays", () => {
  it("freezes LINE_TOTAL once, preserves visible codes and flags missing prices", () => {
    const days = buildScenarioDays(source());
    expect(days[0]!.items[0]).toMatchObject({ sku: "VISIBLE-1", qty: 1, unit_cost_usd: 120 });
    expect(days[0]!.overrides).toEqual({
      accommodation_text: { es: "Hotel informado por Andrea" },
      meals: ["Almuerzo."],
    });
    expect(days[0]!.items.find((item) => item.sku === "VISIBLE-4")).toMatchObject({ qty: 1, unit_cost_usd: 0 });
    expect(days[1]!.items[0]).toMatchObject({ sku: "VISIBLE-2", qty: 0, unit_cost_usd: 120 });
    expect(days[1]!.snapshot).toMatchObject({
      visible_code: "UYU3D-D2",
      required_service_count: 2,
      omitted_economic_items: [expect.stringContaining("Pendiente")],
    });
  });

  it("keeps ambiguous priced lines usable and exposes reconciliation without altering either total", () => {
    const days = buildScenarioDays(source());
    expect(days[0]!.items[0]).toMatchObject({ service_id: null, unit_cost_usd: 120 });
    const result = applyScenarioReconciliation(
      { approved_cost_usd: 150, detail_cost_usd: 120, cost_difference_usd: -30, reconciliation_status: "difference" },
      { status: "ok", warnings: [], total_cost_usd: 120 } as unknown as Parameters<typeof applyScenarioReconciliation>[1],
    );
    expect(result).toMatchObject({ status: "error", total_cost_usd: 120 });
    expect(result.warnings[0]).toContain("presupuesto aprobado USD 150");
    expect(result.warnings[0]).toContain("desglose USD 120");
  });
});
