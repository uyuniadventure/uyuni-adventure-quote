import { PGlite } from "@electric-sql/pglite";
import { readdir, readFile } from "node:fs/promises";
import { beforeMigration, afterMigration } from "./migration-fixtures.mjs";

export const root = new URL("../../", import.meta.url);

export async function createDatabase({ migrationFiles, throughMigration } = {}) {
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
  const files =
    migrationFiles ??
    (await readdir(new URL("supabase/migrations/", root))).filter((x) => x.endsWith(".sql")).sort();
  for (const file of files) {
    // A historical checkpoint is used only to test a later data migration with
    // alternate counts. By default every real migration runs with test fixtures.
    if (throughMigration && file > throughMigration) continue;
    try {
      await beforeMigration(db, file);
      const sql = (await readFile(new URL(`supabase/migrations/${file}`, root), "utf8")).replaceAll(
        "\r\n",
        "\n",
      );
      await db.exec(sql);
      await afterMigration(db, file);
    } catch (error) {
      throw new Error(`${file}: ${error.message}`, { cause: error });
    }
  }
  return db;
}

/** Only archived fixture SQL: it predates T01h; replay its production backfill. */
export async function execArchivedSeed(db, sql) {
  const v2 =
    (
      await db.query(
        "select 1 from information_schema.columns where table_schema='public' and table_name='day_blocks' and column_name='hotel_id'",
      )
    ).rows.length > 0;
  if (!v2) return db.exec(sql);
  await db.exec(`alter table public.services disable trigger vehicle_capacity;
    alter table public.services disable trigger block_hotel_service;
    alter table public.day_blocks disable trigger block_hotel_identity;
    alter table public.day_block_items disable trigger block_hotel_items;`);
  await db.exec(sql);
  const countBefore = Number(
    (await db.query("select count(*) n from public.day_block_items")).rows[0].n,
  );
  const migration = await readFile(
    new URL("supabase/migrations/20261018000100_block_options_v2.sql", root),
    "utf8",
  );
  await db.exec("update public.services set capacity=coalesce(capacity,vehicle_max_pax)");
  await db.exec(
    migration.slice(
      migration.indexOf("-- Diagnose before"),
      migration.indexOf("create function public.check_block_hotel"),
    ),
  );
  await db.exec(`alter table public.services enable trigger vehicle_capacity;
    alter table public.services enable trigger block_hotel_service;
    alter table public.day_blocks enable trigger block_hotel_identity;
    alter table public.day_block_items enable trigger block_hotel_items;`);
  return {
    addedBlockItems:
      Number((await db.query("select count(*) n from public.day_block_items")).rows[0].n) -
      countBefore,
  };
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
      await execArchivedSeed(db, sql);
    } catch (error) {
      throw new Error(`${file}: ${error.message}; ${error.detail || ""}`);
    }
  }
  return report;
}
