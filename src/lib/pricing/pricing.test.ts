import { describe, expect, it } from "vitest";
import { calculateQuote, dateForDay, type PricingItem, type QuoteInput, type Rate } from ".";
import { spaUyuni } from "./__fixtures__/spa-uyuni";
import { bolivia, expectedBolivia } from "./__fixtures__/bolivia";
import { sivola, expectedSivola } from "./__fixtures__/sivola";

const rate: Rate = {
  season: "ALL",
  valid_from: null,
  valid_to: null,
  pax_min: null,
  pax_max: null,
  price_net: 100,
};
const item: PricingItem = {
  id: "a",
  pricing_unit: "per_person",
  currency: "USD",
  qty: 1,
  rates: [rate],
  applies_tc: true,
  margin_applicable: true,
  included: true,
};
const base: QuoteInput = {
  pax_paying: 2,
  tc_count: 1,
  start_date: "2026-12-31",
  rooming: { paying: { DBL_TWN: 1 }, tc: { SGL: 1 } },
  vehicles: { bolivia: 4 },
  staff: { drivers: 4, guides: 1 },
  fx_snapshot: { USD: 1, CLP: 885 },
  margin_pct: 20,
  rounding_rule: { increment: 1, mode: "none" },
  days: [{ day_number: 1, items: [item] }],
};
describe("pricing", () => {
  it("charges TC without dividing by TC and marks up only eligible costs", () => {
    const result = calculateQuote({
      ...base,
      days: [
        {
          day_number: 1,
          items: [item, { ...item, id: "b", applies_tc: false, margin_applicable: false }],
        },
      ],
    });
    expect(result).toMatchObject({
      total_cost_usd: 500,
      total_margin_usd: 60,
      total_price_usd: 560,
      price_per_pax_usd: 280,
    });
  });
  it.each([
    ["per_person", 3],
    ["per_group", 2],
    ["per_unit", 2],
    ["per_vehicle", 4],
    ["per_room", 2],
    ["per_staff", 8],
  ] as const)("%s quantity", (pricing_unit, quantity) => {
    const result = calculateQuote({
      ...base,
      days: [
        {
          day_number: 1,
          items: [
            {
              ...item,
              pricing_unit,
              qty: 2,
              vehicle_segment: "bolivia",
              room_type: "SGL",
              nights: 2,
              staff_type: "drivers",
            },
          ],
        },
      ],
    });
    expect(result.items[0]?.quantity).toBe(quantity);
  });
  it("selects date, season and effective pax band, preferring explicit season", () => {
    const rates = [
      rate,
      {
        ...rate,
        season: "ALTA" as const,
        valid_from: "2027-01-01",
        valid_to: "2027-01-31",
        pax_min: 3,
        pax_max: 3,
        price_net: 300,
      },
    ];
    const result = calculateQuote({
      ...base,
      seasons: [{ from: "2027-01-01", to: "2027-01-31", season: "ALTA" }],
      days: [{ day_number: 2, items: [{ ...item, rates }] }],
    });
    expect(result.total_cost_usd).toBe(900);
    expect(dateForDay("2028-02-28", 2)).toBe("2028-02-29");
  });
  it("converts frozen FX and calculates single supplement", () => {
    const result = calculateQuote({
      ...base,
      single_supplements: [
        { single_cost: 150, double_cost: 200, currency: "USD", nights: 2, margin_applicable: true },
      ],
      days: [
        {
          day_number: 1,
          items: [{ ...item, currency: "CLP", rates: [{ ...rate, price_net: 8850 }] }],
        },
      ],
    });
    expect(result.total_cost_usd).toBe(30);
    expect(result.single_supplement_pp).toBe(120);
  });
  it("charges multi-day purchase once", () => {
    const shared = { ...item, day_span: 3, coverage_key: "purchase", coverage_start_day: 1 };
    const result = calculateQuote({
      ...base,
      days: [1, 2, 3].map((day_number) => ({
        day_number,
        items: [{ ...shared, id: String(day_number) }],
      })),
    });
    expect(result.total_cost_usd).toBe(300);
    expect(result.items.map((x) => x.covered)).toEqual([false, true, true]);
  });
  it("uses override only with a note and reports rack-only prices", () => {
    expect(() =>
      calculateQuote({
        ...base,
        days: [
          { day_number: 1, items: [{ ...item, price_overridden: true, unit_cost_original: 50 }] },
        ],
      }),
    ).toThrow("note");
    expect(
      calculateQuote({
        ...base,
        days: [
          {
            day_number: 1,
            items: [
              {
                ...item,
                price_overridden: true,
                unit_cost_original: 50,
                override_note: "Proveedor confirmó",
              },
            ],
          },
        ],
      }).total_cost_usd,
    ).toBe(150);
    expect(
      calculateQuote({
        ...base,
        days: [
          {
            day_number: 1,
            items: [{ ...item, rates: [{ ...rate, price_net: null, price_rack: 90 }] }],
          },
        ],
      }).warnings,
    ).toHaveLength(1);
  });
  it("rounds and recomputes independent scenarios including vehicles", () => {
    const result = calculateQuote({
      ...base,
      rounding_rule: { mode: "ceil", increment: 5, per_pax: true },
      days: [
        {
          day_number: 1,
          items: [
            {
              ...item,
              pricing_unit: "per_vehicle",
              vehicle_segment: "bolivia",
              rates: [{ ...rate, price_net: 101 }],
            },
          ],
        },
      ],
      pax_scenarios: [
        { pax_paying: 4, tc_count: 0, rooming: { paying: {}, tc: {} }, vehicles: { bolivia: 1 } },
      ],
    });
    expect(result.total_price_usd).toBe(490);
    expect(result.scenarios[0]?.total_price_usd).toBe(140);
  });
  it("rejects ambiguous/missing rates, FX and vehicle assumptions", () => {
    for (const change of [
      { rates: [] },
      { rates: [rate, rate] },
      { currency: "EUR" },
      { pricing_unit: "per_vehicle" as const },
    ])
      expect(() =>
        calculateQuote({ ...base, days: [{ day_number: 1, items: [{ ...item, ...change }] }] }),
      ).toThrow();
    expect(() => calculateQuote({ ...base, pax_paying: 0 })).toThrow();
  });
  it("excludes optional items and unoccupied room variants", () => {
    expect(
      calculateQuote({
        ...base,
        days: [
          {
            day_number: 1,
            items: [
              { ...item, included: false, rates: [] },
              { ...item, id: "unused", pricing_unit: "per_room", room_type: "QUAD", rates: [] },
            ],
          },
        ],
      }).total_cost_usd,
    ).toBe(0);
  });
});
describe("historical acceptance fixtures — awaiting exact source costs", () => {
  it.skip("SPA UYU 3D2N MP, 2 pax — TODO costs", () => {
    expect(calculateQuote(spaUyuni as QuoteInput).total_price_usd).toBeGreaterThan(0);
  });
  it.skip("Bolivia 5D4N 9+1 — TODO costs", () => {
    expect(calculateQuote(bolivia as QuoteInput)).toMatchObject(expectedBolivia);
  });
  it.skip("SIVOLA 10D 14+1 — TODO costs", () => {
    expect(calculateQuote(sivola as QuoteInput)).toMatchObject(expectedSivola);
  });
});
