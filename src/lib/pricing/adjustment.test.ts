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
    [6.4, 106.4],
    [-10, 90],
    [0, 100],
    [-100, 0],
  ])("100 con %s %% cuesta %s", (pct, expected) => {
    const input = quote(pct);
    const before = structuredClone(input);
    const result = calculateQuote(input);
    expect(result.total_cost_usd).toBe(expected);
    expect(result.items[0]!.base_cost_usd).toBe(100);
    expect(result.items[0]!.adjustment_pct).toBe(pct);
    expect(result.items[0]!.adjustment_amount_usd).toBeCloseTo(expected - 100, 10);
    expect(input).toEqual(before);
  });
  it("uses base margin + adjustment, as confirmed by Andrea: 100 + 25 + 4 = 129", () => {
    const result = calculateQuote(quote(4, 25));
    expect(result).toMatchObject({
      total_cost_usd: 104,
      total_margin_usd: 25,
      total_price_usd: 129,
    });
  });
  it("adjusts after quantities and FX; excluded items stay zero and ineligible margin stays zero", () => {
    const input = quote(6.4, 25);
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
    const input = quote(10);
    const item = input.days[0]!.items[0]!;
    item.pricing_unit = "per_person";
    item.price_overridden = true;
    item.override_note = "Precio acordado";
    item.unit_cost_original = 200;
    input.pax_scenarios = [{ pax_paying: 2, tc_count: 0, rooming: input.rooming, vehicles: {} }];
    const result = calculateQuote(input);
    expect(result.total_cost_usd).toBe(220);
    expect(result.scenarios[0]!.total_cost_usd).toBe(440);
    delete item.price_overridden;
    item.rates[0]!.price_net = null;
    expect(calculateQuote(input).items[0]).toMatchObject({
      status: "error",
      base_cost_usd: null,
      adjustment_amount_usd: null,
      total_cost_usd: null,
    });
  });
  it.each([-100.01, NaN, Infinity, -Infinity])("rejects an invalid percentage %s", (pct) => {
    expect(() => calculateQuote(quote(pct))).toThrow();
  });
});
