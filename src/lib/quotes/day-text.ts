import type { DayContent } from "./day-content";

type Translation = {
  lang: string;
  title: string;
  description: string;
  reviewed: boolean;
  includes?: string | null;
  excludes?: string | null;
};

/** Keep the source intact; fallback text belongs only to this draft's overrides. */
export function prepareDayText(
  snapshot: {
    block: { code: string };
    translations: Translation[];
    modules: { module?: { code: string } | undefined; translations: Translation[] }[];
    content: DayContent;
  },
  language: string,
) {
  const choose = (texts: Translation[]) =>
    [...new Set([language, "es", "en", "it"])]
      .map((lang) => texts.find((t) => t.lang === lang && (t.title.trim() || t.description.trim())))
      .find((t) => !!t);
  const text = choose(snapshot.translations);
  let reviewed = !!text && text.lang === language && text.reviewed;
  const moduleTexts = snapshot.modules.map((m) => {
    const mt = choose(m.translations);
    reviewed = reviewed && !!mt && mt.lang === language && mt.reviewed;
    return mt ? `${mt.title}\n${mt.description}` : (m.module?.code ?? "");
  });
  const fields = {
    title: text?.title.trim() ? text.title : snapshot.block.code,
    description: [text?.description ?? "", ...moduleTexts].join("\n\n"),
    includes: text?.includes ?? "",
    excludes: text?.excludes ?? "",
  };
  const overrides: DayContent = {};
  for (const key of ["title", "description", "includes", "excludes"] as const) {
    if ((snapshot.content[key]?.[language] ?? "") !== fields[key])
      overrides[key] = { [language]: fields[key] };
  }
  return {
    ...fields,
    reviewed,
    translation: text ?? null,
    source_language: text?.lang ?? null,
    overrides,
  };
}
