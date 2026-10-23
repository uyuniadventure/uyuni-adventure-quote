export function parseSuggestedPosition(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0)
    throw new Error("La posición sugerida debe ser un número entero mayor que cero.");
  return parsed;
}
