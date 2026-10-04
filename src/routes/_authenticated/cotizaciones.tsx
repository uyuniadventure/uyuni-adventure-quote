import { createFileRoute } from "@tanstack/react-router";
import { SECTIONS, SectionShell, sectionHead } from "@/components/section";

const s = SECTIONS.cotizaciones;

export const Route = createFileRoute("/_authenticated/cotizaciones")({
  head: () => sectionHead(s),
  component: () => <SectionShell section={s} />,
});
