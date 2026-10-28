// Shared by the browser and Edge Functions. Pure; no DB or UI dependencies.
export interface DocumentContentPatch {
  client_name?: string;
  introduction?: string;
  guide?: string;
  payment_text?: string;
  cancellation?: string;
  terms_url?: string;
  info?: { title: string; content: string }[];
}
export interface DocumentDay {
  id: string;
  day_number: number;
  date: string | null;
  block_snapshot: unknown;
  overrides: unknown;
  snapshot?: unknown;
}
export interface DocumentItem {
  id: string;
  quote_day_id: string;
  sku: string | null;
  description: string;
  pricing_snapshot: unknown;
  included?: boolean;
  type?: string;
  room_distribution?: unknown;
  check_in?: string | null;
  check_out?: string | null;
  meal_plan?: string | null;
}
export interface DayText {
  title?: Record<string, string> | undefined;
  description?: Record<string, string> | undefined;
  includes?: Record<string, string> | undefined;
  excludes?: Record<string, string> | undefined;
  accommodation_text?: Record<string, string> | undefined;
  transport_text?: Record<string, string> | undefined;
  client_note?: Record<string, string> | undefined;
  meals?: string[] | undefined;
  start_point?: string | null | undefined;
  end_point?: string | null | undefined;
}
export function mergeDayContent(base: DayText, overrides: DayText): DayText {
  const result = { ...base, ...overrides };
  for (const key of [
    "title",
    "description",
    "includes",
    "excludes",
    "accommodation_text",
    "transport_text",
    "client_note",
  ] as const) {
    if (overrides[key]) result[key] = { ...base[key], ...overrides[key] };
  }
  return result;
}
export function resolveDocumentDay(day: DocumentDay): DayText {
  return mergeDayContent(
    (day.block_snapshot as { content?: DayText })?.content ?? {},
    (day.overrides ?? {}) as DayText,
  );
}

const INCLUDED_MEALS = /\s+Comidas\s+inclu[ií]das\s*:\s*/i;

export interface DescriptiveLodging {
  accommodation: string;
  meals: string;
}

/** Separates the known Excel suffix without guessing when the marker is absent. */
export function splitDescriptiveLodging(
  accommodation: string | null | undefined,
  meals: string | null | undefined,
): DescriptiveLodging {
  const original = accommodation?.trim() ?? "";
  const separateMeals = meals?.trim() ?? "";
  const match = INCLUDED_MEALS.exec(original);
  if (!match)
    return { accommodation: original, meals: separateMeals };
  return {
    accommodation: original.slice(0, match.index).trim(),
    meals: separateMeals || original.slice(match.index + match[0].length).trim(),
  };
}

/** Descriptive Excel fallback; it never implies a structured hotel link. */
export function sourceLodgingDetails(day: DocumentDay): DescriptiveLodging {
  const snapshot = day.snapshot as {
    source_ref?: { hotel?: unknown; meals?: unknown };
  } | null;
  const hotel = snapshot?.source_ref?.hotel;
  const meals = snapshot?.source_ref?.meals;
  return splitDescriptiveLodging(
    typeof hotel === "string" ? hotel : "",
    typeof meals === "string" ? meals : "",
  );
}

export function sourceAccommodationText(day: DocumentDay) {
  return sourceLodgingDetails(day).accommodation;
}
export interface DocumentContent extends DocumentContentPatch {
  /** Legacy text is retained for audit; document sections are authoritative after migration. */
  text_sections_migrated?: boolean;
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
  quote: unknown;
  days: DocumentDay[];
  items: DocumentItem[];
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
      const effective = resolveDocumentDay(day);
      const sourceLodging = sourceLodgingDetails(day);
      const overrides = (day.overrides ?? {}) as Record<string, unknown>;
      const field = (key: string, value: string): TextField => ({
        value,
        overridden:
          typeof overrides[key] === "object" &&
          overrides[key] !== null &&
          lang in (overrides[key] as Record<string, unknown>),
      });
      const routeFrom = effective.start_point ?? "";
      const routeTo = effective.end_point ?? "";
      const lodging = splitDescriptiveLodging(
        localized(effective.accommodation_text, lang) || sourceLodging.accommodation,
        effective.meals?.length ? effective.meals.join(", ") : sourceLodging.meals,
      );
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
          lodging.accommodation,
        ),
        meals: {
          value: effective.meals?.length ? effective.meals : lodging.meals ? [lodging.meals] : [],
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
