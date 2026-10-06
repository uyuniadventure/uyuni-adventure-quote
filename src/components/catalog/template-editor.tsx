import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Clock, GripVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { db } from "@/lib/db";
import type { Enums, Tables } from "@/types/db";
import { canManageCatalog, useCurrentUser } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUSES, StatusBadge, cap } from "./shared";
import {
  CATEGORIES, DURATION_LABELS, Field, IT_MODALITIES, ROUTE_TYPES, SearchPicker, blockTitle, canEditCatalogRow, fetchBlocks, useLocationCodes,
} from "./kit";

export function TemplateEditor({ id, onClose, onCreated }: { id: string | null; onClose: () => void; onCreated: (id: string) => void }) {
  const isNew = id === "new";
  const { user, role } = useCurrentUser();
  const q = useQuery({
    queryKey: ["itinerary_template", id],
    enabled: !!id && !isNew,
    queryFn: async () => {
      const { data, error } = await db.from("itinerary_templates").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });
  const row = isNew ? null : q.data;
  const canEdit = canEditCatalogRow(role, user.id, row);

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-4xl">
        <SheetHeader>
          <SheetTitle>{isNew ? "Nueva plantilla" : row?.name ?? "Plantilla"}</SheetTitle>
          <SheetDescription className="font-mono text-xs">{row?.sku ?? "Itinerario reutilizable compuesto por bloques diarios."}</SheetDescription>
        </SheetHeader>
        {isNew ? (
          <div className="mt-4"><TemplateForm row={null} canEdit={canEdit} onSaved={onCreated} /></div>
        ) : !row ? (
          <p className="mt-6 text-sm text-muted-foreground">{q.isError ? "No se pudo cargar la plantilla." : "Cargando…"}</p>
        ) : (
          <Tabs defaultValue="dias" className="mt-4">
            <TabsList>
              <TabsTrigger value="dias">Días</TabsTrigger>
              <TabsTrigger value="datos">Datos</TabsTrigger>
            </TabsList>
            <TabsContent value="dias" className="mt-4"><TemplateDays template={row} canEdit={canEdit} /></TabsContent>
            <TabsContent value="datos" className="mt-4"><TemplateForm key={row.updated_at} row={row} canEdit={canEdit} onSaved={() => {}} /></TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}

const csv = (a: string[] | null | undefined) => (a ?? []).join(", ");
const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

function TemplateForm({ row, canEdit, onSaved }: { row: Tables<"itinerary_templates"> | null; canEdit: boolean; onSaved: (id: string) => void }) {
  const { user, role } = useCurrentUser();
  const manager = canManageCatalog(role);
  const qc = useQueryClient();
  const locs = useLocationCodes();
  const [f, setF] = useState({
    sku: row?.sku ?? "", name: row?.name ?? "", route_from: row?.route_from ?? "", route_to: row?.route_to ?? "",
    route_type: row?.route_type ?? ("ONEWAY" as Enums<"route_type">), days: String(row?.days ?? 1), nights: String(row?.nights ?? 0),
    modality: row?.modality ?? ("privado" as Enums<"itinerary_modality">), category: row?.category ?? ("COMFORT" as Enums<"tour_category">),
    hotel_combo: row?.hotel_combo ?? "", countries: csv(row?.countries), main_places: csv(row?.main_places),
    meals_summary: row?.meals_summary ?? "", includes_guide: row?.includes_guide ?? false, guide_language: row?.guide_language ?? "",
    includes_staff_lodging_meals: row?.includes_staff_lodging_meals ?? false, status: row?.status ?? ("pendiente" as Enums<"catalog_status">),
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const suggested = f.route_from && f.route_to ? `${f.route_from}${f.route_to}-${f.days}D${f.nights}N${f.hotel_combo ? `-${f.hotel_combo}` : ""}` : "";

  const skuFormatOk = SKU_RE.test(f.sku.trim());

  const save = useMutation({
    mutationFn: async () => {
      const days = Number(f.days), nights = Number(f.nights);
      if (!f.sku.trim() || !f.name.trim()) throw new Error("SKU y nombre son obligatorios.");
      if (!(days > 0) || nights < 0 || nights > days) throw new Error("Días debe ser > 0 y noches entre 0 y días.");
      let dup = db.from("itinerary_templates").select("id", { count: "exact", head: true }).eq("sku", f.sku.trim());
      if (row) dup = dup.neq("id", row.id);
      const { count, error: dupErr } = await dup;
      if (dupErr) throw dupErr;
      if (count) throw new Error("Este SKU ya existe");
      const values = {
        sku: f.sku.trim(), name: f.name.trim(), route_from: f.route_from || null, route_to: f.route_to || null,
        route_type: f.route_type, days, nights, modality: f.modality, category: f.category,
        hotel_combo: f.hotel_combo.trim() || null, countries: list(f.countries), main_places: list(f.main_places),
        meals_summary: f.meals_summary.trim() || null, includes_guide: f.includes_guide, guide_language: f.guide_language.trim() || null,
        includes_staff_lodging_meals: f.includes_staff_lodging_meals, status: manager ? f.status : ("pendiente" as const),
      };
      if (row) {
        const { error } = await db.from("itinerary_templates").update(values).eq("id", row.id);
        if (error) throw error;
        return row.id;
      }
      const { data, error } = await db.from("itinerary_templates").insert({ ...values, created_by: user.id }).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => {
      toast.success("Plantilla guardada.");
      qc.invalidateQueries({ queryKey: ["itinerary_templates"] });
      qc.invalidateQueries({ queryKey: ["itinerary_template", id] });
      qc.invalidateQueries({ queryKey: ["import-review"] });
      onSaved(id);
    },
    onError: (e: Error) => toast.error(e.message.includes("duplicate") ? "Este SKU ya existe" : e.message),
  });

  const locSelect = (k: "route_from" | "route_to") => (
    <Select value={f[k] || "none"} onValueChange={(v) => set(k, v === "none" ? "" : v)} disabled={!canEdit}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">—</SelectItem>
        {locs.data?.map((l) => <SelectItem key={l.code} value={l.code}>{l.code} · {l.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
  const sel = <K extends "route_type" | "modality" | "category">(k: K, opts: string[]) => (
    <Select value={f[k]} onValueChange={(v) => set(k, v as (typeof f)[K])} disabled={!canEdit}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{opts.map((o) => <SelectItem key={o} value={o}>{k === "modality" ? cap(o) : o}</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="SKU" className="sm:col-span-2">
          <div className="flex gap-2">
            <Input value={f.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} placeholder="UYUSPA-3D2N-PTd" className="font-mono" disabled={!canEdit} />
            {canEdit && suggested && suggested !== f.sku && <Button type="button" variant="outline" onClick={() => set("sku", suggested)}>Usar {suggested}</Button>}
          </div>
          {f.sku.trim() && !skuFormatOk && (
            <p className="mt-1 flex items-center gap-1 text-xs text-brand-orange-deep"><AlertTriangle className="h-3.5 w-3.5" />El SKU no sigue el formato {"{ORIGEN}{DESTINO}-{N}D{N}N-{COMBO}[-SUFIJOS]"} (ej. UYUSPA-3D2N-PTd). Puedes guardar igual.</p>
          )}
        </Field>
        <Field label="Estado">
          {manager ? (
            <Select value={f.status} onValueChange={(v) => set("status", v as Enums<"catalog_status">)} disabled={!canEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{cap(s)}</SelectItem>)}</SelectContent>
            </Select>
          ) : <div className="pt-1"><StatusBadge status={f.status} /></div>}
        </Field>
        <Field label="Nombre" className="sm:col-span-3"><Input value={f.name} onChange={(e) => set("name", e.target.value)} disabled={!canEdit} /></Field>
        <Field label="Origen">{locSelect("route_from")}</Field>
        <Field label="Destino">{locSelect("route_to")}</Field>
        <Field label="Tipo de ruta">{sel("route_type", ROUTE_TYPES)}</Field>
        <Field label="Días"><Input type="number" min={1} value={f.days} onChange={(e) => set("days", e.target.value)} disabled={!canEdit} /></Field>
        <Field label="Noches"><Input type="number" min={0} value={f.nights} onChange={(e) => set("nights", e.target.value)} disabled={!canEdit} /></Field>
        <Field label="Combo hoteles"><Input value={f.hotel_combo} onChange={(e) => set("hotel_combo", e.target.value)} placeholder="MPF" disabled={!canEdit} /></Field>
        <Field label="Categoría">{sel("category", CATEGORIES)}</Field>
        <Field label="Modalidad">{sel("modality", IT_MODALITIES)}</Field>
        <Field label="Comidas"><Input value={f.meals_summary} onChange={(e) => set("meals_summary", e.target.value)} placeholder="2B,3L,2D" disabled={!canEdit} /></Field>
        <Field label="Países (coma)"><Input value={f.countries} onChange={(e) => set("countries", e.target.value)} placeholder="Bolivia, Chile" disabled={!canEdit} /></Field>
        <Field label="Lugares principales (coma)" className="sm:col-span-2"><Input value={f.main_places} onChange={(e) => set("main_places", e.target.value)} disabled={!canEdit} /></Field>
        <Field label="Idioma del guía"><Input value={f.guide_language} onChange={(e) => set("guide_language", e.target.value)} placeholder="ES / EN / IT" disabled={!canEdit} /></Field>
        <label className="flex items-center gap-2 pt-6 text-sm"><Checkbox checked={f.includes_guide} onCheckedChange={(v) => set("includes_guide", v === true)} disabled={!canEdit} />Incluye guía</label>
        <label className="flex items-center gap-2 pt-6 text-sm"><Checkbox checked={f.includes_staff_lodging_meals} onCheckedChange={(v) => set("includes_staff_lodging_meals", v === true)} disabled={!canEdit} />Incluye alojamiento/comidas staff</label>
      </div>
      {canEdit && <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Guardando…" : row ? "Guardar cambios" : "Crear plantilla"}</Button>}
    </div>
  );
}

interface DayRow { key: string; block_id: string; code: string; title: string }

function TemplateDays({ template, canEdit }: { template: Tables<"itinerary_templates">; canEdit: boolean }) {
  const qc = useQueryClient();
  const key = ["template_days", template.id];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await db
        .from("template_days")
        .select("id, day_number, block_id, day_blocks(code, day_block_translations(lang, title))")
        .eq("template_id", template.id)
        .order("day_number");
      if (error) throw error;
      return data;
    },
  });
  const [rows, setRows] = useState<DayRow[]>([]);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!q.data) return;
    setRows(q.data.map((d) => ({ key: d.id, block_id: d.block_id, code: d.day_blocks?.code ?? "?", title: d.day_blocks ? blockTitle(d.day_blocks) : "Bloque no visible" })));
    setDirty(false);
  }, [q.data]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    setRows((r) => arrayMove(r, r.findIndex((x) => x.key === e.active.id), r.findIndex((x) => x.key === e.over!.id)));
    setDirty(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const del = await db.from("template_days").delete().eq("template_id", template.id);
      if (del.error) throw del.error;
      if (rows.length) {
        const ins = await db.from("template_days").insert(rows.map((r, i) => ({ template_id: template.id, day_number: i + 1, block_id: r.block_id })));
        if (ins.error) throw ins.error;
        if (rows.length !== template.days) {
          const nights = Math.min(template.nights, rows.length);
          const up = await db.from("itinerary_templates").update({ days: rows.length, nights }).eq("id", template.id);
          if (up.error) throw up.error;
        }
      }
    },
    onSuccess: () => {
      toast.success("Días guardados.");
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["itinerary_template", template.id] });
      qc.invalidateQueries({ queryKey: ["itinerary_templates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {canEdit && (
          <SearchPicker className="w-full sm:w-[380px]" placeholder="Añadir día con un bloque…" queryKey="blocks" fetcher={fetchBlocks}
            onPick={(o) => { if (!o) return; setRows((r) => [...r, { key: crypto.randomUUID(), block_id: o.id, code: o.sub ?? "", title: o.label }]); setDirty(true); }} />
        )}
        <div className="ml-auto flex items-center gap-2">
          {dirty && <span className="text-xs text-brand-orange-deep">Cambios sin guardar</span>}
          {canEdit && <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending}>{save.isPending ? "Guardando…" : "Guardar días"}</Button>}
        </div>
      </div>
      {q.isLoading ? <p className="text-sm text-muted-foreground">Cargando…</p> : rows.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">Sin días. Añade bloques diarios para armar el itinerario.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={rows.map((r) => r.key)} strategy={verticalListSortingStrategy}>
            <ol className="space-y-2">
              {rows.map((r, i) => (
                <DayItem key={r.key} row={r} n={i + 1} canEdit={canEdit} onRemove={() => { setRows((x) => x.filter((y) => y.key !== r.key)); setDirty(true); }} />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function DayItem({ row, n, canEdit, onRemove }: { row: DayRow; n: number; canEdit: boolean; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.key, disabled: !canEdit });
  const [open, setOpen] = useState(false);
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`space-y-3 rounded-md border bg-card p-3 ${isDragging ? "z-10 shadow-lg ring-2 ring-brand-orange/40" : ""}`}>
      <div className="flex items-center gap-3">
        {canEdit && (
          <button type="button" className="cursor-grab touch-none text-muted-foreground hover:text-foreground" aria-label="Arrastrar" {...attributes} {...listeners}>
            <GripVertical className="h-5 w-5" />
          </button>
        )}
        <span className="flex h-8 w-14 shrink-0 items-center justify-center rounded bg-primary text-xs font-semibold text-primary-foreground">Día {n}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-foreground">{row.title}</div>
          <div className="truncate font-mono text-xs text-muted-foreground">{row.code}</div>
        </div>
        <Button size="icon" variant="ghost" aria-label={open ? "Ocultar itinerario" : "Ver itinerario"} onClick={() => setOpen((v) => !v)}>
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        {canEdit && <Button size="icon" variant="ghost" onClick={onRemove}><Trash2 className="h-4 w-4" /></Button>}
      </div>
      {open && <DayBlockPreview blockId={row.block_id} />}
    </li>
  );
}

interface BlockDetail {
  mods: { id: string; time: string | null; name: string; code: string; duration: Enums<"activity_duration"> }[];
  items: { id: string; qty: number; included: boolean; optional: boolean; name: string; sku: string | null; type: Enums<"service_type"> | null }[];
  texts: { lang: string; title: string; description: string; includes: string | null; excludes: string | null }[];
}

function DayBlockPreview({ blockId }: { blockId: string }) {
  const q = useQuery({
    queryKey: ["day_block_preview", blockId],
    enabled: !!blockId,
    queryFn: async (): Promise<BlockDetail> => {
      const [md, it, tr] = await Promise.all([
        db.from("day_block_modules").select("id, time, activity_modules(code, name, duration)").eq("block_id", blockId).order("order"),
        db.from("day_block_items").select("id, qty, included, is_optional, services(sku, name, type)").eq("block_id", blockId).order("created_at"),
        db.from("day_block_translations").select("lang, title, description, includes, excludes").eq("block_id", blockId),
      ]);
      for (const r of [md, it, tr]) if (r.error) throw r.error;
      return {
        mods: (md.data ?? []).map((m) => ({
          id: m.id, time: m.time, code: m.activity_modules?.code ?? "?", name: m.activity_modules?.name ?? "Módulo eliminado",
          duration: m.activity_modules?.duration ?? ("FD" as Enums<"activity_duration">),
        })),
        items: (it.data ?? []).map((x) => ({
          id: x.id, qty: x.qty, included: x.included, optional: x.is_optional,
          name: x.services?.name ?? "Servicio eliminado", sku: x.services?.sku ?? null, type: x.services?.type ?? null,
        })),
        texts: tr.data ?? [],
      };
    },
  });

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Cargando itinerario…</p>;
  if (q.isError) return <p className="text-sm text-destructive">No se pudo cargar el detalle del bloque.</p>;
  const d = q.data!;
  const es = d.texts.find((t) => t.lang === "es") ?? d.texts[0];

  return (
    <div className="space-y-3 rounded-md bg-muted/30 p-3">
      {es?.description && <p className="text-sm text-muted-foreground">{es.description}</p>}
      {d.mods.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Itinerario del día</p>
          <ol className="space-y-1">
            {d.mods.map((m) => (
              <li key={m.id} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 flex w-16 shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground">
                  {m.time ? <><Clock className="h-3 w-3" />{m.time.slice(0, 5)}</> : "—"}
                </span>
                <span className="min-w-0"><span className="font-medium text-foreground">{m.name}</span>{" "}
                  <span className="font-mono text-xs text-muted-foreground">{m.code} · {DURATION_LABELS[m.duration]}</span></span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {d.items.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Servicios del día</p>
          <ul className="space-y-1">
            {d.items.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-foreground">{x.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{x.sku}{x.qty > 1 ? ` ×${x.qty}` : ""}</span>
                <Badge variant="secondary" className="font-normal">{cap(x.type ?? "")}</Badge>
                {x.included ? <Badge className="font-normal">Incluido</Badge> : <Badge variant="outline" className="font-normal text-brand-orange-deep">No incluido</Badge>}
                {x.optional && <Badge variant="secondary" className="font-normal">Opcional</Badge>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(d.mods.length === 0 && d.items.length === 0) && (
        <p className="text-sm text-muted-foreground">El bloque no tiene módulos ni servicios asignados.</p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Incluye</p>
          <p className="whitespace-pre-line text-sm text-foreground">{es?.includes?.trim() || "—"}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">No incluye</p>
          <p className="whitespace-pre-line text-sm text-foreground">{es?.excludes?.trim() || "—"}</p>
        </div>
      </div>
      {es && !["es"].includes(es.lang) && <p className="text-xs text-muted-foreground">Textos mostrados en idioma: {es.lang.toUpperCase()} (sin traducción al español).</p>}
    </div>
  );
}
