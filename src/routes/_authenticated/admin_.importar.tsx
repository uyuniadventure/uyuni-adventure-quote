import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, primaryBtn } from "@/components/catalog/kit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/hooks/use-auth";
import { parseConsolidatedWorkbook, type ConsolidatedWorkbookPreview } from "@/lib/import/consolidated-workbook";
import {
  commitConsolidatedImport,
  previewConsolidatedImport,
  type ConsolidatedDatabasePreview,
  type ConsolidatedImportResult,
} from "@/lib/import/consolidated-import";

const APPROVED_FILE = "UyuniQuote_BASE_UNICA_IMPORTACION_2026_2027.xlsx";
const ISSUE_TYPE_LABEL = {
  identification: "Identificación",
  missing_price: "Tarifa sin precio",
  date_exclusion: "Exclusión de vigencia",
  reconciliation: "Conciliación",
  technical: "Técnica",
} as const;

export const Route = createFileRoute("/_authenticated/admin_/importar")({
  head: () => ({
    meta: [
      { title: "Importar Excel — Cotizador Uyuni Adventure" },
      { name: "description", content: "Previsualiza y confirma la base consolidada 2026–2027." },
    ],
  }),
  component: ConsolidatedImportPage,
});

function ConsolidatedImportPage() {
  const { role } = useCurrentUser();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ConsolidatedWorkbookPreview | null>(null);
  const [database, setDatabase] = useState<ConsolidatedDatabasePreview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<ConsolidatedImportResult | null>(null);

  const validate = useMutation({
    mutationFn: async (selected: File) => {
      if (selected.name !== APPROVED_FILE)
        throw new Error(`Selecciona exclusivamente ${APPROVED_FILE}.`);
      const parsed = await parseConsolidatedWorkbook(await selected.arrayBuffer());
      const comparison = await previewConsolidatedImport(parsed);
      return { parsed, comparison };
    },
    onSuccess: ({ parsed, comparison }) => {
      setPreview(parsed);
      setDatabase(comparison);
      setConfirmed(false);
      setResult(null);
      toast.success("Excel validado. La previsualización no realizó escrituras.");
    },
    onError: (error: Error) => {
      setPreview(null);
      setDatabase(null);
      toast.error(error.message);
    },
  });
  const commit = useMutation({
    mutationFn: async () => {
      if (!file || !preview || !confirmed) throw new Error("Confirma explícitamente la importación.");
      return commitConsolidatedImport(file.name, preview);
    },
    onSuccess: (value) => {
      setResult(value);
      toast.success(value.idempotent ? "El archivo ya había sido importado." : "Importación completada.");
    },
    onError: (error: Error) => toast.error(`No se importó ningún dato: ${error.message}`),
  });

  if (role !== "admin") {
    return (
      <Card className="mx-auto max-w-md space-y-3 p-8 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-brand-orange-deep" />
        <h1 className="text-lg font-semibold">Acceso restringido</h1>
        <p className="text-sm text-muted-foreground">Solo Admin puede previsualizar o confirmar esta importación.</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Importar base consolidada"
        subtitle="Valida las diez hojas y revisa todos los cambios antes de escribir en el catálogo."
        action={<Button asChild variant="outline"><Link to="/admin"><ArrowLeft className="mr-1 h-4 w-4" />Volver a Admin</Link></Button>}
      />
      <Card className="space-y-4 p-6">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="mt-0.5 h-6 w-6 text-brand-orange-deep" />
          <div>
            <h2 className="font-semibold">Archivo aprobado</h2>
            <p className="text-sm text-muted-foreground">{APPROVED_FILE}</p>
            <p className="mt-1 text-xs text-muted-foreground">La selección y la previsualización no modifican Supabase.</p>
          </div>
        </div>
        <Input
          aria-label="Seleccionar archivo Excel"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          disabled={validate.isPending || commit.isPending}
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null;
            setFile(selected);
            setPreview(null);
            setDatabase(null);
            setResult(null);
            if (selected) validate.mutate(selected);
          }}
        />
        {validate.isPending && <p role="status" className="text-sm">Leyendo y validando referencias entre hojas…</p>}
        {validate.error && <p role="alert" className="text-sm text-destructive">{validate.error.message}</p>}
      </Card>

      {preview && database && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="Servicios" value={preview.counts.services} detail={`${preview.counts.activeServices} activos · ${preview.counts.pendingServices} pendientes`} />
            <Metric label="Tarifas" value={preview.counts.rates} detail="1.203 de 2026 · 41 de 2027" />
            <Metric label="Escenarios" value={preview.counts.scenarios} detail={`${preview.scenarios.filter((scenario) => scenario.reviewStatus === "REVISAR").length} con diferencia de conciliación`} />
            <Metric label="Bloques económicos" value={preview.counts.scenarioDays} detail="Sin duplicar day_blocks" />
            <Metric label="Plantillas" value={preview.counts.templates} detail={`${preview.counts.narrativeDays} recorridos narrativos`} />
          </div>

          <Card className="space-y-4 p-6">
            <div>
              <h2 className="font-semibold">Comparación con el catálogo actual</h2>
              <p className="text-sm text-muted-foreground">“Protegido” significa que existe un registro manual y no será sobrescrito.</p>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Entidad</TableHead><TableHead className="text-right">Nuevos</TableHead><TableHead className="text-right">Existentes</TableHead><TableHead className="text-right">Modificados</TableHead><TableHead className="text-right">Protegidos</TableHead></TableRow></TableHeader>
              <TableBody>
                <ComparisonRow label="Servicios" values={database.services} />
                <ComparisonRow label="Tarifas" values={database.rates} />
                <ComparisonRow label="Escenarios" values={database.scenarios} />
                <ComparisonRow label="Plantillas" values={database.templates} />
              </TableBody>
            </Table>
          </Card>

          <Card className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">Incidencias conservadas</h2>
                <p className="text-sm text-muted-foreground">
                  {preview.counts.issues} controles: {preview.issues.filter((issue) => issue.issueType === "identification").length} de identificación · {preview.issues.filter((issue) => issue.issueType === "missing_price").length} tarifas sin precio · {preview.issues.filter((issue) => issue.issueType === "reconciliation").length} de conciliación.
                </p>
              </div>
              <Badge variant="outline" className="border-brand-orange-deep text-brand-orange-deep">No se inventan asociaciones ni precios</Badge>
            </div>
            <div className="max-h-80 overflow-auto rounded-md border">
              <Table>
                <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Código</TableHead><TableHead>Detalle</TableHead><TableHead>Referencia</TableHead></TableRow></TableHeader>
                <TableBody>
                  {preview.issues.slice(0, 25).map((issue) => (
                    <TableRow key={issue.importKey}>
                      <TableCell>{ISSUE_TYPE_LABEL[issue.issueType]}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium">{issue.code}</TableCell>
                      <TableCell>{issue.detail}</TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs">{issue.sourceRef.sheet}!{issue.sourceRef.cell ?? issue.sourceRef.row}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={confirmed} onCheckedChange={(value) => setConfirmed(value === true)} disabled={commit.isPending || !!result} />
              <span>Confirmo que revisé la previsualización y autorizo una importación transaccional. Los registros manuales protegidos no se modificarán.</span>
            </label>
            <Button className={primaryBtn} disabled={!confirmed || commit.isPending || !!result} onClick={() => commit.mutate()}>
              <Upload className="mr-1 h-4 w-4" />{commit.isPending ? "Importando…" : "Confirmar importación"}
            </Button>
            {commit.error && <p role="alert" className="text-sm text-destructive">La transacción se revirtió por completo: {commit.error.message}</p>}
            {result && (
              <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-4" role="status">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-brand-orange-deep" />
                <div><p className="font-medium">{result.idempotent ? "Sin cambios: archivo ya procesado" : "Importación completada"}</p><p className="text-sm text-muted-foreground">Lote {result.run_id ?? "existente"} · huella {preview.sourceSha256.slice(0, 12)}…</p></div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <Card className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value.toLocaleString("es")}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></Card>;
}

function ComparisonRow({ label, values }: { label: string; values: Record<string, number> }) {
  return <TableRow><TableCell className="font-medium">{label}</TableCell><TableCell className="text-right">{values["new"] ?? 0}</TableCell><TableCell className="text-right">{values["existing"] ?? 0}</TableCell><TableCell className="text-right">{values["modified"] ?? 0}</TableCell><TableCell className="text-right">{values["protected"] ?? 0}</TableCell></TableRow>;
}
