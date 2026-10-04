import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import type { Json } from "@/types/db";
import { useCurrentUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RATE_FIELD_LABELS, cap, money, paxRange, validity, type RateValues } from "./shared";

const RATE_KEYS = Object.keys(RATE_FIELD_LABELS) as (keyof RateValues)[];

function pickRate(v: Json): Partial<RateValues> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, unknown> = {};
  for (const k of RATE_KEYS) if (k in v) out[k] = (v as Record<string, unknown>)[k];
  return out as Partial<RateValues>;
}

export function useChangeRequests() {
  return useQuery({
    queryKey: ["change-requests"],
    queryFn: async () => {
      const { data, error } = await db
        .from("service_change_requests")
        .select("*, services(id, sku, name, currency), service_rates(*, services(id, sku, name, currency))")
        .eq("status", "pendiente")
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function usePendingServices() {
  return useQuery({
    queryKey: ["services", "pending"],
    queryFn: async () => {
      const { data, error } = await db
        .from("services")
        .select("id, sku, name, type, country, currency, pricing_unit, created_at, import_issues, suppliers(name)")
        .eq("status", "pendiente")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });
}

export function ChangeRequestsPanel({ onOpenService }: { onOpenService: (id: string) => void }) {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const q = useChangeRequests();

  const review = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const req = q.data?.find((r) => r.id === id);
      if (!req) throw new Error("Sugerencia no encontrada");
      if (approve) {
        const values = pickRate(req.proposed_values);
        if (req.rate_id) {
          const { error } = await db.from("service_rates").update(values).eq("id", req.rate_id);
          if (error) throw error;
        } else if (req.service_id) {
          const { error } = await db.from("service_rates").insert({ ...values, service_id: req.service_id });
          if (error) throw error;
        }
      }
      const { error } = await db
        .from("service_change_requests")
        .update({ status: approve ? "aprobado" : "rechazado", approved_by: user.id, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { approve }) => {
      toast.success(approve ? "Sugerencia aprobada y tarifa actualizada." : "Sugerencia rechazada.");
      qc.invalidateQueries({ queryKey: ["change-requests"] });
      qc.invalidateQueries({ queryKey: ["service"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (!q.data?.length) return <Empty text="No hay sugerencias pendientes." />;

  return (
    <div className="space-y-3">
      {q.data.map((r) => {
        const svc = r.services ?? r.service_rates?.services ?? null;
        const current = r.service_rates;
        const proposed = pickRate(r.proposed_values);
        return (
          <div key={r.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{current ? "Cambio de tarifa" : "Nueva tarifa"}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("es-CL")}</span>
                </div>
                {svc && (
                  <button className="mt-1 text-left font-medium text-foreground hover:underline" onClick={() => onOpenService(svc.id)}>
                    {svc.name} <span className="font-mono text-xs text-muted-foreground">{svc.sku}</span>
                  </button>
                )}
                <p className="mt-1 text-sm text-muted-foreground">Motivo: {r.reason}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={review.isPending} onClick={() => review.mutate({ id: r.id, approve: false })}>
                  <X className="mr-1 h-4 w-4" />Rechazar
                </Button>
                <Button size="sm" disabled={review.isPending} onClick={() => review.mutate({ id: r.id, approve: true })}>
                  <Check className="mr-1 h-4 w-4" />Aprobar
                </Button>
              </div>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th className="py-1 pr-4 text-left font-medium" />
                    <th className="py-1 pr-4 text-left font-medium">Temporada</th>
                    <th className="py-1 pr-4 text-left font-medium">Vigencia</th>
                    <th className="py-1 pr-4 text-left font-medium">Pax</th>
                    <th className="py-1 pr-4 text-right font-medium">Neto</th>
                    <th className="py-1 text-right font-medium">Rack</th>
                  </tr>
                </thead>
                <tbody>
                  {current && <RateLine label="Actual" r={current} currency={svc?.currency} />}
                  <RateLine label="Propuesta" r={proposed} currency={svc?.currency} highlight />
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RateLine({ label, r, currency, highlight }: {
  label: string; r: Partial<RateValues>; currency?: string | null; highlight?: boolean;
}) {
  const rr = { valid_from: r.valid_from ?? null, valid_to: r.valid_to ?? null, pax_min: r.pax_min ?? null, pax_max: r.pax_max ?? null };
  return (
    <tr className={highlight ? "font-medium text-foreground" : "text-muted-foreground"}>
      <td className="py-1 pr-4 text-xs">{label}</td>
      <td className="py-1 pr-4">{r.season ?? "—"}</td>
      <td className="py-1 pr-4 text-xs">{validity(rr)}</td>
      <td className="py-1 pr-4">{paxRange(rr)}</td>
      <td className="py-1 pr-4 text-right">{money(r.price_net, currency)}</td>
      <td className="py-1 text-right">{money(r.price_rack, currency)}</td>
    </tr>
  );
}

export function PendingServicesPanel({ onOpenService }: { onOpenService: (id: string) => void }) {
  const qc = useQueryClient();
  const q = usePendingServices();

  const review = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { error } = await db.from("services").update({ status: approve ? "activo" : "inactivo" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { approve }) => {
      toast.success(approve ? "Servicio aprobado." : "Servicio rechazado (inactivo).");
      qc.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (e: Error) =>
      toast.error(e.message.includes("check") ? "Para activarlo, el servicio necesita unidad de cobro y moneda." : e.message),
  });

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (!q.data?.length) return <Empty text="No hay servicios pendientes." />;

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Servicio</TableHead><TableHead>Tipo</TableHead><TableHead>Proveedor</TableHead>
            <TableHead>País</TableHead><TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {q.data.map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                <button className="text-left hover:underline" onClick={() => onOpenService(s.id)}>
                  <p className="font-medium text-foreground">{s.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{s.sku}</p>
                </button>
                {s.import_issues && <p className="mt-0.5 text-[11px] text-brand-orange-deep">{s.import_issues}</p>}
              </TableCell>
              <TableCell>{cap(s.type)}</TableCell>
              <TableCell>{s.suppliers?.name ?? "—"}</TableCell>
              <TableCell>{s.country ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap text-right">
                <Button size="sm" variant="outline" className="mr-2" disabled={review.isPending} onClick={() => review.mutate({ id: s.id, approve: false })}>
                  <X className="mr-1 h-4 w-4" />Rechazar
                </Button>
                <Button size="sm" disabled={review.isPending} onClick={() => review.mutate({ id: s.id, approve: true })}>
                  <Check className="mr-1 h-4 w-4" />Aprobar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{text}</div>;
}
