import { z } from "zod";
import type { Json, Tables } from "../../types/db";
import type { TemplateSource } from "./template-source";

const localized = z.record(z.string().regex(/^[a-z]{2}(-[A-Za-z]{2})?$/), z.string());
/** Only narrative content belongs in overrides; services are quote_items. */
export const dayContentSchema = z
  .object({
    title: localized.optional(),
    description: localized.optional(),
    meals: z.array(z.string()).optional(),
    accommodation_text: localized.optional(),
    transport_text: localized.optional(),
    schedule: z.array(z.string()).optional(),
    start_point: z.string().nullable().optional(),
    end_point: z.string().nullable().optional(),
    internal_notes: z.string().nullable().optional(),
    photo_ids: z.array(z.string()).optional(),
  })
  .strict();
export type DayContent = z.infer<typeof dayContentSchema>;
export type FrozenDay = Pick<Tables<"quote_days">, "block_snapshot" | "overrides">;
export function resolveDay(day: FrozenDay): DayContent {
  const snapshot = day.block_snapshot as { content?: DayContent };
  const base = dayContentSchema.parse(snapshot.content ?? {});
  const overrides = dayContentSchema.parse(day.overrides);
  const result = { ...base, ...overrides };
  for (const key of ["title", "description", "accommodation_text", "transport_text"] as const) {
    if (overrides[key]) result[key] = { ...base[key], ...overrides[key] };
  }
  return result;
}
export interface ContinuityWarning {
  nivel: "aviso";
  día: number;
  mensaje: string;
}
export function continuityWarnings(
  days: (FrozenDay & Pick<Tables<"quote_days">, "day_number" | "link_type">)[],
): ContinuityWarning[] {
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{M}|\s/gu, "")
      .toLowerCase();
  const sorted = [...days].sort((a, b) => a.day_number - b.day_number);
  return sorted.flatMap((day, i) => {
    const next = sorted[i + 1];
    if (
      !next ||
      next.day_number !== day.day_number + 1 ||
      day.link_type === "independent" ||
      next.link_type === "independent"
    )
      return [];
    const end = resolveDay(day).end_point;
    const start = resolveDay(next).start_point;
    // An unknown endpoint is not evidence of a broken connection.
    if (!end?.trim() || !start?.trim() || normalize(end) === normalize(start)) return [];
    return [
      {
        nivel: "aviso" as const,
        día: next.day_number,
        mensaje: `Días ${day.day_number} → ${next.day_number}: el final «${end}» no conecta con el inicio «${start}».`,
      },
    ];
  });
}

export function snapshotBlock(block: Tables<"day_blocks">, source: TemplateSource) {
  const byId = <T extends { id: string }>(rows: T[]) =>
    [...rows].sort((a, b) => a.id.localeCompare(b.id));
  const translations = byId(source.texts.filter((t) => t.block_id === block.id));
  const links = source.links
    .filter((l) => l.block_id === block.id)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const modules = links.map((link) => ({
    link,
    module: source.modules.find((m) => m.id === link.module_id),
    translations: byId(source.moduleTexts.filter((t) => t.module_id === link.module_id)),
    items: byId(source.moduleItems.filter((i) => i.module_id === link.module_id)),
  }));
  return {
    block,
    translations,
    modules,
    services: byId(source.items.filter((i) => i.block_id === block.id)),
    content: {
      ...(block.content as DayContent),
      title: Object.fromEntries(translations.map((t) => [t.lang, t.title])),
      description: Object.fromEntries(
        translations.map((t) => [
          t.lang,
          [
            t.description,
            ...modules.flatMap((m) => {
              const mt = m.translations.find((x) => x.lang === t.lang);
              return mt ? [`${mt.title}\n${mt.description}`] : [];
            }),
          ].join("\n\n"),
        ]),
      ),
      start_point: block.start_point ?? block.route_from,
      end_point: block.end_point ?? block.route_to,
    },
  };
}

/** Overlapping purchases form one movement group; separate purchases retain their own keys. */
export function groupCoveredDays<
  T extends { day_number: number; items: { day_span?: number; pricing_snapshot?: Json }[] },
>(days: T[]) {
  const spans: { start: number; end: number }[] = [];
  for (const day of days)
    for (const item of day.items) {
      if ((item.day_span ?? 1) <= 1) continue;
      const start = (item.pricing_snapshot as { coverage_start_day: number }).coverage_start_day;
      if (start !== day.day_number) continue;
      spans.push({ start, end: start + (item.day_span ?? 1) - 1 });
    }
  const groups: { start: number; end: number; id: string }[] = [];
  for (const span of spans.sort((a, b) => a.start - b.start)) {
    const last = groups.at(-1);
    if (last && span.start <= last.end) last.end = Math.max(last.end, span.end);
    else groups.push({ ...span, id: crypto.randomUUID() });
  }
  return days.map((day) => {
    const group = groups.find((g) => g.start <= day.day_number && day.day_number <= g.end);
    return {
      ...day,
      link_type: group ? ("grouped" as const) : ("chained" as const),
      group_id: group?.id ?? null,
      group_position: group ? day.day_number - group.start + 1 : null,
    };
  });
}
