import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { Client } from "pg";
import { createClient } from "@supabase/supabase-js";
import { beforeMigration, afterMigration } from "../../scripts/db/migration-fixtures.mjs";
import { localOnly } from "./local-only.mjs";

// CLI status reads ONLY the isolated local project. Never source production .env.
const status = JSON.parse(
  execFileSync("supabase", ["status", "--workdir", "tests/e2e", "-o", "json"], {
    encoding: "utf8",
  }),
);
const api = localOnly(status.API_URL, 54321);
const pg = new Client({ connectionString: localOnly(status.DB_URL, 54322) });
await pg.connect();
const sql = { exec: (text) => pg.query(text), query: (text, args) => pg.query(text, args) };
const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");
try {
  const exists = await pg.query("select to_regclass('public.quotes') existing");
  if (exists.rows[0].existing)
    throw new Error(
      "Use a fresh E2E database (supabase stop --workdir tests/e2e --no-backup). Refusing to change an existing database.",
    );
  for (const file of (await readdir(new URL("../../supabase/migrations/", import.meta.url)))
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    await beforeMigration(sql, file);
    await pg.query(await read(`supabase/migrations/${file}`));
    await afterMigration(sql, file);
    console.log(`Applied ${file}`);
  }
  for (const reportFile of ["report.json", "blocks-report.json"]) {
    const report = JSON.parse(await read(`supabase/seed/applied/${reportFile}`));
    for (const file of report.seed_order)
      await pg.query(await read(`supabase/seed/applied/${file}`));
  }
  await pg.query(await read("supabase/seed/04_spauyu_mp_2pax.sql"));
  // Synthetic review prerequisites only. No rates, quantities, rooming or totals change.
  // This is NOT approval of the Cloud import or its customer-facing texts.
  await pg.query(`
    update itinerary_templates set status='activo',import_warnings='[]' where sku='SPAUYU-3D2N-MP';
    update day_blocks set status='activo' where code like 'IMPORT_SPAUYU_MP_2PAX_D%';
    update day_block_translations set reviewed=true where block_id in(select id from day_blocks where code like 'IMPORT_SPAUYU_MP_2PAX_D%');
    update services set status='activo' where id in(select service_id from day_block_items where block_id in(select id from day_blocks where code like 'IMPORT_SPAUYU_MP_2PAX_D%'));
    update pricing_settings set margin_pct=25,margin_mode='markup',deposit_pct=30;
  `);
  const spa = JSON.parse(await read("tests/fixtures/SPAUYU-3D2N-MP.json"));
  await pg.query("delete from exchange_rates");
  for (const [currency, rate] of Object.entries(spa.input.fx_snapshot)) {
    await pg.query("insert into exchange_rates(currency,rate_to_usd,valid_from) values($1,$2,$3)", [
      currency,
      rate,
      spa.input.start_date,
    ]);
  }
  const admin = createClient(api, status.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const email = "seller-e2e@example.invalid",
    password = `E2e-${randomUUID()}!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  const role = await pg.query("select role from profiles where id=$1", [data.user.id]);
  if (role.rows[0]?.role !== "vendedor") throw new Error("E2E account must have vendedor role");
  const client = await pg.query(
    "insert into clients(type,name,email,language) values('B2C','Cliente E2E SPA','customer-e2e@example.invalid','es') returning id",
  );
  await pg.query("notify pgrst, 'reload schema'");
  await mkdir(new URL("./.local/", import.meta.url), { recursive: true });
  await writeFile(
    new URL("./.local/runtime.json", import.meta.url),
    JSON.stringify(
      {
        api,
        anonKey: status.ANON_KEY,
        email,
        password,
        sellerId: data.user.id,
        clientId: client.rows[0].id,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log("Local E2E fixtures ready; vendedor account created. No Cloud access.");
} finally {
  await pg.end();
}
