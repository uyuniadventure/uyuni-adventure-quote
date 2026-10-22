export type ClimateSeason = "DRY" | "RAIN";

/** Confirmed Uyuni commercial calendar: DRY Jun-Nov, RAIN Dec-May. */
export function climateSeasonForDate(date: string): ClimateSeason {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Fecha inválida: ${date}`);
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date)
    throw new Error(`Fecha inválida: ${date}`);
  const month = parsed.getUTCMonth() + 1;
  return month >= 6 && month <= 11 ? "DRY" : "RAIN";
}
