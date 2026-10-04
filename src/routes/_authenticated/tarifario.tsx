import { createFileRoute } from "@tanstack/react-router";
import { SECTIONS, SectionShell, sectionHead } from "@/components/section";

const s = SECTIONS.tarifario;

export const Route = createFileRoute("/_authenticated/tarifario")({
  head: () => sectionHead(s),
  component: () => <SectionShell section={s} />,
});
