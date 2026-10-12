import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TemplateStep } from "./quote-creator";
import {
  suggestTemplates,
  templateSuggestionError,
  type TemplateSuggestion,
} from "@/lib/quotes/suggestions";
import { createQuoteFromTemplate } from "@/lib/quotes";

vi.mock("@/lib/db", () => ({
  db: {
    from: () => {
      throw new Error("La UI no consulta plantillas directamente");
    },
  },
}));
vi.mock("@/lib/quotes", () => ({ createQuoteFromTemplate: vi.fn(), createEmptyQuote: vi.fn() }));
vi.mock("./quote-ops", () => ({ latestFx: vi.fn(async () => ({ USD: 1 })) }));
vi.mock("@/lib/quotes/suggestions", async (original) => ({
  ...(await original<typeof import("@/lib/quotes/suggestions")>()),
  suggestTemplates: vi.fn(),
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
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
it("shows pending status and warnings, and creates through the library", async () => {
  vi.mocked(suggestTemplates).mockResolvedValue([pending]);
  vi.mocked(createQuoteFromTemplate).mockResolvedValue({ id: "quote" } as Awaited<
    ReturnType<typeof createQuoteFromTemplate>
  >);
  const { onCreated } = show();
  expect(await screen.findByText("Pendiente de revisión")).toBeVisible();
  expect(screen.getByText("Confirmar hotel del día 2")).toBeVisible();
  expect(screen.getByText("Duración distinta")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Usar plantilla" }));
  await waitFor(() => expect(onCreated).toHaveBeenCalledWith("quote"));
  expect(createQuoteFromTemplate).toHaveBeenCalledWith(
    "template",
    expect.objectContaining({ pax_paying: 2, tc_count: 0 }),
  );
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
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
it("distinguishes an empty accessible catalogue from a request error", async () => {
  vi.mocked(suggestTemplates).mockResolvedValue([]);
  show();
  expect(
    await screen.findByText(/No hay plantillas activas o pendientes disponibles/),
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
