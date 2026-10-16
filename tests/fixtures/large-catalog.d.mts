import type { PGlite } from "@electric-sql/pglite";
export const catalogSeller: string;
export const catalogOtherSeller: string;
export function seedLargeCatalog(pg: PGlite): Promise<{
  template_id: string;
  client_id: string;
  block_ids: string[];
}>;
