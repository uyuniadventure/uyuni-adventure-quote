export function quoteRecipient(inputRecipient: unknown, clientEmail: unknown) {
  const value = typeof inputRecipient === "string" ? inputRecipient : clientEmail;
  if (typeof value !== "string") return null;
  const email = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
