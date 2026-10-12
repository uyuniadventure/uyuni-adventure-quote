import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, FilePlus2, Plus } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { createEmptyQuote, createQuoteFromTemplate, type QuoteBasics } from "@/lib/quotes";
import { suggestTemplates, templateImportWarnings } from "@/lib/quotes/suggestions";
import type { Enums } from "@/types/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CATEGORIES, Field, IT_MODALITIES, LANGS, PageHeader, SearchPicker, ilikeTerm, primaryBtn, useLocationCodes, type PickOption,
} from "@/components/catalog/kit";
import { cap } from "@/components/catalog/shared";
import { latestFx } from "./quote-ops";

interface Basics {
  client: PickOption | null;
  client_type: Enums<"client_type">;
  language: string;
  start_date: string;
  pax_paying: string;
  tc_count: string;
  modality: Enums<"itinerary_modality">;
  route_from: string;
  route_to: string;
  days: string;
  category: Enums<"tour_category">;
}

export function QuoteCreator({ onCreated }: { onCreated: (id: string) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [b, setB] = useState<Basics>({
    client: null, client_type: "B2C", language: "es", start_date: "", pax_paying: "2", tc_count: "0",
    modality: "privado", route_from: "", route_to: "", days: "", category: "COMFORT",
  });
  const set = <K extends keyof Basics>(k: K, v: Basics[K]) => setB((p) => ({ ...p, [k]: v }));
  const [newClient, setNewClient] = useState(false);
  const locs = useLocationCodes();

  const valid = b.client && b.start_date && Number(b.pax_paying) > 0 && Number(b.tc_count) >= 0;

  const pickClient = async (o: PickOption | null) => {
    set("client", o);
    if (!o) return;
    const { data } = await db.from("clients").select("type, language").eq("id", o.id).single();
    if (data) setB((p) => ({ ...p, client: o, client_type: data.type, language: LANGS.some(([l]) => l === data.language) ? data.language : p.language }));
  };

  const locSelect = (k: "route_from" | "route_to") => (
    <Select value={b[k] || "none"} onValueChange={(v) => set(k, v === "none" ? "" : v)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Cualquiera</SelectItem>
        {locs.data?.map((l) => <SelectItem key={l.code} value={l.code}>{l.code} · {l.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Nueva cotización" subtitle={step === 1 ? "Paso 1 de 3 · Datos básicos" : "Paso 2 de 3 · Elige una plantilla o empieza desde cero"} />
      {step === 1 ? (
        <Card className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Cliente" className="sm:col-span-2">
              <div className="flex gap-2">
                <SearchPicker placeholder="Buscar cliente…" value={b.client} onPick={pickClient} queryKey="clients"
                  fetcher={async (t) => {
                    let q = db.from("clients").select("id, name, type, email").order("name").limit(30);
                    if (t) q = q.or(`name.ilike.%${ilikeTerm(t)}%,email.ilike.%${ilikeTerm(t)}%`);
                    const { data, error } = await q;
                    if (error) throw error;
                    return data.map((c) => ({ id: c.id, label: c.name, sub: `${c.type}${c.email ? ` · ${c.email}` : ""}` }));
                  }} />
                <Button variant="outline" onClick={() => setNewClient(true)}><Plus className="mr-1 h-4 w-4" />Nuevo</Button>
              </div>
            </Field>
            <Field label="Tipo">
              <Select value={b.client_type} onValueChange={(v) => set("client_type", v as Enums<"client_type">)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="B2C">B2C · Cliente final</SelectItem><SelectItem value="B2B">B2B · Agencia</SelectItem></SelectContent>
              </Select>
            </Field>
            <Field label="Idioma">
              <Select value={b.language} onValueChange={(v) => set("language", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LANGS.map(([l, n]) => <SelectItem key={l} value={l}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Fecha de inicio"><Input aria-label="Fecha de inicio" type="date" value={b.start_date} onChange={(e) => set("start_date", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Pax pagantes"><Input aria-label="Pax pagantes" type="number" min={1} value={b.pax_paying} onChange={(e) => set("pax_paying", e.target.value)} /></Field>
              <Field label="TC (liberados)"><Input aria-label="TC (liberados)" type="number" min={0} value={b.tc_count} onChange={(e) => set("tc_count", e.target.value)} /></Field>
            </div>
            <Field label="Modalidad">
              <Select value={b.modality} onValueChange={(v) => set("modality", v as Enums<"itinerary_modality">)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{IT_MODALITIES.map((m) => <SelectItem key={m} value={m}>{cap(m)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Origen">{locSelect("route_from")}</Field>
            <Field label="Destino">{locSelect("route_to")}</Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Días disponibles"><Input type="number" min={1} value={b.days} onChange={(e) => set("days", e.target.value)} placeholder="—" /></Field>
              <Field label="Categoría">
                <Select value={b.category} onValueChange={(v) => set("category", v as Enums<"tour_category">)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
          </div>
          <div className="flex justify-end">
            <Button className={primaryBtn} disabled={!valid} onClick={() => setStep(2)}>Ver plantillas sugeridas<ArrowRight className="ml-1 h-4 w-4" /></Button>
          </div>
        </Card>
      ) : (
        <TemplateStep basics={b} onBack={() => setStep(1)} onCreated={onCreated} />
      )}
      <NewClientDialog open={newClient} onOpenChange={setNewClient} defaults={b} onCreated={(c) => { void pickClient(c); }} />
    </div>
  );
}

export function TemplateStep({ basics: b, onBack, onCreated }: { basics: Basics; onBack: () => void; onCreated: (id: string) => void }) {
  const q = useQuery({
    queryKey: ["quote-suggestions", b.route_from, b.route_to, b.days, b.category, b.modality],
    queryFn: () => suggestTemplates(b),
    retry: 1,
  });

  const create = useMutation({
    mutationFn: async (templateId: string | null) => {
      const fx = await latestFx();
      const days = Number(b.days) || 1;
      const basics: QuoteBasics = {
        client_id: b.client!.id, client_type: b.client_type, language: b.language, category: b.category,
        tour_sku: `${b.route_from || "XXX"}${b.route_to || "XXX"}-${days}D${Math.max(0, days - 1)}N`,
        start_date: b.start_date, pax_paying: Number(b.pax_paying), tc_count: Number(b.tc_count),
        rooming: { paying: {}, tc: {} }, vehicles: {},
        fx_snapshot: fx, rounding_rule: { increment: 1, mode: "none" },
        pax_scenarios: [],
        document_snapshot: { modality: b.modality, route_from: b.route_from || null, route_to: b.route_to || null, days_available: Number(b.days) || null },
      };
      const quote = templateId ? await createQuoteFromTemplate(templateId, basics) : await createEmptyQuote(basics);
      return quote.id;
    },
    onSuccess: (id) => { toast.success("Borrador creado."); onCreated(id); },
    onError: (e: Error) => toast.error(`No se pudo crear la cotización: ${e.message}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" />Datos básicos</Button>
        <Button variant="outline" disabled={create.isPending} onClick={() => create.mutate(null)}><FilePlus2 className="mr-1 h-4 w-4" />Empezar desde cero</Button>
      </div>
      {create.isPending && <p className="text-sm text-muted-foreground">Creando borrador y copiando servicios de la plantilla…</p>}
      {q.isLoading && <p className="text-sm text-muted-foreground">Buscando plantillas…</p>}
      {q.isError && <div role="alert" className="space-y-2 rounded-md border p-4">
        <p className="text-sm text-destructive">{q.error.message}</p>
        <Button variant="outline" disabled={q.isFetching} onClick={() => void q.refetch()}>Reintentar</Button>
      </div>}
      {!q.isError && q.data?.length === 0 && <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No hay plantillas activas o pendientes disponibles para tu usuario. Empieza desde cero.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {q.data?.map((t) => {
          const built = (t.template_days as unknown as { count: number }[])[0]?.count ?? 0;
          const defaults = (t.quote_defaults ?? {}) as { pax_paying?: number; tc_count?: number };
          const warnings = templateImportWarnings(t.import_warnings);
          const incompatible = defaults.pax_paying != null && (Number(b.pax_paying) !== defaults.pax_paying || Number(b.tc_count) !== defaults.tc_count);
          return (
            <Card key={t.id} role="group" aria-label={`Plantilla ${t.sku}`} className="flex flex-col gap-2 p-4">
              <div className="font-mono text-xs text-muted-foreground">{t.sku}</div>
              <div className="font-medium text-foreground">{t.name}</div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={t.category === b.category ? "default" : "outline"}>{t.category}</Badge>
                <Badge variant="secondary">{t.days}D{t.nights}N</Badge>
                <Badge variant="secondary">{t.route_from ?? "—"} → {t.route_to ?? "—"}</Badge>
                <Badge variant={t.modality === b.modality ? "default" : "outline"}>{cap(t.modality)}</Badge>
                {t.meals_summary && <Badge variant="secondary">{t.meals_summary}</Badge>}
                {t.status === "pendiente" && <Badge variant="outline" className="border-brand-orange-deep text-brand-orange-deep">Pendiente de revisión</Badge>}
                {Number(b.days) > 0 && t.days !== Number(b.days) && <Badge variant="outline">Duración distinta</Badge>}
              </div>
              {t.hotel_combo && <p className="font-mono text-xs text-muted-foreground">Hoteles: {t.hotel_combo}</p>}
              {warnings.length > 0 && <ul aria-label="Advertencias de importación" className="list-inside list-disc text-xs text-brand-orange-deep">
                {warnings.map((warning, index) => <li key={index}>{warning}</li>)}
              </ul>}
              {defaults.pax_paying != null && <p className="text-xs text-muted-foreground">Configuración de referencia: {defaults.pax_paying} pasajeros + {defaults.tc_count} TC, con habitaciones y staff cargados.</p>}
              {incompatible && <p className="text-xs text-brand-orange-deep">Vuelve a los datos básicos para usar el escenario de referencia.</p>}
              {built !== t.days && <p className="text-xs text-brand-orange-deep">Solo {built} de {t.days} días armados.</p>}
              <Button size="sm" className="mt-auto self-end" disabled={create.isPending || incompatible} onClick={() => create.mutate(t.id)}>Usar plantilla</Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function NewClientDialog({ open, onOpenChange, defaults, onCreated }: {
  open: boolean; onOpenChange: (o: boolean) => void; defaults: Basics; onCreated: (c: PickOption) => void;
}) {
  const qc = useQueryClient();
  const [f, setF] = useState({ name: "", contact: "", email: "", country: "" });
  const save = useMutation({
    mutationFn: async () => {
      if (!f.name.trim()) throw new Error("El nombre es obligatorio.");
      if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) throw new Error("Email inválido.");
      const { data, error } = await db.from("clients").insert({
        name: f.name.trim().slice(0, 200), contact: f.contact.trim() || null, email: f.email.trim() || null,
        country: f.country.trim() || null, type: defaults.client_type, language: defaults.language,
      }).select("id, name, type").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ["picker", "clients"] });
      onCreated({ id: c.id, label: c.name, sub: c.type });
      setF({ name: "", contact: "", email: "", country: "" });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nuevo cliente ({defaults.client_type})</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Field label="Nombre / agencia"><Input value={f.name} maxLength={200} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Contacto"><Input value={f.contact} maxLength={200} onChange={(e) => setF({ ...f, contact: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email"><Input type="email" value={f.email} maxLength={255} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="País"><Input value={f.country} maxLength={100} onChange={(e) => setF({ ...f, country: e.target.value })} /></Field>
          </div>
        </div>
        <DialogFooter><Button onClick={() => save.mutate()} disabled={save.isPending}>Crear cliente</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
