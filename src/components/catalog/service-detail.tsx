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

  const s = q.data;
  const rates = [...(s?.service_rates ?? [])].sort(
    (a, b) => a.season.localeCompare(b.season) || (a.pax_min ?? 0) - (b.pax_min ?? 0),
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
                    <TableHead className="text-right">Neto</TableHead><TableHead className="text-right">Rack</TableHead><TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">Sin tarifas cargadas.</TableCell></TableRow>
                  )}
                  {rates.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell><Badge variant="outline">{r.season}</Badge></TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{validity(r)}</TableCell>
                      <TableCell>{paxRange(r)}</TableCell>
                      <TableCell className="text-right">
                        {money(r.price_net, s.currency)}
                        {r.net_cost_missing && <p className="text-[11px] text-brand-orange-deep">sin costo neto</p>}
                      </TableCell>
                      <TableCell className="text-right">{money(r.price_rack, s.currency)}</TableCell>
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
      </SheetContent>
    </Sheet>
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
