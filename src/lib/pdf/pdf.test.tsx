// @vitest-environment node
import { describe, it, expect } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { mkdir, writeFile } from "node:fs/promises";
import { QuoteDocument, type QuotePdfData } from "./document";

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
          items: [],
          scenarios: [],
        },
        optional_prices: {},
      } as unknown as QuotePdfData;
      const buffer = await renderToBuffer(<QuoteDocument data={data} />);
      expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
      expect(buffer.byteLength).toBeGreaterThan(2000);
      await mkdir("tmp/pdfs", { recursive: true });
      await writeFile(`tmp/pdfs/preview-${client_type}.pdf`, buffer);
    },
  );
});
