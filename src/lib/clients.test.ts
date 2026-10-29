import { describe, expect, it } from "vitest";
import { normalizeOptionalEmail } from "./clients";

describe("email opcional del cliente", () => {
  it("permite crear o mantener un cliente sin email", () => {
    expect(normalizeOptionalEmail("  ")).toBeNull();
  });

  it("normaliza un email válido para altas y correcciones", () => {
    expect(normalizeOptionalEmail("  andrea@uyuniadventure.com  ")).toBe("andrea@uyuniadventure.com");
  });

  it.each(["andrea", "andrea@", "@uyuniadventure.com", "andrea @uyuniadventure.com"])("rechaza %s con un mensaje comprensible", (email) => {
    expect(() => normalizeOptionalEmail(email)).toThrow("Ingresa un email válido");
  });
});
