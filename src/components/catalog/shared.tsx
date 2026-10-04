import { Badge } from "@/components/ui/badge";
import type { Enums, Tables } from "@/types/db";

export const SERVICE_TYPES: Enums<"service_type">[] = [
  "transporte", "alojamiento", "comida", "guia", "entrada", "actividad", "paquete", "extra", "vuelo",
];
export const PRICING_UNITS: Enums<"pricing_unit">[] = [
  "per_person", "per_group", "per_room", "per_vehicle", "per_staff", "per_unit",
];
export const PRICING_UNIT_LABELS: Record<Enums<"pricing_unit">, string> = {
  per_person: "Por persona", per_group: "Por grupo", per_room: "Por habitación",
  per_vehicle: "Por vehículo", per_staff: "Por staff", per_unit: "Por unidad",
};
export const SEASONS: Enums<"season">[] = ["ALL", "DRY", "RAIN", "BAJA", "MEDIA", "ALTA", "FESTIVO"];
export const STATUSES: Enums<"catalog_status">[] = ["activo", "pendiente", "inactivo"];
export const MODALITIES: Enums<"service_modality">[] = ["privado", "compartido", "ambos"];
// Monedas de SPEC §4.1 (la tabla currencies es solo de admin).
export const CURRENCIES = ["USD", "CLP", "BOB", "ARS", "PEN", "EUR"];

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "activo" || status === "aprobado"
      ? "bg-success/15 text-success border-success/30"
      : status === "pendiente"
        ? "bg-brand-orange/15 text-brand-orange-deep border-brand-orange/30"
        : "bg-muted text-muted-foreground border-border";
  return <Badge variant="outline" className={cls}>{cap(status)}</Badge>;
}

export function money(v: number | null | undefined, currency?: string | null) {
  if (v === null || v === undefined) return "—";
  return `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(v)}${currency ? ` ${currency}` : ""}`;
}

export function paxRange(r: Pick<Tables<"service_rates">, "pax_min" | "pax_max">) {
  if (r.pax_min == null && r.pax_max == null) return "Todos";
  return `${r.pax_min ?? 1}–${r.pax_max ?? "∞"}`;
}

export function validity(r: Pick<Tables<"service_rates">, "valid_from" | "valid_to">) {
  if (!r.valid_from && !r.valid_to) return "Sin límite";
  return `${r.valid_from ?? "…"} → ${r.valid_to ?? "…"}`;
}

/** Campos de tarifa que se pueden proponer / editar. */
export interface RateValues {
  season: Enums<"season">;
  valid_from: string | null;
  valid_to: string | null;
  pax_min: number | null;
  pax_max: number | null;
  price_net: number | null;
  price_rack: number | null;
  notes: string | null;
}

export function rateValuesFrom(r?: Partial<Tables<"service_rates">> | null): RateValues {
  return {
    season: r?.season ?? "ALL",
    valid_from: r?.valid_from ?? null,
    valid_to: r?.valid_to ?? null,
    pax_min: r?.pax_min ?? null,
    pax_max: r?.pax_max ?? null,
    price_net: r?.price_net ?? null,
    price_rack: r?.price_rack ?? null,
    notes: r?.notes ?? null,
  };
}

export const RATE_FIELD_LABELS: Record<keyof RateValues, string> = {
  season: "Temporada", valid_from: "Desde", valid_to: "Hasta", pax_min: "Pax mín.",
  pax_max: "Pax máx.", price_net: "Neto", price_rack: "Rack", notes: "Notas",
};
