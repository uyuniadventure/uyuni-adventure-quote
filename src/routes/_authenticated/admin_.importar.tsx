import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert, Upload } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-auth";
import { SECTIONS, sectionHead } from "@/components/section";
import { PageHeader } from "@/components/catalog/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  commitImportBatch,
  discardImportBatch,
  stageImportPackage,
  type TemplateImportAssessment,
} from "@/lib/import";
import type { ImportChange, ValidationIssue } from "@/lib/import/package-v2";

const section = SECTIONS["importar-paquete"];

export const Route = createFileRoute("/_authenticated/admin_/importar")({
  head: () => sectionHead(section),
  component: ImportPackagePage,
});

type Preview = Awaited<ReturnType<typeof stageImportPackage>>;

function ImportPackagePage() {
  const { role } = useCurrentUser();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [closed, setClosed] = useState(false);

  if (role !== "admin") {
    return (
      <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-brand-orange" />
        <h1 className="mt-3 text-lg font-semibold">Acceso restringido</h1>
        <p className="mt-1 text-sm text-muted-foreground">Esta sección es solo para Admin.</p>
      </div>
    );
  }

  async function prepare() {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    setClosed(false);
    try {
      setPreview(await stageImportPackage(file));
    } catch (cause) {
      setPreview(null);
      setError(cause instanceof Error ? cause.message : "No se pudo preparar el paquete.");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!preview || preview.validation.errors.length || busy || closed) return;
    setBusy(true);
    setError("");
    try {
      const result = (await commitImportBatch(preview.batchId)) as {
        status?: string;
        error?: string;
      };
      if (result.status !== "committed") throw new Error(result.error || "El lote sigue en vista previa.");
      setClosed(true);
      setMessage("Importación confirmada. Servicios y plantillas permanecen pendientes de aprobación.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo confirmar la importación.");
    } finally {
      setBusy(false);
    }
  }

  async function discard() {
    if (!preview || busy || closed) return;
    setBusy(true);
    setError("");
    try {
      await discardImportBatch(preview.batchId);
      setClosed(true);
      setMessage("Vista previa descartada; el catálogo no cambió.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo descartar el lote.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={section.title} subtitle={section.description} />
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-medium">Paquete ZIP con los diez CSV</p>
        <p className="mb-3 text-sm text-muted-foreground">
          Preparar sólo guarda staging. Los importes se leen exclusivamente desde PRECIO_USD.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="max-w-xl"
            type="file"
            accept=".zip,application/zip"
            disabled={busy}
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setPreview(null);
              setMessage("");
              setError("");
            }}
          />
          <Button disabled={!file || busy} onClick={() => void prepare()}>
            <Upload className="h-4 w-4" /> {busy ? "Procesando…" : "Preparar vista previa"}
          </Button>
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="text-sm font-medium">{message}</p>}
      {preview && (
        <>
          <PreviewSummary preview={preview} />
          <Tabs defaultValue="templates">
            <TabsList className="flex-wrap">
              <TabsTrigger value="templates">47 itinerarios</TabsTrigger>
              <TabsTrigger value="errors">Errores ({preview.validation.errors.length})</TabsTrigger>
              <TabsTrigger value="warnings">Avisos ({preview.validation.warnings.length})</TabsTrigger>
              <TabsTrigger value="diff">Diferencias ({preview.rows.length})</TabsTrigger>
              <TabsTrigger value="control">Control económico ({preview.control.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="templates"><TemplateAssessment rows={preview.templates} /></TabsContent>
            <TabsContent value="errors"><IssueList rows={preview.validation.errors} empty="Sin errores bloqueantes." /></TabsContent>
            <TabsContent value="warnings"><IssueList rows={preview.validation.warnings} empty="Sin avisos." /></TabsContent>
            <TabsContent value="diff"><DiffTable rows={preview.rows} /></TabsContent>
            <TabsContent value="control"><ControlTable rows={preview.control} /></TabsContent>
          </Tabs>
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={busy || closed || preview.validation.errors.length > 0}
              onClick={() => void commit()}
            >
              Confirmar importación pendiente
            </Button>
            <Button variant="outline" disabled={busy || closed} onClick={() => void discard()}>
              Descartar vista previa
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function PreviewSummary({ preview }: { preview: Preview }) {
  const counts = useMemo(
    () =>
      preview.rows.reduce<Record<string, number>>((result, row) => {
        result[row.action] = (result[row.action] ?? 0) + 1;
        return result;
      }, {}),
    [preview.rows],
  );
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <Badge variant="secondary">Nuevos: {counts["insert"] ?? 0}</Badge>
      <Badge variant="outline">Cambian: {counts["update"] ?? 0}</Badge>
      <Badge variant="outline">Iguales: {counts["skip"] ?? 0}</Badge>
      <Badge variant={preview.validation.errors.length ? "destructive" : "secondary"}>
        Errores: {preview.validation.errors.length}
      </Badge>
    </div>
  );
}

function IssueList({ rows, empty }: { rows: ValidationIssue[]; empty: string }) {
  if (!rows.length) return <p className="rounded-md border bg-card p-4 text-sm">{empty}</p>;
  return <ul className="space-y-2 rounded-md border bg-card p-4 text-sm">{rows.map((row, index) => <li key={`${row.key}-${index}`}><span className="font-mono">{row.key}</span> · {row.message}</li>)}</ul>;
}

function TemplateAssessment({ rows }: { rows: TemplateImportAssessment[] }) {
  return (
    <Table>
      <TableHeader><TableRow><TableHead>SKU</TableHead><TableHead>Estado</TableHead><TableHead>Controles</TableHead><TableHead>Motivos</TableHead></TableRow></TableHeader>
      <TableBody>{rows.map((row) => <TableRow key={row.sku}><TableCell className="font-mono text-xs">{row.sku}</TableCell><TableCell><Badge variant={row.status === "blocked" ? "destructive" : "outline"}>{row.status === "validated" ? "Validado" : row.status === "blocked" ? "Bloqueado" : "Pendiente"}</Badge></TableCell><TableCell>{row.controls}</TableCell><TableCell className="max-w-xl text-xs text-muted-foreground">{row.reasons.join(" · ") || "Control económico dentro de tolerancia; sigue pendiente de aprobación comercial."}</TableCell></TableRow>)}</TableBody>
    </Table>
  );
}

function DiffTable({ rows }: { rows: ImportChange[] }) {
  const [filter, setFilter] = useState("all");
  const shown = filter === "all" ? rows : rows.filter((row) => row.action === filter);
  return <div className="space-y-3"><select className="rounded-md border bg-background px-3 py-2 text-sm" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Todas</option><option value="insert">Nuevas</option><option value="update">Cambian</option><option value="skip">Iguales</option></select><Table><TableHeader><TableRow><TableHead>Tabla</TableHead><TableHead>Clave natural</TableHead><TableHead>Acción</TableHead></TableRow></TableHeader><TableBody>{shown.map((row, index) => <TableRow key={`${row.table_name}-${row.natural_key}-${index}`}><TableCell>{row.table_name}</TableCell><TableCell className="font-mono text-xs">{row.natural_key}</TableCell><TableCell>{row.action}</TableCell></TableRow>)}</TableBody></Table></div>;
}

function ControlTable({ rows }: { rows: Preview["control"] }) {
  return <Table><TableHeader><TableRow><TableHead>SKU</TableHead><TableHead>Pax</TableHead><TableHead>Hoja</TableHead><TableHead>App</TableHead><TableHead>Diferencia</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={`${row.sku}-${row.pax}`}><TableCell className="font-mono text-xs">{row.sku}</TableCell><TableCell>{row.pax}</TableCell><TableCell>{row.sheet.toFixed(2)}</TableCell><TableCell>{row.app?.toFixed(2) ?? "—"}</TableCell><TableCell>{row.delta?.toFixed(2) ?? "—"}</TableCell><TableCell><Badge variant={row.level === "red" ? "destructive" : "outline"}>{row.error ? "Pendiente" : row.level}</Badge></TableCell></TableRow>)}</TableBody></Table>;
}
