import { describe, it, expect } from "vitest";
import {
  blockSignature,
  proposeRooming,
  proposeTransport,
  roomingForNight,
  roomingWarnings,
  transportWarning,
} from "./selection-model";
import { calculateQuote, type QuoteInput, type PricingItem } from "../pricing";
const option = { serviceId: "leo", supplierId: "leo", capacity: 5, cost: 100 };
const item: PricingItem = {
  id: "meal",
  pricing_unit: "per_person",
  currency: "USD",
  qty: 1,
  rates: [
    {
      season: "ALL",
      valid_from: null,
      valid_to: null,
      pax_min: null,
      pax_max: null,
      price_net: 10,
    },
  ],
  applies_tc: false,
  margin_applicable: true,
  included: true,
};
function input(items: PricingItem[]): QuoteInput {
  return {
    start_date: "2026-11-01",
    pax_paying: 6,
    tc_count: 1,
    rooming: { paying: {}, tc: {} },
    vehicles: {},
    fx_snapshot: { USD: 1 },
    rounding_rule: { mode: "none", increment: 1 },
    margin_pct: 25,
    days: [{ day_number: 1, items }],
  };
}
describe("T01h proposals and pricing", () => {
  it("proposes two 4x4 for seven, and the cheaper Sprinter when available", () => {
    expect(proposeTransport([option], 7).proposal).toEqual([{ serviceId: "leo", qty: 2 }]);
    expect(
      proposeTransport(
        [option, { serviceId: "sprinter", supplierId: "other", capacity: 12, cost: 150 }],
        7,
      ).proposal,
    ).toEqual([{ serviceId: "sprinter", qty: 1 }]);
    expect(proposeTransport([option], 7, { supplierId: "missing" }).cost).toBeNull();
  });
  it("supports mixed vehicles when that costs less", () => {
    expect(
      proposeTransport(
        [option, { serviceId: "sprinter", supplierId: "leo", capacity: 12, cost: 180 }],
        17,
      ).proposal,
    ).toEqual([
      { serviceId: "leo", qty: 1 },
      { serviceId: "sprinter", qty: 1 },
    ]);
  });
  it("keeps a manual vehicle and reports missing seats after increasing pax", () => {
    const vehicle = {
      ...item,
      id: "car",
      slot_key: "TRANSPORTE",
      pricing_unit: "per_vehicle" as const,
      capacity: 5,
      qty: 1,
      selection_source: "manual" as const,
    };
    const data = input([vehicle]);
    data.pax_paying = 9;
    data.tc_count = 0;
    const result = calculateQuote(data);
    expect(result.items[0]!.quantity).toBe(1);
    expect(result.selection_issues).toContain(transportWarning(5, 9, 1));
  });
  it("proposes DBL plus odd SGL and a separate SGL for TC", () => {
    expect(proposeRooming(3, 1)).toEqual([
      { room_type: "DBL", count: 1, for_tc: false },
      { room_type: "SGL", count: 1, for_tc: false },
      { room_type: "SGL", count: 1, for_tc: true },
    ]);
  });
  it("night overrides replace the generic distribution", () => {
    const rows = [
      ...proposeRooming(4),
      { night: 2, room_type: "TPL", count: 1, for_tc: false },
      { night: 2, room_type: "SGL", count: 1, for_tc: false },
    ];
    expect(roomingForNight(rows, 1).paying).toEqual({ DBL: 2 });
    expect(roomingForNight(rows, 2).paying).toEqual({ TPL: 1, SGL: 1 });
  });
  it("charges 2 DBL + 1 TPL for seven; reports a distribution of six", () => {
    const rooms = [
      { room_type: "DBL", count: 2, for_tc: false },
      { room_type: "TPL", count: 1, for_tc: false },
    ];
    expect(roomingWarnings(rooms, 1, 7, 0)).toEqual([]);
    expect(roomingWarnings([{ room_type: "DBL", count: 3, for_tc: false }], 1, 7, 0)[0]).toContain(
      "suma 6",
    );
    const data = input(
      ["DBL", "TPL"].map((type) => ({
        ...item,
        id: type,
        pricing_unit: "per_room",
        room_type: type,
        slot_key: "ALOJAMIENTO",
      })),
    );
    data.pax_paying = 7;
    data.tc_count = 0;
    data.rooming_rows = rooms;
    expect(calculateQuote(data).total_cost_usd).toBe(30);
  });
  it.each(["charged", "free", "excluded"] as const)(
    "separates cost and supplier quantities: %s",
    (policy) => {
      const result = calculateQuote(input([{ ...item, tc_policy: policy }])).items[0]!;
      expect(result.qty_cost).toBe(policy === "charged" ? 7 : 6);
      expect(result.qty_supplier).toBe(policy === "excluded" ? 6 : 7);
    },
  );
  it("custom minus ten percent reduces selling price", () => {
    const result = calculateQuote(input([{ ...item, margin_mode: "custom", margin_pct: -10 }]));
    expect(result.total_cost_usd).toBe(60);
    expect(result.total_price_usd).toBe(54);
  });
  it("unselected alternatives cost zero", () => {
    expect(calculateQuote(input([{ ...item, selected: false }])).total_cost_usd).toBe(0);
  });
  it("a per-service purchase is charged only on the first of three days", () => {
    const multi = {
      ...item,
      billing: "per_service" as const,
      span_days: 3,
      coverage_key: "purchase",
      coverage_start_day: 1,
    };
    const data = input([]);
    data.days = [1, 2, 3].map((day) => ({ day_number: day, items: [{ ...multi, id: `i${day}` }] }));
    const result = calculateQuote(data);
    expect(result.total_cost_usd).toBe(60);
    expect(result.items.map((i) => i.covered)).toEqual([false, true, true]);
  });
});
describe("hotel block signature", () => {
  const block = {
    route_from: "SPA",
    route_to: "UYU",
    hotel_id: "hotel-a",
    text_es: "Día salar",
    items: [{ slot_key: "ALOJAMIENTO", service_id: "sgl", location: "Uyuni", meal_plan: "BB" }],
  };
  it("ignores room ID and default room choice", () =>
    expect(blockSignature(block)).toBe(
      blockSignature({ ...block, items: [{ ...block.items[0]!, service_id: "twn" }] }),
    ));
  it("distinguishes hotels", () =>
    expect(blockSignature(block)).not.toBe(blockSignature({ ...block, hotel_id: "hotel-b" })));
  it("preserves identities of other services", () =>
    expect(blockSignature({ ...block, items: [{ slot_key: "CENA", service_id: "one" }] })).not.toBe(
      blockSignature({ ...block, items: [{ slot_key: "CENA", service_id: "two" }] }),
    ));
});
