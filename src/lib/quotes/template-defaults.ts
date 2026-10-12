import type { QuoteBasics } from "./index";
import type { Json } from "@/types/db";
import { z } from "zod";

const passengerDefaults = z.object({
  pax_paying: z.number().int().positive().optional(),
  tc_count: z.number().int().nonnegative().optional(),
});
export function templatePassengerDefaults(raw: Json) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const result = passengerDefaults.safeParse(raw);
  if (!result.success)
    throw new Error(
      "La configuración de pasajeros de la plantilla no es válida. Revisa quote_defaults.",
    );
  return result.data;
}
export function templatePassengerMismatch(
  basics: { pax_paying: string | number; tc_count: string | number },
  raw: Json,
) {
  const defaults = templatePassengerDefaults(raw);
  return (
    (defaults.pax_paying !== undefined && Number(basics.pax_paying) !== defaults.pax_paying) ||
    (defaults.tc_count !== undefined && Number(basics.tc_count) !== defaults.tc_count)
  );
}
export function templatePassengerLabel(raw: Json) {
  const defaults = templatePassengerDefaults(raw);
  return [
    defaults.pax_paying !== undefined ? `${defaults.pax_paying} pasajeros` : null,
    defaults.tc_count !== undefined ? `${defaults.tc_count} TC` : null,
  ]
    .filter(Boolean)
    .join(" + ");
}

export interface TemplateQuoteDefaults {
  pax_paying: number;
  tc_count: number;
  rooming: QuoteBasics["rooming"];
  staff: NonNullable<QuoteBasics["staff"]>;
  source_url: string;
  source_sheet: string;
  source_range: string;
  expected_cost_usd: number;
}

export function applyTemplateDefaults(basics: QuoteBasics, raw: Json): QuoteBasics {
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || Object.keys(raw).length === 0)
    return basics;
  const defaults = raw as unknown as TemplateQuoteDefaults;
  // This pilot only certifies the source's 2-pax scenario. Do not silently reuse
  // its room distribution for another group size or a complimentary passenger.
  if (templatePassengerMismatch(basics, raw)) {
    throw new Error(
      `Esta plantilla está configurada para ${templatePassengerLabel(raw)}. Usa ese escenario para la validación o empieza desde cero.`,
    );
  }
  const hasRooms =
    Object.values(basics.rooming.paying).some((n) => n > 0) ||
    Object.values(basics.rooming.tc).some((n) => n > 0);
  return {
    ...basics,
    rooming: hasRooms ? basics.rooming : structuredClone(defaults.rooming ?? basics.rooming),
    staff:
      basics.staff && (basics.staff.drivers > 0 || basics.staff.guides > 0)
        ? basics.staff
        : { ...(defaults.staff ?? basics.staff ?? { drivers: 0, guides: 0 }) },
  };
}
