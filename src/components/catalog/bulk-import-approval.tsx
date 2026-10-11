import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-auth";
import { reviewImport, type ImportApprovalResult } from "@/lib/import-review";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function BulkImportApproval() {
  const { role } = useCurrentUser();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportApprovalResult | null>(null);
  const [error, setError] = useState("");
  if (role !== "admin") return null;

  async function run(fingerprint?: string) {
    setBusy(true);
    setError("");
    setResult(null);
    setOpen(true);
    try {
      const next = await reviewImport(fingerprint);
      setResult(next);
      if (!next.dry_run) {
        await Promise.all(
          [
            "import-review",
            "services",
            "service",
            "itinerary_templates",
            "itinerary_template",
            "day_blocks",
            "activity_modules",
            "picker",
            "quote-suggestions",
          ].map((key) => qc.invalidateQueries({ queryKey: [key] })),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo revisar la importación.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button disabled={busy} onClick={() => void run()}>
        Aprobar todo lo válido
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {result && !result.dry_run
                ? "Resultado de la aprobación"
                : "Simulación de aprobación"}
            </DialogTitle>
            <DialogDescription>
              {result && !result.dry_run
                ? "Los elementos válidos están activos. Los demás siguen pendientes con sus motivos guardados."
                : "Revisa los conteos y los motivos. No se guardará ningún cambio hasta que confirmes."}
            </DialogDescription>
          </DialogHeader>
          {busy && <p role="status">{result ? "Procesando…" : "Revisando catálogo…"}</p>}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {result && (
            <>
              <p className="text-sm text-muted-foreground">
                Vigencia evaluada al {result.review_date} (Santiago). Se revisan todos los
                pendientes, sin el límite de filas de la pantalla.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Catálogo</TableHead>
                    <TableHead>Revisados</TableHead>
                    <TableHead>{result.dry_run ? "Se aprobarían" : "Aprobados"}</TableHead>
                    <TableHead>Quedan pendientes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(
                    [
                      ["Servicios", result.services],
                      ["Plantillas", result.templates],
                    ] as const
                  ).map(([label, group]) => (
                    <TableRow key={label}>
                      <TableCell>{label}</TableCell>
                      <TableCell>{group.pending}</TableCell>
                      <TableCell>{group.eligible}</TableCell>
                      <TableCell>{group.remaining}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(
                [
                  ["Servicios", result.services],
                  ["Plantillas", result.templates],
                ] as const
              ).map(([label, group]) => (
                <details key={label} className="rounded-md border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    {label}: detalle y motivos
                  </summary>
                  <ul className="mt-3 max-h-56 space-y-3 overflow-y-auto text-sm">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <p className="font-medium">
                          {item.code} · {item.name}
                        </p>
                        <p className="text-muted-foreground">
                          {item.reasons.length
                            ? item.reasons.join(" ")
                            : result.dry_run
                              ? "Válido para aprobar."
                              : "Aprobado."}
                        </p>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>
              {result && !result.dry_run ? "Cerrar" : "Cancelar"}
            </Button>
            {error && (
              <Button disabled={busy} onClick={() => void run()}>
                Volver a simular
              </Button>
            )}
            {result?.dry_run && (
              <Button
                disabled={busy || result.services.pending + result.templates.pending === 0}
                onClick={() => void run(result.fingerprint)}
              >
                Confirmar aprobación
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
