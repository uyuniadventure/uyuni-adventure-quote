import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, Check, Loader2, MessageSquare, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { buildSupplierPayables, computeRealMargin, generateCommunicationPlan } from "@/lib/ops";
import type { Enums, Tables, TablesUpdate } from "@/types/db";
import { canManageCatalog, useCurrentUser } from "@/hooks/use-auth";
import { Field, primaryBtn } from "@/components/catalog/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BOOKING_STATUS, OPS_STATUS, PAYABLE_STATUS, fmtDate, today, usd } from "./shared";

const invalidateOps = (qc: ReturnType<typeof useQueryClient>) => {
  for (const k of ["ops-services", "ops-lodging", "ops-payables-pending", "ops-service"]) qc.invalidateQueries({ queryKey: [k] });
};

export function ServiceSheet({ serviceId, onClose }: { serviceId: string; onClose: () => void }) {
  const { role } = useCurrentUser();
  const canEdit = canManageCatalog(role);
  const qc = useQueryClient();
  const svc = useQuery({
    queryKey: ["ops-service", serviceId],
    queryFn: async () => {
      const { data, error } = await db.from("ops_services").select("*").eq("id", serviceId).single();
      if (error) throw error;
      return data;
    },
  });
  const setStatus = useMutation({
    mutationFn: async (status: Enums<"ops_status">) => {
      const { error } = await db.from("ops_services").update({ status }).eq("id", serviceId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Estado actualizado."); invalidateOps(qc); },
    onError: (e: Error) => toast.error(e.message),
  });
  const margin = useMutation({
    mutationFn: () => computeRealMargin(serviceId),
    onSuccess: () => { toast.success("Costo y margen real calculados."); invalidateOps(qc); },
    onError: (e: Error) => toast.error(e.message),
  });
  const s = svc.data;

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-5xl">
        <SheetHeader>
          <SheetTitle className="font-mono">{s?.booking_code ?? "Servicio"}</SheetTitle>
          <SheetDescription>{s ? `${s.client_name ?? ""} · ${fmtDate(s.start_date)} → ${fmtDate(s.end_date)} · ${s.pax} pax · ${s.client_type}` : "Cargando…"}</SheetDescription>
        </SheetHeader>
        {s && (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-5">
              <Stat label="Costo cotizado" value={usd(s.quoted_cost_usd)} />
              <Stat label="Costo real" value={usd(s.real_cost_usd)} />
              <Stat label="Precio de venta" value={usd(s.sale_price_usd)} />
              <Stat label="Margen real" value={usd(s.real_margin_usd)} />
              <div className="space-y-2">
                <Select value={s.status} disabled={!canEdit} onValueChange={(v) => setStatus.mutate(v as Enums<"ops_status">)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(OPS_STATUS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
                {canEdit && (
                  <Button size="sm" variant="outline" className="w-full" onClick={() => margin.mutate()} disabled={margin.isPending}>
                    {margin.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Calculator className="mr-1 h-4 w-4" />}Calcular margen real
                  </Button>
                )}
              </div>
            </div>
            <Tabs defaultValue="items" className="mt-6">
              <TabsList>
                <TabsTrigger value="items">Ítems por día</TabsTrigger>
                <TabsTrigger value="pagos">Proveedores</TabsTrigger>
                {canEdit && <TabsTrigger value="pax">Pasajeros</TabsTrigger>}
                <TabsTrigger value="com">Comunicación</TabsTrigger>
              </TabsList>
              <TabsContent value="items" className="mt-4"><ItemsTab serviceId={serviceId} canEdit={canEdit} /></TabsContent>
              <TabsContent value="pagos" className="mt-4"><PayablesTab serviceId={serviceId} canEdit={canEdit} /></TabsContent>
              {canEdit && <TabsContent value="pax" className="mt-4"><PassengersTab serviceId={serviceId} /></TabsContent>}
              <TabsContent value="com" className="mt-4"><CommsTab serviceId={serviceId} canEdit={canEdit} /></TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/40 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

/* ---------------- Ítems ---------------- */

type Item = Tables<"ops_items"> & { suppliers: { name: string } | null };

function ItemsTab({ serviceId, canEdit }: { serviceId: string; canEdit: boolean }) {
  const [editing, setEditing] = useState<Item | null>(null);
  const q = useQuery({
    queryKey: ["ops-service", serviceId, "items"],
    queryFn: async () => {
      const { data, error } = await db.from("ops_items").select("*, suppliers(name)").eq("service_id", serviceId).order("date").order("pickup_time", { nullsFirst: true });
      if (error) throw error;
      return data as Item[];
    },
  });
  const byDay = new Map<string, Item[]>();
  q.data?.forEach((i) => byDay.set(i.date, [...(byDay.get(i.date) ?? []), i]));
  if (q.isLoading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (!q.data?.length) return <p className="text-sm text-muted-foreground">Este servicio no tiene ítems.</p>;
  return (
    <div className="space-y-5">
      {[...byDay.entries()].map(([day, items], idx) => (
        <div key={day}>
          <h3 className="mb-2 text-sm font-semibold">Día {idx + 1} · {fmtDate(day)}</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Pick-up</TableHead><TableHead>Descripción</TableHead><TableHead>Proveedor</TableHead>
                <TableHead className="text-right">Costo USD</TableHead><TableHead>Reserva</TableHead><TableHead>Notas</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {items.map((i) => (
                  <TableRow key={i.id} className={canEdit ? "cursor-pointer" : ""} onClick={() => canEdit && setEditing(i)}>
                    <TableCell className="whitespace-nowrap">{i.pickup_time?.slice(0, 5) ?? "—"}</TableCell>
                    <TableCell><div className="font-medium">{i.description}</div><div className="text-xs text-muted-foreground">{i.type}{i.place ? ` · ${i.place}` : ""}</div></TableCell>
                    <TableCell>{i.suppliers?.name ?? <span className="text-destructive">Sin asignar</span>}</TableCell>
                    <TableCell className="text-right">{usd(i.cost_usd)}</TableCell>
                    <TableCell><Badge variant={i.booking_status === "confirmado" ? "default" : i.booking_status === "cancelado" ? "destructive" : "outline"}>{BOOKING_STATUS[i.booking_status]}</Badge></TableCell>
                    <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">{[i.followup_notes, i.extra_notes].filter(Boolean).join(" · ") || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
      {editing && <ItemDialog item={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ItemDialog({ item, onClose }: { item: Item; onClose: () => void }) {
  const qc = useQueryClient();
  const [v, setV] = useState({
    booking_status: item.booking_status,
    pickup_time: item.pickup_time?.slice(0, 5) ?? "",
    place: item.place ?? "",
    supplier_id: item.supplier_id ?? "",
    currency: item.currency ?? "",
    cost_local: item.cost_local?.toString() ?? "",
    cost_usd: item.cost_usd?.toString() ?? "",
    followup_notes: item.followup_notes ?? "",
    extra_notes: item.extra_notes ?? "",
  });
  const set = (k: keyof typeof v, val: string) => setV((s) => ({ ...s, [k]: val }));
  const suppliers = useQuery({
    queryKey: ["suppliers-min"],
    queryFn: async () => (await db.from("suppliers").select("id, name").order("name")).data ?? [],
  });
  const currencies = useQuery({
    queryKey: ["currency-codes"],
    queryFn: async () => (await db.from("currencies").select("code").order("code")).data ?? [],
  });
  const curOpts = [...new Set([...(currencies.data ?? []).map((c) => c.code), "USD", "BOB", "CLP", ...(item.currency ? [item.currency] : [])])];
  const save = useMutation({
    mutationFn: async () => {
      const num = (x: string) => (x.trim() === "" ? null : Number(x));
      const patch: TablesUpdate<"ops_items"> = {
        booking_status: v.booking_status, pickup_time: v.pickup_time || null, place: v.place.trim() || null,
        supplier_id: v.supplier_id || null, currency: v.currency || null,
        cost_local: num(v.cost_local), cost_usd: num(v.cost_usd),
        followup_notes: v.followup_notes.trim() || null, extra_notes: v.extra_notes.trim() || null,
      };
      const { error } = await db.from("ops_items").update(patch).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Ítem actualizado."); invalidateOps(qc); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>{item.description}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Estado de reserva">
            <Select value={v.booking_status} onValueChange={(x) => set("booking_status", x as Enums<"booking_status">)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(BOOKING_STATUS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Hora pick-up"><Input type="time" value={v.pickup_time} onChange={(e) => set("pickup_time", e.target.value)} /></Field>
          <Field label="Lugar" className="sm:col-span-2"><Input value={v.place} onChange={(e) => set("place", e.target.value)} /></Field>
          <Field label="Proveedor" className="sm:col-span-2">
            <Select value={v.supplier_id} onValueChange={(x) => set("supplier_id", x)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
              <SelectContent>{suppliers.data?.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Moneda">
            <Select value={v.currency} onValueChange={(x) => set("currency", x)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{curOpts.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Costo real (moneda local)"><Input type="number" step="any" value={v.cost_local} onChange={(e) => set("cost_local", e.target.value)} /></Field>
          <Field label="Costo real USD" className="sm:col-span-2"><Input type="number" step="any" value={v.cost_usd} onChange={(e) => set("cost_usd", e.target.value)} /></Field>
          <Field label="Seguimiento" className="sm:col-span-2"><Textarea rows={2} value={v.followup_notes} onChange={(e) => set("followup_notes", e.target.value)} /></Field>
          <Field label="Notas extra" className="sm:col-span-2"><Textarea rows={2} value={v.extra_notes} onChange={(e) => set("extra_notes", e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className={primaryBtn} onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Guardando…" : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Proveedores ---------------- */

function PayablesTab({ serviceId, canEdit }: { serviceId: string; canEdit: boolean }) {
  const qc = useQueryClient();
  const [paying, setPaying] = useState<null | { id: string; balance: number }>(null);
  const q = useQuery({
    queryKey: ["ops-service", serviceId, "payables"],
    queryFn: async () => {
      const { data, error } = await db.from("ops_supplier_payables").select("*, suppliers(name)").eq("service_id", serviceId).order("due_date", { nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });
  const build = useMutation({
    mutationFn: () => buildSupplierPayables(serviceId),
    onSuccess: () => { toast.success("Costos por proveedor actualizados."); invalidateOps(qc); },
    onError: (e: Error) => toast.error(e.message),
  });
  const setDue = async (id: string, due: string) => {
    const { error } = await db.from("ops_supplier_payables").update({ due_date: due || null }).eq("id", id);
    if (error) toast.error(error.message); else invalidateOps(qc);
  };
  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Agrupa los ítems activos por proveedor y moneda. Requiere proveedor, moneda y costos reales en todos los ítems.</p>
          <Button size="sm" variant="outline" onClick={() => build.mutate()} disabled={build.isPending}>
            {build.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}Generar costos
          </Button>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Proveedor</TableHead><TableHead>Detalle</TableHead><TableHead className="text-right">Costo</TableHead>
            <TableHead className="text-right">Pagado</TableHead><TableHead className="text-right">Saldo</TableHead>
            <TableHead>Vence</TableHead><TableHead>Estado</TableHead>{canEdit && <TableHead />}
          </TableRow></TableHeader>
          <TableBody>
            {q.data?.length === 0 && <TableRow><TableCell colSpan={8} className="text-muted-foreground">Aún no se generaron los costos por proveedor.</TableCell></TableRow>}
            {q.data?.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.suppliers?.name}<div className="text-xs text-muted-foreground">{p.currency} {Number(p.cost_local).toLocaleString("es")}</div></TableCell>
                <TableCell className="max-w-[220px] whitespace-pre-line text-xs text-muted-foreground">{p.detail}</TableCell>
                <TableCell className="text-right">{usd(p.cost_usd)}</TableCell>
                <TableCell className="text-right">{usd(p.paid_usd)}</TableCell>
                <TableCell className="text-right font-medium">{usd(p.balance_usd)}</TableCell>
                <TableCell>
                  {canEdit ? <Input type="date" className="h-8 w-[140px]" defaultValue={p.due_date ?? ""} onBlur={(e) => e.target.value !== (p.due_date ?? "") && setDue(p.id, e.target.value)} /> : fmtDate(p.due_date)}
                </TableCell>
                <TableCell><Badge variant={p.status === "pagado" ? "default" : "outline"}>{PAYABLE_STATUS[p.status]}</Badge>{p.paid_date && <div className="text-xs text-muted-foreground">{fmtDate(p.paid_date)}</div>}</TableCell>
                {canEdit && <TableCell>{p.status !== "pagado" && <Button size="sm" variant="ghost" onClick={() => setPaying({ id: p.id, balance: Number(p.balance_usd ?? 0) })}>Registrar pago</Button>}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {paying && <PayDialog payableId={paying.id} balance={paying.balance} onClose={() => setPaying(null)} />}
    </div>
  );
}

export function PayDialog({ payableId, balance, onClose }: { payableId: string; balance: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState(balance > 0 ? balance.toFixed(2) : "");
  const [date, setDate] = useState(today());
  const pay = useMutation({
    mutationFn: async () => {
      const amt = Number(amount);
      if (!(amt > 0)) throw new Error("Monto inválido.");
      const { data: cur, error: e1 } = await db.from("ops_supplier_payables").select("cost_usd, paid_usd").eq("id", payableId).single();
      if (e1) throw e1;
      const paid = Number(cur.paid_usd) + amt;
      const status: Enums<"payable_status"> = paid >= Number(cur.cost_usd) ? "pagado" : "parcial";
      const { error } = await db.from("ops_supplier_payables").update({ paid_usd: paid, paid_date: date, status }).eq("id", payableId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pago registrado."); invalidateOps(qc); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Registrar pago a proveedor</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Saldo pendiente: {usd(balance)}</p>
          <Field label="Monto USD"><Input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Fecha de pago"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className={primaryBtn} onClick={() => pay.mutate()} disabled={pay.isPending}>Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Pasajeros (solo admin/operación) ---------------- */

type Pax = Tables<"ops_passengers">;
const PAX_FIELDS: [keyof Pax, string, string?][] = [
  ["full_name", "Nombre completo"], ["nationality", "Nacionalidad"], ["passport", "Pasaporte"], ["birth_date", "Nacimiento", "date"],
  ["dietary_restrictions", "Restricciones alimentarias"], ["bed_type", "Tipo de cama"], ["phone", "Teléfono"], ["email", "Email"], ["notes", "Notas"],
];

function PassengersTab({ serviceId }: { serviceId: string }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Pax> | null>(null);
  const key = ["ops-service", serviceId, "pax"];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await db.from("ops_passengers").select("*").eq("service_id", serviceId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await db.from("ops_passengers").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => toast.error(e.message),
  });
  const save = async () => {
    if (!editing?.full_name?.trim()) { toast.error("El nombre es obligatorio."); return; }
    const payload = Object.fromEntries(PAX_FIELDS.map(([k]) => [k, (editing[k] as string | null | undefined)?.toString().trim() || null])) as Partial<Pax>;
    const { error } = editing.id
      ? await db.from("ops_passengers").update(payload).eq("id", editing.id)
      : await db.from("ops_passengers").insert({ ...payload, full_name: editing.full_name.trim(), service_id: serviceId });
    if (error) { toast.error(error.message); return; }
    toast.success("Pasajero guardado.");
    setEditing(null);
    qc.invalidateQueries({ queryKey: key });
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Datos sensibles: visibles solo para Operación y Admin; no salen en PDFs ni exportaciones.</p>
        <Button size="sm" className={primaryBtn} onClick={() => setEditing({})}><Plus className="mr-1 h-4 w-4" />Agregar</Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Nombre</TableHead><TableHead>Nacionalidad</TableHead><TableHead>Pasaporte</TableHead><TableHead>Nacimiento</TableHead>
            <TableHead>Dieta</TableHead><TableHead>Cama</TableHead><TableHead>Contacto</TableHead><TableHead />
          </TableRow></TableHeader>
          <TableBody>
            {q.data?.length === 0 && <TableRow><TableCell colSpan={8} className="text-muted-foreground">Sin pasajeros cargados.</TableCell></TableRow>}
            {q.data?.map((p) => (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => setEditing(p)}>
                <TableCell className="font-medium">{p.full_name}{p.notes && <div className="text-xs text-muted-foreground">{p.notes}</div>}</TableCell>
                <TableCell>{p.nationality ?? "—"}</TableCell><TableCell>{p.passport ?? "—"}</TableCell>
                <TableCell>{fmtDate(p.birth_date)}</TableCell><TableCell>{p.dietary_restrictions ?? "—"}</TableCell>
                <TableCell>{p.bed_type ?? "—"}</TableCell><TableCell className="text-xs">{[p.phone, p.email].filter(Boolean).join(" · ") || "—"}</TableCell>
                <TableCell><Button size="icon" variant="ghost" aria-label="Eliminar" onClick={(e) => { e.stopPropagation(); if (confirm("¿Eliminar pasajero?")) remove.mutate(p.id); }}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {editing && (
        <Dialog open onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader><DialogTitle>{editing.id ? "Editar pasajero" : "Nuevo pasajero"}</DialogTitle></DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              {PAX_FIELDS.map(([k, label, type]) => (
                <Field key={k} label={label} className={k === "notes" || k === "full_name" ? "sm:col-span-2" : ""}>
                  <Input type={type ?? "text"} value={(editing[k] as string | null | undefined) ?? ""} onChange={(e) => setEditing((s) => ({ ...s, [k]: e.target.value }))} />
                </Field>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button className={primaryBtn} onClick={save}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ---------------- Comunicación ---------------- */

const MILESTONES = ["Bienvenida tras confirmar", "48 h antes", "24 h antes", "Día 1 por la tarde", "Fin del viaje"];

function CommsTab({ serviceId, canEdit }: { serviceId: string; canEdit: boolean }) {
  const qc = useQueryClient();
  const key = ["ops-service", serviceId, "comms"];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await db.from("ops_communications").select("*").eq("service_id", serviceId).order("milestone");
      if (error) throw error;
      return data;
    },
  });
  const gen = useMutation({
    mutationFn: () => generateCommunicationPlan(serviceId),
    onSuccess: () => { toast.success("Plan de comunicación generado."); qc.invalidateQueries({ queryKey: key }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mark = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Enums<"communication_status"> }) => {
      const { error } = await db.from("ops_communications").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-3">
      {canEdit && (q.data?.length ?? 0) < 5 && (
        <Button size="sm" variant="outline" onClick={() => gen.mutate()} disabled={gen.isPending}>
          {gen.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-1 h-4 w-4" />}Generar plan de comunicación
        </Button>
      )}
      {q.data?.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay plan de comunicación.</p>}
      <div className="space-y-2">
        {q.data?.map((c) => (
          <div key={c.id} className="rounded-md border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold">{c.milestone}. {MILESTONES[c.milestone - 1]}</div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{c.channel === "whatsapp" ? "WhatsApp" : "Email"}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(c.scheduled_at).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}</span>
                {c.status === "enviado" ? (
                  <Badge className="gap-1"><Check className="h-3 w-3" />Enviado</Badge>
                ) : canEdit ? (
                  <Button size="sm" variant="outline" onClick={() => mark.mutate({ id: c.id, status: "enviado" })}>Marcar enviado</Button>
                ) : <Badge variant="secondary">Pendiente</Badge>}
              </div>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{c.message}</p>
            {canEdit && c.status === "enviado" && (
              <button className="mt-1 text-xs text-muted-foreground hover:underline" onClick={() => mark.mutate({ id: c.id, status: "pendiente" })}>Deshacer</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
