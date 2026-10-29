import { describe, expect, it } from "vitest";
import {
  applyScenarioReconciliation,
  buildScenarioDays,
  narrativeWithoutLodging,
  selectSeparatedTemplateNarrative,
  validateTemplateScenarioSelection,
} from "./from-scenario";
import type { CostScenarioSource } from "./scenario-source";
import { buildQuoteDocumentModel } from "./document-model";

function source(): CostScenarioSource {
  return {
    scenario: { id: "scenario", tour_sku: "UYU3D", rate_year: 2026, season: "DRY", pax: 3 } as CostScenarioSource["scenario"],
    days: [
      { id: "day-1", scenario_id: "scenario", day_number: 1, visible_code: "UYU3D-D1", title: "Día 1", description: null, source_ref: { hotel: "Hotel informado por Andrea Comidas incluidas: texto duplicado", meals: "Almuerzo." } },
      { id: "day-2", scenario_id: "scenario", day_number: 2, visible_code: "UYU3D-D2", title: "Título y narración combinados", description: "Nota: conservar esta observación.", source_ref: {} },
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

  it("uses safely separated template text and preserves the economic note and provenance", () => {
    const longNarrative = "Narración aprobada ".repeat(40).trim();
    const days = buildScenarioDays(source(), [
      {
        day_number: 2,
        title: "Título breve",
        description: longNarrative,
        note: null,
        source: "template_translation",
      },
    ]);
    expect(days[1]).toMatchObject({ title: "Título breve", description: longNarrative });
    expect(days[1]!.block_snapshot).toMatchObject({
      content: {
        title: { es: "Título breve" },
        description: { es: longNarrative },
        client_note: { es: "Nota: conservar esta observación." },
      },
    });
    expect(days[1]!.snapshot).toMatchObject({
      source_narrative: {
        title: "Título y narración combinados",
        description: "Nota: conservar esta observación.",
        applied_template_narrative: { day_number: 2 },
      },
    });
    expect(days.flatMap((day) => day.items)).toHaveLength(3);
    expect(days[0]!.items[0]!.pricing_snapshot).toMatchObject({ scenario_line_id: "line-1" });
    const projected = buildQuoteDocumentModel(
      {
        quote: {},
        days: days.map((day) => ({ ...day, date: null })),
        items: [],
        content: {},
      },
      "es",
    );
    expect(projected.days[1]).toMatchObject({
      title: { value: "Título breve" },
      description: { value: longNarrative },
      client_note: { value: "Nota: conservar esta observación." },
    });

    const edited = buildQuoteDocumentModel(
      {
        quote: {},
        days: days.map((day) => ({
          ...day,
          date: null,
          overrides:
            day.day_number === 2
              ? { ...(day.overrides as object), title: { es: "Edición de Andrea" } }
              : day.overrides,
        })),
        items: [],
        content: {},
      },
      "es",
    );
    expect(edited.days[1]!.title).toEqual({ value: "Edición de Andrea", overridden: true });
  });

  it("keeps combined text intact when no safely separated source exists", () => {
    const days = buildScenarioDays(source());
    expect(days[1]).toMatchObject({
      title: "Título y narración combinados",
      description: "Nota: conservar esta observación.",
    });
    expect(days[1]!.block_snapshot).toMatchObject({
      content: {
        title: { es: "Título y narración combinados" },
        description: { es: "Nota: conservar esta observación." },
      },
    });
  });

  it("accepts already-separated translations, strips only an explicit lodging line and rejects combined import rows", () => {
    expect(narrativeWithoutLodging("Narración completa.\nAlojamiento: Hotel Luna Salada")).toBe(
      "Narración completa.",
    );
    expect(narrativeWithoutLodging("Texto sin separador reconocible")).toBe(
      "Texto sin separador reconocible",
    );
    const translations = [
      { block_id: "safe", lang: "es", title: "Título breve", description: "Narración completa." },
      { block_id: "combined", lang: "es", title: "Título y narración", description: "Nota" },
    ];
    expect(
      selectSeparatedTemplateNarrative(
        [
          { day_number: 4, block_id: "safe", import_title: null, import_note: null },
          { day_number: 2, block_id: "combined", import_title: "Título y narración", import_note: null },
        ],
        translations,
        "es",
      ),
    ).toEqual([
      {
        day_number: 4,
        title: "Título breve",
        description: "Narración completa.",
        note: null,
        source: "template_translation",
      },
    ]);
  });

  it("keeps all four template narrative days associated with their original day number", () => {
    const templateDays = [4, 1, 3, 2].map((day_number) => ({
      day_number,
      block_id: `block-${day_number}`,
      import_title: null,
      import_note: day_number === 2 ? "Nota del día 2" : null,
    }));
    const translations = [1, 2, 3, 4].map((day) => ({
      block_id: `block-${day}`,
      lang: "es",
      title: `Título ${day}`,
      description: `Narración ${day}`,
    }));
    expect(
      selectSeparatedTemplateNarrative(templateDays, translations, "es").map((day) => [
        day.day_number,
        day.title,
        day.description,
        day.note,
      ]),
    ).toEqual([
      [4, "Título 4", "Narración 4", null],
      [1, "Título 1", "Narración 1", null],
      [3, "Título 3", "Narración 3", null],
      [2, "Título 2", "Narración 2", "Nota del día 2"],
    ]);
  });
});

describe("template economic scenario selection", () => {
  const template = { id: "template", sku: "SPASPA-4D3N-LLTd", status: "activo" } as const;
  const scenario = {
    id: "scenario",
    template_id: "template",
    tour_sku: "SPASPA-4D3N-LLTd",
    rate_year: 2026,
    pax: 2,
    status: "activo",
  } as const;

  it("accepts only the exact template, year and passengers", () => {
    expect(() =>
      validateTemplateScenarioSelection(template, scenario, {
        start_date: "2026-05-10",
        pax_paying: 2,
      }),
    ).not.toThrow();
    expect(() =>
      validateTemplateScenarioSelection(template, { ...scenario, rate_year: 2027 }, {
        start_date: "2026-05-10",
        pax_paying: 2,
      }),
    ).toThrow("año");
    expect(() =>
      validateTemplateScenarioSelection(template, { ...scenario, pax: 3 }, {
        start_date: "2026-05-10",
        pax_paying: 2,
      }),
    ).toThrow("pasajeros");
    expect(() =>
      validateTemplateScenarioSelection(template, { ...scenario, template_id: "other" }, {
        start_date: "2026-05-10",
        pax_paying: 2,
      }),
    ).toThrow("plantilla");
  });
});
