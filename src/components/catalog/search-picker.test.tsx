import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SearchPicker } from "./kit";

afterEach(() => cleanup());

it("muestra un error de consulta y permite reintentar sin llamarlo 'Sin resultados'", async () => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  const fetcher = vi
    .fn<(term: string) => Promise<[]>>()
    .mockRejectedValueOnce(new Error("Supabase no disponible"))
    .mockResolvedValueOnce([]);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <SearchPicker
        placeholder="Buscar bloque diario…"
        queryKey="error-blocks"
        fetcher={fetcher}
        onPick={() => {}}
      />
    </QueryClientProvider>,
  );

  fireEvent.click(screen.getByRole("combobox", { name: "Buscar bloque diario…" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "No se pudieron cargar los resultados.",
  );
  expect(screen.queryByText("Sin resultados.")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  expect(await screen.findByText("Sin resultados.")).toBeInTheDocument();
});
