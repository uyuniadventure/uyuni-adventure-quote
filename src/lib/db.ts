import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../integrations/supabase/client";
import type { Database, Json } from "../types/db";

// Lovable owns the connection/auth client; only its schema typing is extended here.
export const db = supabase as unknown as SupabaseClient<Database>;
export function json(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
export function unwrap<T>({
  data,
  error,
}: {
  data: T;
  error: { message: string } | null;
}): NonNullable<T> {
  if (error) throw new Error(error.message);
  if (data === null || data === undefined) throw new Error("Record not found or inaccessible");
  return data as NonNullable<T>;
}
