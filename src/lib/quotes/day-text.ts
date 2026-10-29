import type { DayContent } from "./day-content";

type Translation = {
  lang: string;
  title: string;
  description: string;
  reviewed: boolean;
  includes?: string | null;
  excludes?: string | null;
};

export function recoverReliableDayTranslation(
  text: Translation,
  candidates: Translation[],
): Translation | undefined {
  if (text.description.trim()) return undefined;
  const combined = text.title.trim().replace(/\s+/g, " ");
  const matches = candidates.filter((candidate) => {
    const title = candidate.title.trim();
    const description = candidate.description.trim();
    if (!title || !description) return false;
    const includes = candidate.includes?.trim();
    const reconstructed = `${title} ${description}${includes ? ` Comidas incluidas: ${includes}` : ""}`
      .trim()
      .replace(/\s+/g, " ");
    return reconstructed === combined;
  });
  return matches.length === 1 ? matches[0] : undefined;
}

/**
 * Some imported library rows duplicated already-separated description/meals
 * into title. Only remove an exact, independently stored suffix; never infer a
 * boundary from punctuation or length.
 */
export function separateReliableDayText(text: Translation): Translation {
  const title = text.title.trim();
  const description = text.description.trim();
  const includes = text.includes?.trim() ?? "";
  if (!description) return text;
  const suffixes = [
    `${description}${includes ? ` Comidas incluidas: ${includes}` : ""}`,
    `${description}${includes ? `\nComidas incluidas: ${includes}` : ""}`,
    description,
  ];
  const suffix = suffixes.find((candidate) => title.endsWith(candidate));
  if (!suffix) return text;
  const separatedTitle = title.slice(0, -suffix.length).trim();
  return separatedTitle ? { ...text, title: separatedTitle } : text;
}

function reliableMealsFromCombinedTitle(text: Translation): string[] | undefined {
  const description = text.description.trim();
  const includes = text.includes?.trim();
  if (!description || !includes) return undefined;
  const marker = `Comidas incluidas: ${includes}`;
  return text.title.includes(description) && text.title.includes(marker)
    ? includes.split(/\s*·\s*/).filter(Boolean)
    : undefined;
}

/** Keep the source intact; fallback text belongs only to this draft's overrides. */
export function prepareDayText(
  snapshot: {
    block: { code: string };
    translations: Translation[];
    modules: { module?: { code: string } | undefined; translations: Translation[] }[];
    content: DayContent;
  },
  language: string,
  reliableCandidates: Translation[] = [],
) {
  const choose = (texts: Translation[]) =>
    [...new Set([language, "es", "en", "it"])]
      .map((lang) => texts.find((t) => t.lang === lang && (t.title.trim() || t.description.trim())))
      .find((t) => !!t);
  const selectedText = choose(snapshot.translations);
  const recoveredText = selectedText
    ? recoverReliableDayTranslation(selectedText, reliableCandidates)
    : undefined;
  const sourceText = recoveredText ?? selectedText;
  const meals = recoveredText?.includes?.split(/\s*·\s*/).filter(Boolean) ??
    (selectedText ? reliableMealsFromCombinedTitle(selectedText) : undefined);
  const text = sourceText ? separateReliableDayText(sourceText) : undefined;
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
  if (meals && JSON.stringify(snapshot.content.meals ?? []) !== JSON.stringify(meals))
    overrides.meals = meals;
  return {
    ...fields,
    reviewed,
    translation: text ?? null,
    source_language: text?.lang ?? null,
    overrides,
  };
}
