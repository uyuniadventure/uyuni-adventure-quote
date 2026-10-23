// @vitest-environment node
import { describe, expect, it } from "vitest";
import { filterAndRankTemplateSuggestions } from "./suggestion-ranking";

const candidate = (
  sku: string,
  routeFrom: string | null,
  routeTo: string | null,
  options: Partial<{
    days: number;
    category: "BUDGET" | "COMFORT" | "VIP" | "MIXTO";
    modality: "privado" | "compartido" | "grupo";
    status: "activo" | "pendiente";
  }> = {},
) => ({
  id: sku,
  sku,
  route_from: routeFrom,
  route_to: routeTo,
  days: options.days ?? 4,
  category: options.category ?? "COMFORT",
  modality: options.modality ?? "privado",
  status: options.status ?? "activo",
});

const routes = [
  candidate("SPA-SPA", "SPA", "SPA"),
  candidate("SPA-UYU", "SPA", "UYU"),
  candidate("UYU-SPA", "UYU", "SPA"),
  candidate("UYU-UYU", "UYU", "UYU"),
  candidate("UNKNOWN-FROM", null, "SPA"),
  candidate("UNKNOWN-TO", "SPA", null),
];

describe("filterAndRankTemplateSuggestions", () => {
  it("requires an exact match for both selected route endpoints", () => {
    expect(
      filterAndRankTemplateSuggestions(routes, { route_from: "SPA", route_to: "SPA" }).map(
        (template) => template.sku,
      ),
    ).toEqual(["SPA-SPA"]);
    expect(
      filterAndRankTemplateSuggestions(routes, { route_from: "SPA", route_to: "UYU" }).map(
        (template) => template.sku,
      ),
    ).toEqual(["SPA-UYU"]);
  });

  it("filters only the endpoint specified when the other one is Cualquiera", () => {
    expect(
      filterAndRankTemplateSuggestions(routes, { route_from: "SPA", route_to: "" }).map(
        (template) => template.sku,
      ),
    ).toEqual(["SPA-SPA", "SPA-UYU", "UNKNOWN-TO"]);
    expect(
      filterAndRankTemplateSuggestions(routes, { route_from: "", route_to: "SPA" }).map(
        (template) => template.sku,
      ),
    ).toEqual(["SPA-SPA", "UNKNOWN-FROM", "UYU-SPA"]);
  });

  it("does not treat missing template endpoints as wildcards", () => {
    expect(
      filterAndRankTemplateSuggestions(routes, { route_from: "SPA", route_to: "SPA" }).some(
        (template) => template.sku.startsWith("UNKNOWN"),
      ),
    ).toBe(false);
  });

  it("keeps the existing ranking within the compatible route", () => {
    const compatible = [
      candidate("EXACT", "SPA", "SPA"),
      candidate("ONE-DAY-OFF", "SPA", "SPA", { days: 3 }),
      candidate("OTHER-PREFERENCES", "SPA", "SPA", {
        days: 10,
        category: "VIP",
        modality: "grupo",
      }),
      candidate("PENDING", "SPA", "SPA", { status: "pendiente" }),
    ];
    expect(
      filterAndRankTemplateSuggestions(compatible, {
        route_from: "SPA",
        route_to: "SPA",
        days: 4,
        category: "COMFORT",
        modality: "privado",
      }).map((template) => [template.sku, template.score]),
    ).toEqual([
      ["EXACT", 11],
      ["ONE-DAY-OFF", 10],
      ["OTHER-PREFERENCES", 6],
      ["PENDING", 11],
    ]);
  });

  it("keeps the broad search and returns an empty result when nothing matches", () => {
    expect(filterAndRankTemplateSuggestions(routes, {})).toHaveLength(routes.length);
    expect(
      filterAndRankTemplateSuggestions(routes, { route_from: "LPB", route_to: "LPB" }),
    ).toEqual([]);
  });
});
