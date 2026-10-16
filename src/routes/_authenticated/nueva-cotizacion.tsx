import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SECTIONS, sectionHead } from "@/components/section";
import { QuoteCreator } from "@/components/quote/quote-creator";
import { QuoteWorkspace } from "@/components/quote/quote-workspace";
import { quoteCreationSearch } from "@/lib/quotes";

const s = SECTIONS["nueva-cotizacion"];

export const Route = createFileRoute("/_authenticated/nueva-cotizacion")({
  validateSearch: quoteCreationSearch,
  head: () => sectionHead(s),
  component: NewQuotePage,
});

function NewQuotePage() {
  const { quote, template } = Route.useSearch();
  const navigate = useNavigate({ from: "/nueva-cotizacion" });
  if (quote)
    return <QuoteWorkspace key={quote} quoteId={quote} onReset={() => navigate({ search: {} })} />;
  return (
    <QuoteCreator
      key={template ?? "new"}
      templateId={template}
      onCreated={(id) => navigate({ search: { quote: id } })}
    />
  );
}
