import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { QuotePayments } from "./quote-payments";
import {
  loadQuotePayments,
  registerQuotePayment,
  uploadPaymentReceipt,
  PaymentRejectedError,
  type PaymentResult,
} from "@/lib/quotes/payments";
import type { Tables } from "@/types/db";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));
vi.mock("@/lib/quotes/payments", async (original) => ({
  ...(await original<typeof import("@/lib/quotes/payments")>()),
  loadQuotePayments: vi.fn(),
  registerQuotePayment: vi.fn(),
  uploadPaymentReceipt: vi.fn(),
}));
const quote = {
  id: "72000000-0000-0000-0000-000000000010",
  status: "enviada",
  archived_at: null,
  fx_snapshot: { USD: 1, BOB: 7 },
} as unknown as Tables<"quotes">;
const summary = {
  quote_id: quote.id,
  status: "enviada" as const,
  deposit_pct: 30,
  total_price_usd: 1000,
  deposit_required_usd: 300,
  paid_usd: 0,
  deposits_usd: 0,
  deposit_remaining_usd: 300,
  balance_usd: 1000,
  credit_usd: 0,
  unconverted_payments: 0,
  operation_id: null,
};
const registered = {
  payment: {
    id: "payment",
    amount: 300,
    currency: "USD",
    amount_usd: 300,
    date: "2026-10-12",
    method: "transferencia",
    type: "deposito",
    bank: "Banco test",
    receipt_path: null,
  },
  summary: {
    ...summary,
    status: "vendida",
    paid_usd: 300,
    deposits_usd: 300,
    deposit_remaining_usd: 0,
    balance_usd: 700,
    operation_id: "operation",
  },
} as PaymentResult;
beforeEach(() => {
  vi.mocked(loadQuotePayments).mockResolvedValue({ payments: [], summary });
  vi.mocked(registerQuotePayment).mockResolvedValue(registered);
  vi.mocked(uploadPaymentReceipt).mockResolvedValue("receipt-path");
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const mount = (value = quote) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <QuotePayments quote={value} />
    </QueryClientProvider>,
  );
async function fill() {
  const amount = await screen.findByLabelText("Monto");
  fireEvent.change(amount, { target: { value: "300" } });
  fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2026-10-12" } });
  fireEvent.change(screen.getByLabelText("Método"), { target: { value: "transferencia" } });
  fireEvent.change(screen.getByLabelText("Banco"), { target: { value: "Banco test" } });
}

it("registers the form through the RPC wrapper, refreshes balance and links to Operations", async () => {
  mount();
  await fill();
  vi.mocked(loadQuotePayments).mockResolvedValue({
    payments: [registered.payment],
    summary: registered.summary,
  });
  fireEvent.click(screen.getByRole("button", { name: "Registrar pago" }));
  await waitFor(() =>
    expect(registerQuotePayment).toHaveBeenCalledExactlyOnceWith(quote.id, expect.any(String), {
      amount: 300,
      currency: "USD",
      date: "2026-10-12",
      method: "transferencia",
      bank: "Banco test",
      type: "deposito",
    }),
  );
  expect(await screen.findByRole("link", { name: "Ver servicio en Operación" })).toHaveAttribute(
    "href",
    "/operacion",
  );
  expect(screen.getByText("Banco test")).toBeInTheDocument();
  expect(uploadPaymentReceipt).not.toHaveBeenCalled();
});

it("retries an uncertain response with the same ID and payload", async () => {
  vi.mocked(registerQuotePayment)
    .mockRejectedValueOnce(new Error("Conexión interrumpida"))
    .mockResolvedValueOnce(registered);
  mount();
  await fill();
  fireEvent.click(screen.getByRole("button", { name: "Registrar pago" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Conexión interrumpida");
  expect(screen.getByLabelText("Monto")).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Reintentar registro" }));
  await waitFor(() => expect(registerQuotePayment).toHaveBeenCalledTimes(2));
  expect(vi.mocked(registerQuotePayment).mock.calls[1]).toEqual(
    vi.mocked(registerQuotePayment).mock.calls[0],
  );
});

it("allows correcting data after a confirmed database rollback", async () => {
  vi.mocked(registerQuotePayment).mockRejectedValueOnce(new PaymentRejectedError("Monto inválido"));
  mount();
  await fill();
  fireEvent.click(screen.getByRole("button", { name: "Registrar pago" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Monto inválido");
  expect(screen.getByLabelText("Monto")).toBeEnabled();
  expect(screen.getByRole("button", { name: "Registrar pago" })).toBeEnabled();
});

it("keeps archived versions read only", async () => {
  mount({ ...quote, archived_at: "2026-10-12T12:00:00Z" });
  await screen.findByText("Sin pagos registrados.");
  expect(screen.queryByRole("button", { name: "Registrar pago" })).not.toBeInTheDocument();
});
