import { createClient } from "npm:@supabase/supabase-js@2.117.2";
export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
export function secret(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing secret: ${name}`);
  return value;
}
export function response(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
export function serve(handler: (r: Request) => Promise<Response>) {
  Deno.serve(async (r) => {
    if (r.method === "OPTIONS") return new Response(null, { headers: cors });
    if (r.method !== "POST") return response({ error: "POST required" }, 405);
    try {
      return await handler(r);
    } catch (e) {
      console.error(e instanceof Error ? e.message : "Request failed");
      return response({ error: "Request failed. Check the function logs." }, 400);
    }
  });
}
export function admin() {
  return createClient(secret("SUPABASE_URL"), secret("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function authenticated(r: Request) {
  const authorization = r.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("Authentication required");
  const client = createClient(secret("SUPABASE_URL"), secret("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Invalid session");
  return { client, user: data.user };
}
export function must<T>(result: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error("Missing record");
  return result.data as NonNullable<T>;
}
export async function resend(payload: unknown, key: string) {
  const result = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(25000),
  });
  if (!result.ok) throw new Error(`Resend HTTP ${result.status}; retry the same outbox entry`);
  const body = await result.json();
  if (typeof body.id !== "string") throw new Error("Missing provider receipt");
  return body.id as string;
}
export function base64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
