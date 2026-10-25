import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BlockEditor } from "./block-editor";
import { parseSuggestedPosition } from "./block-editor-utils";

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  update: vi.fn(),
  read: vi.fn(),
  itemInsert: vi.fn(),
  itemRead: vi.fn(),
  fetchServices: vi.fn(),
  listHotels: vi.fn(),
  eligibleHotelRooms: vi.fn(),
  user: { id: "user-1" },
  role: "admin" as string | null,
}));

vi.mock("@/hooks/use-auth", () => ({
  useCurrentUser: () => ({ user: mocks.user, role: mocks.role }),
  canManageCatalog: (role: string | null) => role === "admin" || role === "operacion",
}));
vi.mock("@/lib/db", () => ({
  db: {
    from: (table: string) => {
      if (table === "day_blocks")
        return {
          insert: (values: unknown) => ({ select: () => ({ single: () => mocks.insert(values) }) }),
          update: (values: unknown) => ({
            eq: (column: string, id: string) => mocks.update(values, column, id),
          }),
          select: () => ({ eq: () => ({ single: () => mocks.read() }) }),
        };
      if (table === "day_block_items")
        return {
          insert: (values: unknown) => mocks.itemInsert(values),
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
          delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
          select: () => ({ eq: () => ({ order: () => mocks.itemRead() }) }),
        };
      throw new Error(`Unexpected table: ${table}`);
    },
  },
}));
vi.mock("@/lib/catalog/hotels", () => ({
  listHotels: () => mocks.listHotels(),
  eligibleHotelRooms: (blockId: string) => mocks.eligibleHotelRooms(blockId),
}));
vi.mock("./kit", async (load) => {
  const actual = await load<typeof import("./kit")>();
  return {
    ...actual,
    useLocationCodes: () => ({ data: [] }),
    TranslationsPanel: () => <div>Panel de textos</div>,
    fetchServices: (...args: unknown[]) => mocks.fetchServices(...args),
  };
});
vi.mock("./catalog-actions", () => ({ CatalogDeleteButton: () => null }));

function show(
  id: string | null = "new",
  completeAction?: {
    label: string;
    onComplete: (id: string) => Promise<boolean>;
  },
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onClose = vi.fn();
  const onCreated = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <BlockEditor id={id} onClose={onClose} onCreated={onCreated} {...(completeAction ? { completeAction } : {})} />
    </QueryClientProvider>,
  );
  return { onClose, onCreated };
}

const existing = {
  id: "block-1",
  code: "BD-001",
  route_from: null,
  route_to: null,
  places: [],
  modality: "privado",
  hotel_service_id: null,
  hotel_id: null,
  default_day_position: null,
  status: "pendiente",
  created_by: "user-1",
  updated_at: "2026-10-23",
  catalog_origin: "zip_import",
  services: null,
  day_block_translations: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  mocks.insert.mockResolvedValue({ data: { id: "created-1" }, error: null });
  mocks.update.mockResolvedValue({ error: null });
  mocks.itemInsert.mockResolvedValue({ error: null });
  mocks.itemRead.mockResolvedValue({ data: [], error: null });
  mocks.fetchServices.mockResolvedValue([]);
  mocks.listHotels.mockResolvedValue([
    { id: "hotel-1", code: "P", name: "Palacio de Sal", supplier_id: "supplier-1", label: "Palacio de Sal · P · Proveedor Palacio", code_pending: false },
  ]);
  mocks.eligibleHotelRooms.mockResolvedValue([]);
  mocks.read.mockResolvedValue({ data: existing, error: null });
  vi.spyOn(window, "confirm").mockReturnValue(false);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("parseSuggestedPosition", () => {
  it("accepts an empty value or a positive integer", () => {
    expect(parseSuggestedPosition("  ")).toBeNull();
    expect(parseSuggestedPosition("5")).toBe(5);
  });

  it.each(["0", "-1", "abc", "1.5"])("rejects %s", (value) => {
    expect(() => parseSuggestedPosition(value)).toThrow("número entero mayor que cero");
  });
});

it("creates once with a normalized code and confirmed position", async () => {
  let finish: ((value: { data: { id: string }; error: null }) => void) | undefined;
  mocks.insert.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const { onCreated } = show();
  fireEvent.change(screen.getByLabelText("Código"), { target: { value: "  bd-010  " } });
  fireEvent.change(screen.getByLabelText("Posición sugerida (día)"), { target: { value: "2" } });
  const button = screen.getByRole("button", { name: "Crear bloque" });
  fireEvent.click(button);
  fireEvent.click(button);
  await waitFor(() => expect(mocks.insert).toHaveBeenCalledTimes(1));
  expect(mocks.insert).toHaveBeenCalledWith(
    expect.objectContaining({ code: "BD-010", default_day_position: 2, hotel_id: null }),
  );
  expect(mocks.insert.mock.calls[0]?.[0]).not.toHaveProperty("hotel_service_id");
  await act(async () => {
    finish?.({ data: { id: "created-1" }, error: null });
  });
  await waitFor(() => expect(onCreated).toHaveBeenCalledWith("created-1"));
});

it("keeps entered values and explains a duplicate code", async () => {
  mocks.insert.mockResolvedValue({
    data: null,
    error: { code: "23505", message: "duplicate key" },
  });
  show();
  const code = screen.getByLabelText("Código");
  fireEvent.change(code, { target: { value: "BD-DUP" } });
  fireEvent.click(screen.getByRole("button", { name: "Crear bloque" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Ya existe un bloque con ese código");
  expect(code).toHaveValue("BD-DUP");
});

it("does not insert an empty code or an invalid position", async () => {
  show();
  fireEvent.click(screen.getByRole("button", { name: "Crear bloque" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("El código es obligatorio");
  fireEvent.change(screen.getByLabelText("Código"), { target: { value: "BD-011" } });
  fireEvent.change(screen.getByLabelText("Posición sugerida (día)"), { target: { value: "1.5" } });
  fireEvent.click(screen.getByRole("button", { name: "Crear bloque" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("número entero mayor que cero");
  expect(mocks.insert).not.toHaveBeenCalled();
});

it("protects closing and tab changes while data has unsaved changes", async () => {
  const { onClose } = show("block-1");
  expect(await screen.findByRole("tab", { name: "Datos" })).toBeInTheDocument();
  expect(screen.queryByRole("tab", { name: "Módulos" })).not.toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Textos" })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Servicios sueltos" })).toBeInTheDocument();
  const code = await screen.findByLabelText("Código");
  fireEvent.change(code, { target: { value: "BD-EDIT" } });
  await screen.findByText("Cambios sin guardar");
  fireEvent.mouseDown(screen.getByRole("tab", { name: "Textos" }), { button: 0, ctrlKey: false });
  expect(window.confirm).toHaveBeenCalled();
  expect(screen.getByRole("tab", { name: "Datos" })).toHaveAttribute("data-state", "active");
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(onClose).not.toHaveBeenCalled();
  vi.mocked(window.confirm).mockReturnValue(true);
  fireEvent.mouseDown(screen.getByRole("tab", { name: "Textos" }), { button: 0, ctrlKey: false });
  expect(await screen.findByText("Panel de textos")).toBeInTheDocument();
});

it("incorporates only a saved block, prevents repeated clicks and permits retry after failure", async () => {
  let finish: ((value: boolean) => void) | undefined;
  const onComplete = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce(true);
  const { onClose } = show("block-1", { label: "Incorporar al día 2", onComplete });
  const button = await screen.findByRole("button", { name: "Incorporar al día 2" });

  fireEvent.click(button);
  fireEvent.click(button);
  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(onComplete).toHaveBeenCalledWith("block-1");
  expect(onClose).not.toHaveBeenCalled();

  await act(async () => finish?.(false));
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Incorporar al día 2" }));
  await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
});

it("requires saving pending editor changes before incorporation", async () => {
  const onComplete = vi.fn().mockResolvedValue(true);
  show("block-1", { label: "Incorporar al día 1", onComplete });
  const button = await screen.findByRole("button", { name: "Incorporar al día 1" });
  expect(button).toBeEnabled();
  fireEvent.change(screen.getByLabelText("Código"), { target: { value: "BD-EDIT" } });
  expect(button).toBeDisabled();
  expect(screen.getByText("Guarda o descarta los cambios antes de incorporar el bloque.")).toBeInTheDocument();
  expect(onComplete).not.toHaveBeenCalled();
});

it("waits for a service write before allowing incorporation", async () => {
  let finish: ((value: { error: null }) => void) | undefined;
  mocks.fetchServices.mockResolvedValue([{ id: "meal-1", label: "Almuerzo", sub: "MEAL-1" }]);
  mocks.itemInsert.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const onComplete = vi.fn().mockResolvedValue(true);
  show("block-1", { label: "Incorporar al día 1", onComplete });
  fireEvent.mouseDown(await screen.findByRole("tab", { name: "Servicios sueltos" }), { button: 0, ctrlKey: false });
  fireEvent.click(screen.getByRole("combobox", { name: "Añadir servicio suelto (comida, traslado, entrada…)" }));
  fireEvent.click(await screen.findByText("Almuerzo"));

  const complete = screen.getByRole("button", { name: "Incorporar al día 1" });
  await waitFor(() => expect(complete).toBeDisabled());
  expect(screen.getByText("Espera a que terminen de guardarse los servicios.")).toBeInTheDocument();
  expect(onComplete).not.toHaveBeenCalled();

  await act(async () => finish?.({ error: null }));
  await waitFor(() => expect(complete).toBeEnabled());
});

it("edits an imported block without converting its origin", async () => {
  show("block-1");
  const code = await screen.findByDisplayValue("BD-001");
  expect(mocks.insert).not.toHaveBeenCalled();
  fireEvent.change(code, { target: { value: "bd-001-editado" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
  expect(mocks.update.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ code: "BD-001-EDITADO" }));
  expect(mocks.update.mock.calls[0]?.[0]).not.toHaveProperty("catalog_origin");
  expect(mocks.update.mock.calls[0]?.[0]).not.toHaveProperty("hotel_id");
  expect(mocks.update.mock.calls[0]?.[0]).not.toHaveProperty("hotel_service_id");
  expect(await screen.findByText("Guardado")).toBeInTheDocument();
});

it("creates a block with a hotel code without writing the legacy service", async () => {
  show();
  fireEvent.change(screen.getByLabelText("Código"), { target: { value: "BD-HOTEL" } });
  fireEvent.click(screen.getByRole("combobox", { name: "Sin hotel" }));
  fireEvent.click(await screen.findByText("Palacio de Sal · P · Proveedor Palacio"));
  fireEvent.click(screen.getByRole("button", { name: "Crear bloque" }));
  await waitFor(() => expect(mocks.insert).toHaveBeenCalledTimes(1));
  expect(mocks.insert.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ hotel_id: "hotel-1" }));
  expect(mocks.insert.mock.calls[0]?.[0]).not.toHaveProperty("hotel_service_id");
});

it("shows and locks a modern hotel while allowing other edits", async () => {
  mocks.read.mockResolvedValue({ data: { ...existing, hotel_id: "hotel-1" }, error: null });
  show("block-1");
  expect(await screen.findByText("Palacio de Sal · P · Proveedor Palacio")).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Sin hotel" })).toBeDisabled();
  expect(screen.getByText("Para cambiar de hotel, crea otro bloque diario.")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Código"), { target: { value: "BD-MODERNO" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
  expect(mocks.update.mock.calls[0]?.[0]).not.toHaveProperty("hotel_id");
  expect(mocks.update.mock.calls[0]?.[0]).not.toHaveProperty("hotel_service_id");
});

it("preserves and labels a legacy hotel association", async () => {
  mocks.read.mockResolvedValue({
    data: {
      ...existing,
      hotel_service_id: "room-legacy",
      services: { id: "room-legacy", name: "Habitación heredada", sku: "HTL-LEGACY" },
    },
    error: null,
  });
  show("block-1");
  expect(await screen.findByText("Habitación heredada")).toBeInTheDocument();
  expect(screen.getByText("Asociación heredada. Se conservará sin convertirla automáticamente.")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Código"), { target: { value: "BD-LEGACY" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
  expect(mocks.update.mock.calls[0]?.[0]).not.toHaveProperty("hotel_id");
  expect(mocks.update.mock.calls[0]?.[0]).not.toHaveProperty("hotel_service_id");
});

it("assigns a hotel once to an existing block without hotel", async () => {
  show("block-1");
  fireEvent.mouseDown(await screen.findByRole("tab", { name: "Servicios sueltos" }), { button: 0, ctrlKey: false });
  expect(await screen.findByText("Asigna primero un hotel", { exact: false })).toBeInTheDocument();
  fireEvent.mouseDown(screen.getByRole("tab", { name: "Datos" }), { button: 0, ctrlKey: false });
  fireEvent.click(screen.getByRole("combobox", { name: "Sin hotel" }));
  fireEvent.click(await screen.findByText("Palacio de Sal · P · Proveedor Palacio"));
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
  expect(mocks.update.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ hotel_id: "hotel-1" }));
  expect(mocks.update.mock.calls[0]?.[0]).not.toHaveProperty("hotel_service_id");
});

it("adds only compatible rooms with the accommodation slot", async () => {
  const room = { id: "room-1", name: "Habitación doble", sku: "HTL-P-DBL", status: "activo" };
  mocks.read.mockResolvedValue({ data: { ...existing, hotel_id: "hotel-1" }, error: null });
  mocks.eligibleHotelRooms.mockResolvedValue([room]);
  show("block-1");
  fireEvent.mouseDown(await screen.findByRole("tab", { name: "Servicios sueltos" }), { button: 0, ctrlKey: false });
  fireEvent.click(screen.getByRole("combobox", { name: "Añadir habitación compatible…" }));
  fireEvent.click(await screen.findByText("Habitación doble"));
  await waitFor(() => expect(mocks.itemInsert).toHaveBeenCalledTimes(1));
  expect(mocks.itemInsert).toHaveBeenCalledWith({ block_id: "block-1", service_id: "room-1", qty: 1, slot_key: "ALOJAMIENTO" });
});

it("rejects a room that becomes incompatible and keeps other services available", async () => {
  const room = { id: "room-1", name: "Habitación doble", sku: "HTL-P-DBL", status: "activo" };
  mocks.read.mockResolvedValue({ data: { ...existing, hotel_id: "hotel-1" }, error: null });
  mocks.eligibleHotelRooms.mockResolvedValueOnce([room]).mockResolvedValueOnce([]);
  mocks.fetchServices.mockResolvedValue([{ id: "meal-1", label: "Almuerzo", sub: "MEAL-1" }]);
  show("block-1");
  fireEvent.mouseDown(await screen.findByRole("tab", { name: "Servicios sueltos" }), { button: 0, ctrlKey: false });
  fireEvent.click(screen.getByRole("combobox", { name: "Añadir habitación compatible…" }));
  fireEvent.click(await screen.findByText("Habitación doble"));
  await waitFor(() => expect(mocks.eligibleHotelRooms).toHaveBeenCalledTimes(2));
  expect(mocks.itemInsert).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("combobox", { name: "Añadir servicio suelto (comida, traslado, entrada…)" }));
  fireEvent.click(await screen.findByText("Almuerzo"));
  await waitFor(() => expect(mocks.itemInsert).toHaveBeenCalledWith({ block_id: "block-1", service_id: "meal-1", qty: 1 }));
  expect(mocks.fetchServices).toHaveBeenCalledWith("", undefined, "alojamiento");
});
