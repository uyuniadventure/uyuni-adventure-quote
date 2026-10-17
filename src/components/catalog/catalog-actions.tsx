import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, Check, MoreHorizontal, Trash2 } from "lucide-react";
import { canManageCatalog, useCurrentUser } from "@/hooks/use-auth";
import { archiveDayBlocks, archiveTemplates, approveDayBlocks, approveTemplates, deleteDayBlocks, deleteTemplates, previewCatalogApproval, previewTemplateDeletion, type BlockTemplateDependency, type CatalogApprovalPreview, type CatalogKind, type DeleteTemplatesCounts } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Action = "approve" | "delete" | "archive";
export interface CatalogRecord { id: string; code: string; name: string }
const affectedKeys = ["itinerary_templates", "itinerary_template", "template_days", "day_blocks", "day_block", "day_block_preview", "day_block_items", "day_block_modules", "import-review", "picker", "quote-suggestions", "quotes", "quote", "quote-list", "quote-days"];

export function useCatalogActions(kind: CatalogKind, onSuccess?: (action: Action) => void) {
  const qc = useQueryClient();
  const { role } = useCurrentUser();
  const allowed = canManageCatalog(role);
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<{ action: Action; records: CatalogRecord[] } | null>(null);
  const [preview, setPreview] = useState<CatalogApprovalPreview | null>(null);
  const [counts, setCounts] = useState<DeleteTemplatesCounts | null>(null);
  const [dependencies, setDependencies] = useState<BlockTemplateDependency[]>([]);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");

  async function work(fn: () => Promise<void>) {
    if (locked.current || !allowed) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try { await fn(); } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la operación del catálogo.");
    } finally { locked.current = false; setBusy(false); }
  }
  async function prepare(action: Action, records: CatalogRecord[]) {
    if (!allowed || !records.length || locked.current) return;
    setState({ action, records: [...records] });
    setPreview(null); setCounts(null); setDependencies([]); setSummary("");
    await work(async () => {
      const ids = records.map((r) => r.id);
      if (action === "approve") setPreview(await previewCatalogApproval(kind, ids));
      if (action === "delete" && kind === "templates") setCounts(await previewTemplateDeletion(ids));
    });
  }
  async function confirm(acceptWarnings = false, force = false) {
    if (!state || summary) return;
    await work(async () => {
      const ids = state.records.map((r) => r.id);
      if (state.action === "approve") {
        if (!preview) return;
        const result = await (kind === "templates" ? approveTemplates : approveDayBlocks)(ids, { acceptWarnings });
        setPreview(result);
        setSummary(`${result.approved} aprobados; ${result.pending} pendientes.`);
      } else if (state.action === "archive") {
        const result = await (kind === "templates" ? archiveTemplates : archiveDayBlocks)(ids);
        setSummary(`${result.archived} registros pasaron a Inactivo.`);
      } else if (kind === "templates") {
        if (!counts) return;
        const result = await deleteTemplates(ids);
        setSummary(`${result.templates} plantillas eliminadas; ${result.template_days} días de plantilla eliminados; ${result.quotes_detached} cotizaciones sin plantilla de origen. Sus días y totales se conservan.`);
      } else {
        const result = await deleteDayBlocks(ids, { force });
        if (result.length) { setDependencies(result); return; }
        setSummary("Borrado completado. No quedan los bloques seleccionados en el catálogo.");
      }
      await Promise.all(affectedKeys.map((key) => qc.invalidateQueries({ queryKey: [key] })));
      onSuccess?.(state.action);
    });
  }
  const dialog = allowed && state ? (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) setState(null); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" onEscapeKeyDown={(e) => { if (busy) e.preventDefault(); }} onPointerDownOutside={(e) => { if (busy) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>{summary ? "Resultado" : dependencies.length ? "Bloques usados en plantillas" : state.action === "approve" ? "Aprobar selección" : state.action === "archive" ? "Archivar selección" : "Eliminar selección"}</DialogTitle>
          <DialogDescription>
            {state.action === "approve" ? "Aceptar avisos no revisa textos ni aprueba servicios asociados." : state.action === "archive" ? "El estado será Inactivo. Se conservan el contenido y los vínculos." : kind === "templates" ? "Las cotizaciones conservarán sus días, ítems y total; solo perderán la plantilla de origen." : "El borrado es permanente. Las cotizaciones conservan sus días y totales."}
          </DialogDescription>
        </DialogHeader>
        {busy && <p role="status">Procesando…</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {summary && <p role="status" className="text-sm font-medium">{summary}</p>}
        {preview ? <ul className="max-h-80 space-y-3 overflow-y-auto text-sm">{preview.items.map((r) => <li key={r.id}><p className="font-medium">{r.code} · {r.name}</p><ul className="text-muted-foreground">{r.reasons.length ? r.reasons.map((reason) => <li key={reason}>{reason}</li>) : <li>Sin avisos.</li>}</ul></li>)}</ul> : !summary && <ul className="max-h-60 overflow-y-auto text-sm">{state.records.map((r) => <li key={r.id}>{r.code} · {r.name}</li>)}</ul>}
        {counts && !summary && <p className="text-sm">{counts.templates} plantillas y {counts.template_days} días. {counts.quotes_detached} cotizaciones quedarán sin plantilla de origen. El conteo final se comprobará al confirmar.</p>}
        {!!dependencies.length && <div className="space-y-3 text-sm"><p className="font-medium">No se borró ningún bloque del lote.</p>{dependencies.map((d) => <div key={d.block_id}><p>{state.records.find((r) => r.id === d.block_id)?.code ?? d.block_id} →</p><ul className="pl-4 text-muted-foreground">{d.templates.map((t) => <li key={t.id}>{t.sku}</li>)}</ul></div>)}<p>Se quitarán los días afectados de estas plantillas, se renumerarán los restantes y quedarán pendientes.</p></div>}
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" disabled={busy} onClick={() => setState(null)}>{summary ? "Cerrar" : "Cancelar"}</Button>
          {!summary && state.action === "approve" && preview && <><Button disabled={busy} onClick={() => void confirm(false)}>{preview.with_warnings ? "Aprobar solo los sin avisos" : "Confirmar aprobación"}</Button>{preview.with_warnings > 0 && <Button variant="outline" disabled={busy} onClick={() => void confirm(true)}>Aprobar todos igual</Button>}</>}
          {!summary && state.action === "approve" && !preview && !busy && <Button onClick={() => void prepare(state.action, state.records)}>Volver a consultar</Button>}
          {!summary && state.action === "archive" && <Button disabled={busy} onClick={() => void confirm()}>Confirmar archivado</Button>}
          {!summary && state.action === "delete" && (kind === "day_blocks" || counts) && <Button variant="destructive" disabled={busy} onClick={() => void confirm(false, dependencies.length > 0)}>{dependencies.length ? "Eliminar y quitar de las plantillas" : "Confirmar eliminación"}</Button>}
          {!summary && state.action === "delete" && kind === "templates" && !counts && !busy && <Button onClick={() => void prepare(state.action, state.records)}>Volver a consultar</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null;
  return { allowed, busy, prepare, dialog };
}

export function CatalogRowMenu({ record, actions }: { record: CatalogRecord; actions: ReturnType<typeof useCatalogActions> }) {
  if (!actions.allowed) return null;
  return <DropdownMenu><DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label={`Acciones de ${record.code}`} disabled={actions.busy} onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent onClick={(e) => e.stopPropagation()}><DropdownMenuItem onSelect={() => void actions.prepare("approve", [record])}><Check />Aprobar</DropdownMenuItem><DropdownMenuItem className="text-destructive" onSelect={() => void actions.prepare("delete", [record])}><Trash2 />Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}

export function CatalogSelectionBar({ records, actions, disabled = false }: { records: CatalogRecord[]; actions: ReturnType<typeof useCatalogActions>; disabled?: boolean }) {
  if (!actions.allowed || !records.length) return null;
  return <div className="flex flex-wrap gap-2"><Button disabled={actions.busy || disabled} onClick={() => void actions.prepare("approve", records)}><Check className="h-4 w-4" />Aprobar ({records.length})</Button><Button variant="outline" disabled={actions.busy || disabled} onClick={() => void actions.prepare("delete", records)}><Trash2 className="h-4 w-4" />Eliminar ({records.length})</Button><Button variant="outline" disabled={actions.busy || disabled} onClick={() => void actions.prepare("archive", records)}><Archive className="h-4 w-4" />Archivar ({records.length})</Button></div>;
}

export function CatalogDeleteButton({ kind, record, onDeleted }: { kind: CatalogKind; record: CatalogRecord; onDeleted: () => void }) {
  const actions = useCatalogActions(kind, (action) => { if (action === "delete") onDeleted(); });
  if (!actions.allowed) return null;
  return <><Button variant="destructive" className="mt-4" disabled={actions.busy} onClick={() => void actions.prepare("delete", [record])}><Trash2 className="h-4 w-4" />Eliminar {kind === "templates" ? "plantilla" : "bloque"}</Button>{actions.dialog}</>;
}