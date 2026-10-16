import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { TemplateSavePreview } from "@/lib/quotes/save-template";

const mocks = vi.hoisted(() => ({ role: "vendedor", prepare: vi.fn(), save: vi.fn() }));
vi.mock("@/hooks/use-auth", () => ({
  useCurrentUser: () => ({ role: mocks.role }),
  canManageCatalog: (role: string) => ["admin", "operacion"].includes(role),
}));
vi.mock("@/lib/quotes/save-template", () => ({
  prepareQuoteTemplate: mocks.prepare,
  saveQuoteAsTemplate: mocks.save,
  listTemplateLocations: async () => [
    { code: "SPA", name: "San Pedro" },
    { code: "UYU", name: "Uyuni" },
  ],
  TemplateSkuConflict: class extends Error {},
}));
import { SaveTemplateDialog } from "./save-template-dialog";

const preview: TemplateSavePreview = {
  sku: "SPAUYU-2D1N-MP",
  route_from: "SPA",
  route_to: "UYU",
  days: 2,
  needs_from: false,
  needs_to: false,
  quote_updated_at: "2026-10-16T12:00:00Z",
  existing: {
    id: "existing",
    sku: "SPAUYU-2D1N-MP",
    name: "Programa existente",
    updated_at: "2026-10-16T12:00:00Z",
  },
};
beforeEach(() => {
  mocks.role = "vendedor";
  mocks.prepare.mockReset().mockResolvedValue(preview);
  mocks.save
    .mockReset()
    .mockResolvedValue({ id: "new", sku: "SPAUYU-2D1N-MP-V2", replaced: false });
});
afterEach(cleanup);
function mount() {
  const onClose = vi.fn();
  const act = vi.fn(async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      return true;
    } catch {
      return false;
    }
  });
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <SaveTemplateDialog
        quoteId="quote"
        onClose={onClose}
        actions={{ act, busy: false, result: null, calcError: null }}
      />
    </QueryClientProvider>,
  );
  return { onClose, act };
}
it("ofrece al vendedor guardar una nueva versión y no reemplazar", async () => {
  const { onClose, act } = mount();
  fireEvent.click(await screen.findByRole("button", { name: "Guardar como nueva" }));
  await waitFor(() => expect(mocks.save).toHaveBeenCalledWith("quote", preview, "new"));
  expect(
    screen.queryByRole("button", { name: "Reemplazar plantilla existente" }),
  ).not.toBeInTheDocument();
  expect(act).toHaveBeenCalledWith(expect.any(Function), undefined, false);
  await waitFor(() => expect(onClose).toHaveBeenCalled());
});
it.each(["admin", "operacion"])(
  "%s confirma el reemplazo de la plantilla concreta",
  async (role) => {
    mocks.role = role;
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Reemplazar plantilla existente" }));
    expect(mocks.save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar reemplazo" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith("quote", preview, "replace"));
  },
);
it("pide origen y destino ausentes antes de habilitar el guardado", async () => {
  mocks.prepare.mockImplementation(async (_id, route) => ({
    ...preview,
    existing: null,
    needs_from: true,
    needs_to: true,
    route_from: route.route_from || null,
    route_to: route.route_to || null,
    sku: route.route_from && route.route_to ? preview.sku : null,
  }));
  mount();
  const origin = await screen.findByLabelText("Origen del primer día");
  expect(screen.getByRole("button", { name: "Guardar plantilla" })).toBeDisabled();
  await waitFor(() => expect(origin).not.toBeDisabled());
  fireEvent.change(origin, { target: { value: "SPA" } });
  await waitFor(() =>
    expect(mocks.prepare).toHaveBeenLastCalledWith("quote", { route_from: "SPA", route_to: "" }),
  );
  fireEvent.change(await screen.findByLabelText("Destino del último día"), {
    target: { value: "UYU" },
  });
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Guardar plantilla" })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Guardar plantilla" }));
  await waitFor(() =>
    expect(mocks.save).toHaveBeenCalledWith(
      "quote",
      expect.objectContaining({ route_from: "SPA", route_to: "UYU" }),
      "create",
    ),
  );
});
it("mantiene abierto el diálogo y muestra el error en español si falla el guardado", async () => {
  mocks.save.mockRejectedValue(
    new Error("La cotización cambió. Reabre el diálogo antes de guardar."),
  );
  const { onClose } = mount();
  fireEvent.click(await screen.findByRole("button", { name: "Guardar como nueva" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("La cotización cambió");
  expect(onClose).not.toHaveBeenCalled();
});
