import { describe, expect, it } from "vitest";
import { matchesSuggestionRoute, resolveSuggestionRoute } from "./suggestion-route";

const locations = ["SPA", "UYU"];

describe("suggestion route resolution", () => {
  it.each([
    ["SPASPA-4D3N", "SPA", "SPA"],
    ["SPAUYU-4D3N", "SPA", "UYU"],
    ["UYUSPA-4D3N", "UYU", "SPA"],
    ["UYUUYU-4D3N", "UYU", "UYU"],
  ])("resolves %s", (sku, route_from, route_to) => {
    expect(resolveSuggestionRoute({ sku }, locations)).toMatchObject({ route_from, route_to });
  });

  it("prioritizes a complete structured route over the SKU", () => {
    expect(
      resolveSuggestionRoute(
        { sku: "SPASPA-4D3N", route_from: "UYU", route_to: "SPA" },
        locations,
      ),
    ).toEqual({ route_from: "UYU", route_to: "SPA", source: "structured" });
  });

  it("does not infer an ambiguous or unrecognized SKU", () => {
    expect(resolveSuggestionRoute({ sku: "ABC-4D3N" }, ["A", "AB", "BC", "C"])).toBeNull();
    expect(resolveSuggestionRoute({ sku: "SIN-RUTA" }, locations)).toBeNull();
  });

  it("never includes an unidentified candidate for a requested route", () => {
    expect(
      matchesSuggestionRoute({ sku: "SIN-RUTA" }, { route_from: "SPA", route_to: "SPA" }, locations),
    ).toBe(false);
  });
});
