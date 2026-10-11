import { db } from "../db";
import type { Enums } from "@/types/db";

export const QUOTES_PAGE_SIZE = 25;
export const QUOTE_STATUSES: Record<Enums<"quote_status">, string> = {
  borrador: "Borrador",
  revisada: "Revisada",
  enviada: "Enviada",
  vendida: "Vendida",
  perdida: "Perdida",
};

export interface QuoteFilters {
  code: string;
  client: string;
  status: Enums<"quote_status"> | "all";
  page: number;
}

// These are literal substring searches, including SKUs containing underscores.
const pattern = (value: string) => `%${value.trim().replace(/[\\%_]/g, "\\$&")}%`;

export async function listQuotes(filters: QuoteFilters) {
  let query = db
    .from("quotes")
    .select(
      "id, code, client_type, start_date, pax_paying, tc_count, status, archived_at, total_price_usd, updated_at, clients!inner(name)",
      { count: "exact" },
    )
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .range(filters.page * QUOTES_PAGE_SIZE, (filters.page + 1) * QUOTES_PAGE_SIZE - 1);
  if (filters.code.trim()) query = query.ilike("code", pattern(filters.code));
  if (filters.client.trim()) query = query.ilike("clients.name", pattern(filters.client));
  if (filters.status !== "all") query = query.eq("status", filters.status);
  const { data, count, error } = await query;
  if (error) throw error;
  // RLS decides visibility; do not fetch all quotes and filter permissions in UI.
  return { rows: data ?? [], count: count ?? 0 };
}

export type QuoteListRow = Awaited<ReturnType<typeof listQuotes>>["rows"][number];
