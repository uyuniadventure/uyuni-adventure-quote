import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { recalculateQuote } from "@/lib/quotes";
import { saveQuoteTermsUrl, sendQuoteEmail } from "@/lib/quotes/delivery";
import type { Tables } from "@/types/db";
import type { useQuoteActions } from "./quote-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export function QuoteDelivery({
  quote,
  actions,
}: {
  quote: Tables<"quotes">;
  actions: ReturnType<typeof useQuoteActions>;
}) {
  const qc = useQueryClient();
  const content = (quote.document_snapshot ?? {}) as { client_email?: string; terms_url?: string };
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
        Destinatario: {content.client_email || "Falta el email del cliente en esta cotización."}
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
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!editable || actions.busy || (quote.client_type === "B2C" && !terms)}
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
            !content.client_email ||
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
