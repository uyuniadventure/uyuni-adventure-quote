import type { QuoteBasics } from "./index";
import type { Json } from "@/types/db";

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
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || !("pax_paying" in raw))
    return basics;
  const defaults = raw as unknown as TemplateQuoteDefaults;
  // This pilot only certifies the source's 2-pax scenario. Do not silently reuse
  // its room distribution for another group size or a complimentary passenger.
  if (basics.pax_paying !== defaults.pax_paying || basics.tc_count !== defaults.tc_count) {
    throw new Error(
      `Esta plantilla está configurada para ${defaults.pax_paying} pasajeros + ${defaults.tc_count} TC. Usa ese escenario para la validación o empieza desde cero.`,
    );
  }
  const hasRooms =
    Object.values(basics.rooming.paying).some((n) => n > 0) ||
    Object.values(basics.rooming.tc).some((n) => n > 0);
  return {
    ...basics,
    rooming: hasRooms ? basics.rooming : structuredClone(defaults.rooming),
    staff:
      basics.staff && (basics.staff.drivers > 0 || basics.staff.guides > 0)
        ? basics.staff
        : { ...defaults.staff },
  };
}
