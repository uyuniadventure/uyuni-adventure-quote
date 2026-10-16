import type { ProposalContext, DocSection } from "../../supabase/functions/_shared/proposal";
export function proposalFixture(channel = "B2C"): ProposalContext {
  const section = (code: string, key: string | null, sort: number, body = ""): DocSection => ({
    id: code,
    sort,
    hidden: false,
    options: {},
    title_override: null,
    body_override_html: null,
    override_lang: null,
    reviewed: false,
    snapshot: {
      code,
      kind: key ? "dynamic" : "static",
      data_key: key,
      required: ["TYC", "PRECIO", "ITINERARIO"].includes(code),
      channel: "all",
      translations: [{ lang: "es", title: code, body_html: body, reviewed: true }],
    },
  });
  const sections = [
    section("INTRO", null, 1, "<p>Hola {{cliente}}, viajas con {{vendedor}}.</p>"),
    section("ITINERARIO", "itinerario", 2),
    section("PRECIO", "precio", 3),
    section("TYC", null, 4, "<p>Condiciones de prueba.</p>"),
    section("VALIDEZ", "validez", 5),
  ];
  sections[4]!.options = { valid_until: "2026-12-01T18:00" };
  sections[3]!.options = { mode: "full" };
  return {
    quote: {
      id: "quote",
      language: "es",
      client_type: channel,
      start_date: "2027-01-20",
      pax_paying: 2,
      tc_count: 0,
      total_price_usd: 1000,
      price_per_pax_usd: 500,
      balance_due_days: 5,
      tour_sku: "UYUUYU-2D1N",
      document_snapshot: {
        client_name: "Cliente de prueba",
        payment_text: "Saldo antes del viaje",
        item_labels: { item: "Servicio para viajeros" },
      },
      calculation: {
        status: "ok",
        scenarios:
          channel === "B2B"
            ? [{ pax_paying: 4, total_price_usd: 1600, price_per_pax_usd: 400, status: "ok" }]
            : [],
      },
    },
    days: [
      {
        id: "day1",
        day_number: 1,
        date: "2027-01-20",
        snapshot: { reviewed: true },
        block_snapshot: {
          content: {
            title: { es: "Salar" },
            description: { es: "Programa de prueba" },
            internal_notes: "SECRET_INTERNAL",
            accommodation_text: { es: "Hotel de prueba" },
            meals: ["Desayuno"],
          },
        },
        overrides: { description: { es: "Texto propio T01d" } },
      },
    ],
    items: [
      {
        id: "item",
        quote_day_id: "day1",
        sku: "INTERNAL_SKU",
        description: "Descripción base",
        pricing_snapshot: {
          cost: "SECRET_COST",
          margin: "SECRET_MARGIN",
          adjustment: "SECRET_ADJUSTMENT",
        },
        included: true,
      },
    ],
    sections,
    seller: "Vendedora",
    payments: { deposit_required_usd: 300, deposits_usd: 100, paid_usd: 150, unconverted: 0 },
    source_hash: "revision-1",
  };
}
