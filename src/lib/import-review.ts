import { z } from "zod";
import { db, unwrap } from "./db";

const group = z.object({
  pending: z.number().int().nonnegative(),
  eligible: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      code: z.string(),
      name: z.string(),
      reasons: z.array(z.string()),
    }),
  ),
});
const resultSchema = z.object({
  dry_run: z.boolean(),
  review_date: z.string(),
  fingerprint: z.string().min(1),
  services: group,
  templates: group,
});
export type ImportApprovalResult = z.infer<typeof resultSchema>;

/** No fingerprint means simulation. Applying always uses a reviewed snapshot. */
export async function reviewImport(fingerprint?: string): Promise<ImportApprovalResult> {
  return resultSchema.parse(
    unwrap(
      await db.rpc("approve_valid_imports", {
        p_dry_run: fingerprint === undefined,
        ...(fingerprint === undefined ? {} : { p_expected_fingerprint: fingerprint }),
      }),
    ),
  );
}
