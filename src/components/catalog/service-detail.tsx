import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { db, json } from "@/lib/db";
import type { Tables, TablesUpdate } from "@/types/db";
import { canManageCatalog, useCurrentUser } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RateForm } from "./rate-form";
import {
  CURRENCIES, MODALITIES, PRICING_UNITS, PRICING_UNIT_LABELS, SERVICE_TYPES,
  StatusBadge, cap, money, paxRange, rateValuesFrom, validity, type RateValues,
} from "./shared";

type Rate = Tables<"service_rates">;
type Mode =
  | { kind: "edit"; rate: Rate }
  | { kind: "add" }
  | { kind: "suggest"; rate: Rate | null };

export function ServiceDetail({ serviceId, onClose }: { serviceId: string | null; onClose: () => void }) {
  const { user, role } = useCurrentUser();
  const manager = canManageCatalog(role);
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode | null>(null);
  const [editingService, setEditingService] = useState(false);

  const suppliersQ = useQuery({
    queryKey: ["suppliers", "pick"],
    enabled: !!serviceId && manager,
    queryFn: async () => {
      const { data, error } = await db.from("suppliers").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const q = useQuery({
    queryKey: ["service", serviceId],
    enabled: !!serviceId,
    queryFn: async () => {
      const { data, error } = await db
        .from("services")
        .select("*, suppliers(name), service_rates(*)")
        .eq("id", serviceId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["service", serviceId] });
    qc.invalidateQueries({ queryKey: ["services"] });
    qc.invalidateQueries({ queryKey: ["change-requests"] });
  };

  const save = useMutation({
    mutationFn: async ({ values, reason }: { values: RateValues; reason: string }) => {
      if (!mode || !serviceId) return;
      if (mode.kind === "edit") {
        const { error } = await db.from("service_rates").update(values).eq("id", mode.rate.id);
        if (error) throw error;
      } else if (mode.kind === "add") {
        const { error } = await db.from("service_rates").insert({ ...values, service_id: serviceId });
        if (error) throw error;
      } else {
        const { error } = await db.from("service_change_requests").insert({
          service_id: mode.rate ? null : serviceId,
          rate_id: mode.rate?.id ?? null,
          proposed_values: json(values),
          reason,
          requested_by: user.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(mode?.kind === "suggest" ? "Sugerencia enviada para aprobación." : "Tarifa guardada.");
      setMode(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("service_rates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Tarifa eliminada."); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeService = useMutation({
    mutationFn: async () => {
      if (!serviceId) return;
      const { error: rErr } = await db.from("service_rates").delete().eq("service_id", serviceId);
      if (rErr) throw rErr;
      const { error } = await db.from("services").delete().eq("id", serviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Servicio eliminado.");
      qc.invalidateQueries({ queryKey: ["services"] });
      onClose();
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("foreign key") || e.message.includes("violates")
          ? "No se puede eliminar: el servicio está usado en bloques, cotizaciones u operación."
          : e.message,
      ),
  });

  const s = q.data;
  const rates = [...(s?.service_rates ?? [])].sort(
    (a, b) => (a.season ?? "").localeCompare(b.season ?? "") || (a.pax_min ?? 0) - (b.pax_min ?? 0),
  );

  return (
    <Sheet open={!!serviceId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
        {!s ? (
          <p className="p-6 text-sm text-muted-foreground">{q.isError ? "No se pudo cargar el servicio." : "Cargando…"}</p>
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2"><StatusBadge status={s.status} /><Badge variant="secondary">{cap(s.type)}</Badge></div>
              <SheetTitle className="text-left">{s.name}</SheetTitle>
              <SheetDescription className="text-left font-mono text-xs">{s.sku}</SheetDescription>
              {manager && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => setEditingService(true)}>
                    <Pencil className="mr-1 h-4 w-4" />Editar servicio
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive"
                    onClick={() => confirm(`¿Eliminar el servicio "${s.name}" y todas sus tarifas? Esta acción no se puede deshacer.`) && removeService.mutate()}
                    disabled={removeService.isPending}>
                    <Trash2 className="mr-1 h-4 w-4" />Eliminar servicio
                  </Button>
                </div>
              )}
            </SheetHeader>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Info label="Proveedor" value={s.suppliers?.name} />
              <Info label="País" value={s.country} />
              <Info label="Ubicación" value={s.location} />
              <Info label="Unidad de cobro" value={s.pricing_unit ? PRICING_UNIT_LABELS[s.pricing_unit] : null} />
              <Info label="Moneda" value={s.currency} />
              <Info label="Modalidad" value={cap(s.modality)} />
              {s.room_type && <Info label="Habitación" value={s.room_type} />}
              {s.meal_plan && <Info label="Régimen" value={s.meal_plan} />}
              {s.vehicle_type && <Info label="Vehículo" value={`${s.vehicle_type}${s.vehicle_max_pax ? ` · máx ${s.vehicle_max_pax} pax` : ""}`} />}
              {s.multi_day_span > 1 && <Info label="Cubre días" value={String(s.multi_day_span)} />}
              <Info label="Fuente" value={s.source} />
            </dl>
            {(s.notes || s.import_issues) && (
              <div className="mt-4 space-y-2 text-sm">
                {s.notes && <p className="text-muted-foreground"><span className="font-medium text-foreground">Notas: </span>{s.notes}</p>}
                {s.import_issues && <p className="rounded-md border border-brand-orange/30 bg-brand-orange/10 p-2 text-foreground"><span className="font-medium">Revisión de importación: </span>{s.import_issues}</p>}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Tarifas ({rates.length})</h3>
              {manager ? (
                <Button size="sm" onClick={() => setMode({ kind: "add" })}><Plus className="mr-1 h-4 w-4" />Agregar tarifa</Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setMode({ kind: "suggest", rate: null })}>
                  <MessageSquarePlus className="mr-1 h-4 w-4" />Sugerir nueva tarifa
                </Button>
              )}
            </div>
            <div className="mt-3 rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Temporada</TableHead><TableHead>Vigencia</TableHead><TableHead>Pax</TableHead>
                    <TableHead className="text-right">Neto</TableHead><TableHead className="text-right">Rack</TableHead><TableHead>Control económico</TableHead><TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">Sin tarifas cargadas.</TableCell></TableRow>
                  )}
                  {rates.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell><Badge variant="outline">{r.season ?? "Sin definir"}</Badge></TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{validity(r)}</TableCell>
                      <TableCell>{paxRange(r)}</TableCell>
                      <TableCell className="text-right">
                        {money(r.price_net, s.currency)}
                        {r.net_cost_missing && <p className="text-[11px] text-brand-orange-deep">sin costo neto</p>}
                      </TableCell>
                      <TableCell className="text-right">{money(r.price_rack, s.currency)}</TableCell>
                      <TableCell className="max-w-64 text-xs">
                        {r.pricing_enabled === false && <p className="text-brand-orange-deep">Tarifa pendiente de precio</p>}
                        {r.exclusion_text && <p>Exclusión de vigencia: {r.exclusion_text}</p>}
                        {Array.isArray(r.date_exclusions) && r.date_exclusions.length > 0 && <p>{r.date_exclusions.length} exclusión(es) de fecha</p>}
                        {r.pricing_enabled !== false && !r.exclusion_text && (!Array.isArray(r.date_exclusions) || r.date_exclusions.length === 0) && <span className="text-muted-foreground">Sin incidencias</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {manager ? (
                          <>
                            <Button size="icon" variant="ghost" aria-label="Editar tarifa" onClick={() => setMode({ kind: "edit", rate: r })}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" aria-label="Eliminar tarifa"
                              onClick={() => confirm("¿Eliminar esta tarifa?") && remove.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                          </>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => setMode({ kind: "suggest", rate: r })}>Sugerir cambio</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <Dialog open={!!mode} onOpenChange={(o) => !o && setMode(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {mode?.kind === "edit" ? "Editar tarifa" : mode?.kind === "add" ? "Nueva tarifa" : "Sugerir cambio"}
              </DialogTitle>
            </DialogHeader>
            {mode && (
              <RateForm
                key={mode.kind + (mode.kind !== "add" ? mode.rate?.id ?? "new" : "")}
                initial={rateValuesFrom(mode.kind === "add" ? null : mode.rate)}
                withReason={mode.kind === "suggest"}
                submitLabel={mode.kind === "suggest" ? "Enviar sugerencia" : "Guardar tarifa"}
                busy={save.isPending}
                onSubmit={(values, reason) => save.mutate({ values, reason })}
              />
            )}
          </DialogContent>
        </Dialog>

        {s && (
          <EditServiceDialog
            open={editingService}
            onOpenChange={setEditingService}
            service={s}
            suppliers={suppliersQ.data ?? []}
            onSaved={refresh}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

type ServiceRow = Tables<"services">;

function EditServiceDialog({
  open, onOpenChange, service, suppliers, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  service: ServiceRow;
  suppliers: { id: string; name: string }[];
  onSaved: () => void;
}) {
  const [f, setF] = useState(() => ({
    sku: service.sku,
    name: service.name,
    type: service.type,
    pricing_unit: service.pricing_unit ?? "per_person",
    currency: service.currency ?? "USD",
    country: service.country ?? "",
    location: service.location ?? "",
    supplier_id: service.supplier_id ?? "none",
    modality: service.modality,
    room_type: service.room_type ?? "",
    vehicle_type: service.vehicle_type ?? "",
    vehicle_max_pax: service.vehicle_max_pax?.toString() ?? "",
    meal_plan: service.meal_plan ?? "NONE",
    notes: service.notes ?? "",
  }));
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      const row: TablesUpdate<"services"> = {
        sku: f.sku.trim(),
        name: f.name.trim(),
        type: f.type,
        pricing_unit: f.pricing_unit as ServiceRow["pricing_unit"],
        currency: f.currency,
        country: f.country.trim() || null,
        location: f.location.trim() || null,
        supplier_id: f.supplier_id === "none" ? null : f.supplier_id,
        modality: f.modality,
        room_type: f.room_type.trim() || null,
        vehicle_type: f.vehicle_type.trim() || null,
        vehicle_max_pax: f.vehicle_max_pax.trim() === "" ? null : Number(f.vehicle_max_pax),
        meal_plan: f.meal_plan as ServiceRow["meal_plan"],
        notes: f.notes.trim() || null,
      };
      const { error } = await db.from("services").update(row).eq("id", service.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Servicio actualizado.");
      onOpenChange(false);
      onSaved();
    },
    onError: (e: Error) =>
      toast.error(e.message.includes("duplicate") ? "Ya existe otro servicio con ese SKU." : e.message),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar servicio</DialogTitle>
          <DialogDescription>Los cambios aplican a todas las cotizaciones y bloques que usan este servicio.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5"><Label>SKU *</Label><Input required value={f.sku} onChange={(e) => set("sku")(e.target.value)} className="font-mono" /></div>
          <div className="col-span-2 space-y-1.5"><Label>Nombre *</Label><Input required value={f.name} onChange={(e) => set("name")(e.target.value)} /></div>
          <Pick label="Tipo" value={f.type} onChange={set("type")} options={SERVICE_TYPES.map((t) => [t, cap(t)])} />
          <Pick label="Unidad de cobro" value={f.pricing_unit} onChange={set("pricing_unit")} options={PRICING_UNITS.map((u) => [u, PRICING_UNIT_LABELS[u]])} />
          <Pick label="Moneda" value={f.currency} onChange={set("currency")} options={CURRENCIES.map((c) => [c, c])} />
          <Pick label="Modalidad" value={f.modality} onChange={set("modality")} options={MODALITIES.map((m) => [m, cap(m)])} />
          <div className="space-y-1.5"><Label>País</Label><Input value={f.country} onChange={(e) => set("country")(e.target.value.toUpperCase())} /></div>
          <div className="space-y-1.5"><Label>Ubicación</Label><Input value={f.location} onChange={(e) => set("location")(e.target.value)} /></div>
          <div className="col-span-2">
            <Pick label="Proveedor" value={f.supplier_id} onChange={set("supplier_id")}
              options={[["none", "Sin proveedor"], ...suppliers.map((s) => [s.id, s.name] as [string, string])]} />
          </div>
          <div className="space-y-1.5"><Label>Tipo de habitación</Label><Input value={f.room_type} onChange={(e) => set("room_type")(e.target.value)} /></div>
          <Pick label="Régimen" value={f.meal_plan} onChange={set("meal_plan")} options={[["NONE", "Sin comidas"], ["BB", "BB"], ["HB", "HB"], ["FB", "FB"]]} />
          <div className="space-y-1.5"><Label>Tipo de vehículo</Label><Input value={f.vehicle_type} onChange={(e) => set("vehicle_type")(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Pax máx. vehículo</Label><Input type="number" min={1} value={f.vehicle_max_pax} onChange={(e) => set("vehicle_max_pax")(e.target.value)} /></div>
          <div className="col-span-2 space-y-1.5"><Label>Notas</Label><Input value={f.notes} onChange={(e) => set("notes")(e.target.value)} /></div>
          <Button type="submit" className="col-span-2" disabled={save.isPending}>{save.isPending ? "Guardando…" : "Guardar cambios"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Pick({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}
