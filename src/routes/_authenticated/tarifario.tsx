import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import type { Enums } from "@/types/db";
import { SECTIONS, sectionHead } from "@/components/section";
import { canManageCatalog, useCurrentUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PRICING_UNIT_LABELS, SERVICE_TYPES, STATUSES, StatusBadge, cap } from "@/components/catalog/shared";
import { ServiceDetail } from "@/components/catalog/service-detail";
import { Checkbox } from "@/components/ui/checkbox";
import { useCatalogSelection } from "@/components/catalog/catalog-selection";
import { BulkStatusBar } from "@/components/catalog/bulk-status-bar";
import { CreateServiceDialog } from "@/components/catalog/create-service";
import {
  ChangeRequestsPanel, PendingServicesPanel, useChangeRequests, usePendingServices,
} from "@/components/catalog/review-panels";

const s = SECTIONS.tarifario;
const PAGE = 25;
const ALL = "all";

export const Route = createFileRoute("/_authenticated/tarifario")({
  head: () => sectionHead(s),
  component: TarifarioPage,
});

export function useSuppliersList() {
  return useQuery({
    queryKey: ["suppliers", "list"],
    queryFn: async () => {
      const { data, error } = await db.from("suppliers").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });
}

function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

function TarifarioPage() {
  const { role } = useCurrentUser();
  const manager = canManageCatalog(role);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const suppliers = useSuppliersList();
  const requests = useChangeRequests();
  const pending = usePendingServices();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{s.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Servicios, tarifas por temporada y tramos de pasajeros.</p>
        </div>
        <Button onClick={() => setCreating(true)} className="bg-brand-orange text-brand-navy hover:bg-brand-orange-deep hover:text-white">
          <Plus className="mr-1 h-4 w-4" />Nuevo servicio
        </Button>
      </div>

      {manager ? (
        <Tabs defaultValue="servicios">
          <TabsList>
            <TabsTrigger value="servicios">Servicios</TabsTrigger>
            <TabsTrigger value="sugerencias">
              Sugerencias {!!requests.data?.length && <Badge className="ml-2 h-5 px-1.5">{requests.data.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="pendientes">
              Pendientes {!!pending.data?.length && <Badge className="ml-2 h-5 px-1.5">{pending.data.length}</Badge>}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="servicios" className="mt-4"><ServicesTable suppliers={suppliers.data ?? []} onOpen={setOpenId} /></TabsContent>
          <TabsContent value="sugerencias" className="mt-4"><ChangeRequestsPanel onOpenService={setOpenId} /></TabsContent>
          <TabsContent value="pendientes" className="mt-4"><PendingServicesPanel onOpenService={setOpenId} /></TabsContent>
        </Tabs>
      ) : (
        <ServicesTable suppliers={suppliers.data ?? []} onOpen={setOpenId} />
      )}

      <ServiceDetail serviceId={openId} onClose={() => setOpenId(null)} />
      <CreateServiceDialog open={creating} onOpenChange={setCreating} suppliers={suppliers.data ?? []} onCreated={setOpenId} />
    </div>
  );
}

function ServicesTable({ suppliers, onOpen }: { suppliers: { id: string; name: string }[]; onOpen: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState(ALL);
  const [country, setCountry] = useState(ALL);
  const [supplier, setSupplier] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(0);
  const term = useDebounced(search.trim());
  const { role } = useCurrentUser();
  const manager = canManageCatalog(role);
  const filterKey = JSON.stringify({ search, term, type, country, supplier, status });
  const selection = useCatalogSelection(["services"], filterKey, manager, async (offset, end) => {
    let query = db.from("services").select("id, sku, name").order("sku").order("id").range(offset, end);
    if (term) { const t = term.replace(/[%,()]/g, " "); query = query.or(`sku.ilike.%${t}%,name.ilike.%${t}%`); }
    if (type !== ALL) query = query.eq("type", type as Enums<"service_type">);
    if (country !== ALL) query = query.eq("country", country);
    if (supplier !== ALL) query = supplier === "none" ? query.is("supplier_id", null) : query.eq("supplier_id", supplier);
    if (status !== ALL) query = query.eq("status", status as Enums<"catalog_status">);
    const { data, error } = await query;
    if (error) throw error;
    return data.map((r) => ({ id: r.id, code: r.sku, name: r.name }));
  });
  const cols = manager ? 10 : 9;

  useEffect(() => setPage(0), [term, type, country, supplier, status]);

  const countries = useQuery({
    queryKey: ["services", "countries"],
    queryFn: async () => {
      const { data, error } = await db.from("services").select("country").not("country", "is", null).limit(5000);
      if (error) throw error;
      return [...new Set(data.map((r) => r.country as string))].sort();
    },
  });

  const q = useQuery({
    queryKey: ["services", "page", { term, type, country, supplier, status, page }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = db
        .from("services")
        .select("id, sku, name, type, country, currency, pricing_unit, status, suppliers(name), service_rates(count)", { count: "exact" })
        .order("sku")
        .range(page * PAGE, page * PAGE + PAGE - 1);
      if (term) {
        const t = term.replace(/[%,()]/g, " ");
        query = query.or(`sku.ilike.%${t}%,name.ilike.%${t}%`);
      }
      if (type !== ALL) query = query.eq("type", type as Enums<"service_type">);
      if (country !== ALL) query = query.eq("country", country);
      if (supplier !== ALL) query = supplier === "none" ? query.is("supplier_id", null) : query.eq("supplier_id", supplier);
      if (status !== ALL) query = query.eq("status", status as Enums<"catalog_status">);
      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data, count: count ?? 0 };
    },
  });

  const total = q.data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por SKU o nombre…" className="pl-8" />
        </div>
        <Filter value={type} onChange={setType} placeholder="Tipo" options={SERVICE_TYPES.map((t) => [t, cap(t)])} />
        <Filter value={country} onChange={setCountry} placeholder="País" options={(countries.data ?? []).map((c) => [c, c])} />
        <Filter value={supplier} onChange={setSupplier} placeholder="Proveedor" wide
          options={[["none", "Sin proveedor"], ...suppliers.map((x) => [x.id, x.name] as [string, string])]} />
        <Filter value={status} onChange={setStatus} placeholder="Estado" options={STATUSES.map((x) => [x, cap(x)])} />
      </div>

      {manager && <BulkStatusBar kind="services" selection={selection} invalidate={["services"]} />}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {manager && <TableHead className="w-10" />}
              <TableHead>SKU</TableHead><TableHead>Nombre</TableHead><TableHead>Tipo</TableHead>
              <TableHead>Proveedor</TableHead><TableHead>País</TableHead><TableHead>Unidad</TableHead>
              <TableHead>Moneda</TableHead><TableHead className="text-right">Tarifas</TableHead><TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && <TableRow><TableCell colSpan={cols} className="py-10 text-center text-muted-foreground">Cargando…</TableCell></TableRow>}
            {q.isError && <TableRow><TableCell colSpan={cols} className="py-10 text-center text-destructive">No se pudo cargar el tarifario.</TableCell></TableRow>}
            {q.data && q.data.rows.length === 0 && (
              <TableRow><TableCell colSpan={cols} className="py-10 text-center text-muted-foreground">No hay servicios con estos filtros.</TableCell></TableRow>
            )}
            {q.data?.rows.map((r) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => onOpen(r.id)}>
                {manager && <TableCell onClick={(e) => e.stopPropagation()}><Checkbox aria-label={`Seleccionar ${r.sku}`} checked={selection.ids.has(r.id)} disabled={!selection.ready} onCheckedChange={(v) => selection.toggle(r.id, v === true)} /></TableCell>}
                <TableCell className="max-w-[220px] truncate font-mono text-xs">{r.sku}</TableCell>
                <TableCell className="max-w-[280px] truncate font-medium text-foreground">{r.name}</TableCell>
                <TableCell>{cap(r.type)}</TableCell>
                <TableCell className="max-w-[180px] truncate">{r.suppliers?.name ?? "—"}</TableCell>
                <TableCell>{r.country ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{r.pricing_unit ? PRICING_UNIT_LABELS[r.pricing_unit] : "—"}</TableCell>
                <TableCell>{r.currency ?? "—"}</TableCell>
                <TableCell className="text-right">{(r.service_rates as unknown as { count: number }[])[0]?.count ?? 0}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total.toLocaleString("es-CL")} servicios</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span>Página {page + 1} de {pages}</span>
          <Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}

function Filter({ value, onChange, placeholder, options, wide }: {
  value: string; onChange: (v: string) => void; placeholder: string; options: [string, string][]; wide?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={wide ? "w-[200px]" : "w-[150px]"}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}: todos</SelectItem>
        {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
