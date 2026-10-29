import { z } from "zod";
import type { Enums } from "../../types/db";
import type { Rooming } from "./index";

export const roomTypeSchema = z.enum(["SGL", "DBL", "TPL", "MAT"]);
export const rateBandSchema = z
  .object({
    pax_min: z.number().int().nonnegative().nullable(),
    pax_max: z.number().int().positive().nullable(),
  })
  .strict()
  .refine((r) => r.pax_min == null || r.pax_max == null || r.pax_min <= r.pax_max, {
    message: "El límite inferior del tramo no puede superar el superior",
  });
const shapes = {
  per_room: z.object({ room_type: roomTypeSchema, nights: z.number().int().positive() }).strict(),
  per_vehicle: z
    .object({ vehicle_segment: z.string().trim().min(1), rate_band: rateBandSchema.optional() })
    .strict(),
  per_person: z.object({}).strict(),
  per_group: z.object({}).strict(),
  per_staff: z.object({ staff_type: z.enum(["drivers", "guides"]) }).strict(),
  per_unit: z.object({}).strict(),
};

/** Complete configurations for editors/imports. Missing fields are accepted only
 * by the partial parser below, then resolved at calculation time with warnings. */
export const pricingConfigSchemas = shapes;
export const pricingConfigSchema = z.discriminatedUnion("pricing_unit", [
  z.object({ pricing_unit: z.literal("per_room"), pricing_config: shapes.per_room }),
  z.object({ pricing_unit: z.literal("per_vehicle"), pricing_config: shapes.per_vehicle }),
  z.object({ pricing_unit: z.literal("per_person"), pricing_config: shapes.per_person }),
  z.object({ pricing_unit: z.literal("per_group"), pricing_config: shapes.per_group }),
  z.object({ pricing_unit: z.literal("per_staff"), pricing_config: shapes.per_staff }),
  z.object({ pricing_unit: z.literal("per_unit"), pricing_config: shapes.per_unit }),
]);
export interface PartialPricingConfig {
  room_type?: z.infer<typeof roomTypeSchema>;
  nights?: number;
  vehicle_segment?: string;
  rate_band?: z.infer<typeof rateBandSchema>;
  staff_type?: "drivers" | "guides";
}
export function parsePricingConfig(
  unit: Enums<"pricing_unit">,
  raw: unknown,
): PartialPricingConfig {
  return shapes[unit].partial().parse(raw ?? {});
}

/** Occupancy aliases only. STANDARD/SUITE are hotel categories, not bed counts. */
export function occupancyType(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return (
    ({
      DBL_TWN: "DBL",
      TWN: "DBL",
      DBL_MAT: "MAT",
      HAB_SGL: "SGL",
      HAB_DBL: "DBL",
      HAB_TPL: "TPL",
      HAB_MAT: "MAT",
    } as Record<string, string>)[value] ??
    (["SGL", "DBL", "TPL", "MAT", "QUAD"].includes(value) ? value : undefined)
  );
}
export function normalizeRooms(rooms: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [type, n] of Object.entries(rooms)) {
    if (!Number.isInteger(n) || n < 0) throw new Error(`Invalid rooms: ${type}`);
    const key = occupancyType(type) ?? type;
    result[key] = (result[key] ?? 0) + n;
  }
  return result;
}
export function resolveRooming(rooming: Rooming, paying: number, tc: number) {
  const selected = { paying: normalizeRooms(rooming.paying), tc: normalizeRooms(rooming.tc) };
  const warnings: string[] = [];
  if (!Object.values(selected.paying).some((n) => n > 0)) {
    selected.paying = { DBL: Math.floor(paying / 2), SGL: paying % 2 };
    warnings.push(
      `Habitaciones por defecto para ${paying} pagantes: ${Math.floor(paying / 2)} DBL + ${paying % 2} SGL. Puedes cambiar la distribución en la cotización.`,
    );
  }
  if (tc > 0 && !Object.values(selected.tc).some((n) => n > 0)) {
    selected.tc = { SGL: tc };
    warnings.push(`Habitaciones TC por defecto: ${tc} SGL separadas de los pagantes.`);
  }
  return { rooming: selected, warnings };
}
