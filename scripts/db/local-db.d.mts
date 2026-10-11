import type { PGlite } from "@electric-sql/pglite";
export const root: URL;
export function createDatabase(): Promise<PGlite>;
export function seedDatabase(db: PGlite): Promise<{ seed_order: string[] }>;
