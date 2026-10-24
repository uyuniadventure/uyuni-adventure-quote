import { db, unwrap } from "../db";
import type { Tables } from "../../types/db";

/** Read-only proposal for T09. Confirmation must use the quote mutation queue. */
export async function proposeSegmentForBlocks(route: string, days: number, people: number) {
  if (!Number.isInteger(days) || days < 1 || !Number.isInteger(people) || people < 1)
    throw new Error("Duración o pasajeros inválidos");
  const rules = unwrap(
    await db.from("segment_rules").select("*").eq("route", route).eq("days", days).order("id"),
  );
  const services = unwrap(
    await db
      .from("services")
      .select("*")
      .in(
        "id",
        rules.map((r) => r.service_id),
      )
      .order("id"),
  );
  return rules.map((r) => {
    const s = services.find((s) => s.id === r.service_id);
    if (!s) throw new Error("Servicio de tramo no disponible");
    return {
      ...r,
      service: s,
      qty: s.pricing_unit === "per_vehicle" ? Math.ceil(people / (s.capacity ?? 0)) : 1,
      billing: "per_service" as const,
      span_days: r.day_to - r.day_from + 1,
    };
  });
}
/** View data only: a covered day has a label, never another persisted quote_item. */
export function includedSegmentsForDay(
  items: Pick<
    Tables<"quote_items">,
    "id" | "sku" | "description" | "billing" | "span_days" | "selected" | "pricing_snapshot"
  >[],
  day: number,
) {
  return items
    .filter((i) => {
      const start = (i.pricing_snapshot as { coverage_start_day?: number }).coverage_start_day;
      return (
        i.selected &&
        i.billing === "per_service" &&
        start != null &&
        day > start &&
        day < start + i.span_days
      );
    })
    .map((i) => ({
      id: i.id,
      sku: i.sku,
      description: i.description,
      label: `incluido en Día ${(i.pricing_snapshot as { coverage_start_day: number }).coverage_start_day}`,
      cost: 0,
    }));
}
