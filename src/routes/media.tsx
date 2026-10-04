import { createFileRoute } from "@tanstack/react-router";
import { SECTIONS, SectionShell, sectionHead } from "@/components/section";

const s = SECTIONS.media;

export const Route = createFileRoute("/media")({
  head: () => sectionHead(s),
  component: () => <SectionShell section={s} />,
});
