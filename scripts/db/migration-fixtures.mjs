import { readFile } from "node:fs/promises";

// Local test data only. The production rack migration must reject any count != 243,
// including a fresh empty database. Supply its explicit precondition in PGlite
// and remove the synthetic rows afterwards. Never used against Lovable Cloud.
export const rackMigration = "20261011000200_rack_to_net.sql";
const fixtureService = "00000000-0000-0000-0000-000000000243";
export async function beforeMigration(db, file) {
  if (file === "20261006100000_recover_missing_templates.sql") {
    // In Cloud these locations already exist from seed 00. Load the same source
    // rows locally before the recovery's foreign keys need them; do not skip it.
    const base = await readFile(
      new URL("../../supabase/seed/applied/00_base.sql", import.meta.url),
      "utf8",
    );
    const locations = base
      .split(/\r?\n/)
      .filter((line) => line.startsWith("insert into public.location_codes "));
    if (!locations.length) throw new Error("Recovery fixture requires the archived location codes");
    await db.exec(locations.join("\n"));
    return;
  }
  if (file !== rackMigration) return;
  const {
    rows: [state],
  } = await db.query("select count(*)::int n from public.service_rates");
  if (state.n !== 0) throw new Error("Migration fixture requires an empty local database");
  await db.query(
    `insert into public.services(id,sku,name,type,pricing_unit)
    values($1,'LOCAL_MIGRATION_243','Local migration fixture','extra','per_unit')`,
    [fixtureService],
  );
  await db.query(
    `insert into public.service_rates(service_id,price_rack)
    select $1,g from generate_series(0,242) g`,
    [fixtureService],
  );
}
export async function afterMigration(db, file) {
  if (file !== rackMigration) return;
  const {
    rows: [state],
  } = await db.query(
    `select count(*)::int n,
    bool_and(price_net=price_rack) correct from public.service_rates where service_id=$1`,
    [fixtureService],
  );
  if (state.n !== 243 || !state.correct)
    throw new Error("Rack migration did not copy its 243-row fixture");
  await db.query("delete from public.services where id=$1", [fixtureService]);
}
