import { db, json, unwrap } from "../db";
import { calculateSavedQuote, loadQuote } from "./index";
import {
  continuityWarnings,
  dayContentSchema,
  groupCoveredDays,
  type DayContent,
} from "./day-content";
import type { QuoteResult } from "../pricing";
export {
  resolveDay,
  dayContentSchema,
  type DayContent,
  type ContinuityWarning,
} from "./day-content";

export interface DayMutationResult {
  quote_id: string;
  block_id: string | null;
  calculation: QuoteResult;
}
/** Preparation performs no writes. A second call applies the same operation under
 * the quote lock and checks the revision before saving children and totals. */
async function mutate(
  quoteId: string,
  operation: string,
  payload: object,
): Promise<DayMutationResult> {
  const args = { p_id: quoteId, p_operation: operation, p_payload: json(payload) };
  const prepared = unwrap(await db.rpc("edit_quote_days", args)) as unknown as Awaited<
    ReturnType<typeof loadQuote>
  >;
  const result = calculateSavedQuote(prepared);
  return unwrap(
    await db.rpc("edit_quote_days", {
      ...args,
      p_updated_at: prepared.quote.updated_at,
      p_result: json(result),
    }),
  ) as unknown as DayMutationResult;
}
export async function validateContinuity(quoteId: string) {
  return continuityWarnings((await loadQuote(quoteId)).days);
}
export async function updateDayContent(dayId: string, fields: DayContent) {
  dayContentSchema.parse(fields);
  const day = unwrap(await db.from("quote_days").select("*").eq("id", dayId).single());
  return mutate(day.quote_id, "content", { day_id: dayId, fields });
}
export async function setDayLinkType(dayId: string, linkType: "chained" | "independent") {
  const day = unwrap(await db.from("quote_days").select("*").eq("id", dayId).single());
  return mutate(day.quote_id, "link", { day_id: dayId, link_type: linkType });
}
export function groupDays(quoteId: string, dayNumbers: number[]) {
  return mutate(quoteId, "group", { day_numbers: dayNumbers, group_id: crypto.randomUUID() });
}
export async function ungroup(groupId: string) {
  const days = unwrap(await db.from("quote_days").select("*").eq("group_id", groupId));
  const quoteIds = new Set(days.map((d) => d.quote_id));
  if (quoteIds.size !== 1) throw new Error("Grupo inexistente o ambiguo");
  return mutate(days[0]!.quote_id, "ungroup", { group_id: groupId });
}
/** Move before an earlier target, or after a later target (whole target group). */
export function moveDay(quoteId: string, dayId: string, targetDay: number) {
  return mutate(quoteId, "move", { day_id: dayId, target_day: targetDay });
}
export function deleteDay(quoteId: string, dayId: string) {
  return mutate(quoteId, "delete", { day_id: dayId });
}
export async function saveDayAsNewBlock(dayId: string, nombre: string) {
  const day = unwrap(await db.from("quote_days").select("*").eq("id", dayId).single());
  return mutate(day.quote_id, "save_block", {
    day_id: dayId,
    name: nombre,
    new_block_id: crypto.randomUUID(),
  });
}

/** Append one library day with its translations, defaults and frozen tariffs. */
export async function addBlockDay(quoteId: string, blockId: string) {
  const { quote, days } = await loadQuote(quoteId);
  const bundle = await prepareBlockDay(quote, blockId, days.length + 1);
  if (bundle.items.some((i) => (i.day_span ?? 1) > 1))
    throw new Error("Selecciona todos los bloques del tramo multi-día y añádelos juntos");
  return mutate(quoteId, "add_block", bundle);
}

/** Select the whole stretch before writing: no partial itinerary or duplicate purchase. */
export async function addBlockDays(quoteId: string, blockIds: string[]) {
  if (!blockIds.length) throw new Error("Selecciona al menos un bloque");
  const { quote, days } = await loadQuote(quoteId);
  const bundles = await Promise.all(
    blockIds.map((id, index) => prepareBlockDay(quote, id, days.length + index + 1)),
  );
  const purchasePrefix = crypto.randomUUID();
  for (const bundle of bundles)
    for (const item of bundle.items) {
      if ((item.day_span ?? 1) <= 1) continue;
      const snapshot = item.pricing_snapshot as {
        coverage_key: string;
        coverage_start_day: number;
      };
      const libraryPosition = bundle.source.block.default_day_position;
      if (libraryPosition == null)
        throw new Error("Falta la posición del bloque para identificar su tramo multi-día");
      snapshot.coverage_key = `${purchasePrefix}:${snapshot.coverage_key}`;
      snapshot.coverage_start_day += bundle.day.day_number - libraryPosition;
      if (
        snapshot.coverage_start_day <= days.length ||
        snapshot.coverage_start_day + item.day_span! - 1 > days.length + bundles.length
      )
        throw new Error(
          "Selecciona todos los bloques consecutivos del tramo multi-día, en su orden",
        );
    }
  // A purchase linked only to its first block still covers every day of its span.
  for (const bundle of bundles)
    for (const item of [...bundle.items]) {
      if ((item.day_span ?? 1) <= 1) continue;
      const config = item.pricing_snapshot as { coverage_key: string; coverage_start_day: number };
      if (config.coverage_start_day !== bundle.day.day_number) continue;
      for (
        let n = config.coverage_start_day + 1;
        n < config.coverage_start_day + item.day_span!;
        n++
      ) {
        const target = bundles.find((b) => b.day.day_number === n)!;
        if (
          !target.items.some(
            (i) =>
              (i.pricing_snapshot as { coverage_key?: string }).coverage_key ===
              config.coverage_key,
          )
        )
          target.items.push({
            ...structuredClone(item),
            id: crypto.randomUUID(),
            quote_day_id: target.day.id,
          });
      }
    }
  const grouped = groupCoveredDays(bundles.map((b) => ({ ...b.day, items: b.items })));
  return mutate(quoteId, "add_blocks", {
    blocks: bundles.map((bundle, i) => ({
      ...bundle,
      day: {
        ...bundle.day,
        link_type: grouped[i]!.link_type,
        group_id: grouped[i]!.group_id,
        group_position: grouped[i]!.group_position,
      },
    })),
  });
}

async function prepareBlockDay(
  quote: Awaited<ReturnType<typeof loadQuote>>["quote"],
  blockId: string,
  dayNumber: number,
) {
  const { serviceItem } = await import("./from-template");
  const snapshot = unwrap(await db.rpc("snapshot_day_block", { p_id: blockId })) as unknown as {
    block: import("../../types/db").Tables<"day_blocks">;
    translations: import("../../types/db").Tables<"day_block_translations">[];
    services: import("../../types/db").Tables<"day_block_items">[];
    modules: {
      link: import("../../types/db").Tables<"day_block_modules">;
      module: import("../../types/db").Tables<"activity_modules">;
      translations: import("../../types/db").Tables<"activity_module_translations">[];
      items: import("../../types/db").Tables<"activity_module_items">[];
    }[];
    content: DayContent;
  };
  const tr = snapshot.translations.find((t) => t.lang === quote.language);
  if (!tr) throw new Error(`Falta traducción ${quote.language}`);
  const rows = [...snapshot.services, ...snapshot.modules.flatMap((m) => m.items)];
  const hotel = snapshot.block.hotel_service_id;
  const ids = [
    ...new Set([...rows.map((r) => r.service_id), hotel].filter((id): id is string => !!id)),
  ];
  const [services, rates] = await Promise.all([
    db.from("services").select("*").in("id", ids).order("id").then(unwrap),
    db.from("service_rates").select("*").in("service_id", ids).order("id").then(unwrap),
  ]);
  const source = { services, rates };
  // Coverage coordinates belong to the library until addBlockDays relocates them.
  const libraryDay = snapshot.block.default_day_position ?? dayNumber;
  const frozen = rows.map((r) => serviceItem(r, libraryDay, source));
  if (hotel && !frozen.some((i) => i.service_id === hotel))
    frozen.push(
      serviceItem(
        {
          service_id: hotel,
          source_kind: "hotel",
          qty: 1,
          applies_tc: null,
          margin_applicable: null,
          multi_day_span: 1,
        },
        dayNumber,
        source,
      ),
    );
  const id = crypto.randomUUID();
  const day = {
    id,
    quote_id: quote.id,
    day_number: dayNumber,
    title: snapshot.content.title?.[quote.language] ?? tr.title,
    description: snapshot.content.description?.[quote.language] ?? tr.description,
    includes: tr.includes,
    excludes: tr.excludes,
    route_from: snapshot.block.route_from,
    route_to: snapshot.block.route_to,
    source_block_id: blockId,
    block_snapshot: snapshot,
    overrides: {},
    link_type: "chained",
    group_id: null,
    group_position: null,
    snapshot: {
      reviewed:
        tr.reviewed &&
        snapshot.modules.every((m) =>
          m.translations.some((t) => t.lang === quote.language && t.reviewed),
        ),
      language: quote.language,
      places: snapshot.block.places,
      hotel_service_id: hotel,
      block_id: blockId,
    },
  };
  const items = frozen.map((i) => ({
    ...i,
    id: crypto.randomUUID(),
    quote_day_id: id,
    adjustment_pct: i.adjustment_pct ?? 0,
    adjustment_note: i.adjustment_note ?? null,
    price_overridden: i.price_overridden ?? false,
    included: i.included ?? true,
    source_block_service_id:
      (i.pricing_snapshot as { _source_link?: { id?: string } })._source_link?.id ?? null,
  }));
  return { block_id: blockId, source: snapshot, day, items };
}
