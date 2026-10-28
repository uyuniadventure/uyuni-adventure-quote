import { describe, expect, it } from "vitest";
import type { Tables } from "../../types/db";
import {
  SCENARIO_IMPORT_OVERRIDE_NOTE,
  hasCatalogRateSnapshot,
  manualOverrideNote,
  quoteItemCostLabel,
} from "./scenario-origin";

const item = (changes: Partial<Tables<"quote_items">> = {}) =>
  ({
    price_overridden: true,
    override_note: SCENARIO_IMPORT_OVERRIDE_NOTE,
    pricing_snapshot: { scenario_line_id: "line-1", charge_once_key: "room" },
    ...changes,
  }) as Tables<"quote_items">;

describe("presentación del origen del costo", () => {
  it("distingue el costo importado intacto, la edición manual y la tarifa de catálogo", () => {
    expect(quoteItemCostLabel(item())).toBe("Costo importado del escenario");
    expect(
      quoteItemCostLabel(item({ override_note: manualOverrideNote(item(), "Precio negociado") })),
    ).toBe("Precio manual");
    expect(quoteItemCostLabel(item({ price_overridden: false, override_note: null }))).toBeNull();
  });

  it("solo ofrece volver a una tarifa cuando el snapshot contiene tarifas", () => {
    expect(hasCatalogRateSnapshot(item())).toBe(false);
    expect(hasCatalogRateSnapshot(item({ pricing_snapshot: { rates: [{ price_net: 10 }] } }))).toBe(true);
  });
});
