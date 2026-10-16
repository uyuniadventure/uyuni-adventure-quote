import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { Tables } from "@/types/db";
import { recalculateQuote } from "@/lib/quotes";
import { QuoteDelivery } from "./quote-delivery";
import { useQuoteActions } from "./quote-workspace";

vi.mock("@/lib/quotes", async (original) => ({
  ...(await original<typeof import("@/lib/quotes")>()),
  recalculateQuote: vi.fn(),
}));
vi.mock("@/lib/quotes/document", async (original) => ({
  ...(await original<typeof import("@/lib/quotes/document")>()),
  listDocSections: vi.fn().mockResolvedValue([]),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

it("does not send an old PDF while new terms are unsaved", async () => {
  const actions = { busy: false, act: vi.fn(), result: null, calcError: null };
  const quote = {
    id: "q",
    status: "revisada",
    client_type: "B2C",
    archived_at: null,
    pdf_path: "q/current.pdf",
    document_snapshot: {
      client_email: "test@example.invalid",
      terms_url: "https://example.invalid/old",
    },
  } as unknown as Tables<"quotes">;
  render(<QuoteDelivery quote={quote} actions={actions} />, { wrapper });
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Enviar por email" })).toBeEnabled(),
  );
  fireEvent.change(screen.getByLabelText("Enlace a términos y condiciones"), {
    target: { value: "https://example.invalid/new" },
  });
  expect(screen.getByRole("button", { name: "Enviar por email" })).toBeDisabled();
  expect(actions.act).not.toHaveBeenCalled();
});

it("queues delivery after edits and does not recalculate an already-sent quote", async () => {
  const order: string[] = [];
  vi.mocked(recalculateQuote).mockImplementation(async () => {
    order.push("calculate");
    return {} as Awaited<ReturnType<typeof recalculateQuote>>;
  });
  const { result } = renderHook(() => useQuoteActions("q"), { wrapper });
  await act(async () => {
    const edit = result.current.act(async () => {
      order.push("edit");
    });
    const send = result.current.act(
      async () => {
        order.push("sent");
      },
      undefined,
      false,
    );
    await Promise.all([edit, send]);
  });
  expect(order).toEqual(["edit", "calculate", "sent"]);
  expect(recalculateQuote).toHaveBeenCalledTimes(1);
  expect(result.current.calcError).toBeNull();
});
