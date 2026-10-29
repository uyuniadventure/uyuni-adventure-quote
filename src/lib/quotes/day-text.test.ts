import { describe, expect, it } from "vitest";
import { prepareDayText, recoverReliableDayTranslation, separateReliableDayText } from "./day-text";

const translation = (lang: string, title: string, description: string, reviewed = true) => ({
  lang,
  title,
  description,
  reviewed,
  includes: null,
  excludes: null,
});

describe("prepareDayText", () => {
  it("uses independently stored description and meals to clean a duplicated imported title", () => {
    const description = "Salida temprano por la mañana para visitar el campo geotérmico.";
    const result = prepareDayText(
      {
        block: { code: "DIA-4" },
        translations: [{
          ...translation(
            "es",
            `Sol de la Mañana · Laguna Verde · Hito Cajón · San Pedro de Atacama ${description} Comidas incluidas: Desayuno · Almuerzo`,
            description,
          ),
          includes: "Desayuno · Almuerzo",
        }],
        modules: [],
        content: {},
      },
      "es",
    );

    expect(result).toMatchObject({
      title: "Sol de la Mañana · Laguna Verde · Hito Cajón · San Pedro de Atacama",
      description,
      includes: "Desayuno · Almuerzo",
      overrides: { meals: ["Desayuno", "Almuerzo"] },
    });
  });

  it("does not split a combined title without an exact independent suffix", () => {
    const original = translation("es", "Título narración sin campos fiables", "Otra descripción");
    expect(separateReliableDayText(original)).toEqual(original);
  });

  it("recovers a combined imported block only from one exact independent translation", () => {
    const source = {
      ...translation(
        "es",
        "Sol de la Mañana · Laguna Verde · Hito Cajón · San Pedro de Atacama",
        "Salida temprano por la mañana para visitar el campo geotérmico.",
      ),
      includes: "Desayuno · Almuerzo",
    };
    const combined = translation(
      "es",
      `${source.title} ${source.description} Comidas incluidas: ${source.includes}`,
      "",
    );
    expect(recoverReliableDayTranslation(combined, [source])).toEqual(source);
    expect(recoverReliableDayTranslation(combined, [source, { ...source }])).toBeUndefined();
    const result = prepareDayText(
      { block: { code: "IMPORTADO" }, translations: [combined], modules: [], content: {} },
      "es",
      [source],
    );
    expect(result).toMatchObject({
      title: source.title,
      description: source.description,
      overrides: { meals: ["Desayuno", "Almuerzo"] },
    });
  });
  it("uses a frozen fallback when the block has no Spanish translation", () => {
    const result = prepareDayText(
      {
        block: { code: "DIA-SIN-ES" },
        translations: [translation("en", "English title", "English description")],
        modules: [],
        content: {},
      },
      "es",
    );

    expect(result).toMatchObject({
      title: "English title",
      description: "English description",
      reviewed: false,
      source_language: "en",
      overrides: {
        title: { es: "English title" },
        description: { es: "English description" },
      },
    });
  });

  it("keeps a block usable and pending review when it has no translations", () => {
    const result = prepareDayText(
      {
        block: { code: "DIA-SIN-TEXTOS" },
        translations: [],
        modules: [],
        content: {},
      },
      "es",
    );

    expect(result).toMatchObject({
      title: "DIA-SIN-TEXTOS",
      description: "",
      reviewed: false,
      translation: null,
      source_language: null,
      overrides: { title: { es: "DIA-SIN-TEXTOS" } },
    });
  });
});
