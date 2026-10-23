import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TranslationsPanel } from "./kit";

const mocks = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[], upsert: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    from: () => ({
      select: () => ({ eq: async () => ({ data: mocks.rows, error: null }) }),
      upsert: (values: unknown) => mocks.upsert(values),
    }),
    functions: { invoke: vi.fn() },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rows = [
    {
      id: "tr-1",
      lang: "es",
      title: "Título anterior",
      description: "Descripción anterior",
      includes: null,
      excludes: null,
      reviewed: true,
    },
  ];
  mocks.upsert.mockResolvedValue({ error: null });
});
afterEach(cleanup);

it("reports dirty and saved states and refreshes block title queries after persistence", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const onDirtyChange = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <TranslationsPanel
        kind="day_block"
        parentId="block-1"
        canEdit
        onDirtyChange={onDirtyChange}
      />
    </QueryClientProvider>,
  );
  const title = await screen.findByLabelText("Título es");
  fireEvent.change(title, { target: { value: "Título actualizado" } });
  expect(screen.getByText("Cambios sin guardar")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Guardar texto" }));
  await waitFor(() => expect(mocks.upsert).toHaveBeenCalled());
  expect(await screen.findByText("Guardado")).toBeInTheDocument();
  expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["day_block", "block-1"] });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["day_blocks"] });
});

it("keeps the edited text after a failed save", async () => {
  mocks.upsert.mockResolvedValue({ error: { message: "Failed to fetch" } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TranslationsPanel kind="day_block" parentId="block-1" canEdit />
    </QueryClientProvider>,
  );
  const title = await screen.findByLabelText("Título es");
  fireEvent.change(title, { target: { value: "Texto sin perder" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar texto" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo conectar");
  expect(title).toHaveValue("Texto sin perder");
});
