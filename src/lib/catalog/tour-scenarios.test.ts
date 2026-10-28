import { describe, expect, it } from "vitest";
import {
  prepareScenarioLines,
  resolveTourScenario,
  scenarioLineQuantity,
  type ScenarioCostLine,
  type TourScenario,
} from "./tour-scenarios";

const scenario = (year: number, season: string, pax: number): TourScenario => ({
  id: `${year}-${season}-${pax}`,
  tour_sku: "UYUUYU-3D2N-PTd",
  year,
  season,
  pax,
  status: "activo",
});

const line = (overrides: Partial<ScenarioCostLine> = {}): ScenarioCostLine => ({
  id: "line-1",
  day_number: 1,
  quantity: 1,
  billing_unit: "PER_SERVICE",
  cost_basis: "UNIT_RATE",
  original_amount: 100,
  amount_usd: 100,
  ...overrides,
});

describe("tour cost scenarios", () => {
  it("resolves DRY and RAIN independently for the same tour, pax and day", () => {
    const rows = [scenario(2026, "DRY", 3), scenario(2026, "RAIN", 3)];
    expect(
      resolveTourScenario(rows, { tour_sku: rows[0]!.tour_sku, year: 2026, season: "DRY", pax: 3 })
        .id,
    ).toBe("2026-DRY-3");
    expect(
      resolveTourScenario(rows, { tour_sku: rows[0]!.tour_sku, year: 2026, season: "RAIN", pax: 3 })
        .id,
    ).toBe("2026-RAIN-3");
  });

  it("keeps years distinct and resolves pax 1 through 5 without fallback", () => {
    const rows = [2026, 2027].flatMap((year) =>
      [1, 2, 3, 4, 5].map((pax) => scenario(year, "DRY", pax)),
    );
    for (const year of [2026, 2027])
      for (const pax of [1, 2, 3, 4, 5])
        expect(
          resolveTourScenario(rows, { tour_sku: "UYUUYU-3D2N-PTd", year, season: "DRY", pax }).id,
        ).toBe(`${year}-DRY-${pax}`);
    expect(() =>
      resolveTourScenario(rows, { tour_sku: "UYUUYU-3D2N-PTd", year: 2028, season: "DRY", pax: 3 }),
    ).toThrow(/no encontrado/);
  });

  it("interprets person, group, room and service units explicitly", () => {
    expect(scenarioLineQuantity(line({ billing_unit: "PER_PERSON", quantity: 2 }), 3)).toBe(6);
    expect(scenarioLineQuantity(line({ billing_unit: "PER_GROUP", quantity: 1 }), 3)).toBe(1);
    expect(scenarioLineQuantity(line({ billing_unit: "PER_ROOM", quantity: 2 }), 3)).toBe(2);
    expect(scenarioLineQuantity(line({ billing_unit: "PER_ROOM_PER_DAY", quantity: 2 }), 3)).toBe(
      2,
    );
    expect(scenarioLineQuantity(line({ billing_unit: "PER_SERVICE", quantity: 1 }), 3)).toBe(1);
  });

  it("does not multiply an already totalled line and preserves missing prices", () => {
    expect(
      scenarioLineQuantity(
        line({ cost_basis: "LINE_TOTAL", billing_unit: "PER_PERSON", quantity: 3 }),
        3,
      ),
    ).toBe(1);
    expect(prepareScenarioLines([line({ amount_usd: null })], 3)[0]!.total_usd).toBeNull();
  });

  it("charges a multi-day transport once while preserving ordered appearances", () => {
    const rows = prepareScenarioLines(
      [
        line({ id: "second", day_number: 2, charge_once_key: "transport-3d" }),
        line({ id: "first", day_number: 1, charge_once_key: "transport-3d" }),
        line({ id: "meal", day_number: 2, billing_unit: "PER_PERSON", amount_usd: 10 }),
      ],
      3,
    );
    expect(rows.map((row) => [row.id, row.covered, row.total_usd])).toEqual([
      ["first", false, 100],
      ["meal", false, 30],
      ["second", true, 0],
    ]);
  });
});
