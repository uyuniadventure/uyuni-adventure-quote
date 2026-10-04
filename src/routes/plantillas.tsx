import { createFileRoute } from "@tanstack/react-router";
import { SECTIONS, SectionShell, sectionHead } from "@/components/section";

const s = SECTIONS.plantillas;

export const Route = createFileRoute("/plantillas")({
  head: () => sectionHead(s),
  component: () => <SectionShell section={s} />,
});
