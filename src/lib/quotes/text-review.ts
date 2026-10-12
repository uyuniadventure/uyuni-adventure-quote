import type { Json } from "../../types/db";

/** Retains IDs/content for the UI, sorted by itinerary order; never mutates input.
 * Legacy/free days without a boolean reviewed=true still need human review. */
export function unreviewedDays<T extends { day_number: number; snapshot: Json }>(
  days: readonly T[],
): T[] {
  return days
    .filter((day) => {
      const snapshot = day.snapshot;
      return (
        !snapshot ||
        typeof snapshot !== "object" ||
        Array.isArray(snapshot) ||
        snapshot["reviewed"] !== true
      );
    })
    .sort((a, b) => a.day_number - b.day_number);
}

export function unreviewedDaysMessage(
  days: readonly { day_number: number; snapshot: Json }[],
  language: string,
): string | null {
  const pending = unreviewedDays(days);
  return pending.length
    ? `Faltan revisar los textos de los días ${pending.map((day) => day.day_number).join(", ")} (idioma ${language.toUpperCase()})`
    : null;
}
