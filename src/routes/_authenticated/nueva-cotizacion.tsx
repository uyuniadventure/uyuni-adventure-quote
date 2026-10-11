import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SECTIONS, sectionHead } from "@/components/section";
import { QuoteCreator } from "@/components/quote/quote-creator";
import { QuoteWorkspace } from "@/components/quote/quote-workspace";

const s = SECTIONS["nueva-cotizacion"];

export const Route = createFileRoute("/_authenticated/nueva-cotizacion")({
  validateSearch: (search: Record<string, unknown>): { quote?: string } =>
    typeof search['quote'] === "string" && search['quote'] ? { quote: search['quote'] } : {},
  head: () => sectionHead(s),
  component: NewQuotePage,
});

function NewQuotePage() {
  const { quote } = Route.useSearch();
  const navigate = useNavigate({ from: "/nueva-cotizacion" });
  if (quote) return <QuoteWorkspace key={quote} quoteId={quote} onReset={() => navigate({ search: {} })} />;
  return <QuoteCreator onCreated={(id) => navigate({ search: { quote: id } })} />;
}
