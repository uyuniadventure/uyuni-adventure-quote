import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listQuotes, type QuoteListRow } from "@/lib/quotes/list";
import { QuoteList } from "./quote-list";

vi.mock("@/lib/quotes/list", async (original) => ({
  ...(await original<typeof import("@/lib/quotes/list")>()),
  listQuotes: vi.fn(),
}));
vi.mock("@/hooks/use-auth", () => ({
  useCurrentUser: () => ({ user: { id: "seller" }, role: "vendedor" }),
  canManageCatalog: () => false,
}));
const load = vi.mocked(listQuotes);
const draft: QuoteListRow = {
  id: "saved-quote",
  code: "UYUUYU-3D2N-LTd-ES-26-0001",
  client_type: "B2C",
  start_date: "2026-10-14",
  pax_paying: 2,
  tc_count: 0,
  status: "borrador",
  archived_at: null,
  total_price_usd: 1843.75,
  updated_at: "2026-10-11T12:00:00Z",
  clients: { name: "Referencia LTd" },
};

function showList() {
  const root = createRootRoute({ component: Outlet });
  const list = createRoute({
    getParentRoute: () => root,
    path: "/cotizaciones",
    component: QuoteList,
  });
  const editor = createRoute({
    getParentRoute: () => root,
    path: "/nueva-cotizacion",
    validateSearch: (search: Record<string, unknown>) => ({
      quote: typeof search["quote"] === "string" ? search["quote"] : undefined,
    }),
    component: () => <div>Editor existente</div>,
  });
  const router = createRouter({
    routeTree: root.addChildren([list, editor]),
    history: createMemoryHistory({ initialEntries: ["/cotizaciones"] }),
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}
beforeEach(() => {
  load.mockReset();
});
afterEach(cleanup);

describe("Cotizaciones", () => {
  it("opens the saved draft ID in the existing editor", async () => {
    load.mockResolvedValue({ rows: [draft], count: 1 });
    const router = showList();
    const link = await screen.findByRole("link", { name: `Continuar ${draft.code}` });
    expect(link).toHaveAttribute("href", "/nueva-cotizacion?quote=saved-quote");
    fireEvent.click(link);
    await waitFor(() => expect(router.state.location.search).toEqual({ quote: draft.id }));
    expect(await screen.findByText("Editor existente")).toBeInTheDocument();
  });

  it("resets pagination when the client or code filter changes", async () => {
    load.mockResolvedValue({ rows: [draft], count: 30 });
    showList();
    fireEvent.click(await screen.findByRole("button", { name: "Siguiente" }));
    await waitFor(() =>
      expect(load).toHaveBeenLastCalledWith({ code: "", client: "", status: "all", page: 1 }),
    );
    fireEvent.change(screen.getByLabelText("Cliente"), { target: { value: "Andrea" } });
    fireEvent.change(screen.getByLabelText("Código"), { target: { value: "LTd" } });
    await waitFor(() =>
      expect(load).toHaveBeenLastCalledWith({
        code: "LTd",
        client: "Andrea",
        status: "all",
        page: 0,
      }),
    );
  });

  it("distinguishes missing calculations from zero and opens archived quotes read-only", async () => {
    load.mockResolvedValue({
      rows: [
        { ...draft, total_price_usd: null },
        {
          ...draft,
          id: "archive",
          code: "ARCHIVED",
          archived_at: "2026-10-11",
          total_price_usd: 0,
        },
      ],
      count: 2,
    });
    showList();
    expect(await screen.findByText("Sin calcular")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver ARCHIVED" })).toBeInTheDocument();
    expect(screen.getByText("Archivada")).toBeInTheDocument();
    expect(screen.getByText(/US\$.*0,00/)).toBeInTheDocument();
  });

  it("shows a recoverable error instead of claiming the list is empty", async () => {
    load
      .mockRejectedValueOnce(new Error("Sin conexión"))
      .mockResolvedValue({ rows: [draft], count: 1 });
    showList();
    expect(await screen.findByRole("alert")).toHaveTextContent("Sin conexión");
    expect(screen.queryByText("No hay cotizaciones con estos filtros.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText(draft.code)).toBeInTheDocument();
  });
});
