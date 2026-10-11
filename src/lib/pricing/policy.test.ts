import { describe, expect, it } from "vitest";
import { calculateQuote, type QuoteInput } from ".";
import { resolvePricingPolicy } from "./policy";

const base: QuoteInput = {
  pax_paying: 2,
  tc_count: 1,
  start_date: "2026-10-11",
  rooming: { paying: {}, tc: {} },
  vehicles: {},
  fx_snapshot: { USD: 1 },
  margin_pct: 25,
  rounding_rule: { mode: "none", increment: 1 },
  days: [
    {
      day_number: 1,
      items: [
        {
          id: "group",
          pricing_unit: "per_group",
          currency: "USD",
          qty: 1,
          applies_tc: true,
          margin_applicable: true,
          included: true,
          rates: [
            {
              season: "ALL",
              valid_from: null,
              valid_to: null,
              pax_min: null,
              pax_max: null,
              price_net: 1000,
            },
          ],
        },
      ],
    },
  ],
};

describe("margin modes and agency commissions", () => {
  it("cost 1000 + 25% markup = 1250", () => {
    expect(calculateQuote({ ...base, margin_mode: "markup" })).toMatchObject({
      total_cost_usd: 1000,
      total_margin_usd: 250,
      total_commission_usd: 0,
      total_price_usd: 1250,
      price_per_pax_usd: 625,
    });
  });
  it("cost 1000 with 25% margin_on_price = 1333.33", () => {
    expect(calculateQuote({ ...base, margin_mode: "margin_on_price" })).toMatchObject({
      total_cost_usd: 1000,
      total_margin_usd: 333.33,
      total_commission_usd: 0,
      total_price_usd: 1333.33,
      price_per_pax_usd: 666.67,
    });
  });
  it("cost 1000 + 25% markup + gross 10% = 1388.89", () => {
    expect(
      calculateQuote({
        ...base,
        client_type: "B2B",
        margin_mode: "markup",
        client_pricing: { commission_mode: "gross", commission_pct: 10 },
      }),
    ).toMatchObject({
      total_cost_usd: 1000,
      total_margin_usd: 250,
      total_commission_usd: 138.89,
      total_price_usd: 1388.89,
      price_per_pax_usd: 694.45,
      rounding_adjustment_usd: 0,
    });
  });
  it.each([
    { margin_pct: 0, client_pricing: { margin_pct: 30 }, expected: 1000, source: "quote" },
    { margin_pct: null, client_pricing: { margin_pct: 10 }, expected: 1100, source: "client" },
    { margin_pct: undefined, client_pricing: { margin_pct: 0 }, expected: 1000, source: "client" },
    { margin_pct: null, client_pricing: { margin_pct: null }, expected: 1500, source: "admin" },
  ])(
    "resolves percentage priority, including explicit zero ($source/$expected)",
    ({ expected, source, ...settings }) => {
      const input = {
        ...base,
        ...settings,
        admin_pricing: { margin_pct: 50, margin_mode: "markup" as const },
      };
      const before = structuredClone(input);
      const result = calculateQuote(input);
      expect(result.total_price_usd).toBe(expected);
      expect(result.pricing_policy.margin_source).toBe(source);
      expect(input).toEqual(before);
    },
  );
  it("defaults to markup 25%/none and can inherit the admin mode", () => {
    expect(resolvePricingPolicy({})).toMatchObject({
      margin_pct: 25,
      margin_mode: "markup",
      commission_mode: "none",
    });
    expect(
      calculateQuote({
        ...base,
        margin_pct: undefined,
        admin_pricing: { margin_pct: 25, margin_mode: "margin_on_price" },
      }).total_price_usd,
    ).toBe(1333.33);
  });
  it("only marks up eligible items, but gross commission covers the agency price", () => {
    const item = base.days[0]!.items[0]!;
    const result = calculateQuote({
      ...base,
      margin_mode: "margin_on_price",
      client_type: "B2B",
      client_pricing: { commission_mode: "gross", commission_pct: 10 },
      days: [
        { day_number: 1, items: [item, { ...item, id: "no-margin", margin_applicable: false }] },
      ],
    });
    expect(result.total_margin_usd).toBe(333.33);
    expect(result.items[1]?.total_margin_usd).toBe(0);
    expect(result.total_commission_usd).toBe(259.26);
    expect(result.total_price_usd).toBe(2592.59);
  });
  it.each(["B2C", undefined] as const)("never adds an agency commission to %s", (client_type) => {
    expect(
      calculateQuote({
        ...base,
        client_type,
        client_pricing: { commission_mode: "gross", commission_pct: 10 },
      }),
    ).toMatchObject({ total_price_usd: 1250, total_commission_usd: 0 });
  });
  it("none disables commission and frozen quote values override later client defaults", () => {
    expect(
      calculateQuote({
        ...base,
        client_type: "B2B",
        commission_mode: "none",
        commission_pct: 0,
        client_pricing: { commission_mode: "gross", commission_pct: 10 },
      }).total_price_usd,
    ).toBe(1250);
  });
  it.each([-1, 100, 101, Infinity, NaN])("rejects invalid divisor percentages %s", (pct) => {
    expect(() =>
      calculateQuote({ ...base, margin_mode: "margin_on_price", margin_pct: pct }),
    ).toThrow("Invalid margin");
    expect(() =>
      calculateQuote({
        ...base,
        client_type: "B2B",
        commission_mode: "gross",
        commission_pct: pct,
      }),
    ).toThrow("Invalid commission");
  });
  it("retains markup >=100% compatibility and calculates scenarios/supplements with the selected policy", () => {
    expect(calculateQuote({ ...base, margin_pct: 100 }).total_price_usd).toBe(2000);
    const result = calculateQuote({
      ...base,
      margin_mode: "margin_on_price",
      client_type: "B2B",
      commission_mode: "gross",
      commission_pct: 10,
      single_supplements: [
        { single_cost: 150, double_cost: 100, currency: "USD", nights: 1, margin_applicable: true },
      ],
      pax_scenarios: [{ pax_paying: 4, tc_count: 0, rooming: base.rooming, vehicles: {} }],
    });
    expect(result.single_supplement_pp).toBe(148.15);
    expect(result.scenarios[0]).toMatchObject({
      total_price_usd: 1481.48,
      total_commission_usd: 148.15,
      price_per_pax_usd: 370.37,
    });
  });
  it("reports rounding separately and keeps all breakdown totals null on pricing errors", () => {
    const result = calculateQuote({
      ...base,
      client_type: "B2B",
      commission_mode: "gross",
      commission_pct: 10,
      rounding_rule: { mode: "ceil", increment: 5, per_pax: true },
    });
    expect(result).toMatchObject({
      total_price_usd: 1390,
      total_commission_usd: 138.89,
      rounding_adjustment_usd: 1.11,
    });
    const item = base.days[0]!.items[0]!;
    expect(
      calculateQuote({
        ...base,
        days: [
          { day_number: 1, items: [{ ...item, rates: [{ ...item.rates[0]!, price_net: null }] }] },
        ],
      }),
    ).toMatchObject({
      status: "error",
      total_price_usd: null,
      total_margin_usd: null,
      total_commission_usd: null,
      rounding_adjustment_usd: null,
    });
  });
});
