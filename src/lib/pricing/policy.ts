export type MarginMode = "markup" | "margin_on_price";
export type CommissionMode = "none" | "gross";

export const DEFAULT_PRICING = { margin_pct: 25, margin_mode: "markup" } as const;

export interface ClientPricing {
  margin_pct?: number | null | undefined;
  commission_pct?: number | null | undefined;
  commission_mode?: CommissionMode | null | undefined;
}
export interface AdminPricing {
  margin_pct: number;
  margin_mode: MarginMode;
}
export interface PricingPolicyInput {
  // Percent points: 25 means 25%, not 0.25. Explicit zero overrides inheritance.
  margin_pct?: number | null | undefined;
  margin_mode?: MarginMode | null | undefined;
  client_type?: "B2B" | "B2C" | undefined;
  client_pricing?: ClientPricing;
  admin_pricing?: AdminPricing;
  // Frozen values on an existing quote; otherwise inherited from its B2B client.
  commission_pct?: number | null | undefined;
  commission_mode?: CommissionMode | null | undefined;
}

export function resolvePricingPolicy(input: PricingPolicyInput) {
  const margin_pct =
    input.margin_pct ??
    input.client_pricing?.margin_pct ??
    input.admin_pricing?.margin_pct ??
    DEFAULT_PRICING.margin_pct;
  const margin_mode =
    input.margin_mode ?? input.admin_pricing?.margin_mode ?? DEFAULT_PRICING.margin_mode;
  if (margin_mode !== "markup" && margin_mode !== "margin_on_price")
    throw new Error("Invalid margin mode");
  if (
    !Number.isFinite(margin_pct) ||
    margin_pct < 0 ||
    (margin_mode === "margin_on_price" && margin_pct >= 100)
  )
    throw new Error(
      "Invalid margin: margin_on_price requires 0 <= % < 100; markup requires % >= 0",
    );
  const mode = input.commission_mode ?? input.client_pricing?.commission_mode ?? "none";
  const pct = input.commission_pct ?? input.client_pricing?.commission_pct ?? 0;
  if (mode !== "none" && mode !== "gross") throw new Error("Invalid commission mode");
  if (!Number.isFinite(pct) || pct < 0 || pct >= 100)
    throw new Error("Invalid commission: requires 0 <= % < 100");
  const commission_mode = input.client_type === "B2B" ? mode : "none";
  return {
    margin_pct,
    margin_mode,
    margin_source:
      input.margin_pct != null
        ? "quote"
        : input.client_pricing?.margin_pct != null
          ? "client"
          : "admin",
    commission_mode,
    commission_pct: commission_mode === "gross" ? pct : 0,
  } as const;
}

export function marginAmount(cost: number, pct: number, mode: MarginMode): number {
  return mode === "markup" ? (cost * pct) / 100 : cost / (1 - pct / 100) - cost;
}
