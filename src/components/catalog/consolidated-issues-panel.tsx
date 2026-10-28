import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ISSUE_LABEL: Record<string, string> = {
  identification: "Identificación",
  missing_price: "Tarifa sin precio",
  date_exclusion: "Exclusión de vigencia",
  reconciliation: "Conciliación",
  technical: "Técnica",
};

export function ConsolidatedIssuesPanel() {
  const query = useQuery({ queryKey: ["consolidated-import-issues"], queryFn: async () => {
    const result = await db.from("consolidated_import_issues").select("id,scenario_key,day_key,line_key,code,issue_type,detail,source_ref,created_at").order("created_at", { ascending: false }).limit(500);
    if (result.error) throw result.error;
    return result.data;
  }});
  return <Card className="space-y-3 p-4"><div><h2 className="font-semibold text-foreground">Incidencias del consolidado</h2><p className="text-sm text-muted-foreground">Trazabilidad del Excel por escenario, día, línea y celda de origen.</p></div>
    {query.isError && <p role="alert" className="text-sm text-destructive">{query.error.message}</p>}
    <div className="max-h-96 overflow-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Código</TableHead><TableHead>Escenario / día</TableHead><TableHead>Detalle</TableHead><TableHead>Origen</TableHead></TableRow></TableHeader><TableBody>
      {query.data?.map((issue) => { const ref = issue.source_ref as { sheet?: string; row?: number; cell?: string }; return <TableRow key={issue.id}><TableCell>{ISSUE_LABEL[issue.issue_type] ?? issue.issue_type}</TableCell><TableCell className="font-mono text-xs">{issue.code}</TableCell><TableCell>{issue.scenario_key ?? "—"}{issue.day_key ? ` · ${issue.day_key}` : ""}{issue.line_key ? ` · ${issue.line_key}` : ""}</TableCell><TableCell>{issue.detail}</TableCell><TableCell className="font-mono text-xs">{[ref.sheet, ref.cell, ref.row ? `fila ${ref.row}` : null].filter(Boolean).join(" · ") || "—"}</TableCell></TableRow>; })}
      {!query.isLoading && query.data?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No hay incidencias registradas.</TableCell></TableRow>}
    </TableBody></Table></div>
  </Card>;
}
