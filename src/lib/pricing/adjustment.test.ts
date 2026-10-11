import { describe, expect, it } from "vitest";
import { calculateQuote, type QuoteInput } from ".";

function quote(pct = 0, margin = 0): QuoteInput {
  return {
    pax_paying: 1,
    tc_count: 0,
    start_date: "2026-10-11",
    rooming: { paying: {}, tc: {} },
    vehicles: {},
    fx_snapshot: { USD: 1, BOB: 7 },
    margin_pct: margin,
    rounding_rule: { increment: 1, mode: "none" },
    days: [
      {
        day_number: 1,
        items: [
          {
            id: "one",
            pricing_unit: "per_group",
            currency: "USD",
            qty: 1,
            applies_tc: false,
            margin_applicable: true,
            included: true,
            adjustment_pct: pct,
            adjustment_note: "combustible 2027",
            rates: [
              {
                season: "ALL",
                valid_from: null,
                valid_to: null,
                pax_min: null,
                pax_max: null,
                price_net: 100,
              },
            ],
          },
        ],
      },
    ],
  };
}
describe("ajuste de costo de la cotización", () => {
  it.each([
    [0.064, 106.4],
    [-0.1, 90],
    [0, 100],
    [-0.5, 50],
    [1, 200],
  ])("100 con fracción %s cuesta %s", (pct, expected) => {
    const input = quote(pct);
    const before = structuredClone(input);
    const result = calculateQuote(input);
    expect(result.total_cost_usd).toBe(expected);
    expect(result.items[0]!.base_cost_usd).toBe(100);
    expect(result.items[0]!.adjustment_pct).toBe(pct);
    expect(result.items[0]!.adjustment_amount_usd).toBeCloseTo(expected - 100, 10);
    expect(result.items[0]!.costo_base).toBe(100);
    expect(result.items[0]!.adjustment_usd).toBeCloseTo(expected - 100, 10);
    expect(result.items[0]!.costo_ajustado).toBe(expected);
    expect(result.total_adjustments_usd).toBeCloseTo(expected - 100, 10);
    expect(input).toEqual(before);
  });
  it("applies markup to adjusted cost: 100 × 1.04 × 1.25 = 130", () => {
    const result = calculateQuote(quote(0.04, 25));
    expect(result).toMatchObject({
      total_cost_usd: 104,
      total_margin_usd: 26,
      total_price_usd: 130,
      total_adjustments_usd: 4,
    });
  });
  it("adjusts after quantities and FX; excluded items stay zero and ineligible margin stays zero", () => {
    const input = quote(0.064, 25);
    const item = input.days[0]!.items[0]!;
    item.currency = "BOB";
    item.qty = 2;
    item.rates[0]!.price_net = 350;
    item.margin_applicable = false;
    input.days[0]!.items.push({ ...item, id: "excluded", included: false });
    expect(calculateQuote(input)).toMatchObject({
      total_cost_usd: 106.4,
      total_margin_usd: 0,
      total_price_usd: 106.4,
    });
    expect(calculateQuote(input).items[1]).toMatchObject({
      base_cost_usd: 0,
      adjustment_amount_usd: 0,
      total_cost_usd: 0,
    });
  });
  it("uses an override as base, carries adjustments to pax scenarios and does not hide missing rates", () => {
    const input = quote(0.1);
    const item = input.days[0]!.items[0]!;
    item.pricing_unit = "per_person";
    item.price_overridden = true;
    item.override_note = "Precio acordado";
    item.unit_cost_original = 200;
    input.pax_scenarios = [{ pax_paying: 2, tc_count: 0, rooming: input.rooming, vehicles: {} }];
    const result = calculateQuote(input);
    expect(result.total_cost_usd).toBe(220);
    expect(result.scenarios[0]!.total_cost_usd).toBe(440);
    expect(result.scenarios[0]!.total_adjustments_usd).toBe(40);
    delete item.price_overridden;
    item.rates[0]!.price_net = null;
    expect(calculateQuote(input).items[0]).toMatchObject({
      status: "error",
      base_cost_usd: null,
      adjustment_amount_usd: null,
      total_cost_usd: null,
      costo_base: null,
      adjustment_usd: null,
      costo_ajustado: null,
    });
    expect(calculateQuote(input).total_adjustments_usd).toBeNull();
  });
  it("applies margin_on_price and gross commission to the adjusted amount", () => {
    const result = calculateQuote({
      ...quote(0.064, 25),
      margin_mode: "margin_on_price",
      client_type: "B2B",
      commission_mode: "gross",
      commission_pct: 10,
    });
    expect(result.total_cost_usd).toBe(106.4);
    expect(result.total_margin_usd).toBe(35.47);
    expect(result.total_price_usd).toBe(157.63);
  });
  it.each([-0.500001, 1.000001, 6.4, NaN, Infinity, -Infinity])(
    "rejects an invalid fraction %s",
    (pct) => {
      expect(() => calculateQuote(quote(pct))).toThrow();
    },
  );
});
