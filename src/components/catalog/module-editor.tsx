import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import type { Enums, Tables } from "@/types/db";
import { canManageCatalog, useCurrentUser } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MODALITIES, STATUSES, StatusBadge, cap } from "./shared";
import {
  DURATIONS, DURATION_LABELS, Field, SearchPicker, TranslationsPanel, canEditCatalogRow, fetchServices, usePlaces,
} from "./kit";

/** null = usa el valor por defecto del servicio. */
export function TriState({ value, onChange, disabled }: { value: boolean | null; onChange: (v: boolean | null) => void; disabled?: boolean }) {
  return (
    <Select value={value === null ? "d" : value ? "y" : "n"} onValueChange={(v) => onChange(v === "d" ? null : v === "y")} disabled={!!disabled}>
      <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="d">Por defecto</SelectItem>
        <SelectItem value="y">Sí</SelectItem>
        <SelectItem value="n">No</SelectItem>
      </SelectContent>
    </Select>
  );
}

/** id = "new" abre el alta. */
export function ModuleEditor({ id, onClose, onCreated }: { id: string | null; onClose: () => void; onCreated: (id: string) => void }) {
  const isNew = id === "new";
  const { user, role } = useCurrentUser();
  const q = useQuery({
    queryKey: ["activity_module", id],
    enabled: !!id && !isNew,
    queryFn: async () => {
      const { data, error } = await db.from("activity_modules").select("*, places(name)").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });
  const row = isNew ? null : q.data;
  const canEdit = canEditCatalogRow(role, user.id, row);

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>{isNew ? "Nuevo módulo de actividad" : row?.name ?? "Módulo"}</SheetTitle>
          <SheetDescription className="font-mono text-xs">{row?.code ?? "Actividad reutilizable compuesta por servicios del tarifario."}</SheetDescription>
        </SheetHeader>
        {isNew ? (
          <div className="mt-4"><ModuleForm row={null} canEdit={canEdit} onSaved={onCreated} /></div>
        ) : !row ? (
          <p className="mt-6 text-sm text-muted-foreground">{q.isError ? "No se pudo cargar el módulo." : "Cargando…"}</p>
        ) : (
          <Tabs defaultValue="datos" className="mt-4">
            <TabsList>
              <TabsTrigger value="datos">Datos</TabsTrigger>
              <TabsTrigger value="textos">Textos</TabsTrigger>
              <TabsTrigger value="servicios">Servicios</TabsTrigger>
            </TabsList>
            <TabsContent value="datos" className="mt-4"><ModuleForm key={row.updated_at} row={row} canEdit={canEdit} onSaved={() => {}} /></TabsContent>
            <TabsContent value="textos" className="mt-4"><TranslationsPanel kind="activity_module" parentId={row.id} canEdit={canEdit} /></TabsContent>
            <TabsContent value="servicios" className="mt-4"><ModuleItems moduleId={row.id} canEdit={canEdit} /></TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ModuleForm({ row, canEdit, onSaved }: { row: Tables<"activity_modules"> | null; canEdit: boolean; onSaved: (id: string) => void }) {
  const { user, role } = useCurrentUser();
  const manager = canManageCatalog(role);
  const qc = useQueryClient();
  const places = usePlaces();
  const [f, setF] = useState({
    code: row?.code ?? "",
    name: row?.name ?? "",
    place_id: row?.place_id ?? "",
    duration: row?.duration ?? ("FD" as Enums<"activity_duration">),
    default_time: row?.default_time?.slice(0, 5) ?? "",
    modality: row?.modality ?? ("ambos" as Enums<"service_modality">),
    status: row?.status ?? ("pendiente" as Enums<"catalog_status">),
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      if (!f.code.trim() || !f.name.trim()) throw new Error("Código y nombre son obligatorios.");
      const values = {
        code: f.code.trim().toUpperCase(), name: f.name.trim(), place_id: f.place_id || null, duration: f.duration,
        default_time: f.default_time || null, modality: f.modality, status: manager ? f.status : ("pendiente" as const),
      };
      if (row) {
        const { error } = await db.from("activity_modules").update(values).eq("id", row.id);
        if (error) throw error;
        return row.id;
      }
      const { data, error } = await db.from("activity_modules").insert({ ...values, created_by: user.id }).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => {
      toast.success("Módulo guardado.");
      qc.invalidateQueries({ queryKey: ["activity_modules"] });
      qc.invalidateQueries({ queryKey: ["activity_module", id] });
      qc.invalidateQueries({ queryKey: ["import-review"] });
      onSaved(id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Código"><Input value={f.code} onChange={(e) => set("code", e.target.value)} placeholder="MOD_SPA_VALLE_LUNA_HD" disabled={!canEdit} /></Field>
        <Field label="Nombre interno"><Input value={f.name} onChange={(e) => set("name", e.target.value)} disabled={!canEdit} /></Field>
        <Field label="Lugar">
          <Select value={f.place_id || "none"} onValueChange={(v) => set("place_id", v === "none" ? "" : v)} disabled={!canEdit}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin lugar</SelectItem>
              {places.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.country})</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Duración">
          <Select value={f.duration} onValueChange={(v) => set("duration", v as Enums<"activity_duration">)} disabled={!canEdit}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{DURATIONS.map((d) => <SelectItem key={d} value={d}>{DURATION_LABELS[d]}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Hora por defecto"><Input type="time" value={f.default_time} onChange={(e) => set("default_time", e.target.value)} disabled={!canEdit} /></Field>
        <Field label="Modalidad">
          <Select value={f.modality} onValueChange={(v) => set("modality", v as Enums<"service_modality">)} disabled={!canEdit}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{MODALITIES.map((m) => <SelectItem key={m} value={m}>{cap(m)}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Estado">
          {manager ? (
            <Select value={f.status} onValueChange={(v) => set("status", v as Enums<"catalog_status">)} disabled={!canEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{cap(s)}</SelectItem>)}</SelectContent>
            </Select>
          ) : (
            <div className="pt-1"><StatusBadge status={f.status} /></div>
          )}
        </Field>
      </div>
      {!manager && !row && <p className="text-xs text-muted-foreground">Se creará en estado pendiente hasta que Operación lo apruebe.</p>}
      {canEdit && <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Guardando…" : row ? "Guardar cambios" : "Crear módulo"}</Button>}
    </div>
  );
}

function ModuleItems({ moduleId, canEdit }: { moduleId: string; canEdit: boolean }) {
  const qc = useQueryClient();
  const key = ["activity_module_items", moduleId];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await db
        .from("activity_module_items")
        .select("*, services(sku, name, type)")
        .eq("module_id", moduleId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const run = useMutation({
    mutationFn: async (fn: () => PromiseLike<{ error: { message: string } | null }>) => {
      const { error } = await fn();
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => toast.error(e.message),
  });
  const update = (id: string, v: Partial<Tables<"activity_module_items">>) =>
    run.mutate(() => db.from("activity_module_items").update(v).eq("id", id));

  return (
    <div className="space-y-3">
      {canEdit && (
        <SearchPicker
          placeholder="Añadir servicio del tarifario…"
          queryKey="services"
          fetcher={(t) => fetchServices(t)}
          onPick={(o) => o && run.mutate(() => db.from("activity_module_items").insert({ module_id: moduleId, service_id: o.id, qty: 1 }))}
        />
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Servicio</TableHead><TableHead>Tipo</TableHead><TableHead className="w-20">Cant.</TableHead><TableHead>Aplica TC</TableHead><TableHead>Margen</TableHead><TableHead /></TableRow>
          </TableHeader>
          <TableBody>
            {q.data?.length === 0 && <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">Sin servicios.</TableCell></TableRow>}
            {q.data?.map((it) => (
              <TableRow key={it.id}>
                <TableCell><div className="font-medium">{it.services?.name}</div><div className="font-mono text-xs text-muted-foreground">{it.services?.sku}</div></TableCell>
                <TableCell>{it.services ? cap(it.services.type) : "—"}</TableCell>
                <TableCell>
                  <Input type="number" min={0} step="any" defaultValue={it.qty} className="h-8" disabled={!canEdit}
                    onBlur={(e) => Number(e.target.value) !== it.qty && update(it.id, { qty: Number(e.target.value) || 1 })} />
                </TableCell>
                <TableCell><TriState value={it.applies_tc} onChange={(v) => update(it.id, { applies_tc: v })} disabled={!canEdit} /></TableCell>
                <TableCell><TriState value={it.margin_applicable} onChange={(v) => update(it.id, { margin_applicable: v })} disabled={!canEdit} /></TableCell>
                <TableCell>
                  {canEdit && (
                    <Button size="icon" variant="ghost" onClick={() => run.mutate(() => db.from("activity_module_items").delete().eq("id", it.id))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
