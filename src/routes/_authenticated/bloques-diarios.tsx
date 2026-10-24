import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { listHotels } from "@/lib/catalog/hotels";
import type { Enums } from "@/types/db";
import { SECTIONS, sectionHead } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STATUSES, StatusBadge, cap } from "@/components/catalog/shared";
import { ALL, Filter, PageHeader, blockTitle, ilikeTerm, primaryBtn, useDebounced, useLocationCodes } from "@/components/catalog/kit";
import { canManageCatalog, useCurrentUser } from "@/hooks/use-auth";
import { Checkbox } from "@/components/ui/checkbox";
import { CatalogRowMenu, CatalogSelectionBar, useCatalogActions } from "@/components/catalog/catalog-actions";
import { useCatalogSelection } from "@/components/catalog/catalog-selection";
import { BlockEditor } from "@/components/catalog/block-editor";

const s = SECTIONS["bloques-diarios"];

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
    queryFn: async () => (await listHotels()).map(h => [h.id, h.label] as [string, string]),
  });

  const filterKey = JSON.stringify({ search, term, from, to, place, placeTerm, hotel, status });
  const actions = useCatalogActions("day_blocks", () => selection.clear());
  const selection = useCatalogSelection(["day_blocks"], filterKey, canManageCatalog(role), async (offset, end) => {
    let query = db.from("day_blocks").select("id, code, name").order("code").order("id").range(offset, end);
      if (term) query = query.ilike("code", `%${ilikeTerm(term)}%`);
      if (from !== ALL) query = query.eq("route_from", from);
      if (to !== ALL) query = query.eq("route_to", to);
      if (placeTerm) query = query.contains("places", [placeTerm]);
      if (hotel !== ALL) query = hotel === "none" ? query.is("hotel_id", null) : query.eq("hotel_id", hotel);
      if (status !== ALL) query = query.eq("status", status as Enums<"catalog_status">);
    const { data, error } = await query;
    if (error) throw error;
    return data.map((r) => ({ id: r.id, code: r.code, name: r.name ?? r.code }));
  });
  const q = useQuery({
    queryKey: ["day_blocks", { term, from, to, placeTerm, hotel, status }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = db.from("day_blocks")
        .select("id, code, route_from, route_to, places, modality, default_day_position, status, hotel_id, suppliers(name), day_block_translations(lang, title), day_block_modules(count), day_block_items(count)")
        .order("code").order("id").limit(500);
      if (term) query = query.ilike("code", `%${ilikeTerm(term)}%`);
      if (from !== ALL) query = query.eq("route_from", from);
      if (to !== ALL) query = query.eq("route_to", to);
      if (placeTerm) query = query.contains("places", [placeTerm]);
      if (hotel !== ALL) query = hotel === "none" ? query.is("hotel_id", null) : query.eq("hotel_id", hotel);
      if (status !== ALL) query = query.eq("status", status as Enums<"catalog_status">);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
  const locOpts = (locs.data ?? []).map((l) => [l.code, `${l.code} · ${l.name}`] as [string, string]);
  const count = (v: unknown) => (v as { count: number }[])[0]?.count ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title={s.title} subtitle="Cada bloque es un día de itinerario. Un mismo día con otro hotel es otro bloque."
        action={<Button className={primaryBtn} onClick={() => setOpenId("new")}><Plus className="mr-1 h-4 w-4" />Nuevo bloque</Button>} />
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código…" className="pl-8" />
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
            {q.isLoading && <TableRow><TableCell colSpan={actions.allowed ? 11 : 9} className="py-10 text-center text-muted-foreground">Cargando…</TableCell></TableRow>}
            {q.isError && <TableRow><TableCell colSpan={actions.allowed ? 11 : 9} className="py-10 text-center text-destructive">No se pudieron cargar los bloques.</TableCell></TableRow>}
            {q.data?.length === 0 && <TableRow><TableCell colSpan={actions.allowed ? 11 : 9} className="py-10 text-center text-muted-foreground">No hay bloques con estos filtros.</TableCell></TableRow>}
            {q.data?.map((b) => (
              <TableRow key={b.id} className="cursor-pointer" onClick={() => setOpenId(b.id)}>
                {actions.allowed && <TableCell onClick={(e) => e.stopPropagation()}><Checkbox aria-label={`Seleccionar ${b.code}`} checked={selection.ids.has(b.id)} disabled={!selection.ready || actions.busy} onCheckedChange={(v) => selection.toggle(b.id, v === true)} /></TableCell>}
                <TableCell className="max-w-[200px] truncate font-mono text-xs">{b.code}</TableCell>
                <TableCell className="max-w-[260px] truncate font-medium text-foreground">{blockTitle(b)}</TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs">{b.route_from ?? "—"} → {b.route_to ?? "—"}</TableCell>
                <TableCell className="max-w-[200px] truncate text-xs">{b.places.join(", ") || "—"}</TableCell>
                <TableCell className="max-w-[180px] truncate">{hotels.data?.find(h => h[0] === b.hotel_id)?.[1] ?? b.suppliers?.name ?? "Sin hotel"}</TableCell>
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
      {actions.dialog}
      <BlockEditor id={openId} onClose={() => setOpenId(null)} onCreated={setOpenId} />
    </div>
  );
}
