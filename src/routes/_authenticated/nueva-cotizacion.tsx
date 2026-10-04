import { createFileRoute } from "@tanstack/react-router";
import { SECTIONS, SectionShell, sectionHead } from "@/components/section";

const s = SECTIONS["nueva-cotizacion"];

export const Route = createFileRoute("/_authenticated/nueva-cotizacion")({
  head: () => sectionHead(s),
  component: () => <SectionShell section={s} />,
});
