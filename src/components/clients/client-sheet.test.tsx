import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Tables } from "@/types/db";
import { ClientSheet } from "./client-sheet";

const database = vi.hoisted(() => ({ result: { data: null as unknown, error: null as { message: string } | null }, update: vi.fn() }));
vi.mock("@/hooks/use-auth", () => ({ useCurrentUser: () => ({ user: { id: "seller" }, role: "vendedor" }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/lib/db", () => ({
  db: {
    from: () => {
      const query = {
        update: (payload: unknown) => { database.update(payload); return query; },
        insert: () => query,
        eq: () => query,
        select: () => query,
        single: () => Promise.resolve(database.result),
      };
      return query;
    },
  },
}));

const client = {
  id: "client-1", name: "Andrea", email: null, contact: null, country: null,
  language: "es", type: "B2C", terms_id: null, deposit_pct: null,
} as Tables<"clients">;

function renderSheet(onClose = vi.fn(), onSaved = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={queryClient}><ClientSheet client={client} onClose={onClose} onSaved={onSaved} /></QueryClientProvider>);
  return { onClose, onSaved };
}

beforeEach(() => {
  database.result = { data: { ...client, email: "Nuevo@Example.com" }, error: null };
  database.update.mockClear();
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(cleanup);

it.each(["Close", "Cancelar"])("closes with %s without saving", (action) => {
  const { onClose } = renderSheet();
  fireEvent.change(screen.getByLabelText("Email del cliente"), { target: { value: "sin-guardar@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: action }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(database.update).not.toHaveBeenCalled();
});

it("persists a valid email and reports the confirmed row", async () => {
  const { onClose, onSaved } = renderSheet();
  fireEvent.change(screen.getByLabelText("Email del cliente"), { target: { value: " Nuevo@Example.com " } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ email: "Nuevo@Example.com" })));
  expect(database.update).toHaveBeenCalledWith(expect.objectContaining({ email: "Nuevo@Example.com" }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("keeps the entered email and the sheet open when persistence fails", async () => {
  database.result = { data: null, error: { message: "RLS denied" } };
  const { onClose, onSaved } = renderSheet();
  const input = screen.getByLabelText("Email del cliente");
  fireEvent.change(input, { target: { value: "pendiente@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await waitFor(() => expect(database.update).toHaveBeenCalled());
  expect(input).toHaveValue("pendiente@example.com");
  expect(onClose).not.toHaveBeenCalled();
  expect(onSaved).not.toHaveBeenCalled();
});
