import { ProposalBuilder } from "./proposal-builder";
import { useQuery } from "@tanstack/react-query";
import { listDocSections } from "@/lib/quotes/document";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { recalculateQuote, unreviewedDays, unreviewedDaysMessage } from "@/lib/quotes";
import { saveQuoteTermsUrl, sendQuoteEmail } from "@/lib/quotes/delivery";
import { currentClientEmail } from "@/lib/clients";
import type { Tables } from "@/types/db";
import type { useQuoteActions } from "./quote-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

function LegacyQuoteDelivery({
  quote,
  actions,
  days = [],
  onGoToDay,
}: {
  quote: Tables<"quotes">;
  actions: ReturnType<typeof useQuoteActions>;
  days?: Tables<"quote_days">[];
  onGoToDay?: (dayNumber: number) => void;
}) {
  const pending = unreviewedDays(days);
  const pendingMessage = unreviewedDaysMessage(days, quote.language);
  const qc = useQueryClient();
  const content = (quote.document_snapshot ?? {}) as { client_email?: string; terms_url?: string };
  const clientEmail = useQuery({ queryKey: ["client-email", quote.client_id], queryFn: () => currentClientEmail(quote.client_id) });
  const [terms, setTerms] = useState(content.terms_url ?? "");
  const editable = !quote.archived_at && ["borrador", "revisada"].includes(quote.status);
  const generate = () =>
    actions.act(
      async () => {
        const { generateQuotePdf } = await import("@/lib/pdf");
        if (quote.client_type === "B2C" && terms !== content.terms_url) {
          await saveQuoteTermsUrl(quote.id, terms);
          await recalculateQuote(quote.id);
        }
        const blob = await generateQuotePdf(quote.id);
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${quote.code}.pdf`;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      },
      "PDF generado.",
      false,
    );
  const send = () =>
    actions.act(
      async () => {
        await sendQuoteEmail(quote.id);
        await Promise.all(
          ["quote-history", "quote-versions"].map((key) =>
            qc.invalidateQueries({ queryKey: [key] }),
          ),
        );
      },
      "Correo enviado.",
      false,
    );
  return (
    <Card className="space-y-4 p-4">
      <h2 className="font-semibold">PDF y envío</h2>
      <p className="text-sm text-muted-foreground">
        Destinatario: {clientEmail.data || (clientEmail.isLoading ? "Consultando…" : "Falta el email del cliente.")}
      </p>
      {quote.client_type === "B2C" && (
        <div className="space-y-1">
          <Label htmlFor="quote-terms-url">Enlace a términos y condiciones</Label>
          <Input
            id="quote-terms-url"
            type="url"
            value={terms}
            disabled={!editable || actions.busy}
            onChange={(e) => setTerms(e.target.value)}
          />
        </div>
      )}
      {pendingMessage && (
        <div className="space-y-1 rounded-md border border-brand-orange/40 p-3 text-sm">
          <p className="font-medium text-brand-orange-deep">
            No se puede generar el PDF: {pendingMessage}.
          </p>
          <ul className="list-inside list-disc text-muted-foreground">
            {pending.map((d) => (
              <li key={d.id}>
                <a
                  href={`#day-${d.day_number}`}
                  className="text-primary underline-offset-2 hover:underline"
                  onClick={(e) => {
                    if (!onGoToDay) return;
                    e.preventDefault();
                    onGoToDay(d.day_number);
                  }}
                >
                  Día {d.day_number}: {d.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={
            !editable ||
            actions.busy ||
            pending.length > 0 ||
            (quote.client_type === "B2C" && !terms)
          }
          onClick={() => void generate()}
        >
          Generar PDF
        </Button>
        <Button
          disabled={
            actions.busy ||
            !!quote.archived_at ||
            !quote.pdf_path ||
            (quote.client_type === "B2C" && terms !== content.terms_url) ||
            !clientEmail.data ||
            !["revisada", "enviada"].includes(quote.status)
          }
          onClick={() => void send()}
        >
          Enviar por email
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Revisa la cotización y genera su PDF antes de enviar. El estado cambia cuando el proveedor
        confirma el envío.
      </p>
    </Card>
  );
}

export function QuoteDelivery(props: Parameters<typeof LegacyQuoteDelivery>[0]) {
  const sections = useQuery({
    queryKey: ["doc-sections", props.quote.id],
    queryFn: () => listDocSections(props.quote.id),
  });
  if (props.quote.status === "borrador" || sections.data?.length)
    return <ProposalBuilder quote={props.quote} actions={props.actions} days={props.days ?? []} />;
  if (sections.isLoading) return <p>Cargando propuesta…</p>;
  if (sections.error) return <p role="alert">{sections.error.message}</p>;
  return <LegacyQuoteDelivery {...props} />;
}
