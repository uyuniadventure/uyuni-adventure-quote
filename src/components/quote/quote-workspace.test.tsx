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
import { addBlockDay, addBlockDays, deleteDay, moveDay, updateDayContent } from "@/lib/quotes/days";
import { loadClient } from "@/lib/clients";

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
vi.mock("@/lib/clients", async (original) => ({
  ...(await original<typeof import("@/lib/clients")>()),
  loadClient: vi.fn(),
}));
vi.mock("@/components/clients/client-sheet", () => ({
  ClientSheet: ({ client, onClose }: { client: { email: string | null }; onClose: () => void }) => (
    <div role="dialog" aria-label="Editar cliente en cotización">
      <span>{client.email}</span>
      <button onClick={onClose}>Cancelar cliente</button>
    </div>
  ),
}));
vi.mock("@/lib/quotes/days", async (original) => ({
  ...(await original<typeof import("@/lib/quotes/days")>()),
  addBlockDay: vi.fn(),
  addBlockDays: vi.fn(),
  deleteDay: vi.fn(),
  moveDay: vi.fn(),
  validateContinuity: vi.fn().mockResolvedValue([]),
  updateDayContent: vi.fn().mockResolvedValue(undefined),
}));
const blockSearch = vi.hoisted(() => ({
  search: vi.fn(),
  rows: vi.fn(),
  page: vi.fn(),
}));
const quoteCatalogSearch = vi.hoisted(() => ({ blocks: vi.fn(), services: vi.fn() }));
vi.mock("@/lib/catalog/block-search", () => ({
  searchDayBlockIds: blockSearch.search,
  fetchBlockRowsByIds: blockSearch.rows,
  fetchUnsearchedBlockPage: blockSearch.page,
}));
vi.mock("@/lib/quotes/catalog-search", async (original) => ({
  ...(await original<typeof import("@/lib/quotes/catalog-search")>()),
  searchQuoteBlocks: quoteCatalogSearch.blocks,
  searchQuoteServices: quoteCatalogSearch.services,
}));
vi.mock("@/components/catalog/block-editor", () => ({
  BlockEditor: ({
    id,
    onClose,
    onCreated,
    completeAction,
  }: {
    id: string | null;
    onClose: () => void;
    onCreated: (id: string) => void;
    completeAction: { label: string; onComplete: (id: string) => Promise<boolean> };
  }) =>
    id ? (
      <div role="dialog" aria-label="Editor de bloque diario">
        {id === "new" ? (
          <button onClick={() => onCreated("created-block")}>Crear bloque simulado</button>
        ) : (
          <button onClick={() => void completeAction.onComplete(id)}>{completeAction.label}</button>
        )}
        <button onClick={onClose}>Cancelar editor de bloque</button>
      </div>
    ) : null,
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
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  auth.role = "vendedor";
  vi.mocked(loadClient).mockResolvedValue({ id: "client", email: "actualizado@example.com", name: "Cliente" } as Awaited<ReturnType<typeof loadClient>>);
  blockSearch.search.mockResolvedValue([{ id: "salar-block", code: "BLOCK_NO_SALAR_CODE" }]);
  blockSearch.rows.mockResolvedValue([
    {
      id: "salar-block",
      code: "BLOCK_NO_SALAR_CODE",
      route_from: "UYU",
      route_to: "SPA",
      day_block_translations: [{ lang: "es", title: "Visita al Salar de Uyuni" }],
    },
  ]);
  blockSearch.page.mockResolvedValue([]);
  quoteCatalogSearch.blocks.mockResolvedValue({
    options: [{ id: "salar-block", label: "Visita al Salar de Uyuni", sub: "BLOCK_NO_SALAR_CODE · Tour SPA → SPA" }],
    hasMore: false,
  });
  quoteCatalogSearch.services.mockResolvedValue({
    options: [{ id: "late-service", label: "Servicio página 2", sub: "LATE-501 · Proveedor Sur · Uyuni · extra · per_group · Sin tarifa aplicable" }],
    hasMore: false,
  });
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
      client_id: "client",
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

it("edits the associated client without leaving the quote URL", async () => {
  const router = renderQuote(savedQuote("borrador"));
  fireEvent.click(await screen.findByText("Cliente y guía del documento"));
  fireEvent.click(await screen.findByRole("button", { name: "Editar datos y email del cliente" }));
  expect(await screen.findByRole("dialog", { name: "Editar cliente en cotización" })).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/nueva-cotizacion");
  expect(router.state.location.searchStr).toBe("");
  fireEvent.click(screen.getByRole("button", { name: "Cancelar cliente" }));
  expect(screen.queryByRole("dialog", { name: "Editar cliente en cotización" })).not.toBeInTheDocument();
});

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

it("creates a catalog block from the quote and incorporates it without searching again", async () => {
  const data = savedQuote("borrador");
  data.days = [];
  data.items = [];
  vi.mocked(addBlockDay).mockResolvedValue({ calculation: data.quote.calculation } as never);
  renderQuote(data);

  const open = await screen.findByRole("button", { name: "Nuevo bloque diario" });
  fireEvent.click(open);
  expect(screen.getByRole("dialog", { name: "Editor de bloque diario" })).toBeInTheDocument();
  expect(addBlockDay).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Cancelar editor de bloque" }));
  expect(screen.queryByRole("dialog", { name: "Editor de bloque diario" })).not.toBeInTheDocument();
  expect(addBlockDay).not.toHaveBeenCalled();

  fireEvent.click(open);
  fireEvent.click(screen.getByRole("button", { name: "Crear bloque simulado" }));
  fireEvent.click(await screen.findByRole("button", { name: "Incorporar al día 1" }));
  await waitFor(() => expect(addBlockDay).toHaveBeenCalledExactlyOnceWith("quote", "created-block"));
});

it("busca por título y selecciona un bloque para agregarlo a Nueva cotización", async () => {
  const data = savedQuote("borrador");
  data.days = [];
  data.items = [];
  vi.mocked(addBlockDays).mockResolvedValue({ calculation: data.quote.calculation } as never);
  renderQuote(data);

  fireEvent.click(await screen.findByRole("combobox", { name: "Buscar bloque diario…" }));
  fireEvent.change(screen.getByPlaceholderText("Buscar…"), { target: { value: "salar" } });
  fireEvent.click(await screen.findByText("Visita al Salar de Uyuni"));
  expect(screen.getByText("Día 1: Visita al Salar de Uyuni")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Añadir bloques" }));
  await waitFor(() =>
    expect(addBlockDays).toHaveBeenCalledExactlyOnceWith("quote", ["salar-block"]),
  );
});

it("combina y limpia filtros de bloques sin perder los bloques ya seleccionados", async () => {
  const data = savedQuote("borrador");
  data.days = [];
  data.items = [];
  renderQuote(data);
  fireEvent.click(await screen.findByRole("combobox", { name: "Buscar bloque diario…" }));
  fireEvent.change(screen.getByLabelText("Filtrar bloques por lugar"), { target: { value: "Salar" } });
  fireEvent.change(screen.getByLabelText("Filtrar bloques por origen del tour"), { target: { value: "uyu" } });
  await waitFor(() => expect(quoteCatalogSearch.blocks).toHaveBeenCalledWith(
    "",
    { place: "Salar", from: "UYU", to: "" },
    0,
  ));
  expect(screen.getByText("Lugar: Salar")).toBeInTheDocument();
  expect(screen.getByText("Origen del tour: UYU")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
  expect(screen.queryByText("Lugar: Salar")).not.toBeInTheDocument();
});

it("filtra el tarifario, pagina y muestra servicios sin tarifa aplicable", async () => {
  quoteCatalogSearch.services.mockImplementation(async (_term, _filters, page) => ({
    options: [{ id: `late-service-${page}`, label: `Servicio página ${page + 1}`, sub: "LATE-501 · Proveedor Sur · Uyuni · extra · per_group · Sin tarifa aplicable" }],
    hasMore: page === 0,
  }));
  renderQuote(savedQuote("borrador"));
  fireEvent.click(await screen.findByRole("combobox", { name: "Agregar servicio del tarifario…" }));
  fireEvent.change(screen.getByLabelText("Filtrar servicios por proveedor"), { target: { value: "Proveedor Sur" } });
  fireEvent.change(screen.getByLabelText("Filtrar servicios por lugar"), { target: { value: "Uyuni" } });
  await waitFor(() => expect(quoteCatalogSearch.services).toHaveBeenCalledWith(
    "",
    { supplier: "Proveedor Sur", location: "Uyuni", type: "all" },
    0,
    expect.any(String),
    1,
    2,
  ));
  expect(await screen.findByText("Servicio página 1")).toBeInTheDocument();
  expect(screen.getByText(/Sin tarifa aplicable/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(await screen.findByText("Servicio página 2")).toBeInTheDocument();
});

it("busca por título y selecciona un bloque para reemplazar un día", async () => {
  const data = savedQuote("borrador");
  vi.mocked(addBlockDay).mockResolvedValue({ calculation: data.quote.calculation } as never);
  vi.mocked(moveDay).mockResolvedValue({ calculation: data.quote.calculation } as never);
  vi.mocked(deleteDay).mockResolvedValue({ calculation: data.quote.calculation } as never);
  renderQuote(data);

  fireEvent.click(await screen.findByRole("button", { name: "Reemplazar bloque" }));
  fireEvent.click(
    screen.getByRole("combobox", { name: "Bloque que reemplaza este día…" }),
  );
  fireEvent.change(screen.getByPlaceholderText("Buscar…"), { target: { value: "SaLaR" } });
  fireEvent.click(await screen.findByText("Visita al Salar de Uyuni"));
  await waitFor(() =>
    expect(addBlockDay).toHaveBeenCalledExactlyOnceWith("quote", "salar-block"),
  );
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

it("identifica costos de escenario, alojamiento informado y el recálculo real", async () => {
  const data = savedQuote("borrador");
  data.days[0]!.snapshot = {
    reviewed: true,
    source_ref: {
      hotel: "Hotel de origen sin vínculo ambiguo Comidas incluidas: Almuerzo.",
      meals: "Almuerzo.",
    },
  };
  Object.assign(data.items[0]!, {
    price_overridden: true,
    override_note: "Costo total aprobado en escenario consolidado",
    pricing_snapshot: { scenario_line_id: "scenario-line", charge_once_key: "hotel-night" },
    unit_cost_original: 20,
  });
  renderQuote(data);

  expect(await screen.findByText("Costo importado del escenario")).toBeVisible();
  expect(screen.getByText("Alojamiento informado:")).toBeVisible();
  expect(screen.getAllByText("Hotel de origen sin vínculo ambiguo")).toHaveLength(2);
  expect(screen.getByText("Comidas incluidas:")).toBeVisible();
  expect(screen.getByText("Almuerzo.")).toBeVisible();
  expect(screen.getByText("escenario económico")).toBeVisible();
  expect(screen.queryByText("manual")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Recalcular cotización" })).toHaveAttribute(
    "title",
    "Vuelve a calcular usando los costos guardados en la cotización",
  );

  fireEvent.click(screen.getByRole("button", { name: "Precio manual" }));
  expect(screen.queryByRole("button", { name: "Volver a tarifa" })).not.toBeInTheDocument();
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
