import { describe, expect, it } from "vitest";
import {
  calculateQuote,
  RateError,
  selectRate,
  type PricingItem,
  type QuoteInput,
  type Rate,
} from ".";

const rate: Rate = {
  season: "ALL",
  valid_from: "2026-01-01",
  valid_to: "2026-10-31",
  pax_min: 1,
  pax_max: 2,
  price_net: 100,
};
const item: PricingItem = {
  id: "temporary-uuid",
  sku: "TRANSFER-SPA",
  day_number: 1,
  pricing_unit: "per_person",
  currency: "USD",
  qty: 1,
  rates: [rate],
  applies_tc: false,
  margin_applicable: true,
  included: true,
};
const base: QuoteInput = {
  start_date: "2026-11-04",
  pax_paying: 2,
  tc_count: 0,
  rooming: { paying: {}, tc: {} },
  vehicles: {},
  fx_snapshot: { USD: 1 },
  margin_pct: 25,
  rounding_rule: { mode: "none", increment: 1 },
  days: [{ day_number: 1, items: [item] }],
};

describe("recoverable catalog rate errors", () => {
  it.each(["missing", "ambiguous"] as const)(
    "selectRate exposes %s with SKU, actual day/date/pax and loaded rates",
    (code) => {
      const rates =
        code === "missing" ? [rate] : [rate, rate].map((r) => ({ ...r, valid_to: null }));
      let error: unknown;
      try {
        selectRate({ ...item, day_number: 3, rates }, "2026-11-06", 2);
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(RateError);
      expect(error).toMatchObject({
        code,
        sku: "TRANSFER-SPA",
        day: 3,
        date: "2026-11-06",
        pax: 2,
        rates,
      });
      expect((error as Error).message).toContain("Día 3 · TRANSFER-SPA:");
      expect((error as Error).message).toContain("para 06-11-2026 y 2 pax. Tarifas cargadas:");
      expect((error as Error).message).not.toContain(item.id);
    },
  );
  it("saves a null total/error instead of a partial total and leaves its input untouched", () => {
    const input = {
      ...base,
      days: [
        {
          day_number: 1,
          items: [item, { ...item, id: "valid", rates: [{ ...rate, valid_to: null }] }],
        },
      ],
    };
    const before = structuredClone(input);
    const result = calculateQuote(input);
    expect(result).toMatchObject({ status: "error", total_cost_usd: null, total_price_usd: null });
    expect(result.items[0]).toMatchObject({
      status: "error",
      total_cost_usd: null,
      rate_error: { code: "missing", day: 1 },
    });
    expect(result.items[1]).toMatchObject({ status: "ok", total_cost_usd: 200 });
    expect(result.warnings[0]).toContain(
      "Día 1 · TRANSFER-SPA: sin tarifa para 04-11-2026 y 2 pax",
    );
    expect(input).toEqual(before);
  });
  it("an unavailable scenario also leaves the quote total null", () => {
    const result = calculateQuote({
      ...base,
      days: [{ day_number: 1, items: [{ ...item, rates: [{ ...rate, valid_to: null }] }] }],
      pax_scenarios: [{ pax_paying: 4, tc_count: 0, rooming: base.rooming, vehicles: {} }],
    });
    expect(result.status).toBe("error");
    expect(result.scenarios[0]!.status).toBe("error");
    expect(result.total_price_usd).toBeNull();
    expect(result.warnings.join(" ")).toContain("Escenario 4+0 TC: Día 1 · TRANSFER-SPA");
  });
  it("an explicit manual price can resolve a vehicle with no valid catalog rate", () => {
    const result = calculateQuote({
      ...base,
      days: [
        {
          day_number: 1,
          items: [
            {
              ...item,
              pricing_unit: "per_vehicle",
              price_overridden: true,
              unit_cost_original: 50,
              override_note: "Proveedor confirmó tarifa",
            },
          ],
        },
      ],
    });
    expect(result).toMatchObject({ status: "ok", total_cost_usd: 50, total_price_usd: 62.5 });
  });
  it("keeps an ambiguous multi-day purchase in error without charging its display copies", () => {
    const purchase = {
      ...item,
      day_span: 2,
      coverage_key: "one-purchase",
      coverage_start_day: 1,
      rates: [rate, rate].map((r) => ({ ...r, valid_to: null })),
    };
    const result = calculateQuote({
      ...base,
      days: [1, 2].map((day_number) => ({
        day_number,
        items: [{ ...purchase, id: `item-${day_number}` }],
      })),
    });
    expect(result.items[0]).toMatchObject({ status: "error", rate_error: { code: "ambiguous" } });
    expect(result.items[1]).toMatchObject({ status: "ok", covered: true, total_cost_usd: 0 });
    expect(result.total_price_usd).toBeNull();
  });
});
