import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, Check } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { approveImportReviewItems, type ImportReviewKind } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { useCatalogSelection } from "./catalog-selection";

type Selection = ReturnType<typeof useCatalogSelection>;

/** Bulk approve / archive for services and activity modules. RLS decides access. */
export function BulkStatusBar({ kind, selection, invalidate }: { kind: ImportReviewKind; selection: Selection; invalidate: string[] }) {
  const qc = useQueryClient();
  const [action, setAction] = useState<"approve" | "archive" | null>(null);
  const [busy, setBusy] = useState(false);
  const n = selection.records.length;

  async function run() {
    if (!action || busy) return;
    setBusy(true);
    const ids = selection.records.map((r) => r.id);
    try {
      if (action === "approve") {
        const r = await approveImportReviewItems(kind, ids);
        toast.success(`${r.approved} aprobados; ${r.pending} siguen pendientes.`);
      } else {
        for (let i = 0; i < ids.length; i += 200) {
          const { error } = await db.from(kind).update({ status: "inactivo" }).in("id", ids.slice(i, i + 200));
          if (error) throw error;
        }
        toast.success(`${ids.length} registros pasaron a Inactivo.`);
      }
      await Promise.all([...invalidate, "import-review"].map((k) => qc.invalidateQueries({ queryKey: [k] })));
      selection.clear();
      setAction(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo completar la operación.");
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <Checkbox aria-label="Seleccionar todo" checked={selection.all ? true : n ? "indeterminate" : false}
            disabled={!selection.ready || busy} onCheckedChange={(v) => selection.selectAll(v === true)} />
          Seleccionar todo ({selection.loading ? "…" : n})
        </label>
        {n > 0 && (
          <>
            <Button size="sm" variant="outline" disabled={!selection.ready || busy} onClick={() => setAction("approve")}><Check className="mr-1 h-4 w-4" />Aprobar ({n})</Button>
            <Button size="sm" variant="outline" disabled={!selection.ready || busy} onClick={() => setAction("archive")}><Archive className="mr-1 h-4 w-4" />Archivar ({n})</Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={selection.clear}>Limpiar</Button>
          </>
        )}
        {selection.error && <span role="alert" className="text-destructive">No se pudo cargar la selección completa.</span>}
      </div>
      <AlertDialog open={!!action} onOpenChange={(o) => { if (!o && !busy) setAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{action === "approve" ? "Aprobar selección" : "Archivar selección"}</AlertDialogTitle>
            <AlertDialogDescription>
              {action === "approve"
                ? `Se aprobarán ${n} registros pendientes (pasan a Activo). Los que no cumplan requisitos quedarán pendientes.`
                : `${n} registros pasarán a Inactivo. No se borra nada.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); void run(); }}>{busy ? "Procesando…" : "Confirmar"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
