import type { PGlite } from "@electric-sql/pglite";
export const root: URL;
export function createDatabase(options?: { throughMigration?: string }): Promise<PGlite>;
export function seedDatabase(db: PGlite): Promise<{ seed_order: string[] }>;
