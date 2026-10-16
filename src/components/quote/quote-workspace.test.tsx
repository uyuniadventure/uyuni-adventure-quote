import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { loadQuote, recalculateQuote } from "@/lib/quotes";
import { beginQuoteEdit, transitionQuote } from "@/lib/states";
import type { Enums } from "@/types/db";
import { money } from "@/components/catalog/shared";
import { QuoteWorkspace } from "./quote-workspace";
import { updateDayContent } from "@/lib/quotes/days";

vi.mock("@/lib/quotes", async (original) => ({
  ...(await original<typeof import("@/lib/quotes")>()),
  loadQuote: vi.fn(),
  recalculateQuote: vi.fn(),
}));
const auth = vi.hoisted(() => ({ role: "vendedor" }));
vi.mock("@/hooks/use-auth", () => ({
  useCurrentUser: () => ({ user: { id: "seller" }, role: auth.role }),
  canManageCatalog: () => false,
}));
vi.mock("@/lib/states", () => ({ beginQuoteEdit: vi.fn(), transitionQuote: vi.fn() }));
vi.mock("@/lib/quotes/days", async (original) => ({
  ...(await original<typeof import("@/lib/quotes/days")>()),
  validateContinuity: vi.fn().mockResolvedValue([]),
  updateDayContent: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/db", async (original) => ({
  ...(await original<typeof import("@/lib/db")>()),
  db: {
    from: () => {
      const query = {
        select: () => query,
        or: () => query,
        eq: () => query,
        order: async () => ({ data: [], error: null }),
      };
      return query;
    },
  },
}));
beforeEach(() => {
  auth.role = "vendedor";
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

function savedQuote(status: Enums<"quote_status"> = "enviada", archived_at: string | null = null) {
  return {
    quote: {
      id: "quote",
      code: "LTd-0001",
      status,
      archived_at,
      start_date: "2026-10-14",
      language: "es",
      client_type: "B2C",
      pax_paying: 2,
      tc_count: 0,
      rooming: { paying: {}, tc: {} },
      staff: { drivers: 0, guides: 0 },
      vehicles: {},
      margin_pct: 25,
      fx_snapshot: { USD: 1 },
      pax_scenarios: [],
      calculation: {
        total_cost_usd: 40,
        total_margin_usd: 10,
        total_price_usd: 50,
        price_per_pax_usd: 25,
        single_supplement_pp: 0,
        scenarios: [],
        warnings: [],
        days: [{ day_number: 1, total_cost_usd: 40 }],
        items: [{ id: "item", quantity: 2, total_cost_usd: 40, unit_cost_original: 20 }],
      },
    },
    days: [{ id: "day", day_number: 1, title: "Día guardado", snapshot: { reviewed: true } }],
    items: [
      {
        id: "item",
        quote_day_id: "day",
        description: "Buffet guardado",
        sku: "BUFFET",
        type: "comida",
        pricing_unit: "per_person",
        qty: 1,
        currency: "USD",
        included: true,
        margin_applicable: true,
        applies_tc: false,
        day_span: 1,
        pricing_snapshot: {},
      },
    ],
  } as unknown as Awaited<ReturnType<typeof loadQuote>>;
}

function renderQuote(data = savedQuote()) {
  vi.mocked(loadQuote).mockResolvedValue(data);
  vi.mocked(recalculateQuote).mockResolvedValue(
    data.quote.calculation as unknown as Awaited<ReturnType<typeof recalculateQuote>>,
  );
  const root = createRootRoute({ component: Outlet });
  const editor = createRoute({
    getParentRoute: () => root,
    path: "/nueva-cotizacion",
    component: () => <QuoteWorkspace quoteId="quote" onReset={() => {}} />,
  });
  const list = createRoute({
    getParentRoute: () => root,
    path: "/cotizaciones",
    component: () => null,
  });
  const router = createRouter({
    routeTree: root.addChildren([editor, list]),
    history: createMemoryHistory({ initialEntries: ["/nueva-cotizacion"] }),
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return router;
}

it.each([
  { status: "enviada" as const, archived_at: null },
  { status: "borrador" as const, archived_at: "2026-10-11T12:00:00Z" },
])(
  "opens $status (archived=$archived_at) with its saved line costs and no recalculation",
  async ({ status, archived_at }) => {
    renderQuote(savedQuote(status, archived_at));
    expect(await screen.findByText("Buffet guardado")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Costo base USD" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Ajuste %" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Costo ajustado USD" })).toBeInTheDocument();
    expect(screen.getByText(`Costo ${money(40, "USD")}`)).toBeInTheDocument();
    expect(screen.getByText(`${money(20, "USD")} × 2`)).toBeInTheDocument();
    expect(screen.getByText(money(50, "USD"))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar borrador" })).not.toBeInTheDocument();
    expect(recalculateQuote).not.toHaveBeenCalled();
  },
);

it("shows a missing-rate line in red and offers Precio manual with the full diagnostic", async () => {
  const data = savedQuote("borrador");
  const warning = "Día 1 · BUFFET: sin tarifa para 04-11-2026 y 2 pax. Tarifas cargadas: ninguna.";
  data.quote.calculation = {
    ...(data.quote.calculation as object),
    status: "error",
    total_cost_usd: null,
    total_price_usd: null,
    price_per_pax_usd: null,
    items: [{ id: "item", status: "error", quantity: 2, total_cost_usd: null, warning }],
  };
  renderQuote(data);
  const row = (await screen.findByText("Buffet guardado")).closest("tr")!;
  expect(row).toHaveClass("text-destructive");
  expect(within(row).getByText(warning)).toBeInTheDocument();
  fireEvent.click(within(row).getByRole("button", { name: "Precio manual" }));
  expect(
    await screen.findByRole("dialog", { name: "Precio solo para esta cotización" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Aplicar precio" })).toBeDisabled();
});

it("keeps Editor/Historial and edits a sent quote through a new version", async () => {
  vi.mocked(beginQuoteEdit).mockResolvedValue("new-draft");
  const router = renderQuote();
  expect(await screen.findByRole("tab", { name: "Editor" })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Historial" })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "PDF y envío" })).toBeInTheDocument();
  expect(screen.queryByRole("tab", { name: "Textos del PDF" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Editar nueva versión" }));
  await waitFor(() => expect(beginQuoteEdit).toHaveBeenCalledWith("quote"));
  await waitFor(() => expect(router.state.location.search).toEqual({ quote: "new-draft" }));
  expect(transitionQuote).not.toHaveBeenCalled();
});

it("edits day text inside Editor through the saved snapshot, without recalculating prices", async () => {
  const data = savedQuote("borrador");
  data.days[0]!.block_snapshot = { content: { description: { es: "Descripción guardada" } } };
  renderQuote(data);
  await screen.findByText("Textos del día");
  fireEvent.click(screen.getByText("Textos del día"));
  await waitFor(() => expect(recalculateQuote).toHaveBeenCalledTimes(1));
  vi.mocked(recalculateQuote).mockClear();
  const description = screen.getByLabelText("Descripción");
  expect(description).toHaveValue("Descripción guardada");
  fireEvent.change(description, { target: { value: "Narrativa actualizada" } });
  fireEvent.blur(description);
  await waitFor(() =>
    expect(updateDayContent).toHaveBeenCalledWith("day", {
      description: { es: "Narrativa actualizada" },
    }),
  );
  expect(recalculateQuote).not.toHaveBeenCalled();
});

it("does not offer a manual sale to a seller", async () => {
  renderQuote();
  await screen.findByText("Buffet guardado");
  expect(screen.queryByRole("button", { name: "Marcar vendida" })).not.toBeInTheDocument();
});

it.each([
  { label: "Marcar vendida", status: "vendida" as const },
  { label: "Cancelar cotización", status: "cancelada" as const },
  { label: "Marcar perdida", status: "perdida" as const },
])(
  "requires a reason before $status and forwards it to the RPC wrapper",
  async ({ label, status }) => {
    auth.role = "admin";
    const prompt = vi
      .spyOn(window, "prompt")
      .mockReturnValueOnce(null)
      .mockReturnValueOnce("  ")
      .mockReturnValueOnce("  Motivo documentado  ");
    vi.mocked(transitionQuote).mockResolvedValue(savedQuote(status).quote);
    renderQuote();
    const button = await screen.findByRole("button", { name: label });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(transitionQuote).not.toHaveBeenCalled();
    fireEvent.click(button);
    await waitFor(() =>
      expect(transitionQuote).toHaveBeenCalledExactlyOnceWith(
        "quote",
        status,
        "Motivo documentado",
      ),
    );
    expect(prompt).toHaveBeenCalledTimes(3);
  },
);

it("does not offer changes to an archived sent version", async () => {
  auth.role = "admin";
  renderQuote(savedQuote("enviada", "2026-10-12T12:00:00Z"));
  await screen.findByText("Versión anterior: solo lectura.");
  for (const name of [
    "Editar nueva versión",
    "Marcar vendida",
    "Marcar perdida",
    "Cancelar cotización",
  ]) {
    expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
  }
});

it("blocks sending on a red calculation warning but permits cancellation", async () => {
  const data = savedQuote("revisada");
  data.quote.calculation = { ...(data.quote.calculation as object), status: "error" };
  renderQuote(data);
  expect(await screen.findByRole("button", { name: "Marcar enviada" })).toBeDisabled();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Cancelar cotización" })).toBeEnabled(),
  );
  expect(screen.getByRole("button", { name: "Marcar enviada" })).toBeDisabled();
});
