import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { loadQuote, recalculateQuote } from "@/lib/quotes";
import { money } from "@/components/catalog/shared";
import { QuoteWorkspace } from "./quote-workspace";

vi.mock("@/lib/quotes", async (original) => ({
  ...(await original<typeof import("@/lib/quotes")>()),
  loadQuote: vi.fn(),
  recalculateQuote: vi.fn(),
}));
vi.mock("@/hooks/use-auth", () => ({
  useCurrentUser: () => ({ user: { id: "seller" }, role: "vendedor" }),
  canManageCatalog: () => false,
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it.each([
  { status: "enviada", archived_at: null },
  { status: "borrador", archived_at: "2026-10-11T12:00:00Z" },
])(
  "opens $status (archived=$archived_at) with its saved line costs and no recalculation",
  async ({ status, archived_at }) => {
    const data = {
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
    vi.mocked(loadQuote).mockResolvedValue(data);
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

    expect(await screen.findByText("Buffet guardado")).toBeInTheDocument();
    expect(screen.getByText(`Costo ${money(40, "USD")}`)).toBeInTheDocument();
    expect(screen.getByText(`${money(20, "USD")} × 2`)).toBeInTheDocument();
    expect(screen.getByText(money(50, "USD"))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar borrador" })).not.toBeInTheDocument();
    expect(recalculateQuote).not.toHaveBeenCalled();
  },
);
