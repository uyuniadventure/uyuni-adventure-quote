import { z } from "zod";
import type { Tables } from "../../types/db";
import { resolveDay } from "./day-content";

const text = z.string().max(20_000);
const infoBlock = z
  .object({
    title: z.string().trim().min(1).max(200),
    content: z.string().max(10_000),
  })
  .strict();

/** User-editable part of the quote's PDF document snapshot. */
export const documentContentPatchSchema = z
  .object({
    client_name: z.string().trim().min(1).max(200).optional(),
    introduction: text.optional(),
    guide: text.optional(),
    payment_text: text.optional(),
    cancellation: text.optional(),
    terms_url: z.string().max(2048).optional(),
    info: z.array(infoBlock).max(50).optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, "Indica al menos un texto para guardar.");

export type DocumentContentPatch = z.infer<typeof documentContentPatchSchema>;

export interface DocumentContent extends DocumentContentPatch {
  cover_photo?: string;
  terms?: string;
  eur_payment_url?: string;
  banks?: {
    entity: string;
    bank_name: string;
    account_holder: string;
    account_number: string;
    currency: string;
    swift?: string;
    routing_number?: string;
    iban?: string;
    instructions?: string;
  }[];
  day_photos?: Record<string, string[]>;
  item_labels?: Record<string, string>;
}

export interface TextField<T = string> {
  value: T;
  overridden: boolean;
}

export interface QuoteDocumentModel {
  document: {
    client_name: string;
    introduction: string;
    guide: string;
    payment_text: string;
    cancellation: string;
    terms: string;
    terms_url: string;
    eur_payment_url: string;
    cover_photo: string;
    banks: NonNullable<DocumentContent["banks"]>;
    info: NonNullable<DocumentContent["info"]>;
  };
  days: {
    id: string;
    day_number: number;
    date: string | null;
    title: TextField;
    description: TextField;
    route: TextField<{ from: string; to: string }>;
    accommodation_text: TextField;
    meals: TextField<string[]>;
    transport_text: TextField;
    includes: TextField;
    excludes: TextField;
    client_note: TextField;
    photos: string[];
  }[];
  services: { item_id: string; day_id: string; label: string }[];
}

type DocumentModelInput = {
  quote: Tables<"quotes">;
  days: Tables<"quote_days">[];
  items: Tables<"quote_items">[];
  content: DocumentContent;
};

function localized(value: Record<string, string> | undefined, lang: string) {
  if (!value) return "";
  const keys = [lang, lang.split("-")[0]!, "es", ...Object.keys(value)];
  for (const key of keys) if (value[key] !== undefined) return value[key]!;
  return "";
}

/** Pure projection of all variable text used by the client PDF. */
export function buildQuoteDocumentModel(
  data: DocumentModelInput,
  lang: string,
): QuoteDocumentModel {
  const content = data.content;
  const document = {
    client_name: content.client_name ?? "",
    introduction: content.introduction ?? "",
    guide: content.guide ?? "",
    payment_text: content.payment_text ?? "",
    cancellation: content.cancellation ?? "",
    terms: content.terms ?? "",
    terms_url: content.terms_url ?? "",
    eur_payment_url: content.eur_payment_url ?? "",
    cover_photo: content.cover_photo ?? "",
    banks: content.banks ?? [],
    info: content.info ?? [],
  };
  const days = [...data.days]
    .sort((a, b) => a.day_number - b.day_number)
    .map((day) => {
      const effective = resolveDay(day);
      const overrides = day.overrides as Record<string, unknown>;
      const field = (key: string, value: string): TextField => ({
        value,
        overridden:
          typeof overrides[key] === "object" &&
          overrides[key] !== null &&
          lang in (overrides[key] as Record<string, unknown>),
      });
      const routeFrom = effective.start_point ?? "";
      const routeTo = effective.end_point ?? "";
      return {
        id: day.id,
        day_number: day.day_number,
        date: day.date,
        title: field("title", localized(effective.title, lang)),
        description: field("description", localized(effective.description, lang)),
        route: {
          value: { from: routeFrom, to: routeTo },
          overridden: "start_point" in overrides || "end_point" in overrides,
        },
        accommodation_text: field(
          "accommodation_text",
          localized(effective.accommodation_text, lang),
        ),
        meals: {
          value: effective.meals ?? [],
          overridden: "meals" in overrides,
        },
        transport_text: field("transport_text", localized(effective.transport_text, lang)),
        includes: field("includes", localized(effective.includes, lang)),
        excludes: field("excludes", localized(effective.excludes, lang)),
        client_note: field("client_note", localized(effective.client_note, lang)),
        photos: content.day_photos?.[String(day.day_number)] ?? [],
      };
    });
  const services = data.items.map((item) => {
    const labels = content.item_labels ?? {};
    const snapshot = item.pricing_snapshot as { service?: { name?: string } } | null;
    return {
      item_id: item.id,
      day_id: item.quote_day_id,
      label:
        labels[item.id] ?? labels[item.sku ?? ""] ?? snapshot?.service?.name ?? item.description,
    };
  });
  return { document, days, services };
}
