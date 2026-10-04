import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Field, primaryBtn } from "@/components/catalog/kit";

/** Cliente sin tipar: la tabla se elige por configuración. RLS decide el acceso. */
const loose = db as unknown as SupabaseClient;
const NONE = "__none__";

type Row = Record<string, unknown> & { id: string };

export interface CrudColumn {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date" | "select";
  options?: [string, string][];
  required?: boolean;
  /** Oculta la columna en la tabla (solo formulario). */
  formOnly?: boolean;
  placeholder?: string;
  render?: (row: Row) => React.ReactNode;
}

export function CrudTable({ table, title, columns, orderBy, filter, defaults, onSaved }: {
  table: string;
  title: string;
  columns: CrudColumn[];
  orderBy: { column: string; ascending?: boolean }[];
  filter?: (row: Row) => boolean;
  defaults?: Record<string, unknown>;
  onSaved?: () => void;
}) {
  const qc = useQueryClient();
  const key = ["crud", table];
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      let query = loose.from(table).select("*");
      for (const o of orderBy) query = query.order(o.column, { ascending: o.ascending ?? true });
      const { data, error } = await query;
      if (error) throw error;
      return data as Row[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await loose.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Eliminado."); qc.invalidateQueries({ queryKey: key }); onSaved?.(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (q.data ?? []).filter((r) => (filter ? filter(r) : true));
  const visible = columns.filter((c) => !c.formOnly);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <Button size="sm" className={primaryBtn} onClick={() => setEditing("new")}><Plus className="mr-1 h-4 w-4" />Agregar</Button>
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {visible.map((c) => <TableHead key={c.key}>{c.label}</TableHead>)}
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && <TableRow><TableCell colSpan={visible.length + 1} className="text-muted-foreground">Cargando…</TableCell></TableRow>}
            {q.error && <TableRow><TableCell colSpan={visible.length + 1} className="text-destructive">{(q.error as Error).message}</TableCell></TableRow>}
            {!q.isLoading && !q.error && rows.length === 0 && (
              <TableRow><TableCell colSpan={visible.length + 1} className="text-muted-foreground">Sin registros.</TableCell></TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                {visible.map((c) => (
                  <TableCell key={c.key} className="max-w-[320px] truncate">
                    {c.render ? c.render(r) : c.options ? (c.options.find(([v]) => v === r[c.key])?.[1] ?? "—") : String(r[c.key] ?? "—")}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(r)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label="Eliminar"
                    onClick={() => { if (confirm("¿Eliminar este registro?")) remove.mutate(r.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {editing && (
        <CrudDialog
          table={table}
          title={title}
          columns={columns}
          row={editing === "new" ? null : editing}
          defaults={defaults}
          onClose={() => setEditing(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: key }); onSaved?.(); }}
        />
      )}
    </div>
  );
}

function CrudDialog({ table, title, columns, row, defaults, onClose, onSaved }: {
  table: string; title: string; columns: CrudColumn[]; row: Row | null;
  defaults?: Record<string, unknown>; onClose: () => void; onSaved: () => void;
}) {
  const init: Record<string, string> = {};
  for (const c of columns) {
    const v = row ? row[c.key] : defaults?.[c.key];
    init[c.key] = v === null || v === undefined ? "" : String(v);
  }
  const [values, setValues] = useState(init);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  const save = async () => {
    const payload: Record<string, unknown> = {};
    for (const c of columns) {
      const raw = values[c.key].trim();
      if (c.required && !raw) { toast.error(`${c.label} es obligatorio.`); return; }
      payload[c.key] = raw === "" ? null : c.type === "number" ? Number(raw) : raw;
    }
    setSaving(true);
    const { error } = row
      ? await loose.from(table).update(payload).eq("id", row.id)
      : await loose.from(table).insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Guardado.");
    onSaved();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>{row ? "Editar" : "Agregar"} · {title}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          {columns.map((c) => (
            <Field key={c.key} label={c.label + (c.required ? " *" : "")}>
              {c.type === "textarea" ? (
                <Textarea rows={8} value={values[c.key]} onChange={(e) => set(c.key, e.target.value)} placeholder={c.placeholder} />
              ) : c.type === "select" ? (
                <Select value={values[c.key] || NONE} onValueChange={(v) => set(c.key, v === NONE ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {!c.required && <SelectItem value={NONE}>—</SelectItem>}
                    {c.options?.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={c.type === "number" ? "number" : c.type === "date" ? "date" : "text"}
                  step={c.type === "number" ? "any" : undefined}
                  value={values[c.key]} onChange={(e) => set(c.key, e.target.value)} placeholder={c.placeholder}
                />
              )}
            </Field>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className={primaryBtn} onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
