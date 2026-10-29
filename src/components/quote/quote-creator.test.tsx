import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { QuoteCreator, TemplateStep } from "./quote-creator";
import {
  suggestTemplates,
  templateSuggestionError,
  type TemplateSuggestion,
} from "@/lib/quotes/suggestions";
import { createEmptyQuote, createQuoteFromTemplateSelection, getTemplateForQuote } from "@/lib/quotes";
import { suggestCostScenarios } from "@/lib/quotes/scenario-suggestions";

vi.mock("@/lib/db", () => ({
  db: {
    from: () => {
      throw new Error("La UI no consulta plantillas directamente");
    },
  },
}));
vi.mock("@/lib/quotes", () => ({
  createQuoteFromTemplateSelection: vi.fn(),
  createEmptyQuote: vi.fn(),
  getTemplateForQuote: vi.fn(),
  templateQuotePrefill: (template: {
    route_from: string;
    route_to: string;
    days: number;
    category: string;
    modality: string;
    quote_defaults: { pax_paying?: number; tc_count?: number };
  }) => ({
    route_from: template.route_from,
    route_to: template.route_to,
    days: String(template.days),
    category: template.category,
    modality: template.modality,
    ...(template.quote_defaults.pax_paying !== undefined
      ? { pax_paying: String(template.quote_defaults.pax_paying) }
      : {}),
    ...(template.quote_defaults.tc_count !== undefined
      ? { tc_count: String(template.quote_defaults.tc_count) }
      : {}),
  }),
}));
vi.mock("@/components/catalog/kit", async (original) => ({
  ...(await original<typeof import("@/components/catalog/kit")>()),
  useLocationCodes: () => ({ data: [], isLoading: false }),
}));
vi.mock("./quote-ops", () => ({ latestFx: vi.fn(async () => ({ USD: 1 })) }));
vi.mock("@/lib/quotes/suggestions", async (original) => ({
  ...(await original<typeof import("@/lib/quotes/suggestions")>()),
  suggestTemplates: vi.fn(),
}));
vi.mock("@/lib/quotes/scenario-suggestions", async (original) => ({
  ...(await original<typeof import("@/lib/quotes/scenario-suggestions")>()),
  suggestCostScenarios: vi.fn(),
}));
const basics = {
  client: { id: "client", label: "Cliente" },
  client_type: "B2C" as const,
  language: "es",
  start_date: "2026-10-14",
  pax_paying: "2",
  tc_count: "0",
  modality: "privado" as const,
  route_from: "UYU",
  route_to: "SPA",
  days: "3",
  category: "COMFORT" as const,
};
const pending = {
  id: "template",
  sku: "UYUSPA-4D3N",
  name: "Tour de prueba",
  route_from: "UYU",
  route_to: "SPA",
  days: 4,
  nights: 3,
  category: "COMFORT",
  modality: "privado",
  hotel_combo: null,
  meals_summary: null,
  status: "pendiente",
  economic_status: "validated",
  economic_issues: [],
  quote_defaults: {},
  import_warnings: ["Confirmar hotel del día 2"],
  template_days: [{ count: 4 }],
  score: 10,
} satisfies TemplateSuggestion;
function show() {
  const onCreated = vi.fn(),
    onBack = vi.fn();
  const qc = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  render(
    <QueryClientProvider client={qc}>
      <TemplateStep basics={basics} onBack={onBack} onCreated={onCreated} />
    </QueryClientProvider>,
  );
  return { onCreated, onBack, qc };
}
function showDirectTemplate() {
  const onCreated = vi.fn();
  const qc = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  render(
    <QueryClientProvider client={qc}>
      <QuoteCreator templateId="template" onCreated={onCreated} />
    </QueryClientProvider>,
  );
  return { onCreated };
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(suggestCostScenarios).mockResolvedValue([]);
});
afterEach(cleanup);
it("shows pending status and warnings, and creates through the library", async () => {
  vi.mocked(suggestTemplates).mockResolvedValue([pending]);
  vi.mocked(createQuoteFromTemplateSelection).mockResolvedValue({ id: "quote" } as Awaited<
    ReturnType<typeof createQuoteFromTemplateSelection>
  >);
  const { onCreated } = show();
  expect(await screen.findByText("Pendiente de revisión")).toBeVisible();
  expect(screen.getByText("Confirmar hotel del día 2")).toBeVisible();
  expect(screen.getByText("Duración distinta")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Usar plantilla" }));
  await waitFor(() => expect(onCreated).toHaveBeenCalledWith("quote"));
  expect(createQuoteFromTemplateSelection).toHaveBeenCalledWith(
    "template",
    null,
    expect.objectContaining({ pax_paying: 2, tc_count: 0 }),
  );
});
it("uses an exact economic scenario through the template action without a second workflow", async () => {
  vi.mocked(suggestTemplates).mockResolvedValue([pending]);
  vi.mocked(suggestCostScenarios).mockResolvedValue([
    {
      id: "scenario",
      template_id: "template",
      tour_sku: "UYUSPA-4D3N",
      rate_year: 2026,
      season: "ALL",
      pax: 2,
      approved_cost_usd: 2166,
      detail_cost_usd: 2166,
      cost_difference_usd: 0,
      reconciliation_status: "matched",
      source_ref: {},
      suggested_route_from: "UYU",
      suggested_route_to: "SPA",
    },
  ]);
  vi.mocked(createQuoteFromTemplateSelection).mockResolvedValue({ id: "combined" } as Awaited<
    ReturnType<typeof createQuoteFromTemplateSelection>
  >);
  const { onCreated } = show();
  expect(await screen.findByText("Costos disponibles · ALL · P2")).toBeVisible();
  expect(screen.queryByText("Escenarios económicos importados")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Usar escenario" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Usar plantilla" }));
  await waitFor(() =>
    expect(createQuoteFromTemplateSelection).toHaveBeenCalledWith(
      "template",
      "scenario",
      expect.objectContaining({ start_date: "2026-10-14", pax_paying: 2 }),
    ),
  );
  expect(onCreated).toHaveBeenCalledWith("combined");
});
it("requires an explicit season when a template has multiple exact economic scenarios", async () => {
  vi.mocked(suggestTemplates).mockResolvedValue([pending]);
  const economic = (id: string, season: string) => ({
    id,
    template_id: "template",
    tour_sku: "UYUSPA-4D3N",
    rate_year: 2026,
    season,
    pax: 2,
    approved_cost_usd: 100,
    detail_cost_usd: 100,
    cost_difference_usd: 0,
    reconciliation_status: "matched",
    source_ref: {},
    suggested_route_from: "UYU",
    suggested_route_to: "SPA",
  });
  vi.mocked(suggestCostScenarios).mockResolvedValue([
    economic("dry", "DRY"),
    economic("rain", "RAIN"),
  ]);
  show();
  expect(await screen.findByText(/Selecciona la temporada económica/)).toBeVisible();
  expect(screen.getByRole("combobox", { name: "Temporada de costos para UYUSPA-4D3N" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Usar plantilla" })).toBeDisabled();
});
it("does not show legacy economic warnings or block template selection", async () => {
  vi.mocked(suggestTemplates).mockResolvedValue([
    { ...pending, economic_status: "blocked", economic_issues: ["Falta tarifa del hotel"] },
  ]);
  vi.mocked(createQuoteFromTemplateSelection).mockResolvedValue({ id: "draft" } as Awaited<
    ReturnType<typeof createQuoteFromTemplateSelection>
  >);
  show();
  expect(await screen.findByRole("button", { name: "Usar plantilla" })).toBeVisible();
  expect(screen.queryByText("Totales pendientes")).not.toBeInTheDocument();
  expect(screen.queryByText("Falta tarifa del hotel")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Usar plantilla" }));
  await waitFor(() =>
    expect(createQuoteFromTemplateSelection).toHaveBeenCalledWith(
      "template",
      null,
      expect.anything(),
    ),
  );
});
it("starts a Spanish quote from scratch without requiring a template translation", async () => {
  vi.mocked(suggestTemplates).mockResolvedValue([]);
  vi.mocked(createEmptyQuote).mockResolvedValue({ id: "empty-quote" } as Awaited<
    ReturnType<typeof createEmptyQuote>
  >);
  const { onCreated } = show();
  fireEvent.click(screen.getByRole("button", { name: "Empezar desde cero" }));
  await waitFor(() => expect(onCreated).toHaveBeenCalledWith("empty-quote"));
  expect(createEmptyQuote).toHaveBeenCalledWith(
    expect.objectContaining({ language: "es", client_id: "client" }),
  );
  expect(createQuoteFromTemplateSelection).not.toHaveBeenCalled();
});
it("shows the missing migration after one retry and allows a successful manual retry", async () => {
  vi.mocked(suggestTemplates).mockRejectedValue(
    templateSuggestionError({ code: "42703", message: "column quote_defaults does not exist" }),
  );
  show();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "20261011000100_template_quote_defaults.sql",
  );
  expect(suggestTemplates).toHaveBeenCalledTimes(2);
  expect(screen.queryByText(/No hay plantillas/)).not.toBeInTheDocument();
  vi.mocked(suggestTemplates).mockResolvedValue([pending]);
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(await screen.findByText("Tour de prueba")).toBeVisible();
  expect(screen.queryByText(/20261011000100_template_quote_defaults\.sql/)).not.toBeInTheDocument();
});
it("distinguishes an empty accessible catalogue from a request error", async () => {
  vi.mocked(suggestTemplates).mockResolvedValue([]);
  show();
  expect(
    await screen.findByText(/No hay plantillas compatibles con esta ruta/),
  ).toBeVisible();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
it("keeps the existing reference-pax warning and a way back to basic data", async () => {
  vi.mocked(suggestTemplates).mockResolvedValue([
    { ...pending, quote_defaults: { pax_paying: 9, tc_count: 1 } },
  ]);
  const { onBack } = show();
  expect(await screen.findByText(/Vuelve a los datos básicos/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Usar plantilla" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Datos básicos" }));
  expect(onBack).toHaveBeenCalledOnce();
});
it("prefills a direct template URL and reports an archived template", async () => {
  vi.mocked(getTemplateForQuote).mockResolvedValue({
    ...pending,
    quote_defaults: { pax_paying: 9, tc_count: 1 },
  } as unknown as Awaited<ReturnType<typeof getTemplateForQuote>>);
  showDirectTemplate();
  expect(await screen.findByText("UYUSPA-4D3N · Tour de prueba")).toBeVisible();
  expect(screen.getByRole("spinbutton", { name: "Pax pagantes" })).toHaveValue(9);
  expect(screen.getByRole("spinbutton", { name: "TC (liberados)" })).toHaveValue(1);
  expect(screen.getByRole("spinbutton", { name: "Días disponibles" })).toHaveValue(4);
  cleanup();

  vi.mocked(getTemplateForQuote).mockRejectedValue(
    new Error("La plantilla está archivada y no se puede usar para cotizar."),
  );
  showDirectTemplate();
  expect(await screen.findByRole("alert")).toHaveTextContent("archivada");
});
