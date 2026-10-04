import { createFileRoute } from "@tanstack/react-router";
import { SECTIONS, SectionShell, sectionHead } from "@/components/section";

const s = SECTIONS["revision-importacion"];

export const Route = createFileRoute("/_authenticated/revision-importacion")({
  head: () => sectionHead(s),
  component: () => <SectionShell section={s} />,
});
