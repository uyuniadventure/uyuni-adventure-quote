import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { SECTIONS, sectionHead } from "@/components/section";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, cap } from "@/components/catalog/shared";
import { ServiceDetail } from "@/components/catalog/service-detail";

const s = SECTIONS.proveedores;

export const Route = createFileRoute("/_authenticated/proveedores")({
  head: () => sectionHead(s),
  component: ProveedoresPage,
});

function ProveedoresPage() {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["suppliers", "full"],
    queryFn: async () => {
      const { data, error } = await db.from("suppliers").select("*, services(count)").order("name");
      if (error) throw error;
      return data;
    },
  });

  const term = search.trim().toLowerCase();
  const rows = (q.data ?? []).filter(
    (p) => !term || p.name.toLowerCase().includes(term) || p.aliases.some((a) => a.toLowerCase().includes(term)),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{s.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Hoteles, transportistas y operadores con sus servicios del tarifario.</p>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar proveedor…" className="pl-8" />
      </div>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead><TableHead>País</TableHead><TableHead>Tipo</TableHead>
              <TableHead>Contacto</TableHead><TableHead className="text-right">Servicios</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Cargando…</TableCell></TableRow>}
            {q.data && rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No hay proveedores.</TableCell></TableRow>}
            {rows.map((p) => (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => setOpenId(p.id)}>
                <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                <TableCell>{p.country ?? "—"}</TableCell>
                <TableCell>{p.service_type ? cap(p.service_type) : "—"}</TableCell>
                <TableCell className="max-w-[240px] truncate text-sm">{p.contact || p.email || p.phone || "—"}</TableCell>
                <TableCell className="text-right">{(p.services as unknown as { count: number }[])[0]?.count ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">{rows.length} proveedores</p>

      <SupplierSheet id={openId} onClose={() => setOpenId(null)} onOpenService={setServiceId} />
      <ServiceDetail serviceId={serviceId} onClose={() => setServiceId(null)} />
    </div>
  );
}

function SupplierSheet({ id, onClose, onOpenService }: { id: string | null; onClose: () => void; onOpenService: (id: string) => void }) {
  const q = useQuery({
    queryKey: ["supplier", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await db
        .from("suppliers")
        .select("*, services(id, sku, name, type, currency, status)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
  const p = q.data;
  const services = [...(p?.services ?? [])].sort((a, b) => a.sku.localeCompare(b.sku));

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {!p ? <p className="p-6 text-sm text-muted-foreground">Cargando…</p> : (
          <>
            <SheetHeader>
              <SheetTitle className="text-left">{p.name}</SheetTitle>
              <SheetDescription className="text-left">{[p.country, p.location].filter(Boolean).join(" · ") || "Sin ubicación"}</SheetDescription>
            </SheetHeader>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {([["Contacto", p.contact], ["Agente", p.agent], ["Correo", p.email], ["Teléfono", p.phone],
                ["Tipo", p.service_type ? cap(p.service_type) : null]] as const).map(([l, v]) => (
                <div key={l}><dt className="text-xs text-muted-foreground">{l}</dt><dd className="font-medium text-foreground">{v || "—"}</dd></div>
              ))}
            </dl>
            {p.aliases.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1">{p.aliases.map((a) => <Badge key={a} variant="secondary">{a}</Badge>)}</div>
            )}
            {p.notes && <p className="mt-4 text-sm text-muted-foreground">{p.notes}</p>}
            <h3 className="mt-8 text-sm font-semibold text-foreground">Servicios ({services.length})</h3>
            <div className="mt-3 rounded-md border border-border">
              <Table>
                <TableHeader><TableRow><TableHead>SKU</TableHead><TableHead>Nombre</TableHead><TableHead>Tipo</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                <TableBody>
                  {services.length === 0 && <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">Sin servicios visibles.</TableCell></TableRow>}
                  {services.map((x) => (
                    <TableRow key={x.id} className="cursor-pointer" onClick={() => onOpenService(x.id)}>
                      <TableCell className="font-mono text-xs">{x.sku}</TableCell>
                      <TableCell>{x.name}</TableCell>
                      <TableCell>{cap(x.type)}</TableCell>
                      <TableCell><StatusBadge status={x.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
