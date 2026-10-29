import type { SupabaseClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { dateForDay } from "@/lib/pricing";
import { fetchBlockRowsByIds, fetchUnsearchedBlockPage, searchDayBlockIds } from "@/lib/catalog/block-search";
import { resolveSuggestionRoute } from "./suggestion-route";
import type { Enums, Tables } from "@/types/db";

const PAGE_SIZE = 50;
const client = db as unknown as SupabaseClient;
const clean = (value: string) => value.trim().replace(/[%,()]/g, " ");

export interface QuoteBlockFilters { place: string; from: string; to: string }
export interface QuoteServiceFilters { supplier: string; location: string; type: Enums<"service_type"> | "all" }

type BlockRow = { id: string; code: string; route_from: string | null; route_to: string | null; day_block_translations: { lang: string; title: string }[] | null };
type TemplateRouteRow = { id: string; sku: string; route_from: string | null; route_to: string | null };
type TemplateDayRouteRow = { block_id: string; template_id: string };

export function blockTourRouteMap(
  templates: TemplateRouteRow[],
  days: TemplateDayRouteRow[],
  locationCodes: string[],
) {
  const resolved = new Map(templates.flatMap((template) => {
    const route = resolveSuggestionRoute(template, locationCodes);
    return route ? [[template.id, route] as const] : [];
  }));
  const routes = new Map<string, string[]>();
  for (const day of days) {
    const route = resolved.get(day.template_id);
    if (!route) continue;
    const label = `${route.route_from} → ${route.route_to}`;
    const current = routes.get(day.block_id) ?? [];
    if (!current.includes(label)) routes.set(day.block_id, [...current, label]);
  }
  return routes;
}

export function blocksMatchingTourRoute(routes: Map<string, string[]>, fromFilter: string, toFilter: string) {
  const wantedFrom = fromFilter.trim().toUpperCase();
  const wantedTo = toFilter.trim().toUpperCase();
  return [...routes.entries()].filter(([, candidates]) => candidates.some((route) => {
    const [from, to] = route.split(" → ");
    return (!wantedFrom || from === wantedFrom) && (!wantedTo || to === wantedTo);
  })).map(([id]) => id);
}

type PageResult<T> = PromiseLike<{ data: T[] | null; error: { message?: string } | null }>;
async function readAll<T>(page: (from: number, to: number) => PageResult<T>) {
  const rows: T[] = [];
  for (let from = 0; ; from += 500) {
    const result = await page(from, from + 499);
    if (result.error) throw result.error;
    const current = result.data ?? [];
    rows.push(...current);
    if (current.length < 500) return rows;
  }
}

async function readTourRoutes() {
  const [locations, templates, days] = await Promise.all([
    readAll<{ code: string }>((from, to) => client.from("location_codes").select("code").order("code").range(from, to)),
    readAll<TemplateRouteRow>((from, to) => client.from("itinerary_templates").select("id,sku,route_from,route_to").neq("status", "inactivo").order("id").range(from, to)),
    readAll<TemplateDayRouteRow>((from, to) => client.from("template_days").select("block_id,template_id").not("block_id", "is", null).order("id").range(from, to)),
  ]);
  return blockTourRouteMap(templates, days, locations.map((row) => row.code));
}

const blockOption = (row: BlockRow, tourRoutes: string[]) => ({
  id: row.id,
  label: (row.day_block_translations?.find((translation) => translation.lang === "es") ?? row.day_block_translations?.[0])?.title || row.code,
  sub: `${row.code} · ${tourRoutes.length ? `Tour ${tourRoutes.join(", ")}` : "Recorrido del tour no identificado"}`,
});

export async function searchQuoteBlocks(term: string, filters: QuoteBlockFilters, page: number) {
  const routeFilters = { excludeInactive: true };
  const terms = [clean(term), clean(filters.place)].filter(Boolean);
  let ids: string[] | null = null;
  for (const value of terms) {
    const found = (await searchDayBlockIds(value, routeFilters)).map((row) => row.id);
    ids = ids === null ? found : ids.filter((id) => found.includes(id));
  }
  const tourRoutes = await readTourRoutes();
  if (filters.from || filters.to) {
    const routedIds = blocksMatchingTourRoute(tourRoutes, filters.from, filters.to);
    ids = ids === null ? routedIds : ids.filter((id) => routedIds.includes(id));
  }
  const from = page * PAGE_SIZE;
  const rows = ids === null
    ? await fetchUnsearchedBlockPage<BlockRow>("id,code,route_from,route_to,day_block_translations(lang,title)", routeFilters, from, from + PAGE_SIZE)
    : await fetchBlockRowsByIds<BlockRow>(ids.slice(from, from + PAGE_SIZE + 1), "id,code,route_from,route_to,day_block_translations(lang,title)");
  return { options: rows.slice(0, PAGE_SIZE).map((row) => blockOption(row, tourRoutes.get(row.id) ?? [])), hasMore: rows.length > PAGE_SIZE };
}

type ServiceRow = Pick<Tables<"services">, "id" | "sku" | "name" | "location" | "type" | "pricing_unit"> & {
  suppliers: { name: string } | null;
  service_rates: Pick<Tables<"service_rates">, "season" | "rate_year" | "valid_from" | "valid_to" | "pax_min" | "pax_max" | "pricing_enabled">[];
};

function applicable(row: ServiceRow, date: string, pax: number) {
  return row.service_rates.some((rate) => rate.pricing_enabled !== false &&
    (rate.rate_year == null || rate.rate_year === Number(date.slice(0, 4))) &&
    (!rate.valid_from || rate.valid_from <= date) && (!rate.valid_to || rate.valid_to >= date) &&
    (rate.pax_min == null || pax >= rate.pax_min) && (rate.pax_max == null || pax <= rate.pax_max));
}

export async function searchQuoteServices(term: string, filters: QuoteServiceFilters, page: number, startDate: string, dayNumber: number, pax: number) {
  const supplier = clean(filters.supplier);
  let supplierIds: string[] | undefined;
  if (supplier) {
    const result = await client.from("suppliers").select("id").ilike("name", `%${supplier}%`);
    if (result.error) throw result.error;
    supplierIds = (result.data ?? []).map((row) => row.id);
    if (!supplierIds.length) return { options: [], hasMore: false };
  }
  const from = page * PAGE_SIZE;
  let query = client.from("services")
    .select("id,sku,name,location,type,pricing_unit,suppliers(name),service_rates(season,rate_year,valid_from,valid_to,pax_min,pax_max,pricing_enabled)")
    .neq("status", "inactivo").order("sku").order("id").range(from, from + PAGE_SIZE);
  const text = clean(term);
  if (text) query = query.or(`sku.ilike.%${text}%,name.ilike.%${text}%`);
  if (supplierIds) query = query.in("supplier_id", supplierIds);
  if (filters.location.trim()) query = query.ilike("location", `%${clean(filters.location)}%`);
  if (filters.type !== "all") query = query.eq("type", filters.type);
  const result = await query;
  if (result.error) throw result.error;
  const rows = (result.data ?? []) as unknown as ServiceRow[];
  const date = dateForDay(startDate, dayNumber);
  return {
    options: rows.slice(0, PAGE_SIZE).map((row) => ({
      id: row.id,
      label: row.name,
      sub: [row.sku, row.suppliers?.name, row.location, row.type, row.pricing_unit, applicable(row, date, pax) ? "Tarifa aplicable" : "Sin tarifa aplicable"].filter(Boolean).join(" · "),
    })),
    hasMore: rows.length > PAGE_SIZE,
  };
}
