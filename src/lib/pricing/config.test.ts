import { describe, expect, it } from "vitest";
import {
  calculateQuote,
  pricingConfigSchema,
  parsePricingConfig,
  type QuoteInput,
  type PricingItem,
  type Rate,
} from ".";

const rate: Rate = {
  season: "ALL",
  valid_from: null,
  valid_to: null,
  pax_min: null,
  pax_max: null,
  price_net: 100,
};
const hotel: PricingItem = {
  id: "hotel",
  label: "Hotel",
  pricing_unit: "per_room",
  pricing_config: {},
  currency: "USD",
  qty: 1,
  included: true,
  margin_applicable: true,
  applies_tc: true,
  rates: [
    { ...rate, room_type: "DBL", price_net: 100 },
    { ...rate, room_type: "SGL", price_net: 80 },
    { ...rate, room_type: "TPL", price_net: 150 },
    { ...rate, room_type: "MAT", price_net: 110 },
  ],
};
const vehicle: PricingItem = {
  ...hotel,
  id: "vehicle",
  label: "Transfer",
  pricing_unit: "per_vehicle",
  applies_tc: false,
  rates: [
    { ...rate, pax_min: 1, pax_max: 4, price_net: 200 },
    { ...rate, pax_min: 5, pax_max: 9, price_net: 300 },
    { ...rate, pax_min: 10, pax_max: 16, price_net: 400 },
    { ...rate, pax_min: 17, pax_max: 24, price_net: 500 },
  ],
};
const base: QuoteInput = {
  pax_paying: 2,
  tc_count: 0,
  staff: { drivers: 1, guides: 1 },
  start_date: "2026-10-14",
  rooming: { paying: {}, tc: {} },
  vehicles: {},
  fx_snapshot: { USD: 1 },
  margin_pct: 25,
  rounding_rule: { mode: "none", increment: 1 },
  days: [{ day_number: 1, items: [hotel, vehicle] }],
};

describe("pricing_config and automatic room/vehicle selection", () => {
  it.each([
    { pax: 2, tc: 0, rooms: { DBL: 1, SGL: 0 }, band: 4, roomCost: 100, transportCost: 200 },
    { pax: 3, tc: 0, rooms: { DBL: 1, SGL: 1 }, band: 9, roomCost: 180, transportCost: 300 },
    { pax: 9, tc: 1, rooms: { DBL: 4, SGL: 1 }, band: 16, roomCost: 560, transportCost: 400 },
    { pax: 16, tc: 1, rooms: { DBL: 8, SGL: 0 }, band: 24, roomCost: 880, transportCost: 500 },
  ])(
    "defaults for $pax + $tc TC include staff in the vehicle band",
    ({ pax, tc, rooms, band, roomCost, transportCost }) => {
      const input = { ...base, pax_paying: pax, tc_count: tc };
      const before = structuredClone(input);
      const result = calculateQuote(input);
      expect(result.status).toBe("ok");
      expect(result.effective_rooming).toEqual({ paying: rooms, tc: tc ? { SGL: tc } : {} });
      expect(result.items[0]?.total_cost_usd).toBe(roomCost);
      expect(result.items[1]?.pricing_config?.rate_band?.pax_max).toBe(band);
      expect(result.items[1]?.total_cost_usd).toBe(transportCost);
      expect(result.total_price_usd).toBe((roomCost + transportCost) * 1.25);
      expect(result.price_per_pax_usd).toBeCloseTo(result.total_price_usd! / pax, 2);
      expect(result.warnings.join(" ")).toContain("por defecto");
      expect(result.warnings.join(" ")).toContain(`${pax + tc + 2} personas`);
      expect(input).toEqual(before);
    },
  );
  it.each([
    { pax: 4, paying: { DBL: 2 }, expected: 200 },
    { pax: 5, paying: { TPL: 1, DBL: 1 }, expected: 250 },
    { pax: 2, paying: { MAT: 1 }, expected: 110 },
    { pax: 2, paying: { DBL_TWN: 1 }, expected: 100 },
  ])("quote rooming takes priority for $pax passengers ($paying)", ({ pax, paying, expected }) => {
    const result = calculateQuote({
      ...base,
      pax_paying: pax,
      rooming: { paying, tc: {} },
      days: [{ day_number: 1, items: [hotel] }],
    });
    expect(result.items[0]?.total_cost_usd).toBe(expected);
    expect(result.warnings.some((w) => w.startsWith("Habitaciones por defecto"))).toBe(false);
  });
  it("prices each variant once, with nights and an independent TC room", () => {
    const result = calculateQuote({
      ...base,
      pax_paying: 3,
      tc_count: 1,
      days: [
        {
          day_number: 1,
          items: ["DBL", "SGL", "TPL"].map((room_type) => ({
            ...hotel,
            id: room_type,
            lodging_key: "same-hotel",
            pricing_config: { room_type, nights: 2 },
          })),
        },
      ],
    });
    expect(result.items.map((i) => i.quantity)).toEqual([2, 4, 0]);
    expect(result.total_cost_usd).toBe(520);
    expect(result.items[0]?.room_breakdown).toEqual([
      { room_type: "DBL", quantity: 2, unit_cost_original: 100, total_cost_usd: 200 },
    ]);
  });
  it("does not silently omit an explicitly requested variant absent from a hotel's links", () => {
    expect(() =>
      calculateQuote({
        ...base,
        pax_paying: 5,
        rooming: { paying: { TPL: 1, DBL: 1 }, tc: {} },
        days: [{ day_number: 1, items: [{ ...hotel, lodging_key: "hotel", room_type: "DBL" }] }],
      }),
    ).toThrow("Falta tarifa de habitación TPL");
  });
  it("uses an explicit segment/count and rate band instead of automatic vehicle quantity", () => {
    const result = calculateQuote({
      ...base,
      vehicles: { chile: 2 },
      days: [
        {
          day_number: 1,
          items: [
            {
              ...vehicle,
              pricing_config: { vehicle_segment: "chile", rate_band: { pax_min: 1, pax_max: 4 } },
            },
          ],
        },
      ],
    });
    expect(result.items[0]?.quantity).toBe(2);
    expect(result.total_cost_usd).toBe(400);
    expect(result.warnings).toEqual([]);
  });
  it("checks date/season and never substitutes an undersized or ambiguous vehicle tariff", () => {
    expect(
      calculateQuote({
        ...base,
        pax_paying: 16,
        tc_count: 1,
        days: [{ day_number: 1, items: [{ ...vehicle, rates: vehicle.rates.slice(0, 3) }] }],
      }).items[0]?.rate_error?.code,
    ).toBe("missing");
    expect(
      calculateQuote({
        ...base,
        days: [
          { day_number: 1, items: [{ ...vehicle, rates: [...vehicle.rates, vehicle.rates[0]!] }] },
        ],
      }).items[0]?.rate_error?.code,
    ).toBe("ambiguous");
    expect(
      calculateQuote({
        ...base,
        start_date: "2027-01-01",
        days: [
          {
            day_number: 1,
            items: [
              { ...vehicle, rates: vehicle.rates.map((r) => ({ ...r, valid_to: "2026-12-31" })) },
            ],
          },
        ],
      }).items[0]?.rate_error?.code,
    ).toBe("missing");
  });
  it("warns when the only vehicle tariff has no capacity rather than blocking missing configuration", () => {
    const result = calculateQuote({
      ...base,
      days: [{ day_number: 1, items: [{ ...vehicle, rates: [rate] }] }],
    });
    expect(result).toMatchObject({ status: "ok", total_cost_usd: 100 });
    expect(result.warnings.join(" ")).toContain("Revisar la capacidad");
  });
  it("recomputes defaults for scenarios and charges a multi-day purchase only once", () => {
    const v = { ...vehicle, day_span: 2, coverage_key: "transfer", coverage_start_day: 1 };
    const result = calculateQuote({
      ...base,
      days: [
        { day_number: 1, items: [hotel, v] },
        { day_number: 2, items: [{ ...v, id: "covered" }] },
      ],
      pax_scenarios: [
        {
          pax_paying: 9,
          tc_count: 1,
          staff: base.staff!,
          rooming: { paying: {}, tc: {} },
          vehicles: {},
        },
      ],
    });
    expect(result.total_cost_usd).toBe(300);
    expect(result.items[2]).toMatchObject({ covered: true, quantity: 0 });
    expect(result.scenarios[0]).toMatchObject({ status: "ok", total_cost_usd: 960 });
  });
  it("validates the config by billing unit; absent is different from malformed", () => {
    for (const pricing_unit of ["per_person", "per_group"] as const)
      expect(pricingConfigSchema.parse({ pricing_unit, pricing_config: {} })).toEqual({
        pricing_unit,
        pricing_config: {},
      });
    expect(
      pricingConfigSchema.safeParse({ pricing_unit: "per_room", pricing_config: {} }).success,
    ).toBe(false);
    expect(parsePricingConfig("per_room", {})).toEqual({});
    for (const config of [
      { room_type: "STANDARD" },
      { nights: 0 },
      { nights: 1.5 },
      { nights: "2" },
      { nightz: 2 },
    ])
      expect(() => parsePricingConfig("per_room", config)).toThrow();
    expect(() => parsePricingConfig("per_person", { nights: 2 })).toThrow();
    expect(() =>
      parsePricingConfig("per_vehicle", { rate_band: { pax_min: 10, pax_max: 4 } }),
    ).toThrow();
  });
});
