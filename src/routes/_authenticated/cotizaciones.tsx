import { createFileRoute } from "@tanstack/react-router";
import { SECTIONS, sectionHead } from "@/components/section";
import { QuoteList } from "@/components/quote/quote-list";

const s = SECTIONS.cotizaciones;

export const Route = createFileRoute("/_authenticated/cotizaciones")({
  head: () => sectionHead(s),
  component: QuoteList,
});
