import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, BedDouble, FilePlus2, LayoutTemplate, Loader2, PencilLine, Plus, RefreshCw, Replace, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { addQuoteItem, loadQuote, promoteQuoteToTemplate, recalculateQuote, updateQuoteItem } from "@/lib/quotes";
import { addBlockDay, deleteDay, moveDay, validateContinuity } from "@/lib/quotes/days";
import { beginQuoteEdit, transitionQuote } from "@/lib/states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { QuoteResult } from "@/lib/pricing";
import type { Enums, Tables } from "@/types/db";
import { canManageCatalog, useCurrentUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Field, SearchPicker, fetchBlocks, fetchServices, type PickOption } from "@/components/catalog/kit";
import { CURRENCIES, PRICING_UNITS, PRICING_UNIT_LABELS, SERVICE_TYPES, cap, money, paxRange, validity } from "@/components/catalog/shared";
import { deleteItem, moveDay as moveDayByPosition, replaceDayHotel, serviceToItem } from "./quote-ops";
import { QuotePanel, type Alert } from "./quote-panel";

type Data = Awaited<ReturnType<typeof loadQuote>>;
type Item = Tables<"quote_items">;
type Snap = { room_type?: string | null; vehicle_segment?: string | null; rates?: Tables<"service_rates">[]; is_optional?: boolean };
export const snap = (i: Item) => (i.pricing_snapshot ?? {}) as Snap;

export function useQuoteActions(quoteId: string) {
  const qc = useQueryClient();
  const chain = useRef<Promise<void>>(Promise.resolve());
  const [busy, setBusy] = useState(0);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  const recalc = useCallback(async () => {
    try {
      setResult(await recalculateQuote(quoteId));
      setCalcError(null);
    } catch (e) {
      setCalcError((e as Error).message);
    }
  }, [quoteId]);

  /** Serializa escrituras + recálculo (save_quote_calculation exige updated_at vigente). */
  const act = useCallback(
    (fn: () => Promise<unknown>, ok?: string) => {
      setBusy((b) => b + 1);
      const p = chain.current.then(async () => {
        let success = true;
        let calculated = false;
        try {
          const changed = await fn();
          if (changed && typeof changed === "object" && "calculation" in changed) {
            setResult(changed.calculation as QuoteResult);
            setCalcError(null);
            calculated = true;
          }
          if (ok) toast.success(ok);
        } catch (e) {
          success = false;
          toast.error((e as Error).message);
        }
        if (!calculated) await recalc();
        await qc.invalidateQueries({ queryKey: ["quote-full", quoteId] });
        await qc.invalidateQueries({ queryKey: ["quotes"] });
        return success;
      });
      chain.current = p.then(() => undefined).finally(() => setBusy((b) => b - 1));
      return p;
    },
    [qc, quoteId, recalc],
  );
  return { act, busy: busy > 0, result, calcError };
}

export function QuoteWorkspace({ quoteId, onReset }: { quoteId: string; onReset: () => void }) {
  const q = useQuery({ queryKey: ["quote-full", quoteId], queryFn: () => loadQuote(quoteId) });
  const actions = useQuoteActions(quoteId);
  const started = useRef(false);
  useEffect(() => {
    if (q.data && !started.current && !q.data.quote.archived_at && ["borrador", "revisada"].includes(q.data.quote.status)) {
      started.current = true;
      void actions.act(async () => {});
    }
  }, [q.data, actions]);

  const continuity = useQuery({ queryKey: ["quote-continuity", quoteId, q.data?.quote.updated_at], enabled: !!q.data, queryFn: () => validateContinuity(quoteId) });
  if (q.isError) return <p className="text-sm text-destructive">No se pudo cargar la cotización: {(q.error as Error).message}</p>;
  if (!q.data) return <p className="text-sm text-muted-foreground">Cargando cotización…</p>;
  const data = q.data;
  const editable = ["borrador", "revisada"].includes(data.quote.status) && !data.quote.archived_at;
  const result = actions.result ?? (data.quote.calculation as unknown as QuoteResult | null);
  const displayedActions = { ...actions, result };

  const alerts: Alert[] = [];
  if (actions.calcError) alerts.push({ level: "red", text: `No se pudo calcular: ${actions.calcError}` });
  if (result?.status === "error") alerts.push({ level: "red", text: "El cálculo tiene ítems sin precio; no se puede enviar." });
  for (const r of result?.items ?? []) {
    if (!r.warning) continue;
    const it = data.items.find((i) => i.id === r.id);
    alerts.push({ level: r.total_cost_usd == null ? "red" : "yellow", text: `${it?.description ?? r.id}: ${r.warning}`, target: `item-${r.id}` });
  }
  for (const w of result?.warnings ?? []) alerts.push({ level: "yellow", text: w });
  for (const c of continuity.data ?? []) alerts.push({ level: "yellow", text: c.mensaje, target: `day-${c.día}` });
  const blocked = alerts.some((a) => a.level === "red");

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <TopBar data={data} blocked={blocked} actions={actions} onReset={onReset} />
      {!editable && <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">{data.quote.archived_at ? "Versión anterior: solo lectura." : "Esta cotización ya no es un borrador; editarla requiere crear una nueva versión."}</p>}
      <Tabs defaultValue="editor">
        <TabsList><TabsTrigger value="editor">Editor</TabsTrigger><TabsTrigger value="historial">Historial</TabsTrigger></TabsList>
        <TabsContent value="editor">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <DaysEditor data={data} editable={editable} actions={displayedActions} />
            <div className="space-y-2 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto">
              {editable && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="flex-1" title="Recalcula con las tarifas guardadas en la cotización" onClick={() => actions.act(async () => {}, "Tarifas recalculadas.")}><RefreshCw className="mr-1 h-4 w-4" />Actualizar tarifas</Button>
                  {!data.quote.template_id && (
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => actions.act(() => promoteQuoteToTemplate(data.quote.id), "Plantilla creada (pendiente de revisión).")}><LayoutTemplate className="mr-1 h-4 w-4" />Guardar como plantilla</Button>
                  )}
                </div>
              )}
              <QuotePanel data={data} editable={editable} actions={displayedActions} alerts={alerts} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="historial"><History quoteId={data.quote.id} /></TabsContent>
      </Tabs>
    </div>
  );
}

const CLOSE_ACTIONS: { to: Enums<"quote_status">; label: string }[] = [
  { to: "perdida", label: "Marcar perdida" }, { to: "cancelada", label: "Cancelar cotización" },
];
const NEXT: Record<Enums<"quote_status">, { to: Enums<"quote_status">; label: string; guarded?: boolean; adminOnly?: boolean }[]> = {
  borrador: [{ to: "revisada", label: "Marcar revisada", guarded: true }, ...CLOSE_ACTIONS],
  revisada: [{ to: "enviada", label: "Marcar enviada", guarded: true }, ...CLOSE_ACTIONS],
  enviada: [{ to: "vendida", label: "Marcar vendida", guarded: true, adminOnly: true }, ...CLOSE_ACTIONS],
  vendida: CLOSE_ACTIONS,
  perdida: CLOSE_ACTIONS.filter(a => a.to !== "perdida"),
  cancelada: CLOSE_ACTIONS.filter(a => a.to !== "cancelada"),
};

function TopBar({ data, blocked, actions, onReset }: { data: Data; blocked: boolean; actions: ReturnType<typeof useQuoteActions>; onReset: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { role } = useCurrentUser();
  const { quote } = data;
  const root = quote.code.replace(/-v\d+$/, "");
  const versions = useQuery({
    queryKey: ["quote-versions", root],
    queryFn: async () => {
      const { data: rows, error } = await db.from("quotes").select("id, code, version, status, archived_at").or(`code.eq.${root},code.like.${root}-v%`).order("version");
      if (error) throw error;
      return rows;
    },
  });
  const [pending, setPending] = useState(false);
  const editSent = async () => {
    setPending(true);
    try {
      const id = await beginQuoteEdit(quote.id);
      await Promise.all([qc.invalidateQueries({ queryKey: ["quote-full", quote.id] }), qc.invalidateQueries({ queryKey: ["quote-versions"] }), qc.invalidateQueries({ queryKey: ["quotes"] })]);
      await navigate({ to: "/nueva-cotizacion", search: { quote: id } });
    } catch (e) { toast.error((e as Error).message); } finally { setPending(false); }
  };
  const go = async (to: Enums<"quote_status">) => {
    let note: string | undefined;
    if (["perdida", "cancelada", "vendida"].includes(to)) {
      const reason = to === "perdida" ? "la pérdida" : to === "cancelada" ? "la cancelación" : "la venta sin depósito";
      note = prompt(`Motivo de ${reason} (obligatorio):`)?.trim(); if (!note) return;
    }
    setPending(true);
    try {
      await transitionQuote(quote.id, to, note);
      toast.success(`Estado: ${cap(to)}.`);
      await Promise.all([qc.invalidateQueries({ queryKey: ["quote-full", quote.id] }), qc.invalidateQueries({ queryKey: ["quote-history", quote.id] }), qc.invalidateQueries({ queryKey: ["quote-versions"] }), qc.invalidateQueries({ queryKey: ["quotes"] })]);
    } catch (e) { toast.error((e as Error).message); } finally { setPending(false); }
  };
  const open = !quote.archived_at;
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Cotización</h1>
          <Badge variant="outline">{cap(quote.status)}</Badge>
          {(actions.busy || pending) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{quote.code} · inicio {quote.start_date} · {quote.language.toUpperCase()} · {quote.client_type}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {(versions.data?.length ?? 0) > 1 && (
          <Select value={quote.id} onValueChange={(id) => navigate({ to: "/nueva-cotizacion", search: { quote: id } })}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{versions.data!.map((v) => <SelectItem key={v.id} value={v.id}>v{v.version} · {cap(v.status)}{v.archived_at ? " (archivada)" : ""}</SelectItem>)}</SelectContent>
          </Select>
        )}
        {open && quote.status === "enviada" && <Button variant="outline" disabled={pending || actions.busy} onClick={() => void editSent()}><PencilLine className="mr-1 h-4 w-4" />Editar nueva versión</Button>}
        {open && NEXT[quote.status].filter(t => !t.adminOnly || role === "admin").map((t) => (
          <Button key={t.to} variant={t.to === "perdida" || t.to === "cancelada" ? "outline" : "default"} disabled={pending || actions.busy || (t.guarded && blocked)}
            title={t.guarded && blocked ? "Resuelve los avisos rojos primero" : undefined} onClick={() => void go(t.to)}>{t.label}</Button>
        ))}
        <Button variant="outline" asChild><Link to="/cotizaciones">Cotizaciones</Link></Button>
        <Button variant="outline" onClick={onReset}><FilePlus2 className="mr-1 h-4 w-4" />Otra cotización</Button>
      </div>
    </div>
  );
}

function History({ quoteId }: { quoteId: string }) {
  const h = useQuery({
    queryKey: ["quote-history", quoteId],
    queryFn: async () => {
      const { data, error } = await db.from("quote_status_history").select("id, old_status, new_status, changed_at, note, changed_by").eq("quote_id", quoteId).order("changed_at", { ascending: false });
      if (error) throw error;
      const ids = [...new Set(data.map((r) => r.changed_by))];
      const { data: people } = ids.length ? await db.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
      return data.map((r) => ({ ...r, who: people?.find((p) => p.id === r.changed_by)?.full_name ?? "—" }));
    },
  });
  if (h.isLoading) return <p className="text-sm text-muted-foreground">Cargando historial…</p>;
  if (h.isError) return <p className="text-sm text-destructive">{(h.error as Error).message}</p>;
  return (
    <Card className="overflow-x-auto">
      <Table>
        <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Cambio</TableHead><TableHead>Usuario</TableHead><TableHead>Nota</TableHead></TableRow></TableHeader>
        <TableBody>
          {h.data!.length === 0 && <TableRow><TableCell colSpan={4} className="py-4 text-center text-sm text-muted-foreground">Sin cambios de estado.</TableCell></TableRow>}
          {h.data!.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap text-sm">{new Date(r.changed_at).toLocaleString("es-CL")}</TableCell>
              <TableCell className="text-sm">{r.old_status ? cap(r.old_status) : "—"} → <strong>{cap(r.new_status)}</strong></TableCell>
              <TableCell className="text-sm">{r.who}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{r.note ?? ""}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

type Actions = ReturnType<typeof useQuoteActions>;

function DaysEditor({ data, editable, actions }: { data: Data; editable: boolean; actions: Actions }) {
  const { quote, days, items } = data;
  const { act } = actions;
  return (
    <div className="space-y-3">
      {days.length === 0 && <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">Cotización vacía. Agrega bloques diarios para armar el itinerario.</p>}
      {days.map((d, i) => (
        <DayCard key={d.id} day={d} index={i} count={days.length}
          canMoveUp={i > 0 && (!d.group_id || days[0]?.group_id !== d.group_id)}
          canMoveDown={i < days.length - 1 && (!d.group_id || days.at(-1)?.group_id !== d.group_id)} items={items.filter((it) => it.quote_day_id === d.id)}
          editable={editable} actions={actions}
          onMove={(to) => act(() => moveDayByPosition(quote, days, i, to))}
          onReplace={(blockId) => act(async () => {
            await addBlockDay(quote.id, blockId);
            const fresh = await loadQuote(quote.id);
            const added = fresh.days.at(-1)!;
            await moveDay(quote.id, added.id, d.day_number);
            return deleteDay(quote.id, d.id);
          }, "Bloque reemplazado.")}
          onRemove={() => confirm(d.group_id ? `¿Quitar el grupo completo (días ${days.filter(day => day.group_id === d.group_id).map(day => day.day_number).join(", ")}) y sus servicios?` : `¿Quitar el día ${d.day_number} y sus servicios?`) && act(() => deleteDay(quote.id, d.id), "Día eliminado.")} />
      ))}
      {editable && (
        <Card className="flex flex-wrap items-center gap-2 p-3">
          <span className="text-sm text-muted-foreground">Agregar día {days.length + 1}:</span>
          <SearchPicker className="w-full sm:w-[420px]" placeholder="Buscar bloque diario…" queryKey="blocks" fetcher={fetchBlocks}
            onPick={(o) => o && act(() => addBlockDay(quote.id, o.id), "Bloque agregado.")} />
        </Card>
      )}
    </div>
  );
}

function DayCard({ day, index, count, canMoveUp, canMoveDown, items, editable, actions, onMove, onRemove, onReplace }: {
  day: Tables<"quote_days">; index: number; count: number; canMoveUp: boolean; canMoveDown: boolean; items: Item[]; editable: boolean; actions: Actions;
  onMove: (to: number) => void; onRemove: () => void; onReplace: (blockId: string) => void;
}) {
  const [replacing, setReplacing] = useState(false);
  const { act, result } = actions;
  const [hotelOpen, setHotelOpen] = useState(false);
  const [newItem, setNewItem] = useState(false);
  const hotels = items.filter((i) => i.type === "alojamiento" && i.pricing_unit !== "per_staff");
  const reviewed = (day.snapshot as { reviewed?: boolean })?.reviewed;
  const dayTotal = result?.days.find((x) => x.day_number === day.day_number);

  return (
    <Card id={`day-${day.day_number}`} className="overflow-hidden scroll-mt-4 transition-shadow">
      <div className="flex flex-wrap items-center gap-3 border-b bg-muted/30 px-4 py-2.5">
        <span className="rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">Día {day.day_number}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-foreground">{day.title}</div>
          <div className="font-mono text-xs text-muted-foreground">{day.date ?? ""} {day.route_from || day.route_to ? `· ${day.route_from ?? "—"} → ${day.route_to ?? "—"}` : ""}</div>
        </div>
        {reviewed === false && <Badge variant="outline" className="border-brand-orange/40 text-brand-orange-deep">Texto sin revisar</Badge>}
        {dayTotal && <span className="text-xs text-muted-foreground">Costo {money(dayTotal.total_cost_usd, "USD")}</span>}
        {editable && (
          <div className="flex">
            <Button size="icon" variant="ghost" className="h-8 w-8" disabled={!canMoveUp} onClick={() => onMove(index - 1)} aria-label="Subir"><ArrowUp className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" disabled={!canMoveDown} onClick={() => onMove(index + 1)} aria-label="Bajar"><ArrowDown className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setReplacing((v) => !v)} aria-label="Reemplazar bloque" title="Reemplazar bloque"><Replace className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onRemove} aria-label="Quitar día"><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        {replacing && editable && (
          <SearchPicker className="w-full" placeholder="Bloque que reemplaza este día…" queryKey="blocks" fetcher={fetchBlocks}
            onPick={(o) => { if (o) { setReplacing(false); onReplace(o.id); } }} />
        )}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <BedDouble className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Hotel:</span>
          <span className="font-medium">{hotels.length ? [...new Set(hotels.map((h) => h.description))].join(" · ") : "Sin alojamiento"}</span>
          {editable && <Button size="sm" variant="outline" className="h-7" onClick={() => setHotelOpen(true)}>Cambiar hotel</Button>}
        </div>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Servicio</TableHead><TableHead className="w-20">Cant.</TableHead><TableHead className="text-center">Incluido</TableHead>
              <TableHead className="text-center">TC</TableHead><TableHead className="text-center">Margen</TableHead><TableHead className="text-right">Costo base USD</TableHead><TableHead className="text-right">Ajuste %</TableHead><TableHead className="text-right">Costo ajustado USD</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {items.length === 0 && <TableRow><TableCell colSpan={9} className="py-4 text-center text-sm text-muted-foreground">Sin servicios.</TableCell></TableRow>}
              {items.map((it) => <ItemRow key={it.id} item={it} editable={editable} actions={actions} />)}
            </TableBody>
          </Table>
        </div>
        {editable && (
          <div className="flex flex-wrap gap-2">
            <SearchPicker className="w-full sm:w-[360px]" placeholder="Agregar servicio del tarifario…" queryKey="services" fetcher={(t) => fetchServices(t)}
              onPick={(o) => o && act(async () => addQuoteItem(day.id, await serviceToItem(o.id, { maxSpan: count - index }), false), "Servicio agregado.")} />
            <Button variant="outline" onClick={() => setNewItem(true)}><Plus className="mr-1 h-4 w-4" />Ítem nuevo</Button>
          </div>
        )}
      </div>
      <HotelDialog open={hotelOpen} onOpenChange={setHotelOpen}
        onConfirm={(ids) => act(() => replaceDayHotel(day.id, hotels.map((h) => h.id), ids), "Hotel actualizado.")} />
      <NewItemDialog open={newItem} onOpenChange={setNewItem}
        onConfirm={(item, promote) => act(() => addQuoteItem(day.id, item, promote), promote ? "Ítem agregado y enviado al tarifario." : "Ítem agregado.")} />
    </Card>
  );
}

function ItemRow({ item, editable, actions }: { item: Item; editable: boolean; actions: Actions }) {
  const { act, result } = actions;
  const [override, setOverride] = useState(false);
  const r = result?.items.find((x) => x.id === item.id);
  const s = snap(item);
  const upd = (changes: Parameters<typeof updateQuoteItem>[1]) => act(() => updateQuoteItem(item.id, changes));
  return (
    <TableRow id={`item-${item.id}`} className={item.included ? "" : "opacity-60"}>
      <TableCell className="max-w-[320px]">
        <div className="truncate font-medium">{item.description}</div>
        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <span className="font-mono">{item.sku ?? "manual"}</span>
          <span>· {PRICING_UNIT_LABELS[item.pricing_unit]}</span>
          {s.room_type && <span>· {s.room_type}</span>}
          {s.vehicle_segment && <span>· tramo {s.vehicle_segment}</span>}
          {item.day_span > 1 && <span>· {item.day_span} días</span>}
          {item.price_overridden && <Badge variant="outline" className="h-4 border-brand-orange/40 px-1 text-[10px] text-brand-orange-deep" title={item.override_note ?? ""}>Precio manual</Badge>}
        </div>
        {r?.warning && <div className="text-xs text-destructive">{r.warning}</div>}
      </TableCell>
      <TableCell>
        {["per_group", "per_unit", "per_staff"].includes(item.pricing_unit) ? (
          <Input type="number" min={0} step="any" defaultValue={item.qty} className="h-8" disabled={!editable}
            title={item.pricing_unit === "per_staff" ? "Unidades por miembro del staff" : "Cantidad"}
            onBlur={(e) => Number(e.target.value) !== item.qty && upd({ qty: Math.max(0, Number(e.target.value) || 0) })} />
        ) : <span title="Cantidad calculada con los pasajeros, habitaciones o staff del panel">{r?.quantity ?? "—"}</span>}
      </TableCell>
      <TableCell className="text-center"><Switch checked={item.included} disabled={!editable} onCheckedChange={(v) => upd({ included: v })} /></TableCell>
      <TableCell className="text-center"><Switch checked={item.applies_tc} disabled={!editable} onCheckedChange={(v) => upd({ applies_tc: v })} /></TableCell>
      <TableCell className="text-center"><Switch checked={item.margin_applicable} disabled={!editable} onCheckedChange={(v) => upd({ margin_applicable: v })} /></TableCell>
      <TableCell className="whitespace-nowrap text-right text-sm">{r ? money(r.base_cost_usd === undefined ? r.total_cost_usd : r.base_cost_usd) : "—"}</TableCell>
      <TableCell className="text-right text-sm" title={item.adjustment_note ?? undefined}>{Number(((item.adjustment_pct ?? 0) * 100).toFixed(6))} %{item.adjustment_note && <div className="max-w-40 text-xs text-muted-foreground">{item.adjustment_note}</div>}</TableCell>
      <TableCell className="whitespace-nowrap text-right text-sm">
        {r ? <>{money(r.total_cost_usd)}<div className="text-xs text-muted-foreground">{money(r.unit_cost_original, item.currency)} × {r.quantity}</div></> : "—"}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right">
        {editable && (
          <>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setOverride(true)} aria-label="Sobrescribir precio"><PencilLine className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => act(() => deleteItem(item.id), "Servicio quitado.")} aria-label="Quitar"><Trash2 className="h-4 w-4" /></Button>
          </>
        )}
      </TableCell>
      <OverrideDialog open={override} onOpenChange={setOverride} item={item} currentCost={r?.unit_cost_original}
        onConfirm={(changes) => upd(changes)} />
    </TableRow>
  );
}

function OverrideDialog({ open, onOpenChange, item, currentCost, onConfirm }: {
  open: boolean; onOpenChange: (o: boolean) => void; item: Item; currentCost: number | undefined;
  onConfirm: (c: Parameters<typeof updateQuoteItem>[1]) => void;
}) {
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    if (open) { setCost(String(item.price_overridden ? item.unit_cost_original : currentCost ?? "")); setNote(item.override_note ?? ""); }
  }, [open, item, currentCost]);
  const valid = Number(cost) >= 0 && cost !== "" && note.trim().length > 0;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Precio solo para esta cotización</DialogTitle>
          <DialogDescription>{item.description} · costo unitario en {item.currency}. No modifica el tarifario.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label={`Costo unitario (${item.currency})`}><Input type="number" min={0} step="any" value={cost} onChange={(e) => setCost(e.target.value)} /></Field>
          <Field label="Nota (obligatoria)"><Textarea rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej. tarifa negociada con el proveedor por email del 12/10" /></Field>
        </div>
        <DialogFooter className="gap-2">
          {item.price_overridden && (
            <Button variant="outline" onClick={() => { onConfirm({ price_overridden: false, override_note: null }); onOpenChange(false); }}>Volver a tarifa</Button>
          )}
          <Button disabled={!valid} onClick={() => { onConfirm({ price_overridden: true, unit_cost_original: Number(cost), override_note: note.trim() }); onOpenChange(false); }}>Aplicar precio</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HotelDialog({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; onConfirm: (ids: string[]) => void }) {
  const [hotel, setHotel] = useState<PickOption | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  useEffect(() => { if (!open) { setHotel(null); setSel([]); } }, [open]);
  const rooms = useQuery({
    queryKey: ["hotel-rooms", hotel?.id],
    enabled: !!hotel,
    queryFn: async () => {
      const { data: s, error } = await db.from("services").select("id, supplier_id, name").eq("id", hotel!.id).single();
      if (error) throw error;
      let q = db.from("services").select("id, sku, name, room_type, meal_plan, currency, pricing_unit, status, service_rates(*)").eq("type", "alojamiento").neq("status", "inactivo");
      q = s.supplier_id ? q.eq("supplier_id", s.supplier_id) : q.eq("id", s.id);
      const { data, error: e2 } = await q.order("room_type");
      if (e2) throw e2;
      return data;
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Cambiar hotel del día</DialogTitle>
          <DialogDescription>Elige el hotel y marca los tipos de habitación a usar. Reemplaza el alojamiento actual del día.</DialogDescription>
        </DialogHeader>
        <SearchPicker placeholder="Buscar hotel…" value={hotel} onPick={(o) => { setHotel(o); setSel(o ? [o.id] : []); }} queryKey="hotels" fetcher={(t) => fetchServices(t, "alojamiento")} />
        {rooms.isLoading && hotel && <p className="text-sm text-muted-foreground">Cargando habitaciones…</p>}
        {rooms.data && (
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {rooms.data.map((r) => (
              <label key={r.id} className="flex cursor-pointer gap-3 rounded-md border p-3 hover:bg-muted/40">
                <Checkbox checked={sel.includes(r.id)} onCheckedChange={(v) => setSel((p) => (v ? [...p, r.id] : p.filter((x) => x !== r.id)))} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.room_type ?? "Sin tipo"}</span>
                    <span className="text-sm text-muted-foreground">{r.name}</span>
                    {r.meal_plan && <Badge variant="secondary">{r.meal_plan}</Badge>}
                    {r.pricing_unit && <Badge variant="outline">{PRICING_UNIT_LABELS[r.pricing_unit]}</Badge>}
                    {(!r.pricing_unit || !r.currency) && <Badge variant="outline" className="text-destructive">Incompleto</Badge>}
                  </div>
                  <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {r.service_rates.length === 0 && <div>Sin tarifas cargadas.</div>}
                    {r.service_rates.map((t) => (
                      <div key={t.id}>{t.season} · {validity(t)} · pax {paxRange(t)} · neto {money(t.price_net, r.currency)}{t.price_rack != null ? ` · rack ${money(t.price_rack, r.currency)}` : ""}</div>
                    ))}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button disabled={!sel.length} onClick={() => { onConfirm(sel); onOpenChange(false); }}>Usar {sel.length} habitación(es)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewItemDialog({ open, onOpenChange, onConfirm }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  onConfirm: (item: Parameters<typeof addQuoteItem>[1], promote: boolean) => void;
}) {
  const { role } = useCurrentUser();
  const blank = {
    description: "", sku: "", type: "extra" as Enums<"service_type">, pricing_unit: "per_group" as Enums<"pricing_unit">,
    currency: "USD", qty: "1", cost: "", room_type: "", vehicle_segment: "", applies_tc: false, margin_applicable: true, promote: false,
  };
  const [f, setF] = useState(blank);
  useEffect(() => { if (open) setF(blank); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const err = !f.description.trim() ? "Descripción obligatoria." : f.cost === "" || Number(f.cost) < 0 ? "Costo unitario obligatorio."
    : f.promote && !f.sku.trim() ? "Para agregarlo al tarifario indica un SKU." : f.pricing_unit === "per_room" && !f.room_type.trim() ? "Indica el tipo de habitación."
    : f.pricing_unit === "per_vehicle" && !f.vehicle_segment.trim() ? "Indica el tramo del vehículo." : null;

  const submit = () => {
    onConfirm({
      description: f.description.trim().slice(0, 300), sku: f.sku.trim().toUpperCase() || null, type: f.type, pricing_unit: f.pricing_unit,
      currency: f.currency, qty: Number(f.qty) || 1, unit_cost_original: Number(f.cost), unit_cost_usd: 0,
      applies_tc: f.applies_tc, margin_applicable: f.margin_applicable, included: true, day_span: 1,
      price_overridden: true, override_note: "Ítem creado manualmente en la cotización",
      pricing_snapshot: { rates: [], room_type: f.room_type.trim() || null, vehicle_segment: f.vehicle_segment.trim() || null, is_optional: false },
    }, f.promote);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Ítem nuevo</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Descripción" className="sm:col-span-2"><Input value={f.description} maxLength={300} onChange={(e) => set("description", e.target.value)} /></Field>
          <Field label="Tipo">
            <Select value={f.type} onValueChange={(v) => set("type", v as Enums<"service_type">)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SERVICE_TYPES.map((t) => <SelectItem key={t} value={t}>{cap(t)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Unidad de precio">
            <Select value={f.pricing_unit} onValueChange={(v) => set("pricing_unit", v as Enums<"pricing_unit">)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRICING_UNITS.map((u) => <SelectItem key={u} value={u}>{PRICING_UNIT_LABELS[u]}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          {f.pricing_unit === "per_room" && <Field label="Tipo de habitación"><Input value={f.room_type} onChange={(e) => set("room_type", e.target.value.toUpperCase())} placeholder="DBL" /></Field>}
          {f.pricing_unit === "per_vehicle" && <Field label="Tramo de vehículo"><Input value={f.vehicle_segment} onChange={(e) => set("vehicle_segment", e.target.value)} placeholder="bolivia" /></Field>}
          <Field label="Moneda">
            <Select value={f.currency} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Costo unitario"><Input type="number" min={0} step="any" value={f.cost} onChange={(e) => set("cost", e.target.value)} /></Field>
          <Field label="Cantidad"><Input type="number" min={0} step="any" value={f.qty} onChange={(e) => set("qty", e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm"><Switch checked={f.applies_tc} onCheckedChange={(v) => set("applies_tc", v)} />Aplica TC</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={f.margin_applicable} onCheckedChange={(v) => set("margin_applicable", v)} />Aplica margen</label>
          <div className="space-y-2 rounded-md border p-3 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium"><Checkbox checked={f.promote} onCheckedChange={(v) => set("promote", v === true)} />Agregar al tarifario</label>
            {f.promote && (
              <>
                <Field label="SKU"><Input value={f.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} className="font-mono" /></Field>
                <p className="text-xs text-muted-foreground">{canManageCatalog(role) ? "Se creará activo en el tarifario." : "Se creará como pendiente hasta que Operación lo apruebe."}</p>
              </>
            )}
          </div>
        </div>
        {err && <p className="text-xs text-muted-foreground">{err}</p>}
        <DialogFooter><Button disabled={!!err} onClick={submit}>Agregar ítem</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
