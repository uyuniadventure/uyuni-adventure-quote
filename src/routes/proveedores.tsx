import { createFileRoute } from "@tanstack/react-router";
import { SECTIONS, SectionShell, sectionHead } from "@/components/section";

const s = SECTIONS.proveedores;

export const Route = createFileRoute("/proveedores")({
  head: () => sectionHead(s),
  component: () => <SectionShell section={s} />,
});
