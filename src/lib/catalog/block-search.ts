import type { SupabaseClient } from "@supabase/supabase-js";
import { db } from "../db";

const PAGE_SIZE = 500;
const IN_CHUNK = 100;

type QueryResult<T> = PromiseLike<{
  data: T[] | null;
  error: { message?: string } | null;
}>;

type BlockFilterQuery<T> = QueryResult<T> & {
  eq: (column: string, value: unknown) => BlockFilterQuery<T>;
  neq: (column: string, value: unknown) => BlockFilterQuery<T>;
  contains: (column: string, value: unknown[]) => BlockFilterQuery<T>;
  is: (column: string, value: unknown) => BlockFilterQuery<T>;
};

export interface BlockSearchFilters {
  from?: string;
  to?: string;
  place?: string;
  hotel?: string;
  status?: string;
  excludeInactive?: boolean;
}

export interface BlockSearchMatch {
  id: string;
  code: string;
}

const client = db as unknown as SupabaseClient;

export const cleanBlockSearchTerm = (term: string) => term.trim().replace(/[%,()]/g, " ");

async function readAll<T>(page: (from: number, to: number) => QueryResult<T>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const current = data ?? [];
    rows.push(...current);
    if (current.length < PAGE_SIZE) return rows;
  }
}

function applyFilters<T>(query: unknown, filters: BlockSearchFilters): BlockFilterQuery<T> {
  let filtered = query as BlockFilterQuery<T>;
  if (filters.from) filtered = filtered.eq("route_from", filters.from);
  if (filters.to) filtered = filtered.eq("route_to", filters.to);
  if (filters.place) filtered = filtered.contains("places", [filters.place]);
  if (filters.hotel)
    filtered =
      filters.hotel === "none"
        ? filtered.is("hotel_service_id", null)
        : filtered.eq("hotel_service_id", filters.hotel);
  if (filters.status) filtered = filtered.eq("status", filters.status);
  if (filters.excludeInactive) filtered = filtered.neq("status", "inactivo");
  return filtered;
}

function chunks<T>(values: T[], size = IN_CHUNK) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size)
    result.push(values.slice(index, index + size));
  return result;
}

/**
 * Finds only matching IDs on the server and then reapplies the library filters.
 * Each source is paged, so title/route/place matches are not truncated by the
 * former 30/500 row UI limits. The final list is unique and stable.
 */
export async function searchDayBlockIds(
  rawTerm: string,
  filters: BlockSearchFilters = {},
): Promise<BlockSearchMatch[]> {
  const term = cleanBlockSearchTerm(rawTerm);
  if (!term) return [];
  const pattern = `%${term}%`;
  const scores = new Map<string, number>();
  const remember = (id: string, score: number) =>
    scores.set(id, Math.min(scores.get(id) ?? Number.POSITIVE_INFINITY, score));

  const [blocks, titles, locations, matchedPlaces] = await Promise.all([
    readAll<{ id: string; code: string; name: string | null }>((from, to) =>
      client
        .from("day_blocks")
        .select("id,code,name")
        .or(`code.ilike.${pattern},name.ilike.${pattern}`)
        .order("id")
        .range(from, to),
    ),
    readAll<{ block_id: string; title: string; lang: string }>((from, to) =>
      client
        .from("day_block_translations")
        .select("block_id,title,lang")
        .ilike("title", pattern)
        .order("block_id")
        .order("lang")
        .range(from, to),
    ),
    readAll<{ code: string; name: string }>((from, to) =>
      client
        .from("location_codes")
        .select("code,name")
        .or(`code.ilike.${pattern},name.ilike.${pattern}`)
        .order("code")
        .range(from, to),
    ),
    readAll<{ name: string; slug: string }>((from, to) =>
      client
        .from("places")
        .select("name,slug")
        .or(`name.ilike.${pattern},slug.ilike.${pattern}`)
        .order("slug")
        .range(from, to),
    ),
  ]);

  const folded = term.toLocaleLowerCase();
  for (const row of blocks) {
    const code = row.code.toLocaleLowerCase();
    const name = row.name?.toLocaleLowerCase() ?? "";
    remember(
      row.id,
      code === folded
        ? 0
        : code.startsWith(folded)
          ? 1
          : code.includes(folded)
            ? 2
            : name.startsWith(folded)
              ? 3
              : 4,
    );
  }
  for (const row of titles)
    remember(
      row.block_id,
      row.lang === "es" ? (row.title.toLocaleLowerCase().startsWith(folded) ? 3 : 4) : 5,
    );

  const routes = [...new Set(locations.map((row) => row.code))];
  const places = [...new Set(matchedPlaces.flatMap((row) => [row.slug, row.name]))];
  const [routeFrom, routeTo, relatedPlaces] = await Promise.all([
    routes.length
      ? readAll<{ id: string }>((from, to) =>
          client
            .from("day_blocks")
            .select("id")
            .in("route_from", routes)
            .order("id")
            .range(from, to),
        )
      : [],
    routes.length
      ? readAll<{ id: string }>((from, to) =>
          client.from("day_blocks").select("id").in("route_to", routes).order("id").range(from, to),
        )
      : [],
    places.length
      ? readAll<{ id: string }>((from, to) =>
          client
            .from("day_blocks")
            .select("id")
            .overlaps("places", places)
            .order("id")
            .range(from, to),
        )
      : [],
  ]);
  for (const row of [...routeFrom, ...routeTo]) remember(row.id, 6);
  for (const row of relatedPlaces) remember(row.id, 5);

  const ids = [...scores.keys()];
  if (!ids.length) return [];
  const matching = (
    await Promise.all(
      chunks(ids).map(async (part) => {
        const { data, error } = await applyFilters(
          client.from("day_blocks").select("id,code").in("id", part),
          filters,
        );
        if (error) throw error;
        return (data ?? []) as BlockSearchMatch[];
      }),
    )
  ).flat();
  return matching.sort(
    (a, b) =>
      (scores.get(a.id) ?? 99) - (scores.get(b.id) ?? 99) ||
      a.code.localeCompare(b.code) ||
      a.id.localeCompare(b.id),
  );
}

export async function fetchBlockRowsByIds<T>(ids: string[], select: string): Promise<T[]> {
  if (!ids.length) return [];
  const rows = (
    await Promise.all(
      chunks(ids).map(async (part) => {
        const { data, error } = await client.from("day_blocks").select(select).in("id", part);
        if (error) throw error;
        return (data ?? []) as T[];
      }),
    )
  ).flat();
  const order = new Map(ids.map((id, index) => [id, index]));
  return rows.sort(
    (a, b) =>
      (order.get((a as { id: string }).id) ?? Number.MAX_SAFE_INTEGER) -
      (order.get((b as { id: string }).id) ?? Number.MAX_SAFE_INTEGER),
  );
}

export async function fetchUnsearchedBlockPage<T>(
  select: string,
  filters: BlockSearchFilters,
  from: number,
  to: number,
): Promise<T[]> {
  const { data, error } = await applyFilters(
    client.from("day_blocks").select(select).order("code").order("id").range(from, to),
    filters,
  );
  if (error) throw error;
  return (data ?? []) as T[];
}
