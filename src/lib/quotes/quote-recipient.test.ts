import { describe, expect, it } from "vitest";
import { quoteRecipient } from "../../../supabase/functions/_shared/quote-recipient";

describe("destinatario vigente de una cotización", () => {
  it("utiliza el email actual del cliente aunque el snapshot histórico esté vacío u obsoleto", () => {
    expect(quoteRecipient(undefined, "nuevo@uyuniadventure.com")).toBe("nuevo@uyuniadventure.com");
  });

  it("deja de usar un email eliminado del cliente", () => {
    expect(quoteRecipient(undefined, null)).toBeNull();
  });

  it("rechaza un destinatario actual con formato inválido", () => {
    expect(quoteRecipient(undefined, "correo-invalido")).toBeNull();
  });

  it("conserva un destinatario explícito para operaciones internas autorizadas", () => {
    expect(quoteRecipient("explicito@example.com", "cliente@example.com")).toBe("explicito@example.com");
  });
});
