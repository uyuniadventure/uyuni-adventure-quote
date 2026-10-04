import { createFileRoute } from "@tanstack/react-router";
import { SECTIONS, SectionShell, sectionHead } from "@/components/section";

const s = SECTIONS.admin;

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => sectionHead(s),
  component: () => <SectionShell section={s} />,
});
