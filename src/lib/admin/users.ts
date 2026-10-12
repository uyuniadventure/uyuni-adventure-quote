import { z } from "zod";
import { db, unwrap } from "../db";

const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().nullable(),
  full_name: z.string().nullable(),
  role: z.enum(["admin", "operacion", "vendedor"]),
  created_at: z.string(),
});

export async function listAdminUsers() {
  return userSchema.array().parse(unwrap(await db.rpc("admin_list_users")));
}
