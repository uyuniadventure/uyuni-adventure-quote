import { db, unwrap } from "./db";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeOptionalEmail(value: string) {
  const email = value.trim();
  if (!email) return null;
  if (!EMAIL.test(email)) throw new Error("Ingresa un email válido, por ejemplo nombre@empresa.com.");
  return email;
}

export async function loadClient(clientId: string) {
  return unwrap(await db.from("clients").select("*").eq("id", clientId).single());
}

export async function currentClientEmail(clientId: string) {
  const client = await loadClient(clientId);
  return typeof client.email === "string" && client.email.trim() ? client.email.trim() : null;
}
