import { createFileRoute } from "@tanstack/react-router";
import { SECTIONS, SectionShell, sectionHead } from "@/components/section";

const s = SECTIONS["modulos-actividad"];

export const Route = createFileRoute("/_authenticated/modulos-actividad")({
  head: () => sectionHead(s),
  component: () => <SectionShell section={s} />,
});
