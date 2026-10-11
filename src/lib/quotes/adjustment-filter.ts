import { z } from "zod";
import type { Tables } from "../../types/db";

export const adjustmentFilterSchema = z
  .object({
    type: z
      .enum([
        "transporte",
        "alojamiento",
        "comida",
        "guia",
        "entrada",
        "actividad",
        "paquete",
        "extra",
        "vuelo",
      ])
      .optional(),
    supplier_id: z.string().uuid().optional(),
    day_number: z.number().int().positive().optional(),
    item_ids: z.array(z.string().uuid()).min(1).optional(),
  })
  .strict()
  .refine((v) => Object.values(v).some((x) => x !== undefined), "Indica al menos un filtro");
export type AdjustmentFilter = z.infer<typeof adjustmentFilterSchema>;

/** Intersect provided filters; expand a selected purchase to its multi-day copies. */
export function adjustmentTargets(
  days: Pick<Tables<"quote_days">, "id" | "day_number">[],
  items: Tables<"quote_items">[],
  filter: AdjustmentFilter,
) {
  const f = adjustmentFilterSchema.parse(filter);
  if (f.item_ids?.some((id) => !items.some((i) => i.id === id)))
    throw new Error("La lista contiene ítems ajenos a esta cotización");
  const matched = items.filter(
    (i) =>
      (f.type === undefined || i.type === f.type) &&
      (f.supplier_id === undefined || i.supplier_id === f.supplier_id) &&
      (f.day_number === undefined ||
        days.find((d) => d.id === i.quote_day_id)?.day_number === f.day_number) &&
      (f.item_ids === undefined || f.item_ids.includes(i.id)),
  );
  const coverage = (i: Tables<"quote_items">) =>
    (i.pricing_snapshot as { coverage_key?: string } | null)?.coverage_key;
  const purchases = new Set(
    matched
      .filter((i) => i.day_span > 1)
      .map(coverage)
      .filter(Boolean),
  );
  const affected = items.filter(
    (i) => matched.includes(i) || (i.day_span > 1 && purchases.has(coverage(i))),
  );
  if (!affected.length) throw new Error("El filtro no coincide con ningún ítem");
  return { matchedIds: matched.map((i) => i.id), affectedIds: affected.map((i) => i.id) };
}
