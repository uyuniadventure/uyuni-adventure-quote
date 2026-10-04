import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { db, json } from "@/lib/db";
import type { loadQuote } from "@/lib/quotes";
import type { PaxScenario, Rooming } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { money } from "@/components/catalog/shared";
import { snap, type useQuoteActions } from "./quote-workspace";

type Data = Awaited<ReturnType<typeof loadQuote>>;
type Actions = ReturnType<typeof useQuoteActions>;
type Num = Record<string, number>;

const BASE_ROOMS = ["SGL", "DBL", "TWN", "TPL"];

interface PanelState {
  pax_paying: number; tc_count: number; rooming: Rooming; vehicles: Num; staff: { drivers: number; guides: number };
  margin_pct: number; fx_snapshot: Num; pax_scenarios: PaxScenario[];
}

function fromQuote(q: Data["quote"]): PanelState {
  const r = (q.rooming ?? {}) as Partial<Rooming>;
  const st = (q.staff ?? {}) as Partial<PanelState["staff"]>;
  return {
    pax_paying: q.pax_paying, tc_count: q.tc_count,
    rooming: { paying: { ...(r.paying ?? {}) }, tc: { ...(r.tc ?? {}) } },
    vehicles: { ...((q.vehicles ?? {}) as Num) }, staff: { drivers: st.drivers ?? 0, guides: st.guides ?? 0 },
    margin_pct: Number(q.margin_pct), fx_snapshot: { USD: 1, ...((q.fx_snapshot ?? {}) as Num) },
    pax_scenarios: ((q.pax_scenarios ?? []) as unknown as PaxScenario[]),
  };
}

function NumIn({ value, onChange, disabled, step, className }: { value: number; onChange: (n: number) => void; disabled?: boolean; step?: string; className?: string }) {
  return <Input type="number" min={0} step={step ?? "1"} value={Number.isFinite(value) ? value : 0} disabled={!!disabled}
    onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} className={`h-8 ${className ?? ""}`} />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-2"><h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>{children}</div>;
}

export function QuotePanel({ data, editable, actions }: { data: Data; editable: boolean; actions: Actions }) {
  const { quote, items } = data;
  const { act, result, calcError, busy } = actions;
  const [s, setS] = useState<PanelState>(() => fromQuote(quote));
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const roomTypes = useMemo(() => [...new Set([...BASE_ROOMS, ...items.map((i) => snap(i).room_type).filter(Boolean) as string[], ...Object.keys(s.rooming.paying), ...Object.keys(s.rooming.tc)])], [items, s.rooming]);
  const segments = useMemo(() => [...new Set([...items.filter((i) => i.pricing_unit === "per_vehicle").map((i) => snap(i).vehicle_segment).filter(Boolean) as string[], ...Object.keys(s.vehicles)])], [items, s.vehicles]);
  const currencies = useMemo(() => [...new Set(["USD", ...items.map((i) => i.currency), ...Object.keys(s.fx_snapshot)])], [items, s.fx_snapshot]);

  const update = (fn: (p: PanelState) => PanelState) => { setS(fn); setDirty(true); };

  const save = (manual = false) => {
    clearTimeout(timer.current);
    const snapshot = s;
    setDirty(false);
    return act(async () => {
      if (snapshot.pax_paying < 1) throw new Error("Debe haber al menos 1 pax pagante.");
      const { error } = await db.from("quotes").update({
        pax_paying: snapshot.pax_paying, tc_count: snapshot.tc_count, rooming: json(snapshot.rooming), vehicles: json(snapshot.vehicles),
        staff: json(snapshot.staff), margin_pct: snapshot.margin_pct, fx_snapshot: json(snapshot.fx_snapshot), pax_scenarios: json(snapshot.pax_scenarios),
      }).eq("id", quote.id);
      if (error) throw error;
      setSavedAt(new Date());
    }, manual ? "Borrador guardado." : undefined);
  };

  // Autoguardado + recálculo en vivo.
  useEffect(() => {
    if (!dirty || !editable) return;
    timer.current = setTimeout(() => void save(), 900);
    return () => clearTimeout(timer.current);
  }, [s, dirty]); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = result ?? (quote.total_price_usd != null ? {
    total_cost_usd: Number(quote.total_cost_usd), total_margin_usd: Number(quote.total_margin_usd), total_price_usd: Number(quote.total_price_usd),
    price_per_pax_usd: Number(quote.price_per_pax_usd), single_supplement_pp: Number(quote.single_supplement_pp ?? 0), scenarios: [], warnings: [],
  } : null);
  const missingFx = currencies.filter((c) => !(s.fx_snapshot[c] > 0));

  const setScenario = (i: number, sc: PaxScenario) => update((p) => ({ ...p, pax_scenarios: p.pax_scenarios.map((x, j) => (j === i ? sc : x)) }));

  return (
    <Card className="space-y-4 p-4">
      <div className="rounded-md bg-primary p-4 text-primary-foreground">
        <div className="text-xs uppercase tracking-wide opacity-80">Total</div>
        <div className="text-3xl font-bold">{totals ? money(totals.total_price_usd, "USD") : "—"}</div>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="opacity-80">Costo</span><span className="text-right">{totals ? money(totals.total_cost_usd) : "—"}</span>
          <span className="opacity-80">Margen</span><span className="text-right">{totals ? money(totals.total_margin_usd) : "—"}</span>
          <span className="opacity-80">Por pax</span><span className="text-right font-semibold">{totals ? money(totals.price_per_pax_usd) : "—"}</span>
          <span className="opacity-80">Supl. single</span><span className="text-right">{totals ? money(totals.single_supplement_pp) : "—"}</span>
        </div>
      </div>
      {calcError && <p className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">No se pudo calcular: {calcError}</p>}
      {result && result.warnings.length > 0 && (
        <ul className="space-y-0.5 rounded-md border border-brand-orange/40 p-2 text-xs text-brand-orange-deep">{result.warnings.slice(0, 6).map((w, i) => <li key={i}>{w}</li>)}</ul>
      )}

      {editable && (
        <Button className="w-full" onClick={() => save(true)} disabled={busy && !dirty}>
          <Save className="mr-1 h-4 w-4" />Guardar borrador
        </Button>
      )}
      <p className="text-center text-xs text-muted-foreground">{dirty ? "Cambios sin guardar…" : savedAt ? `Guardado ${savedAt.toLocaleTimeString("es-CL")}` : "Los cambios se guardan automáticamente."}</p>

      <Separator />
      <Section title="Pasajeros">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <label className="space-y-1"><span className="text-xs text-muted-foreground">Pax pagantes</span><NumIn value={s.pax_paying} disabled={!editable} onChange={(n) => update((p) => ({ ...p, pax_paying: Math.round(n) }))} /></label>
          <label className="space-y-1"><span className="text-xs text-muted-foreground">TC</span><NumIn value={s.tc_count} disabled={!editable} onChange={(n) => update((p) => ({ ...p, tc_count: Math.round(n) }))} /></label>
        </div>
      </Section>

      <Section title="Rooming (habitaciones)">
        <div className="grid grid-cols-[1fr_70px_70px] items-center gap-x-2 gap-y-1 text-sm">
          <span /><span className="text-center text-xs text-muted-foreground">Pagantes</span><span className="text-center text-xs text-muted-foreground">TC</span>
          {roomTypes.map((rt) => (
            <RoomRow key={rt} rt={rt} paying={s.rooming.paying[rt] ?? 0} tc={s.rooming.tc[rt] ?? 0} disabled={!editable}
              onChange={(kind, n) => update((p) => ({ ...p, rooming: { ...p.rooming, [kind]: { ...p.rooming[kind], [rt]: Math.round(n) } } }))} />
          ))}
        </div>
      </Section>

      <Section title="Vehículos por tramo">
        {segments.length === 0 ? <p className="text-xs text-muted-foreground">Ningún servicio se cobra por vehículo.</p> : (
          <div className="grid grid-cols-[1fr_80px] items-center gap-2 text-sm">
            {segments.map((sg) => (
              <SegmentRow key={sg} label={sg} value={s.vehicles[sg]} disabled={!editable} onChange={(n) => update((p) => ({ ...p, vehicles: { ...p.vehicles, [sg]: Math.round(n) } }))} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Staff">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <label className="space-y-1"><span className="text-xs text-muted-foreground">Choferes</span><NumIn value={s.staff.drivers} disabled={!editable} onChange={(n) => update((p) => ({ ...p, staff: { ...p.staff, drivers: Math.round(n) } }))} /></label>
          <label className="space-y-1"><span className="text-xs text-muted-foreground">Guías</span><NumIn value={s.staff.guides} disabled={!editable} onChange={(n) => update((p) => ({ ...p, staff: { ...p.staff, guides: Math.round(n) } }))} /></label>
        </div>
      </Section>

      <Section title="Margen y tipo de cambio">
        <label className="flex items-center justify-between gap-2 text-sm"><span>Margen %</span><NumIn value={s.margin_pct} step="0.5" className="w-24" disabled={!editable} onChange={(n) => update((p) => ({ ...p, margin_pct: n }))} /></label>
        <div className="grid grid-cols-[1fr_110px] items-center gap-2 text-sm">
          {currencies.map((c) => (
            <SegmentRow key={c} label={`1 USD = ${c}`} step="any" value={s.fx_snapshot[c]} disabled={!editable || c === "USD"}
              warn={missingFx.includes(c)} onChange={(n) => update((p) => ({ ...p, fx_snapshot: { ...p.fx_snapshot, [c]: n } }))} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Tasa congelada en esta cotización (unidades de moneda por 1 USD).</p>
      </Section>

      {quote.client_type === "B2B" && (
        <Section title="Escenarios de pax (B2B)">
          {s.pax_scenarios.map((sc, i) => (
            <div key={i} className="space-y-2 rounded-md border p-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-xs text-muted-foreground">Pax</span><NumIn value={sc.pax_paying} disabled={!editable} onChange={(n) => setScenario(i, { ...sc, pax_paying: Math.max(1, Math.round(n)) })} />
                <span className="text-xs text-muted-foreground">TC</span><NumIn value={sc.tc_count} disabled={!editable} onChange={(n) => setScenario(i, { ...sc, tc_count: Math.round(n) })} />
                {editable && <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => update((p) => ({ ...p, pax_scenarios: p.pax_scenarios.filter((_, j) => j !== i) }))}><Trash2 className="h-4 w-4" /></Button>}
              </div>
              <div className="flex flex-wrap gap-1 text-xs">
                {roomTypes.filter((rt) => (s.rooming.paying[rt] ?? 0) > 0 || (sc.rooming.paying[rt] ?? 0) > 0).map((rt) => (
                  <label key={rt} className="flex items-center gap-1">{rt}<NumIn className="w-14" value={sc.rooming.paying[rt] ?? 0} disabled={!editable}
                    onChange={(n) => setScenario(i, { ...sc, rooming: { ...sc.rooming, paying: { ...sc.rooming.paying, [rt]: Math.round(n) } } })} /></label>
                ))}
                {segments.map((sg) => (
                  <label key={sg} className="flex items-center gap-1">{sg}<NumIn className="w-14" value={sc.vehicles[sg] ?? 0} disabled={!editable}
                    onChange={(n) => setScenario(i, { ...sc, vehicles: { ...sc.vehicles, [sg]: Math.round(n) } })} /></label>
                ))}
              </div>
            </div>
          ))}
          {editable && (
            <Button variant="outline" size="sm" className="w-full" onClick={() => update((p) => ({
              ...p, pax_scenarios: [...p.pax_scenarios, { pax_paying: p.pax_paying + 2, tc_count: p.tc_count, rooming: structuredClone(p.rooming), vehicles: { ...p.vehicles }, staff: { ...p.staff } }],
            }))}><Plus className="mr-1 h-4 w-4" />Agregar escenario</Button>
          )}
          {result && result.scenarios.length > 0 && (
            <table className="w-full text-xs">
              <thead><tr className="text-muted-foreground"><th className="text-left">Pax+TC</th><th className="text-right">Total</th><th className="text-right">Por pax</th></tr></thead>
              <tbody>{result.scenarios.map((x, i) => (
                <tr key={i}><td>{x.pax_paying}+{x.tc_count}</td><td className="text-right">{money(x.total_price_usd)}</td><td className="text-right font-medium">{money(x.price_per_pax_usd)}</td></tr>
              ))}</tbody>
            </table>
          )}
        </Section>
      )}
    </Card>
  );
}

function RoomRow({ rt, paying, tc, disabled, onChange }: { rt: string; paying: number; tc: number; disabled: boolean; onChange: (k: "paying" | "tc", n: number) => void }) {
  return (
    <>
      <span className="font-mono text-xs">{rt}</span>
      <NumIn value={paying} disabled={disabled} onChange={(n) => onChange("paying", n)} />
      <NumIn value={tc} disabled={disabled} onChange={(n) => onChange("tc", n)} />
    </>
  );
}

function SegmentRow({ label, value, disabled, onChange, step, warn }: { label: string; value: number | undefined; disabled: boolean; onChange: (n: number) => void; step?: string; warn?: boolean }) {
  return (
    <>
      <span className={`text-xs ${warn ? "text-destructive" : ""}`}>{label}{warn ? " · falta" : ""}</span>
      <NumIn value={value ?? 0} step={step} disabled={disabled} onChange={onChange} />
    </>
  );
}
