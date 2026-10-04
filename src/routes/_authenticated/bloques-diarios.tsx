import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import type { Enums } from "@/types/db";
import { SECTIONS, sectionHead } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STATUSES, StatusBadge, cap } from "@/components/catalog/shared";
import { ALL, Filter, PageHeader, blockTitle, ilikeTerm, primaryBtn, useDebounced, useLocationCodes } from "@/components/catalog/kit";
import { BlockEditor } from "@/components/catalog/block-editor";

const s = SECTIONS["bloques-diarios"];

export const Route = createFileRoute("/_authenticated/bloques-diarios")({
  head: () => sectionHead(s),
  component: BlocksPage,
});

function BlocksPage() {
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

  const q = useQuery({
    queryKey: ["day_blocks", { term, from, to, placeTerm, hotel, status }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = db.from("day_blocks")
        .select("id, code, route_from, route_to, places, modality, default_day_position, status, services(name), day_block_translations(lang, title), day_block_modules(count), day_block_items(count)")
        .order("code").limit(500);
      if (term) query = query.ilike("code", `%${ilikeTerm(term)}%`);
      if (from !== ALL) query = query.eq("route_from", from);
      if (to !== ALL) query = query.eq("route_to", to);
      if (placeTerm) query = query.contains("places", [placeTerm]);
      if (hotel !== ALL) query = hotel === "none" ? query.is("hotel_service_id", null) : query.eq("hotel_service_id", hotel);
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
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Código</TableHead><TableHead>Título (ES)</TableHead><TableHead>Ruta</TableHead><TableHead>Lugares</TableHead>
            <TableHead>Hotel</TableHead><TableHead className="text-right">Día</TableHead><TableHead className="text-right">Mód.</TableHead><TableHead className="text-right">Serv.</TableHead><TableHead>Estado</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {q.isLoading && <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Cargando…</TableCell></TableRow>}
            {q.isError && <TableRow><TableCell colSpan={9} className="py-10 text-center text-destructive">No se pudieron cargar los bloques.</TableCell></TableRow>}
            {q.data?.length === 0 && <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">No hay bloques con estos filtros.</TableCell></TableRow>}
            {q.data?.map((b) => (
              <TableRow key={b.id} className="cursor-pointer" onClick={() => setOpenId(b.id)}>
                <TableCell className="max-w-[200px] truncate font-mono text-xs">{b.code}</TableCell>
                <TableCell className="max-w-[260px] truncate font-medium text-foreground">{blockTitle(b)}</TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs">{b.route_from ?? "—"} → {b.route_to ?? "—"}</TableCell>
                <TableCell className="max-w-[200px] truncate text-xs">{b.places.join(", ") || "—"}</TableCell>
                <TableCell className="max-w-[180px] truncate">{b.services?.name ?? "—"}</TableCell>
                <TableCell className="text-right">{b.default_day_position ?? "—"}</TableCell>
                <TableCell className="text-right">{count(b.day_block_modules)}</TableCell>
                <TableCell className="text-right">{count(b.day_block_items)}</TableCell>
                <TableCell><StatusBadge status={b.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <BlockEditor id={openId} onClose={() => setOpenId(null)} onCreated={setOpenId} />
    </div>
  );
}
