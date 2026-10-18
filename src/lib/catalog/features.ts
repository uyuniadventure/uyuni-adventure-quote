import { db, unwrap } from "../db";
export async function getCatalogFeatures() {
  const settings = unwrap(await db.from("pricing_settings").select("*").order("id"));
  return { activity_modules_enabled: settings[0]?.activity_modules_enabled ?? false };
}
