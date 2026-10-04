import { createFileRoute } from "@tanstack/react-router";
import { SECTIONS, SectionShell, sectionHead } from "@/components/section";

const s = SECTIONS.dashboard;

export const Route = createFileRoute("/")({
  head: () => sectionHead(s),
  component: () => <SectionShell section={s} />,
});
