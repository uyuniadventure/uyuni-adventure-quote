import { createFileRoute } from "@tanstack/react-router";
import { SECTIONS, SectionShell, sectionHead } from "@/components/section";

const s = SECTIONS["bloques-diarios"];

export const Route = createFileRoute("/_authenticated/bloques-diarios")({
  head: () => sectionHead(s),
  component: () => <SectionShell section={s} />,
});
