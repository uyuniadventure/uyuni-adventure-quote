export interface TourScenarioKey {
  tour_sku: string;
  year: number;
  season: string;
  pax: number;
}

export interface TourScenario extends TourScenarioKey {
  id: string;
  status: "activo" | "pendiente" | "inactivo";
}

export type ScenarioBillingUnit =
  "PER_PERSON" | "PER_GROUP" | "PER_ROOM" | "PER_ROOM_PER_DAY" | "PER_SERVICE" | "PER_UNIT";

export interface ScenarioCostLine {
  id: string;
  day_number: number;
  quantity: number;
  billing_unit: ScenarioBillingUnit;
  cost_basis: "UNIT_RATE" | "LINE_TOTAL";
  original_amount: number | null;
  amount_usd: number | null;
  charge_once_key?: string | null;
}

const normalized = (value: string) => value.trim().toUpperCase();

/** Exact lookup only: an import/quote must never borrow another year, season or pax band. */
export function resolveTourScenario<T extends TourScenario>(rows: T[], key: TourScenarioKey): T {
  const matches = rows.filter(
    (row) =>
      row.status === "activo" &&
      normalized(row.tour_sku) === normalized(key.tour_sku) &&
      row.year === key.year &&
      normalized(row.season) === normalized(key.season) &&
      row.pax === key.pax,
  );
  if (matches.length !== 1)
    throw new Error(
      matches.length ? "Escenario turístico ambiguo" : "Escenario turístico no encontrado",
    );
  return matches[0]!;
}

/** Quantity charged by the source contract. LINE_TOTAL is never multiplied again. */
export function scenarioLineQuantity(line: ScenarioCostLine, pax: number): number {
  if (!Number.isInteger(pax) || pax < 1) throw new Error("Cantidad de pasajeros inválida");
  if (!Number.isFinite(line.quantity) || line.quantity <= 0)
    throw new Error("Cantidad de línea inválida");
  if (line.cost_basis === "LINE_TOTAL") return 1;
  return line.billing_unit === "PER_PERSON" ? line.quantity * pax : line.quantity;
}

export interface PreparedScenarioLine extends ScenarioCostLine {
  charged_quantity: number;
  total_usd: number | null;
  covered: boolean;
}

/** Prepares immutable quote input while de-duplicating one purchased multi-day service. */
export function prepareScenarioLines(
  lines: ScenarioCostLine[],
  pax: number,
): PreparedScenarioLine[] {
  const charged = new Set<string>();
  return [...lines]
    .sort((a, b) => a.day_number - b.day_number || a.id.localeCompare(b.id))
    .map((line) => {
      const covered = !!line.charge_once_key && charged.has(line.charge_once_key);
      if (line.charge_once_key) charged.add(line.charge_once_key);
      const charged_quantity = covered ? 0 : scenarioLineQuantity(line, pax);
      return {
        ...line,
        charged_quantity,
        covered,
        total_usd: line.amount_usd == null ? null : line.amount_usd * charged_quantity,
      };
    });
}
