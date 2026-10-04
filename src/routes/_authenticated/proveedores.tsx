import { createFileRoute } from "@tanstack/react-router";
import { SECTIONS, SectionShell, sectionHead } from "@/components/section";

const s = SECTIONS.proveedores;

export const Route = createFileRoute("/_authenticated/proveedores")({
  head: () => sectionHead(s),
  component: () => <SectionShell section={s} />,
});
