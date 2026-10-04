import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SECTIONS, sectionHead } from "@/components/section";
import { db } from "@/lib/db";
import type { Enums } from "@/types/db";
import { ALL, Field, Filter, PageHeader } from "@/components/catalog/kit";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ServiceSheet, PayDialog } from "@/components/ops/service-sheet";
import { BOOKING_STATUS, OPS_STATUS, PAYABLE_STATUS, fmtDate, today, usd } from "@/components/ops/shared";
import { canManageCatalog, useCurrentUser } from "@/hooks/use-auth";

const s = SECTIONS.operacion;

export const Route = createFileRoute("/_authenticated/operacion")({
  head: () => sectionHead(s),
  component: OpsPage,
});

function OpsPage() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      <PageHeader title="Operación" subtitle="Servicios vendidos, reservas de alojamiento y pagos a proveedores." />
      <Tabs defaultValue="servicios">
        <TabsList>
          <TabsTrigger value="servicios">Servicios</TabsTrigger>
          <TabsTrigger value="alojamiento">Reservas de alojamiento</TabsTrigger>
          <TabsTrigger value="pagos">Pagos pendientes</TabsTrigger>
        </TabsList>
        <TabsContent value="servicios" className="mt-4"><ServicesList onOpen={setOpen} /></TabsContent>
        <TabsContent value="alojamiento" className="mt-4"><LodgingView onOpen={setOpen} /></TabsContent>
        <TabsContent value="pagos" className="mt-4"><PayablesView onOpen={setOpen} /></TabsContent>
      </Tabs>
      {open && <ServiceSheet serviceId={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

const Empty = ({ cols, text }: { cols: number; text: string }) => (
  <TableRow><TableCell colSpan={cols} className="text-muted-foreground">{text}</TableCell></TableRow>
);

function ServicesList({ onOpen }: { onOpen: (id: string) => void }) {
  const [status, setStatus] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const q = useQuery({
    queryKey: ["ops-services", status, from, to],
    queryFn: async () => {
      let query = db.from("ops_services").select("*").order("start_date").limit(500);
      if (status !== ALL) query = query.eq("status", status as Enums<"ops_status">);
      if (from) query = query.gte("end_date", from);
      if (to) query = query.lte("start_date", to);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Filter value={status} onChange={setStatus} placeholder="Estado" options={Object.entries(OPS_STATUS)} />
        <Field label="Desde"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[160px]" /></Field>
        <Field label="Hasta"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[160px]" /></Field>
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Código</TableHead><TableHead>Cliente</TableHead><TableHead>Tipo</TableHead><TableHead>Fechas</TableHead>
            <TableHead className="text-right">Pax</TableHead><TableHead className="text-right">Costo cotizado</TableHead>
            <TableHead className="text-right">Precio</TableHead><TableHead className="text-right">Margen real</TableHead><TableHead>Estado</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {q.isLoading && <Empty cols={9} text="Cargando…" />}
            {q.error && <Empty cols={9} text={(q.error as Error).message} />}
            {q.data?.length === 0 && <Empty cols={9} text="Sin servicios con estos filtros." />}
            {q.data?.map((r) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => onOpen(r.id)}>
                <TableCell className="font-mono text-xs">{r.booking_code}</TableCell>
                <TableCell>{r.client_name || "—"}</TableCell>
                <TableCell><Badge variant="outline">{r.client_type}</Badge></TableCell>
                <TableCell className="whitespace-nowrap">{fmtDate(r.start_date)} → {fmtDate(r.end_date)}</TableCell>
                <TableCell className="text-right">{r.pax}</TableCell>
                <TableCell className="text-right">{usd(r.quoted_cost_usd)}</TableCell>
                <TableCell className="text-right">{usd(r.sale_price_usd)}</TableCell>
                <TableCell className="text-right">{usd(r.real_margin_usd)}</TableCell>
                <TableCell><Badge variant={r.status === "cancelado" ? "destructive" : "secondary"}>{OPS_STATUS[r.status]}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function LodgingView({ onOpen }: { onOpen: (id: string) => void }) {
  const q = useQuery({
    queryKey: ["ops-lodging"],
    queryFn: async () => {
      const { data, error } = await db.from("ops_items")
        .select("*, ops_services!inner(id, booking_code, client_name, status), suppliers(name, email)")
        .eq("type", "alojamiento").neq("booking_status", "cancelado")
        .in("ops_services.status", ["activo", "en_curso"])
        .order("date").limit(1000);
      if (error) throw error;
      const pay = await db.from("ops_supplier_payables").select("service_id, supplier_id, due_date, paid_date, status")
        .in("service_id", [...new Set(data.map((d) => d.service_id))]);
      return data.map((d) => ({ ...d, payable: pay.data?.find((p) => p.service_id === d.service_id && p.supplier_id === d.supplier_id) }));
    },
  });
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Noche</TableHead><TableHead>Hotel</TableHead><TableHead>Servicio</TableHead><TableHead>Check-in / out</TableHead>
          <TableHead>Distribución</TableHead><TableHead>Estado</TableHead><TableHead>Pago</TableHead><TableHead>Correo hotel</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {q.isLoading && <Empty cols={8} text="Cargando…" />}
          {q.error && <Empty cols={8} text={(q.error as Error).message} />}
          {q.data?.length === 0 && <Empty cols={8} text="No hay noches de hotel en servicios activos." />}
          {q.data?.map((r) => (
            <TableRow key={r.id} className="cursor-pointer" onClick={() => onOpen(r.service_id)}>
              <TableCell className="whitespace-nowrap">{fmtDate(r.date)}</TableCell>
              <TableCell className="font-medium">{r.suppliers?.name ?? r.description}</TableCell>
              <TableCell className="font-mono text-xs">{r.ops_services.booking_code}</TableCell>
              <TableCell className="whitespace-nowrap">{fmtDate(r.check_in)} → {fmtDate(r.check_out)}</TableCell>
              <TableCell className="max-w-[200px] truncate text-xs">{rooms(r.room_distribution)}</TableCell>
              <TableCell><Badge variant="outline">{BOOKING_STATUS[r.booking_status]}</Badge></TableCell>
              <TableCell className="text-xs">{r.payable ? `${PAYABLE_STATUS[r.payable.status]} · vence ${fmtDate(r.payable.due_date)}` : "—"}</TableCell>
              <TableCell className="text-xs">{r.suppliers?.email ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function rooms(v: unknown) {
  if (!v) return "—";
  if (typeof v === "object" && !Array.isArray(v)) return Object.entries(v as Record<string, unknown>).map(([k, n]) => `${k}: ${String(n)}`).join(", ");
  return JSON.stringify(v);
}

function PayablesView({ onOpen }: { onOpen: (id: string) => void }) {
  const { role } = useCurrentUser();
  const canEdit = canManageCatalog(role);
  const [paying, setPaying] = useState<null | { id: string; balance: number }>(null);
  const q = useQuery({
    queryKey: ["ops-payables-pending"],
    queryFn: async () => {
      const { data, error } = await db.from("ops_supplier_payables")
        .select("*, suppliers(name), ops_services(booking_code)")
        .neq("status", "pagado").gt("cost_usd", 0)
        .order("due_date", { ascending: true, nullsFirst: false }).limit(1000);
      if (error) throw error;
      return data;
    },
  });
  const t = today();
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Vence</TableHead><TableHead>Proveedor</TableHead><TableHead>Servicio</TableHead>
          <TableHead className="text-right">Costo</TableHead><TableHead className="text-right">Pagado</TableHead>
          <TableHead className="text-right">Saldo</TableHead><TableHead>Estado</TableHead>{canEdit && <TableHead />}
        </TableRow></TableHeader>
        <TableBody>
          {q.isLoading && <Empty cols={8} text="Cargando…" />}
          {q.error && <Empty cols={8} text={(q.error as Error).message} />}
          {q.data?.length === 0 && <Empty cols={8} text="No hay pagos pendientes." />}
          {q.data?.map((p) => (
            <TableRow key={p.id}>
              <TableCell className={`whitespace-nowrap ${p.due_date && p.due_date < t ? "font-semibold text-destructive" : ""}`}>{p.due_date ? fmtDate(p.due_date) : "Sin fecha"}</TableCell>
              <TableCell className="font-medium">{p.suppliers?.name}</TableCell>
              <TableCell><button className="font-mono text-xs underline-offset-2 hover:underline" onClick={() => onOpen(p.service_id)}>{p.ops_services?.booking_code}</button></TableCell>
              <TableCell className="text-right">{usd(p.cost_usd)}</TableCell>
              <TableCell className="text-right">{usd(p.paid_usd)}</TableCell>
              <TableCell className="text-right font-medium">{usd(p.balance_usd)}</TableCell>
              <TableCell><Badge variant="outline">{PAYABLE_STATUS[p.status]}</Badge></TableCell>
              {canEdit && <TableCell><button className="text-sm text-brand-orange-deep hover:underline" onClick={() => setPaying({ id: p.id, balance: Number(p.balance_usd ?? 0) })}>Registrar pago</button></TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {paying && <PayDialog payableId={paying.id} balance={paying.balance} onClose={() => setPaying(null)} />}
    </div>
  );
}
