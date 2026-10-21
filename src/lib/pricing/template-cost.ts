import { proposeRooming } from "../quotes/selection-model";
import {
  numberCell,
  routeFamily,
  segmentVehicleCapacity,
  type CsvRow,
  type PackageV2,
} from "../import/package-v2";

export interface TemplateCostOptions {
  pax: number;
  tc?: number;
  staff?: number;
  /** Retained for call-site compatibility; imported package costs never use FX. */
  fx?: Record<string, number>;
  year?: number;
  date?: string;
}
export interface CostLine {
  sku: string;
  day: number;
  slot: string;
  qty: number;
  cost_usd: number;
  span_days: number;
  billing: "per_day" | "per_service";
}
export interface PackageTemplate {
  pkg: PackageV2;
  sku: string;
}
export async function costTemplate(
  template: string | PackageTemplate,
  options: TemplateCostOptions,
) {
  if (typeof template === "string")
    return (await import("../import")).costTemplate(template, options);
  return costPackageTemplate(template, options);
}
/** Cost in USD using only the client-authorized PRECIO_USD column. */
export function costPackageTemplate({ pkg, sku }: PackageTemplate, options: TemplateCostOptions) {
  const { pax, tc = 0, staff = 0, year = 2026 } = options;
  if (!Number.isInteger(pax) || pax < 1 || ![tc, staff].every((n) => Number.isInteger(n) && n >= 0))
    throw new Error("Pasajeros inválidos");
  const template = pkg.templates.find((t) => t["sku"] === sku);
  if (!template) throw new Error(`Plantilla desconocida: ${sku}`);
  const lines: CostLine[] = [];
  const tariff = (code: string) => {
    const s = pkg.tariffs.find((s) => s["TariffCode"] === code);
    if (!s) throw new Error(`Tarifa inexistente: ${code}`);
    return s;
  };
  const rate = (s: CsvRow) => {
    if (+s["Year"]! !== year) throw new Error(`Tarifa no vigente en ${year}: ${s["TariffCode"]}`);
    const sourceSeason = s["Season"] || "";
    if (/EXCLUYE|EXCEPT|NO V[ÁA]LID/i.test(sourceSeason))
      throw new Error(`Temporada excluida: ${s["TariffCode"]}`);
    if (sourceSeason && sourceSeason !== "ALL" && sourceSeason !== template["temporada"])
      throw new Error(`Temporada no autorizada: ${s["TariffCode"]}`);
    if (options.date && ((s["ValidFrom"] && options.date < s["ValidFrom"]!) || (s["ValidTo"] && options.date > s["ValidTo"]!)))
      throw new Error(`Tarifa fuera de vigencia: ${s["TariffCode"]}`);
    const price = numberCell(s["PRECIO_USD"]);
    if (price == null) throw new Error(`PRECIO_USD ausente: ${s["TariffCode"]}`);
    return price;
  };
  let vehicles = 1;
  const add = (s: CsvRow, day: number, slot: string, qty: number, span = 1) => {
    lines.push({
      sku: s["TariffCode"]!,
      day,
      slot,
      qty,
      cost_usd: rate(s) * qty,
      span_days: span,
      billing: span > 1 ? "per_service" : "per_day",
    });
  };
  for (const seg of pkg.segments.filter((s) => s["sku"] === sku)) {
    const s = tariff(seg["TariffCode"]!);
    const effectiveUnit = seg["unidad"] || s["UnitType"];
    const capacity = segmentVehicleCapacity(seg, s);
    const count =
      effectiveUnit === "PER_VEHICLE"
        ? Math.ceil((pax + tc + staff) / Number(capacity))
        : 1;
    if (!Number.isFinite(count) || count < 1) throw new Error("Tramo sin capacidad");
    vehicles = Math.max(vehicles, count);
    add(s, +seg["dia_desde"]!, seg["slot"]!, count, +seg["dia_hasta"]! - +seg["dia_desde"]! + 1);
  }
  const quantity = (s: CsvRow, policy: string | undefined, unitOverride?: string) => {
    const people = pax + (policy === "charged" ? tc : 0);
    switch (unitOverride || s["UnitType"]) {
      case "PER_PERSON":
      case "PER_PERSON_PER_NIGHT":
        return people;
      case "PER_GROUP":
        return 1;
      case "PER_VEHICLE":
        return Math.ceil((pax + tc + staff) / Number(s["VehicleMaxPax"]));
      default:
        throw new Error(`Unidad no admitida fuera de habitación: ${s["UnitType"]}`);
    }
  };
  for (const d of pkg.days.filter((d) => d["sku"] === sku))
    for (const i of pkg.blockItems.filter(
      (i) => i["bloque_servicios_id"] === d["bloque_servicios_id"],
    )) {
      let s = tariff(i["TariffCode"]!);
      if (i["slot"] === "TRASLADO_FRONTERA") {
        const candidates = pkg.tariffs.filter(
          (v) =>
            v["Supplier"] === s["Supplier"] &&
            routeFamily(v) === routeFamily(s) &&
            +v["Year"]! === year &&
            v["UnitType"] === s["UnitType"],
        );
        const match = candidates
          .filter(
            (v) =>
              (numberCell(v["PaxMin"]) ?? 1) <= pax + tc &&
              (numberCell(v["PaxMax"]) ?? Infinity) >= pax + tc,
          )
          .sort((a, b) => rate(a) - rate(b));
        if (!match[0]) throw new Error("Traslado sin tramo de pasajeros");
        s = match[0];
      }
      add(s, +d["dia"]!, i["slot"]!, quantity(s, i["tc_policy"], i["unidad"]));
    }
  for (const n of pkg.lodging.filter((n) => n["sku"] === sku)) {
    if (n["slot"] === "ALOJAMIENTO") {
      for (const room of proposeRooming(pax, n["tc_policy"] === "charged" ? tc : 0)) {
        const rooms = pkg.tariffs.filter(
          (s) =>
            s["Supplier"]?.toLowerCase() === n["proveedor"]?.toLowerCase() &&
            s["UnitType"] === "PER_ROOM_PER_NIGHT" &&
            +s["Year"]! === year &&
            (room.room_type === "DBL"
              ? ["DBL", "MAT", "TWN"].includes(s["RoomType"]!)
              : s["RoomType"] === room.room_type),
        );
        rooms.sort((a, b) => rate(a) - rate(b));
        if (!rooms[0]) throw new Error(`Hotel sin ${room.room_type} en ${year}`);
        add(rooms[0], +n["noche"]!, n["slot"]!, room.count);
      }
    } else {
      const s = tariff(n["TariffCode"]!);
      add(
        s,
        +n["noche"]!,
        n["slot"]!,
        n["slot"] === "STAFF" ? vehicles : quantity(s, n["tc_policy"], n["unidad"]),
      );
    }
  }
  const included = pkg.segments
    .filter((s) => s["sku"] === sku)
    .flatMap((s) =>
      Array.from({ length: +s["dia_hasta"]! - +s["dia_desde"]! }, (_, i) => ({
        day: +s["dia_desde"]! + i + 1,
        sku: s["TariffCode"]!,
        label: `incluido en Día ${s["dia_desde"]}`,
      })),
    );
  return {
    total_cost_usd: Math.round(lines.reduce((a, l) => a + l.cost_usd, 0) * 100) / 100,
    lines,
    included,
  };
}
