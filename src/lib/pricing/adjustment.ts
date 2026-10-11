import { z } from "zod";

// Same convention as margin_pct: 6.4 is 6.4 %, not 640 %.
export const adjustmentPctSchema = z.number().finite().min(-100);
export function adjustedCost(base: number, pct = 0) {
  adjustmentPctSchema.parse(pct);
  const cost = base * (1 + pct / 100);
  if (!Number.isFinite(cost) || cost < 0) throw new Error("Costo ajustado inválido");
  return cost;
}
