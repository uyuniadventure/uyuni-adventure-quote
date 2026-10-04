import { createFileRoute } from "@tanstack/react-router";
import { SECTIONS, SectionShell, sectionHead } from "@/components/section";

const s = SECTIONS.clientes;

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => sectionHead(s),
  component: () => <SectionShell section={s} />,
});
