import { useRouteContext } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import type { Enums } from "@/types/db";

export type AppRole = Enums<"app_role">;

export interface CurrentUser {
  user: User;
  role: AppRole | null;
  fullName: string;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  operacion: "Operación",
  vendedor: "Vendedor",
};

/** Validates the session with Auth and reads the role from profiles (RLS: own row). */
export async function loadCurrentUser(): Promise<CurrentUser | null> {
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) return null;
  const { data: profile } = await db
    .from("profiles")
    .select("role, full_name")
    .eq("id", data.user.id)
    .maybeSingle();
  const meta = data.user.user_metadata as { full_name?: string } | undefined;
  return {
    user: data.user,
    role: profile?.role ?? null,
    fullName: profile?.full_name || meta?.full_name || data.user.email || "Usuario",
  };
}

export function useCurrentUser(): CurrentUser {
  return useRouteContext({ from: "/_authenticated", select: (c) => c.auth });
}

/** Admin y operación gestionan el tarifario (SPEC §3). */
export function canManageCatalog(role: AppRole | null) {
  return role === "admin" || role === "operacion";
}
