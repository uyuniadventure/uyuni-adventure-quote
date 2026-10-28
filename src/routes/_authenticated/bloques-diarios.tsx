import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import type { Enums } from "@/types/db";
import { SECTIONS, sectionHead } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STATUSES, StatusBadge, cap } from "@/components/catalog/shared";
import { ALL, Filter, PageHeader, blockTitle, primaryBtn, useDebounced, useLocationCodes } from "@/components/catalog/kit";
import { canManageCatalog, useCurrentUser } from "@/hooks/use-auth";
import { Checkbox } from "@/components/ui/checkbox";
import { CatalogRowMenu, CatalogSelectionBar, useCatalogActions } from "@/components/catalog/catalog-actions";
import { useCatalogSelection } from "@/components/catalog/catalog-selection";
import { BlockEditor } from "@/components/catalog/block-editor";
import { ScenarioDaysPanel } from "@/components/catalog/scenario-days-panel";
import {
  fetchBlockRowsByIds,
  fetchUnsearchedBlockPage,
  searchDayBlockIds,
  type BlockSearchFilters,
} from "@/lib/catalog/block-search";

const s = SECTIONS["bloques-diarios"];
const PAGE_SIZE = 100;
const BLOCK_SELECT = "id,code,route_from,route_to,places,modality,default_day_position,status,services(name),day_block_translations(lang,title),day_block_modules(count),day_block_items(count)";
type BlockRow = {
  id: string;
  code: string;
  route_from: string | null;
  route_to: string | null;
  places: string[];
  modality: Enums<"itinerary_modality">;
  default_day_position: number | null;
  status: Enums<"catalog_status">;
  services: { name: string } | null;
  day_block_translations: { lang: string; title: string }[] | null;
  day_block_modules: { count: number }[];
  day_block_items: { count: number }[];
};

export const Route = createFileRoute("/_authenticated/bloques-diarios")({
  head: () => sectionHead(s),
  component: BlocksPage,
});

function BlocksPage() {
  const { role } = useCurrentUser();
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState(ALL);
  const [to, setTo] = useState(ALL);
  const [place, setPlace] = useState("");
  const [hotel, setHotel] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const term = useDebounced(search.trim());
  const placeTerm = useDebounced(place.trim());
  const locs = useLocationCodes();

  const hotels = useQuery({
    queryKey: ["day_blocks", "hotels"],
    queryFn: async () => {
      const { data, error } = await db.from("day_blocks").select("services(id, name)").not("hotel_service_id", "is", null).limit(2000);
      if (error) throw error;
      const m = new Map<string, string>();
      data.forEach((r) => r.services && m.set(r.services.id, r.services.name));
      return [...m].sort((a, b) => a[1].localeCompare(b[1]));
    },
  });

  const filters: BlockSearchFilters = {
    ...(from !== ALL ? { from } : {}),
    ...(to !== ALL ? { to } : {}),
    ...(placeTerm ? { place: placeTerm } : {}),
    ...(hotel !== ALL ? { hotel } : {}),
    ...(status !== ALL ? { status } : {}),
  };
  const filterKey = JSON.stringify({ term, filters });
  const matches = useQuery({
    queryKey: ["day_blocks", "search-ids", term, filters],
    enabled: !!term,
    queryFn: () => searchDayBlockIds(term, filters),
  });
  const actions = useCatalogActions("day_blocks", () => selection.clear());
  const selection = useCatalogSelection(
    ["day_blocks"],
    filterKey,
    canManageCatalog(role) && (!term || matches.isSuccess),
    async (offset, end) => {
      const rows = term
        ? await fetchBlockRowsByIds<{ id: string; code: string; name: string | null }>(
            (matches.data ?? []).slice(offset, end + 1).map((match) => match.id),
            "id,code,name",
          )
        : await fetchUnsearchedBlockPage<{ id: string; code: string; name: string | null }>(
            "id,code,name",
            filters,
            offset,
            end,
          );
      return rows.map((row) => ({ id: row.id, code: row.code, name: row.name ?? row.code }));
    },
  );
  const q = useInfiniteQuery({
    queryKey: ["day_blocks", { term, from, to, placeTerm, hotel, status }],
    placeholderData: keepPreviousData,
    initialPageParam: 0,
    enabled: !term || matches.isSuccess,
    queryFn: async ({ pageParam }) => {
      if (term) {
        const ids = (matches.data ?? [])
          .slice(pageParam, pageParam + PAGE_SIZE)
          .map((match) => match.id);
        return fetchBlockRowsByIds<BlockRow>(ids, BLOCK_SELECT);
      }
      return fetchUnsearchedBlockPage<BlockRow>(
        BLOCK_SELECT,
        filters,
        pageParam,
        pageParam + PAGE_SIZE - 1,
      );
    },
    getNextPageParam: (last, pages) => {
      const next = pages.length * PAGE_SIZE;
      return term
        ? next < (matches.data?.length ?? 0)
          ? next
          : undefined
        : last.length === PAGE_SIZE
          ? next
          : undefined;
    },
  });
  const rows = q.data?.pages.flat() ?? [];
  const queryError = matches.error ?? q.error;
  const locOpts = (locs.data ?? []).map((l) => [l.code, `${l.code} · ${l.name}`] as [string, string]);
  const count = (v: unknown) => (v as { count: number }[])[0]?.count ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title={s.title} subtitle="Cada bloque es un día de itinerario. Un mismo día con otro hotel es otro bloque."
        action={<Button className={primaryBtn} onClick={() => setOpenId("new")}><Plus className="mr-1 h-4 w-4" />Nuevo bloque</Button>} />
      <ScenarioDaysPanel />
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código, título, lugar o ruta…" className="pl-8" />
        </div>
        <Filter value={from} onChange={setFrom} placeholder="Desde" options={locOpts} />
        <Filter value={to} onChange={setTo} placeholder="Hasta" options={locOpts} />
        <Input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Lugar exacto…" className="w-[170px]" />
        <Filter value={hotel} onChange={setHotel} placeholder="Hotel" wide options={[["none", "Sin hotel"], ...(hotels.data ?? [])]} />
        <Filter value={status} onChange={setStatus} placeholder="Estado" options={STATUSES.map((x) => [x, cap(x)])} />
      </div>
      {actions.allowed && <label className="flex items-center gap-2 text-sm"><Checkbox aria-label="Seleccionar todo" checked={selection.all ? true : selection.records.length ? "indeterminate" : false} disabled={!selection.ready || actions.busy} onCheckedChange={(v) => selection.selectAll(v === true)} />Seleccionar todo ({selection.loading ? "…" : selection.records.length})</label>}
      {selection.error && <p role="alert" className="text-sm text-destructive">No se pudo cargar la selección completa. Vuelve a intentar.</p>}
      <CatalogSelectionBar records={selection.records} actions={actions} disabled={!selection.ready} />
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader><TableRow>
            {actions.allowed && <TableHead className="w-10" />}
            <TableHead>Código</TableHead><TableHead>Título (ES)</TableHead><TableHead>Ruta</TableHead><TableHead>Lugares</TableHead>
            <TableHead>Hotel</TableHead><TableHead className="text-right">Día</TableHead><TableHead className="text-right">Mód.</TableHead><TableHead className="text-right">Serv.</TableHead><TableHead>Estado</TableHead>{actions.allowed && <TableHead />}
          </TableRow></TableHeader>
          <TableBody>
            {(matches.isLoading || q.isLoading) && <TableRow><TableCell colSpan={actions.allowed ? 11 : 9} className="py-10 text-center text-muted-foreground">Cargando…</TableCell></TableRow>}
            {queryError && <TableRow><TableCell colSpan={actions.allowed ? 11 : 9} className="space-y-2 py-10 text-center text-destructive"><p>No se pudieron cargar los bloques.</p><Button size="sm" variant="outline" onClick={() => { if (matches.error) void matches.refetch(); else void q.refetch(); }}>Reintentar</Button></TableCell></TableRow>}
            {!queryError && !q.isLoading && rows.length === 0 && <TableRow><TableCell colSpan={actions.allowed ? 11 : 9} className="py-10 text-center text-muted-foreground">No hay bloques con estos filtros.</TableCell></TableRow>}
            {rows.map((b) => (
              <TableRow key={b.id} className="cursor-pointer" onClick={() => setOpenId(b.id)}>
                {actions.allowed && <TableCell onClick={(e) => e.stopPropagation()}><Checkbox aria-label={`Seleccionar ${b.code}`} checked={selection.ids.has(b.id)} disabled={!selection.ready || actions.busy} onCheckedChange={(v) => selection.toggle(b.id, v === true)} /></TableCell>}
                <TableCell className="max-w-[200px] truncate font-mono text-xs">{b.code}</TableCell>
                <TableCell className="max-w-[260px] truncate font-medium text-foreground">{blockTitle(b)}</TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs">{b.route_from ?? "—"} → {b.route_to ?? "—"}</TableCell>
                <TableCell className="max-w-[200px] truncate text-xs">{b.places.join(", ") || "—"}</TableCell>
                <TableCell className="max-w-[180px] truncate">{b.services?.name ?? "—"}</TableCell>
                <TableCell className="text-right">{b.default_day_position ?? "—"}</TableCell>
                <TableCell className="text-right">{count(b.day_block_modules)}</TableCell>
                <TableCell className="text-right">{count(b.day_block_items)}</TableCell>
                <TableCell><StatusBadge status={b.status} /></TableCell>
                {actions.allowed && <TableCell><CatalogRowMenu record={{ id: b.id, code: b.code, name: blockTitle(b) }} actions={actions} /></TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {q.hasNextPage && (
        <div className="flex justify-center">
          <Button variant="outline" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
            {q.isFetchingNextPage ? "Cargando…" : "Cargar más"}
          </Button>
        </div>
      )}
      {actions.dialog}
      <BlockEditor id={openId} onClose={() => setOpenId(null)} onCreated={setOpenId} />
    </div>
  );
}
