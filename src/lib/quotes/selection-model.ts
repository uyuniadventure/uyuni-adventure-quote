/** Pure proposals. Manual choices are never replaced by these helpers. */
export interface RoomRow {
  night?: number | null;
  room_type: string;
  count: number;
  for_tc: boolean;
}
export function proposeRooming(pax: number, tc = 0): RoomRow[] {
  for (const n of [pax, tc])
    if (!Number.isInteger(n) || n < 0) throw new Error("Pasajeros inválidos");
  return [
    { room_type: "DBL", count: Math.floor(pax / 2), for_tc: false },
    { room_type: "SGL", count: pax % 2, for_tc: false },
    { room_type: "SGL", count: tc, for_tc: true },
  ].filter((r) => r.count > 0);
}
export const occupancy: Record<string, number> = {
  SGL: 1,
  DBL: 2,
  TWN: 2,
  MAT: 2,
  TPL: 3,
  QUAD: 4,
};
export function roomingForNight(rows: RoomRow[], night: number) {
  // Any dated distribution replaces the entire generic distribution for that night.
  const dated = rows.filter((r) => r.night === night);
  const active = dated.length ? dated : rows.filter((r) => r.night == null);
  const result = { paying: {} as Record<string, number>, tc: {} as Record<string, number> };
  for (const r of active) {
    if (!occupancy[r.room_type] || !Number.isInteger(r.count) || r.count < 0)
      throw new Error("Distribución inválida");
    const group = r.for_tc ? result.tc : result.paying;
    group[r.room_type] = (group[r.room_type] ?? 0) + r.count;
  }
  return result;
}
export function roomingWarnings(rows: RoomRow[], night: number, pax: number, tc: number): string[] {
  const rooming = roomingForNight(rows, night);
  return (
    [
      ["paying", pax],
      ["tc", tc],
    ] as const
  ).flatMap(([key, expected]) => {
    const total = Object.entries(rooming[key]).reduce(
      (n, [type, count]) => n + occupancy[type]! * count,
      0,
    );
    return total === expected
      ? []
      : [
          `La distribución ${key === "tc" ? "TC " : ""}suma ${total} personas, la cotización tiene ${expected} (noche ${night})`,
        ];
  });
}
export interface TransportOption {
  serviceId: string;
  supplierId: string | null;
  capacity: number;
  cost: number;
}
export function proposeTransport(
  slot: TransportOption[],
  paxTotal: number,
  options: { supplierId?: string } = {},
) {
  if (!Number.isInteger(paxTotal) || paxTotal < 0) throw new Error("Pasajeros inválidos");
  const alternatives = slot.filter(
    (s) => !options.supplierId || s.supplierId === options.supplierId,
  );
  if (
    alternatives.some(
      (s) =>
        !Number.isInteger(s.capacity) || s.capacity <= 0 || !Number.isFinite(s.cost) || s.cost < 0,
    )
  )
    throw new Error("Capacidad o costo inválido");
  // Unbounded minimum-cost cover; cap states at demand, so oversized vehicles work.
  const best: ({ cost: number; quantities: number[] } | undefined)[] = Array(paxTotal + 1);
  best[0] = { cost: 0, quantities: alternatives.map(() => 0) };
  for (let seats = 0; seats < paxTotal; seats++) {
    const state = best[seats];
    if (!state) continue;
    alternatives.forEach((vehicle, i) => {
      const next = Math.min(paxTotal, seats + vehicle.capacity),
        cost = state.cost + vehicle.cost;
      if (!best[next] || cost < best[next]!.cost) {
        const quantities = [...state.quantities];
        quantities[i]!++;
        best[next] = { cost, quantities };
      }
    });
  }
  const result = best[paxTotal];
  return {
    alternatives,
    proposal: result
      ? alternatives.flatMap((s, i) =>
          result.quantities[i] ? [{ serviceId: s.serviceId, qty: result.quantities[i]! }] : [],
        )
      : [],
    cost: result?.cost ?? null,
  };
}
export function transportWarning(capacity: number, required: number, day: number) {
  return capacity < required
    ? `Faltan ${required - capacity} plazas en el transporte del día ${day}`
    : null;
}
/** Stable canonical signature, deliberately excludes room IDs, defaults and config. */
export function blockSignature(block: {
  route_from: string | null;
  route_to: string | null;
  hotel_id: string | null;
  text_es: string;
  items: {
    slot_key: string;
    service_id: string;
    location?: string | null;
    meal_plan?: string | null;
  }[];
}) {
  const normalize = (s: string | null | undefined) =>
    (s ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
  return JSON.stringify([
    normalize(block.route_from),
    normalize(block.route_to),
    block.hotel_id,
    normalize(block.text_es),
    [
      ...new Set(
        block.items.map((i) =>
          JSON.stringify(
            i.slot_key === "ALOJAMIENTO"
              ? [i.slot_key, block.hotel_id, normalize(i.location), i.meal_plan ?? null]
              : [i.slot_key, i.service_id],
          ),
        ),
      ),
    ].sort(),
  ]);
}
