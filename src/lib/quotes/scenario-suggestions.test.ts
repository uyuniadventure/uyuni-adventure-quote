import { describe, expect, it } from "vitest";
import { filterScenarioSuggestions, scenariosForTemplate } from "./scenario-suggestions";

const scenario = (id: string, tour_sku: string, pax = 2, rate_year = 2026) => ({
  id,
  template_id: null,
  tour_sku,
  pax,
  rate_year,
  season: "DRY",
  approved_cost_usd: 100,
  detail_cost_usd: 100,
  cost_difference_usd: 0,
  reconciliation_status: "matched",
  source_ref: {},
});
const scenarios = [
  { ...scenario("1", "SPASPA-4D3N-LLTd"), season: "ALL" },
  scenario("2", "SPAUYU-4D3N"),
  scenario("3", "UYUSPA-4D3N"),
  scenario("4", "UYUUYU-4D3N"),
  scenario("5", "SIN-RUTA"),
  scenario("6", "SPASPA-4D3N", 3),
  scenario("7", "SPASPA-4D3N", 2, 2027),
];

describe("scenario suggestions", () => {
  it.each([
    ["SPA", "SPA", ["1"]],
    ["SPA", "UYU", ["2"]],
    ["UYU", "SPA", ["3"]],
    ["UYU", "UYU", ["4"]],
  ])("filters the exact %s to %s route", (route_from, route_to, ids) => {
    const result = filterScenarioSuggestions(scenarios, [], ["SPA", "UYU"], {
      route_from,
      route_to,
      start_date: "2026-05-10",
      pax_paying: 2,
    });
    expect(result.map((item) => item.id)).toEqual(ids);
  });

  it("reacts to route changes while preserving pax and year", () => {
    const basics = { start_date: "2026-05-10", pax_paying: 2 };
    expect(
      filterScenarioSuggestions(scenarios, [], ["SPA", "UYU"], {
        ...basics,
        route_from: "SPA",
        route_to: "SPA",
      }).map((item) => item.id),
    ).toEqual(["1"]);
    expect(
      filterScenarioSuggestions(scenarios, [], ["SPA", "UYU"], {
        ...basics,
        route_from: "UYU",
        route_to: "SPA",
      }).map((item) => item.id),
    ).toEqual(["3"]);
  });

  it("keeps the known 2026 ALL P2 scenario when imported days have no route", () => {
    expect(
      filterScenarioSuggestions(scenarios, [], ["SPA", "UYU"], {
        route_from: "SPA",
        route_to: "SPA",
        start_date: "2026-01-15",
        pax_paying: 2,
      }),
    ).toEqual([
      expect.objectContaining({
        tour_sku: "SPASPA-4D3N-LLTd",
        rate_year: 2026,
        season: "ALL",
        pax: 2,
      }),
    ]);
  });

  it("does not treat interior day routes as the tour endpoints", () => {
    const days = [
      { scenario_id: "1", day_number: 1, route_from: null, route_to: "UYU" },
      { scenario_id: "1", day_number: 2, route_from: "UYU", route_to: "UYU" },
      { scenario_id: "1", day_number: 4, route_from: "UYU", route_to: null },
    ];
    expect(
      filterScenarioSuggestions(scenarios, days, ["SPA", "UYU"], {
        route_from: "SPA",
        route_to: "SPA",
        start_date: "2026-01-15",
        pax_paying: 2,
      }).map((item) => item.id),
    ).toEqual(["1"]);
  });

  it("excludes the known scenario when pax or year changes", () => {
    const basics = { route_from: "SPA", route_to: "SPA" };
    expect(
      filterScenarioSuggestions(scenarios, [], ["SPA", "UYU"], {
        ...basics,
        start_date: "2026-01-15",
        pax_paying: 3,
      }).some((item) => item.id === "1"),
    ).toBe(false);
    expect(
      filterScenarioSuggestions(scenarios, [], ["SPA", "UYU"], {
        ...basics,
        start_date: "2027-01-15",
        pax_paying: 2,
      }).some((item) => item.id === "1"),
    ).toBe(false);
  });

  it("associates only the exact template SKU and compatible template id", () => {
    const candidates = [
      { ...scenario("all", "SPASPA-4D3N-LLTd"), season: "ALL", template_id: "template" },
      { ...scenario("dry", "SPASPA-4D3N-LLTd"), season: "DRY", template_id: null },
      { ...scenario("other-template", "SPASPA-4D3N-LLTd"), template_id: "other" },
      scenario("other-sku", "SPAUYU-4D3N"),
    ];
    expect(
      scenariosForTemplate({ id: "template", sku: "SPASPA-4D3N-LLTd" }, candidates).map(
        (item) => item.id,
      ),
    ).toEqual(["all", "dry"]);
  });
});
