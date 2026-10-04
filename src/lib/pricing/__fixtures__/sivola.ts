import type { QuoteInput } from "..";
// TODO: incorporar costos exactos, temporada, margen y política de redondeo.
// 28.057 / 14 = 2.004,07: el PDF muestra una cuota redondeada independientemente.
export const sivola: Partial<QuoteInput> = {
  pax_paying: 14,
  tc_count: 1,
  rooming: { paying: { DBL_TWN: 7 }, tc: { SGL: 1 } },
  vehicles: { bolivia: 4 },
};
export const expectedSivola = { total_price_usd: 28057, price_per_pax_usd: 2004 };
