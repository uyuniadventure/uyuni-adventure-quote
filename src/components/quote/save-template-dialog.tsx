import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { canManageCatalog, useCurrentUser } from "@/hooks/use-auth";
import {
  listTemplateLocations,
  prepareQuoteTemplate,
  saveQuoteAsTemplate,
  TemplateSkuConflict,
  type TemplateSaveMode,
} from "@/lib/quotes/save-template";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { useQuoteActions } from "./quote-workspace";

export function SaveTemplateDialog({
  quoteId,
  actions,
  onClose,
}: {
  quoteId: string;
  actions: ReturnType<typeof useQuoteActions>;
  onClose: () => void;
}) {
  const { role } = useCurrentUser();
  const qc = useQueryClient();
  const [routeFrom, setRouteFrom] = useState("");
  const [routeTo, setRouteTo] = useState("");
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const locations = useQuery({
    queryKey: ["template-save-locations"],
    queryFn: listTemplateLocations,
  });
  const preview = useQuery({
    queryKey: ["template-save-preview", quoteId, routeFrom, routeTo],
    queryFn: () => prepareQuoteTemplate(quoteId, { route_from: routeFrom, route_to: routeTo }),
    retry: false,
  });
  const data = preview.data;
  const duplicate = !!data?.existing || conflict;
  const busy = saving || actions.busy;
  const blocked = busy || preview.isFetching || !data?.sku || preview.isError;
  async function save(mode: TemplateSaveMode) {
    if (!data || blocked) return;
    setSaving(true);
    setError(null);
    try {
      const success = await actions.act(
        async () => {
          try {
            const saved = await saveQuoteAsTemplate(quoteId, data, mode);
            toast.success(
              `Plantilla ${saved.sku} ${saved.replaced ? "reemplazada" : "creada"} (pendiente de revisión).`,
            );
            await qc.invalidateQueries({ queryKey: ["itinerary_templates"] });
          } catch (e) {
            setError((e as Error).message);
            if (e instanceof TemplateSkuConflict) setConflict(true);
            setConfirmReplace(false);
            void preview.refetch();
            throw e;
          }
        },
        undefined,
        false,
      );
      if (success) onClose();
    } finally {
      setSaving(false);
    }
  }
  const changeRoute = (value: string, setter: (value: string) => void) => {
    setter(value);
    setConflict(false);
    setError(null);
    setConfirmReplace(false);
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Guardar como plantilla</DialogTitle>
          <DialogDescription>
            La plantilla copia los días y servicios de esta cotización y queda pendiente de
            revisión.
          </DialogDescription>
        </DialogHeader>
        {preview.isLoading && <p role="status">Preparando plantilla…</p>}
        {preview.isError && (
          <p role="alert" className="text-sm text-destructive">
            {preview.error.message}
          </p>
        )}
        {locations.isError && (
          <p role="alert" className="text-sm text-destructive">
            No se pudieron cargar los lugares. Vuelve a abrir el diálogo.
          </p>
        )}
        {data && (
          <div className="space-y-3">
            {data.needs_from ? (
              <label className="block space-y-1 text-sm">
                <span>Origen del primer día</span>
                <select
                  aria-label="Origen del primer día"
                  value={routeFrom}
                  disabled={busy || locations.isLoading}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                  onChange={(e) => changeRoute(e.target.value, setRouteFrom)}
                >
                  <option value="">Selecciona el origen</option>
                  {locations.data?.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="text-sm">
                Origen del primer día: <strong>{data.route_from}</strong>
              </p>
            )}
            {data.needs_to ? (
              <label className="block space-y-1 text-sm">
                <span>Destino del último día</span>
                <select
                  aria-label="Destino del último día"
                  value={routeTo}
                  disabled={busy || locations.isLoading}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                  onChange={(e) => changeRoute(e.target.value, setRouteTo)}
                >
                  <option value="">Selecciona el destino</option>
                  {locations.data?.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="text-sm">
                Destino del último día: <strong>{data.route_to}</strong>
              </p>
            )}
            {data.sku && (
              <p className="text-sm">
                SKU: <strong>{data.sku}</strong>
              </p>
            )}
            {duplicate && (
              <p className="rounded-md border bg-muted p-3 text-sm">
                Ya existe una plantilla con este SKU{data.existing ? `: ${data.existing.name}` : ""}
                . Guardar como nueva conserva la existente y usa el siguiente sufijo libre (-V2,
                -V3…).
              </p>
            )}
            {confirmReplace && (
              <p role="alert" className="text-sm text-destructive">
                Vas a reemplazar los días y servicios de {data.existing?.sku}. Las cotizaciones ya
                creadas conservan sus copias. Confirma para continuar.
              </p>
            )}
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          {duplicate && canManageCatalog(role) && data?.existing && (
            <Button
              variant="outline"
              disabled={blocked}
              onClick={() => (confirmReplace ? void save("replace") : setConfirmReplace(true))}
            >
              {confirmReplace ? "Confirmar reemplazo" : "Reemplazar plantilla existente"}
            </Button>
          )}
          <Button disabled={blocked} onClick={() => void save(duplicate ? "new" : "create")}>
            {saving ? "Guardando…" : duplicate ? "Guardar como nueva" : "Guardar plantilla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
