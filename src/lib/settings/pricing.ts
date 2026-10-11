import { db, unwrap } from "../db";
import type { AdminPricing, ClientPricing } from "../pricing/policy";

const GLOBAL_ID = "00000000-0000-0000-0000-000000000001";

// Persistence adapter; calculateQuote and policy.ts remain pure and do not fetch data.
export async function getAdminPricingSettings() {
  return unwrap(await db.from("pricing_settings").select("*").eq("id", GLOBAL_ID).single());
}

export async function updateAdminPricingSettings(settings: AdminPricing) {
  // Database constraints validate the complete combination; RLS requires Admin.
  return unwrap(
    await db.from("pricing_settings").update(settings).eq("id", GLOBAL_ID).select().single(),
  );
}

export async function updateClientPricingSettings(clientId: string, settings: ClientPricing) {
  return unwrap(
    await db
      .from("clients")
      .update({
        ...(settings.margin_pct !== undefined ? { margin_pct: settings.margin_pct } : {}),
        ...(settings.commission_mode != null ? { commission_mode: settings.commission_mode } : {}),
        ...(settings.commission_pct != null ? { commission_pct: settings.commission_pct } : {}),
      })
      .eq("id", clientId)
      .select()
      .single(),
  );
}
