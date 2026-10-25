import { describe, expect, it } from "vitest";
import { prepareDayText } from "./day-text";

const translation = (lang: string, title: string, description: string, reviewed = true) => ({
  lang,
  title,
  description,
  reviewed,
  includes: null,
  excludes: null,
});

describe("prepareDayText", () => {
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
