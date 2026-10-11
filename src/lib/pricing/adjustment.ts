import { z } from "zod";

// Fraction: 0.064 means +6.4%. Margin/commission retain percent points.
export const adjustmentPctSchema = z.number().finite().min(-0.5).max(1);
export function adjustedCost(base: number, pct = 0) {
  adjustmentPctSchema.parse(pct);
  const cost = base * (1 + pct);
  if (!Number.isFinite(cost) || cost < 0) throw new Error("Costo ajustado inválido");
  return cost;
}
