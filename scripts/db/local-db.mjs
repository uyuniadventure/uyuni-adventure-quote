import { PGlite } from "@electric-sql/pglite";
import { readdir, readFile } from "node:fs/promises";
import { beforeMigration, afterMigration } from "./migration-fixtures.mjs";

export const root = new URL("../../", import.meta.url);

export async function createDatabase({ throughMigration } = {}) {
  const db = new PGlite();
  // Minimal Supabase Auth contract; this is an isolated, in-memory Postgres.
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,unique(bucket_id,name));
    alter table storage.objects enable row level security;
    grant usage on schema storage to authenticated;
    grant select,insert,update,delete on storage.objects to authenticated;
    create schema auth;
    create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
  `);
  for (const file of (await readdir(new URL("supabase/migrations/", root)))
    .filter((x) => x.endsWith(".sql"))
    .sort()) {
    // A historical checkpoint is used only to test a later data migration with
    // alternate counts. By default every real migration runs with test fixtures.
    if (throughMigration && file > throughMigration) break;
    try {
      await beforeMigration(db, file);
      await db.exec(await readFile(new URL(`supabase/migrations/${file}`, root), "utf8"));
      await afterMigration(db, file);
    } catch (error) {
      throw new Error(`${file}: ${error.message}`, { cause: error });
    }
  }
  return db;
}

export async function seedDatabase(db) {
  const report = JSON.parse(
    await readFile(new URL("supabase/seed/applied/report.json", root), "utf8"),
  );
  for (const file of report.seed_order) {
    const sql = await readFile(new URL(`supabase/seed/applied/${file}`, root), "utf8");
    if ((sql.match(/^insert into /gm) || []).length > 300)
      throw new Error(`${file} exceeds 300 rows`);
    try {
      await db.exec(sql);
    } catch (error) {
      throw new Error(`${file}: ${error.message}; ${error.detail || ""}`);
    }
  }
  return report;
}
