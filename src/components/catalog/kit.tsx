import { useEffect, useState, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Languages, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import type { Enums, Tables } from "@/types/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AppRole } from "@/hooks/use-auth";
import { canManageCatalog } from "@/hooks/use-auth";

export const ALL = "all";
export const LANGS = [
  ["es", "Español"],
  ["en", "English"],
  ["it", "Italiano"],
] as const;
export type Lang = (typeof LANGS)[number][0];

export const DURATIONS: Enums<"activity_duration">[] = ["HD_AM", "HD_PM", "FD", "NOCHE", "TRASLADO"];
export const DURATION_LABELS: Record<Enums<"activity_duration">, string> = {
  HD_AM: "Medio día AM", HD_PM: "Medio día PM", FD: "Día completo", NOCHE: "Noche", TRASLADO: "Traslado",
};
export const IT_MODALITIES: Enums<"itinerary_modality">[] = ["privado", "compartido", "grupo"];
export const CATEGORIES: Enums<"tour_category">[] = ["BUDGET", "COMFORT", "VIP", "MIXTO"];
export const ROUTE_TYPES: Enums<"route_type">[] = ["ROUNDTRIP", "ONEWAY"];

/** Cliente sin tipar para tablas elegidas dinámicamente (traducciones). */
const loose = db as unknown as SupabaseClient;

export function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

/** SPEC §3: admin/operación editan todo; vendedor solo lo suyo en estado pendiente. */
export function canEditCatalogRow(
  role: AppRole | null,
  userId: string,
  row?: { status: Enums<"catalog_status">; created_by: string | null } | null,
) {
  if (canManageCatalog(role)) return true;
  if (!row) return role === "vendedor";
  return role === "vendedor" && row.status === "pendiente" && row.created_by === userId;
}

export const ilikeTerm = (t: string) => t.replace(/[%,()]/g, " ");

export function Filter({ value, onChange, placeholder, options, wide }: {
  value: string; onChange: (v: string) => void; placeholder: string; options: [string, string][]; wide?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={wide ? "w-[220px]" : "w-[150px]"}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}: todos</SelectItem>
        {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export const primaryBtn = "bg-brand-orange text-brand-navy hover:bg-brand-orange-deep hover:text-white";

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/* ---------------- Listas de referencia ---------------- */

export function usePlaces() {
  return useQuery({
    queryKey: ["places"],
    queryFn: async () => {
      const { data, error } = await db.from("places").select("id, name, country").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useLocationCodes() {
  return useQuery({
    queryKey: ["location_codes"],
    queryFn: async () => {
      const { data, error } = await db.from("location_codes").select("code, name").order("code");
      if (error) throw error;
      return data;
    },
  });
}

export function useHotelCodes() {
  return useQuery({
    queryKey: ["hotel_codes"],
    queryFn: async () => {
      const { data, error } = await db.from("hotel_codes").select("code, name").order("code");
      if (error) throw error;
      return data;
    },
  });
}

/* ---------------- Selector con búsqueda en servidor ---------------- */

export interface PickOption { id: string; label: string; sub?: string }

export function SearchPicker({ placeholder, value, onPick, fetcher, queryKey, className, disabled }: {
  placeholder: string;
  value?: PickOption | null;
  onPick: (o: PickOption | null) => void;
  fetcher: (term: string) => Promise<PickOption[]>;
  queryKey: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const t = useDebounced(term.trim());
  const q = useQuery({ queryKey: ["picker", queryKey, t], enabled: open, queryFn: () => fetcher(t) });
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-label={placeholder} aria-expanded={open} disabled={disabled} className={`justify-between font-normal ${className ?? "w-full"}`}>
          <span className="truncate">{value ? value.label : <span className="text-muted-foreground">{placeholder}</span>}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput value={term} onValueChange={setTerm} placeholder="Buscar…" />
          <CommandList>
            {q.isLoading ? <div className="p-3 text-sm text-muted-foreground">Buscando…</div> : <CommandEmpty>Sin resultados.</CommandEmpty>}
            <CommandGroup>
              {value && (
                <CommandItem onSelect={() => { onPick(null); setOpen(false); }}>
                  <span className="text-muted-foreground">Quitar selección</span>
                </CommandItem>
              )}
              {q.data?.map((o) => (
                <CommandItem key={o.id} value={o.id} onSelect={() => { onPick(o); setOpen(false); }}>
                  <Check className={`mr-2 h-4 w-4 ${value?.id === o.id ? "opacity-100" : "opacity-0"}`} />
                  <div className="min-w-0">
                    <div className="truncate text-sm">{o.label}</div>
                    {o.sub && <div className="truncate font-mono text-xs text-muted-foreground">{o.sub}</div>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export async function fetchServices(term: string, type?: Enums<"service_type">): Promise<PickOption[]> {
  let q = db.from("services").select("id, sku, name").neq("status", "inactivo").order("sku").limit(30);
  if (term) q = q.or(`sku.ilike.%${ilikeTerm(term)}%,name.ilike.%${ilikeTerm(term)}%`);
  if (type) q = q.eq("type", type);
  const { data, error } = await q;
  if (error) throw error;
  return data.map((s) => ({ id: s.id, label: s.name, sub: s.sku }));
}

export async function fetchModules(term: string): Promise<PickOption[]> {
  let q = db.from("activity_modules").select("id, code, name").neq("status", "inactivo").order("code").limit(30);
  if (term) q = q.or(`code.ilike.%${ilikeTerm(term)}%,name.ilike.%${ilikeTerm(term)}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data.map((m) => ({ id: m.id, label: m.name, sub: m.code }));
}

export async function fetchBlocks(term: string): Promise<PickOption[]> {
  let q = db
    .from("day_blocks")
    .select("id, code, route_from, route_to, day_block_translations(lang, title)")
    .neq("status", "inactivo")
    .order("code")
    .limit(30);
  if (term) q = q.ilike("code", `%${ilikeTerm(term)}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data.map((b) => ({ id: b.id, label: blockTitle(b), sub: b.code }));
}

export function blockTitle(b: { code: string; day_block_translations?: { lang: string; title: string }[] | null }) {
  const tr = b.day_block_translations ?? [];
  return (tr.find((t) => t.lang === "es") ?? tr[0])?.title || b.code;
}

/* ---------------- Traducciones por idioma ---------------- */

type TranslationKind = "activity_module" | "day_block";
interface TrRow {
  id?: string; lang: string; title: string; description: string;
  includes?: string | null; excludes?: string | null; reviewed: boolean;
}

export function TranslationsPanel({ kind, parentId, canEdit }: { kind: TranslationKind; parentId: string; canEdit: boolean }) {
  const table = kind === "day_block" ? "day_block_translations" : "activity_module_translations";
  const fk = kind === "day_block" ? "block_id" : "module_id";
  const qc = useQueryClient();
  const key = [table, parentId];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await loose.from(table).select("*").eq(fk, parentId);
      if (error) throw error;
      return data as TrRow[];
    },
  });

  const translate = useMutation({
    mutationFn: async (language: Lang) => {
      const { data, error } = await db.functions.invoke("translate-block", { body: { kind, id: parentId, language } });
      if (error) {
        let msg = error.message;
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === "function") {
          try { msg = (await ctx.json()).error ?? msg; } catch { /* ignore */ }
        }
        throw new Error(msg);
      }
      return data as { warning?: string };
    },
    onSuccess: (d) => {
      toast.success(d?.warning ?? "Traducción generada.");
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e: Error) => toast.error(`No se pudo traducir: ${e.message}`),
  });

  return (
    <Tabs defaultValue="es">
      <TabsList>
        {LANGS.map(([l, label]) => {
          const row = q.data?.find((r) => r.lang === l);
          return (
            <TabsTrigger key={l} value={l} className="gap-1.5">
              {label}
              {row ? (!row.reviewed && <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" title="Sin revisar" />) : <span className="text-muted-foreground">·</span>}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {LANGS.map(([l]) => (
        <TabsContent key={l} value={l} className="mt-3">
          {q.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <TranslationForm
              key={`${l}-${q.dataUpdatedAt}`}
              kind={kind}
              lang={l}
              row={q.data?.find((r) => r.lang === l) ?? null}
              hasSource={!!q.data?.length}
              canEdit={canEdit}
              translating={translate.isPending && translate.variables === l}
              onTranslate={() => translate.mutate(l)}
              onSave={async (values) => {
                const { error } = await loose.from(table).upsert({ [fk]: parentId, lang: l, ...values }, { onConflict: `${fk},lang` });
                if (error) throw error;
                await qc.invalidateQueries({ queryKey: key });
              }}
            />
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function TranslationForm({ kind, lang, row, hasSource, canEdit, translating, onTranslate, onSave }: {
  kind: TranslationKind; lang: Lang; row: TrRow | null; hasSource: boolean; canEdit: boolean;
  translating: boolean; onTranslate: () => void; onSave: (v: Omit<TrRow, "id" | "lang">) => Promise<void>;
}) {
  const [title, setTitle] = useState(row?.title ?? "");
  const [description, setDescription] = useState(row?.description ?? "");
  const [includes, setIncludes] = useState(row?.includes ?? "");
  const [excludes, setExcludes] = useState(row?.excludes ?? "");
  const [reviewed, setReviewed] = useState(row?.reviewed ?? lang === "es");
  const [saving, setSaving] = useState(false);

  const save = async (): Promise<void> => {
    if (!title.trim() || !description.trim()) { toast.error("Título y descripción son obligatorios."); return; }
    setSaving(true);
    try {
      await onSave({
        title: title.trim(), description: description.trim(), reviewed,
        ...(kind === "day_block" ? { includes: includes.trim() || null, excludes: excludes.trim() || null } : {}),
      });
      toast.success("Texto guardado.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {!row && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
          <span>Aún no hay texto en este idioma.</span>
          {lang !== "es" && hasSource && (
            <Button size="sm" variant="outline" onClick={onTranslate} disabled={translating || !canEdit}>
              {translating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Languages className="mr-1 h-4 w-4" />}Traducir
            </Button>
          )}
        </div>
      )}
      {row && !row.reviewed && <Badge variant="outline" className="border-brand-orange/40 text-brand-orange-deep">Pendiente de revisión</Badge>}
      <Field label="Título"><Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={!canEdit} /></Field>
      <Field label="Descripción para el cliente">
        <Textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)} disabled={!canEdit} />
      </Field>
      {kind === "day_block" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Incluye"><Textarea rows={3} value={includes} onChange={(e) => setIncludes(e.target.value)} disabled={!canEdit} /></Field>
          <Field label="No incluye"><Textarea rows={3} value={excludes} onChange={(e) => setExcludes(e.target.value)} disabled={!canEdit} /></Field>
        </div>
      )}
      {canEdit && (
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={reviewed} onCheckedChange={(v) => setReviewed(v === true)} />Revisado
          </label>
          <Button size="sm" onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar texto"}</Button>
        </div>
      )}
    </div>
  );
}

export type ModuleRow = Tables<"activity_modules">;
