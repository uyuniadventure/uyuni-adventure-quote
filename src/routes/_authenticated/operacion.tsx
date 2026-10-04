import { createFileRoute } from "@tanstack/react-router";
import { SECTIONS, SectionShell, sectionHead } from "@/components/section";

const s = SECTIONS.operacion;

export const Route = createFileRoute("/_authenticated/operacion")({
  head: () => sectionHead(s),
  component: () => <SectionShell section={s} />,
});
