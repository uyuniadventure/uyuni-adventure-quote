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
import { MODALITIES, STATUSES, StatusBadge, cap } from "@/components/catalog/shared";
import { ALL, DURATIONS, DURATION_LABELS, Filter, PageHeader, ilikeTerm, primaryBtn, useDebounced, usePlaces } from "@/components/catalog/kit";
import { ModuleEditor } from "@/components/catalog/module-editor";

const s = SECTIONS["modulos-actividad"];

export const Route = createFileRoute("/_authenticated/modulos-actividad")({
  head: () => sectionHead(s),
  component: ModulesPage,
});

function ModulesPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [place, setPlace] = useState(ALL);
  const [duration, setDuration] = useState(ALL);
  const [modality, setModality] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const term = useDebounced(search.trim());
  const places = usePlaces();

  const q = useQuery({
    queryKey: ["activity_modules", { term, place, duration, modality, status }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = db.from("activity_modules")
        .select("id, code, name, duration, default_time, modality, status, places(name), activity_module_items(count), activity_module_translations(lang)")
        .order("code").limit(500);
      if (term) query = query.or(`code.ilike.%${ilikeTerm(term)}%,name.ilike.%${ilikeTerm(term)}%`);
      if (place !== ALL) query = place === "none" ? query.is("place_id", null) : query.eq("place_id", place);
      if (duration !== ALL) query = query.eq("duration", duration as Enums<"activity_duration">);
      if (modality !== ALL) query = query.eq("modality", modality as Enums<"service_modality">);
      if (status !== ALL) query = query.eq("status", status as Enums<"catalog_status">);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title={s.title} subtitle="Actividades reutilizables: servicios del tarifario + textos para el cliente."
        action={<Button className={primaryBtn} onClick={() => setOpenId("new")}><Plus className="mr-1 h-4 w-4" />Nuevo módulo</Button>} />
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código o nombre…" className="pl-8" />
        </div>
        <Filter value={place} onChange={setPlace} placeholder="Lugar" wide options={[["none", "Sin lugar"], ...(places.data ?? []).map((p) => [p.id, p.name] as [string, string])]} />
        <Filter value={duration} onChange={setDuration} placeholder="Duración" options={DURATIONS.map((d) => [d, DURATION_LABELS[d]])} />
        <Filter value={modality} onChange={setModality} placeholder="Modalidad" options={MODALITIES.map((m) => [m, cap(m)])} />
        <Filter value={status} onChange={setStatus} placeholder="Estado" options={STATUSES.map((x) => [x, cap(x)])} />
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Código</TableHead><TableHead>Nombre</TableHead><TableHead>Lugar</TableHead><TableHead>Duración</TableHead>
            <TableHead>Hora</TableHead><TableHead>Modalidad</TableHead><TableHead className="text-right">Servicios</TableHead><TableHead>Idiomas</TableHead><TableHead>Estado</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {q.isLoading && <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Cargando…</TableCell></TableRow>}
            {q.isError && <TableRow><TableCell colSpan={9} className="py-10 text-center text-destructive">No se pudieron cargar los módulos.</TableCell></TableRow>}
            {q.data?.length === 0 && <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">No hay módulos con estos filtros.</TableCell></TableRow>}
            {q.data?.map((m) => (
              <TableRow key={m.id} className="cursor-pointer" onClick={() => setOpenId(m.id)}>
                <TableCell className="max-w-[220px] truncate font-mono text-xs">{m.code}</TableCell>
                <TableCell className="max-w-[260px] truncate font-medium text-foreground">{m.name}</TableCell>
                <TableCell>{m.places?.name ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{DURATION_LABELS[m.duration]}</TableCell>
                <TableCell>{m.default_time?.slice(0, 5) ?? "—"}</TableCell>
                <TableCell>{cap(m.modality)}</TableCell>
                <TableCell className="text-right">{(m.activity_module_items as unknown as { count: number }[])[0]?.count ?? 0}</TableCell>
                <TableCell className="text-xs uppercase">{m.activity_module_translations.map((t) => t.lang).sort().join(" · ") || "—"}</TableCell>
                <TableCell><StatusBadge status={m.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ModuleEditor id={openId} onClose={() => setOpenId(null)} onCreated={setOpenId} />
    </div>
  );
}
