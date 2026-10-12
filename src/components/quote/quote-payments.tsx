import { useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  loadQuotePayments,
  paymentInputSchema,
  paymentReceiptUrl,
  registerQuotePayment,
  uploadPaymentReceipt,
  PaymentRejectedError,
  type PaymentInput,
} from "@/lib/quotes/payments";
import type { Tables } from "@/types/db";
import { money } from "@/components/catalog/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function QuotePayments({ quote }: { quote: Tables<"quotes"> }) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["quote-payments", quote.id],
    queryFn: () => loadQuotePayments(quote.id),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  // A failed/uncertain request retries the exact same payload and UUID.
  const attempt = useRef<{ id: string; input: PaymentInput; file: File | null } | null>(null);
  const summary = query.data?.summary;
  const currencies = Object.keys((quote.fx_snapshot ?? {}) as object).filter((c) => c !== "USD");
  const canPay = !quote.archived_at && ["enviada", "vendida"].includes(quote.status);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
    try {
      if (!attempt.current) {
        const data = new FormData(event.currentTarget);
        const input = paymentInputSchema.parse({
          amount: Number(data.get("amount")),
          currency: data.get("currency"),
          date: data.get("date"),
          method: data.get("method"),
          bank: data.get("bank"),
          type: data.get("type"),
        });
        const file = data.get("receipt") as File | null;
        attempt.current = { id: crypto.randomUUID(), input, file: file?.size ? file : null };
      }
      setBusy(true);
      const current = attempt.current;
      if (current.file && !current.input.receipt_path)
        current.input.receipt_path = await uploadPaymentReceipt(quote.id, current.id, current.file);
      const result = await registerQuotePayment(quote.id, current.id, current.input);
      attempt.current = null;
      setFormKey((key) => key + 1);
      toast.success(
        result.summary.status === "vendida" && quote.status === "enviada"
          ? "Depósito completado. Cotización vendida y servicio creado en Operación."
          : "Pago registrado.",
      );
      await Promise.all(
        [
          "quote-payments",
          "quote-full",
          "quote-history",
          "quote-versions",
          "quotes",
          "ops-services",
          "ops-service",
          "ops-lodging",
        ].map((key) => qc.invalidateQueries({ queryKey: [key] })),
      );
    } catch (e) {
      if (e instanceof PaymentRejectedError) attempt.current = null;
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {query.isLoading && <p>Cargando pagos…</p>}
      {query.isError && (
        <p role="alert" className="text-destructive">
          {query.error.message}
        </p>
      )}
      {summary && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Amount
              label={`Depósito requerido (${summary.deposit_pct} %)`}
              value={summary.deposit_required_usd}
            />
            <Amount label="Falta para depósito" value={summary.deposit_remaining_usd} />
            <Amount label="Total pagado" value={summary.paid_usd} />
            <Amount label="Saldo pendiente" value={summary.balance_usd} />
          </div>
          {summary.unconverted_payments > 0 && (
            <p role="alert" className="text-destructive">
              Hay pagos históricos sin tipo de cambio confirmado. Revisa esos pagos antes de
              continuar.
            </p>
          )}
          {!!summary.credit_usd && <p>Saldo a favor: {money(summary.credit_usd, "USD")}</p>}
          {summary.operation_id && (
            <Button asChild variant="outline">
              <Link to="/operacion">Ver servicio en Operación</Link>
            </Button>
          )}
        </>
      )}
      {canPay && summary && summary.unconverted_payments === 0 && (
        <Card className="p-4">
          <h2 className="mb-3 font-semibold">Registrar pago</h2>
          <form key={formKey} onSubmit={submit} className="space-y-3">
            <fieldset disabled={busy || !!attempt.current} className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="payment-date">Fecha</Label>
                <Input
                  id="payment-date"
                  name="date"
                  type="date"
                  required
                  defaultValue={new Intl.DateTimeFormat("en-CA", {
                    timeZone: "America/Santiago",
                  }).format(new Date())}
                />
              </div>
              <div>
                <Label htmlFor="payment-amount">Monto</Label>
                <Input
                  id="payment-amount"
                  name="amount"
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="payment-currency">Moneda</Label>
                <select
                  id="payment-currency"
                  name="currency"
                  className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option>USD</option>
                  {currencies.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="payment-method">Método</Label>
                <Input
                  id="payment-method"
                  name="method"
                  required
                  placeholder="Transferencia, efectivo, tarjeta…"
                />
              </div>
              <div>
                <Label htmlFor="payment-bank">Banco</Label>
                <Input id="payment-bank" name="bank" placeholder="Opcional" />
              </div>
              <div>
                <Label htmlFor="payment-type">Tipo</Label>
                <select
                  id="payment-type"
                  name="type"
                  defaultValue={quote.status === "enviada" ? "deposito" : "saldo"}
                  className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="deposito">Depósito</option>
                  <option value="saldo">Saldo</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <Label htmlFor="payment-receipt">Comprobante (opcional)</Label>
                <Input
                  id="payment-receipt"
                  name="receipt"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                />
                <p className="mt-1 text-xs text-muted-foreground">PDF o imagen, hasta 10 MB.</p>
              </div>
            </fieldset>
            <p className="text-xs text-muted-foreground">
              Conversión a USD con el tipo de cambio guardado en la cotización. Los pagos de tipo
              Depósito se acumulan para confirmar la venta.
            </p>
            {error && (
              <p role="alert" className="text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy}>
              {busy ? "Registrando…" : attempt.current ? "Reintentar registro" : "Registrar pago"}
            </Button>
          </form>
        </Card>
      )}
      {!canPay && (
        <p className="text-sm text-muted-foreground">
          Los pagos se registran en cotizaciones enviadas o vendidas que no estén archivadas.
        </p>
      )}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {["Fecha", "Tipo", "Monto", "USD", "Método", "Banco", "Comprobante"].map((t) => (
                <TableHead key={t}>{t}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data?.payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>Sin pagos registrados.</TableCell>
              </TableRow>
            )}
            {query.data?.payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.date}</TableCell>
                <TableCell>{p.type}</TableCell>
                <TableCell>{money(p.amount, p.currency)}</TableCell>
                <TableCell>
                  {p.amount_usd == null ? "Pendiente de conversión" : money(p.amount_usd, "USD")}
                </TableCell>
                <TableCell>{p.method}</TableCell>
                <TableCell>{p.bank || "—"}</TableCell>
                <TableCell>{p.receipt_path && <Receipt path={p.receipt_path} />}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
function Amount({ label, value }: { label: string; value: number | null }) {
  return (
    <Card className="p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">
        {value == null ? "Pendiente" : money(value, "USD")}
      </p>
    </Card>
  );
}
function Receipt({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  if (url)
    return (
      <a className="underline" href={url} target="_blank" rel="noreferrer">
        Abrir comprobante
      </a>
    );
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        try {
          setUrl(await paymentReceiptUrl(path));
        } catch (e) {
          toast.error((e as Error).message);
        }
      }}
    >
      Ver comprobante
    </Button>
  );
}
