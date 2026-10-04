import type { QuoteInput } from "..";
// TODO: incorporar costos exactos, vehículos, rooming y margen del presupuesto original.
// El PDF de venta no permite reconstruir estos costos sin inventarlos.
export const bolivia: Partial<QuoteInput> = { pax_paying: 9, tc_count: 1 };
export const expectedBolivia = {
  total_price_usd: 12924,
  price_per_pax_usd: 1436,
  single_supplement_pp: 550,
};
