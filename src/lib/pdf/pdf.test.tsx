// @vitest-environment node
import { describe, it, expect } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { mkdir, writeFile } from "node:fs/promises";
import { QuoteDocument, type QuotePdfData } from "./document";
import { Children, isValidElement, type ReactNode } from "react";

function visibleText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child): string => {
      if (typeof child === "string" || typeof child === "number") return String(child);
      return isValidElement<{ children?: ReactNode }>(child)
        ? visibleText(child.props.children)
        : "";
    })
    .join(" ");
}

describe("PDF rendering", () => {
  it.each(["B2B", "B2C"] as const)(
    "renders %s without passenger or internal cost data",
    async (client_type) => {
      const data = {
        quote: {
          id: "preview",
          code: "SPAUYU-3D2N-MP-ES-26-0001",
          tour_sku: "SPAUYU-3D2N-MP",
          language: "es",
          client_type,
          start_date: "2026-12-01",
          pax_paying: 2,
          tc_count: 0,
          rooming: { paying: { DBL_TWN: 1 }, tc: {} },
          vehicles: { "4x4": 1 },
          deposit_pct: 30,
          balance_due_days: 5,
          card_surcharge_pct: 3,
        },
        days: [1, 2, 3].map((n) => ({
          id: String(n),
          day_number: n,
          date: `2026-12-0${n}`,
          title: ["Lagunas Altiplánicas", "Salar de Uyuni", "Regreso a Uyuni"][n - 1],
          description:
            "Un recorrido privado por los paisajes del Altiplano boliviano, con tiempo para explorar las lagunas y disfrutar de la inmensidad del salar. Nuestro conductor acompaña al grupo durante toda la jornada.",
          includes: "Almuerzo y traslados",
          excludes: "Gastos personales",
          route_from: "SPA",
          route_to: "UYU",
        })),
        items: [1, 2, 3].map((n) => ({
          id: "item" + n,
          quote_day_id: String(n),
          description: "Transporte privado 4x4",
          sku: "TRANSFER",
          type: "transporte",
          included: true,
          adjustment_pct: 0.064,
          adjustment_note: "INTERNO_COMBUSTIBLE_2027",
          unit_cost_original: 876.54,
          total_cost_usd: 932.63856,
        })),
        content: {
          client_name: "Cliente de demostración",
          introduction: "Una experiencia de tres días entre el desierto y el salar.",
          terms:
            "Condiciones de demostración para comprobar la composición del documento. No constituyen una oferta comercial.",
          terms_url: "https://example.com/terms",
          banks: [
            {
              entity: "Ando Libre LLC",
              bank_name: "Banco de demostración",
              account_holder: "Titular de demostración",
              account_number: "DEMO",
              currency: "USD",
            },
          ],
          info: [
            {
              title: "Altitud",
              content: "Consulta la información práctica facilitada para preparar tu viaje.",
            },
          ],
        },
        calculation: {
          total_price_usd: 1200,
          price_per_pax_usd: 600,
          single_supplement_pp: 100,
          items: [1, 2, 3].map((n) => ({
            id: "item" + n,
            quantity: 1,
            base_cost_usd: 876.54,
            adjustment_pct: 0.064,
            adjustment_amount_usd: 56.09856,
            total_cost_usd: 932.63856,
          })),
          scenarios: [],
        },
        optional_prices: {},
      } as unknown as QuotePdfData;
      const text = visibleText(QuoteDocument({ data }));
      expect(text).not.toMatch(/INTERNO_COMBUSTIBLE|6[.,]4\s*%|876[.,]54|932[.,]6|56[.,]09/);
      expect(text).toContain(
        new Intl.NumberFormat("es", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 2,
        }).format(1200),
      );
      const buffer = await renderToBuffer(<QuoteDocument data={data} />);
      expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
      expect(buffer.byteLength).toBeGreaterThan(2000);
      await mkdir("tmp/pdfs", { recursive: true });
      await writeFile(`tmp/pdfs/preview-${client_type}.pdf`, buffer);
    },
  );
});
