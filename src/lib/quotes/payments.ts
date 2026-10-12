import { z } from "zod";
import { db, json, unwrap } from "../db";
import type { Enums, Tables } from "@/types/db";

export const paymentInputSchema = z.object({
  amount: z
    .number()
    .finite()
    .positive()
    .max(Number.MAX_SAFE_INTEGER / 10_000),
  currency: z.string().regex(/^[A-Z]{3}$/),
  date: z.string().date(),
  method: z.string().trim().min(1, "Indica el método de pago"),
  type: z.enum(["deposito", "saldo", "otro"]),
  bank: z.string().trim().nullable().optional(),
  receipt_path: z.string().nullable().optional(),
});
export type PaymentInput = z.input<typeof paymentInputSchema>;
export interface PaymentSummary {
  quote_id: string;
  status: Enums<"quote_status">;
  deposit_pct: number;
  total_price_usd: number | null;
  deposit_required_usd: number | null;
  paid_usd: number | null;
  deposits_usd: number | null;
  deposit_remaining_usd: number | null;
  balance_usd: number | null;
  credit_usd: number | null;
  unconverted_payments: number;
  operation_id: string | null;
}
export interface PaymentResult {
  payment: Tables<"quote_payments">;
  summary: PaymentSummary;
}
export class PaymentRejectedError extends Error {}

export async function loadQuotePayments(quoteId: string) {
  const [summary, payments] = await Promise.all([
    db.rpc("quote_payment_summary", { p_id: quoteId }),
    db.from("quote_payments").select("*").eq("quote_id", quoteId).order("date").order("created_at"),
  ]);
  return { summary: unwrap(summary) as unknown as PaymentSummary, payments: unwrap(payments) };
}

/** Keep paymentId across retries. The database validates, converts and commits
 * the payment, status history and operation copy in one transaction. */
export async function registerQuotePayment(
  quoteId: string,
  paymentId: string,
  input: PaymentInput,
) {
  z.string().uuid().parse(quoteId);
  z.string().uuid().parse(paymentId);
  const result = await db.rpc("register_quote_payment", {
    p_quote_id: quoteId,
    p_payment_id: paymentId,
    p_payment: json(paymentInputSchema.parse(input)),
  });
  // A PostgreSQL error confirms rollback. Transport errors have no such guarantee:
  // retain the UUID and exact payload so a retry cannot record a second payment.
  if (result.error?.code && /^[0-9A-Z]{5}$/.test(result.error.code))
    throw new PaymentRejectedError(result.error.message);
  return unwrap(result) as unknown as PaymentResult;
}

const RECEIPT_BUCKET = "payment-receipts";
const RECEIPT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
export async function uploadPaymentReceipt(quoteId: string, paymentId: string, file: File) {
  z.string().uuid().parse(quoteId);
  z.string().uuid().parse(paymentId);
  const extension = RECEIPT_TYPES[file.type];
  if (!extension || !file.size || file.size > 10 * 1024 * 1024)
    throw new PaymentRejectedError("El comprobante debe ser PDF, JPG, PNG o WebP, de hasta 10 MB.");
  const path = `${quoteId}/${paymentId}/receipt.${extension}`;
  const { error } = await db.storage.from(RECEIPT_BUCKET).upload(path, file, { upsert: false });
  // A retry after a lost upload response can reuse this immutable staged object.
  if (
    error &&
    !["Duplicate", "ResourceAlreadyExists"].includes(error.name) &&
    !("code" in error && ["Duplicate", "ResourceAlreadyExists"].includes(String(error.code))) &&
    !("statusCode" in error && String(error.statusCode) === "409")
  )
    throw error;
  return path;
}
export async function paymentReceiptUrl(path: string) {
  return unwrap(await db.storage.from(RECEIPT_BUCKET).createSignedUrl(path, 60)).signedUrl;
}
