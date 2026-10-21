import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, CheckSquare, Pencil, Square, X } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { approveDayBlocks, approveImportReviewItems, approveTemplates } from "@/lib/catalog";
import type { Enums } from "@/types/db";
import { SECTIONS, sectionHead } from "@/components/section";
import { canManageCatalog, useCurrentUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cap } from "@/components/catalog/shared";
import { DURATION_LABELS, PageHeader, blockTitle } from "@/components/catalog/kit";
import { ServiceDetail } from "@/components/catalog/service-detail";
import { ModuleEditor } from "@/components/catalog/module-editor";
import { BlockEditor } from "@/components/catalog/block-editor";
import { TemplateEditor } from "@/components/catalog/template-editor";
import { BulkImportApproval } from "@/components/catalog/bulk-import-approval";

const s = SECTIONS["revision-importacion"];

export const Route = createFileRoute("/_authenticated/revision-importacion")({
  head: () => sectionHead(s),
  component: ReviewPage,
});

type Kind = "services" | "activity_modules" | "day_blocks" | "itinerary_templates";
interface Item { id: string; code: string; title: string; facts: string[]; issues: string[] }

const KIND_LABELS: Record<Kind, string> = {
  services: "Servicios", activity_modules: "Módulos", day_blocks: "Bloques", itinerary_templates: "Plantillas",
};

function warningsList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((w) => (typeof w === "string" ? w : typeof w === "object" && w && "message" in w ? String((w as { message: unknown }).message) : JSON.stringify(w)));
}

function usePending() {
  return useQuery({
    queryKey: ["import-review"],
    queryFn: async (): Promise<Record<Kind, Item[]>> => {
      const [sv, md, bl, tp] = await Promise.all([
        db.from("services").select("id, sku, name, type, country, currency, pricing_unit, source, import_issues, approval_issues, suppliers(name), service_rates(count)").eq("status", "pendiente").order("sku").limit(500),
        db.from("activity_modules").select("id, code, name, duration, places(name), activity_module_items(count), activity_module_translations(lang)").eq("status", "pendiente").order("code").limit(500),
        db.from("day_blocks").select("id, code, route_from, route_to, places, services(name), day_block_translations(lang, title), day_block_modules(count), day_block_items(count)").eq("status", "pendiente").order("code").limit(500),
        db.from("itinerary_templates").select("id, sku, name, days, nights, category, route_from, route_to, import_warnings, approval_issues, template_days(count)").eq("status", "pendiente").order("sku").limit(500),
      ]);
      for (const r of [sv, md, bl, tp]) if (r.error) throw r.error;
      const c = (v: unknown) => (v as { count: number }[])[0]?.count ?? 0;
      return {
        services: (sv.data ?? []).map((x) => ({
          id: x.id, code: x.sku, title: x.name,
          facts: [cap(x.type), x.suppliers?.name ?? "Sin proveedor", x.country ?? "Sin país", x.currency ?? "Sin moneda", x.pricing_unit ?? "Sin unidad", `${c(x.service_rates)} tarifas`, ...(x.source ? [`Origen: ${x.source}`] : [])],
          issues: [
            ...x.approval_issues,
            ...(x.import_issues ? [x.import_issues] : []),
            ...(!x.currency || !x.pricing_unit ? ["Falta moneda o unidad de precio: no se puede activar."] : []),
          ],
        })),
        activity_modules: (md.data ?? []).map((x) => ({
          id: x.id, code: x.code, title: x.name,
          facts: [DURATION_LABELS[x.duration], x.places?.name ?? "Sin lugar", `${c(x.activity_module_items)} servicios`, `Idiomas: ${x.activity_module_translations.map((t) => t.lang).join(", ") || "ninguno"}`],
          issues: [...(c(x.activity_module_items) === 0 ? ["Sin servicios."] : []), ...(!x.activity_module_translations.some((t) => t.lang === "es") ? ["Sin texto en español."] : [])],
        })),
        day_blocks: (bl.data ?? []).map((x) => ({
          id: x.id, code: x.code, title: blockTitle(x),
          facts: [`${x.route_from ?? "—"} → ${x.route_to ?? "—"}`, x.places.join(", ") || "Sin lugares", x.services?.name ?? "Sin hotel", `${c(x.day_block_modules)} módulos`, `${c(x.day_block_items)} servicios`],
          issues: [...(!x.day_block_translations.some((t) => t.lang === "es") ? ["Sin texto en español."] : [])],
        })),
        itinerary_templates: (tp.data ?? []).map((x) => ({
          id: x.id, code: x.sku, title: x.name,
          facts: [`${x.route_from ?? "—"} → ${x.route_to ?? "—"}`, `${x.days}D${x.nights}N`, x.category ?? "Categoría pendiente", `${c(x.template_days)}/${x.days} días armados`],
          issues: [...x.approval_issues, ...warningsList(x.import_warnings), ...(c(x.template_days) !== x.days ? ["Los días armados no coinciden con la duración."] : [])],
        })),
      };
    },
  });
}

function ReviewPage() {
  const { role } = useCurrentUser();
  const manager = canManageCatalog(role);
  const isAdmin = role === "admin";
  const qc = useQueryClient();
  const q = usePending();
  const [open, setOpen] = useState<{ kind: Kind; id: string } | null>(null);
  const [selected, setSelected] = useState<Record<Kind, Set<string>>>({
    services: new Set(), activity_modules: new Set(), day_blocks: new Set(), itinerary_templates: new Set(),
  });

  const toggle = (k: Kind, id: string) => {
    setSelected((prev) => {
      const next = new Set(prev[k]);
      if (next.has(id)) next.delete(id); else next.add(id);
      return { ...prev, [k]: next };
    });
  };

  const bulkApprove = useMutation({
    mutationFn: async ({ kind, ids }: { kind: Kind; ids: string[] }) => {
      const result = await approveImportReviewItems("activity_modules", ids);
      return { ok: result.approved, failed: result.pending };
    },
    onSuccess: ({ ok, failed }) => {
      if (failed === 0) toast.success(`${ok} aprobados.`);
      else if (ok === 0) toast.error("Ninguno se pudo aprobar: faltan datos obligatorios (moneda / unidad de precio).");
      else toast.warning(`${ok} aprobados, ${failed} con error: faltan datos obligatorios (moneda / unidad de precio).`);
      setSelected({ services: new Set(), activity_modules: new Set(), day_blocks: new Set(), itinerary_templates: new Set() });
      qc.invalidateQueries({ queryKey: ["import-review"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const decide = useMutation({
    mutationFn: async ({ kind, id, status }: { kind: Kind; id: string; status: Enums<"catalog_status"> }) => {
      if (status === "activo") {
        if (kind === "day_blocks") return approveDayBlocks([id]);
        if (kind === "itinerary_templates") return approveTemplates([id]);
        return approveImportReviewItems(kind, [id]);
      }
      const { error } = await db.from(kind).update({ status }).eq("id", id);
      if (error) throw error;
      return;
    },
    onSuccess: (_d, v) => {
      toast.success(v.status === "activo" ? "Aprobado." : "Rechazado (marcado como inactivo).");
      qc.invalidateQueries({ queryKey: ["import-review"] });
      qc.invalidateQueries({ queryKey: [v.kind] });
    },
    onError: (e: Error) => toast.error(e.message.includes("check") ? "No se puede activar: faltan datos obligatorios (moneda / unidad de precio)." : e.message),
  });

  const close = () => { setOpen(null); qc.invalidateQueries({ queryKey: ["import-review"] }); };
  const kinds = Object.keys(KIND_LABELS) as Kind[];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title={s.title} subtitle="Elementos en estado pendiente (importados o sugeridos por vendedores) a la espera de revisión." />
      <BulkImportApproval />
      {!manager && <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">Solo Admin y Operación pueden aprobar o rechazar. Aquí ves tus elementos pendientes.</p>}
      {q.isError && <p className="text-sm text-destructive">No se pudo cargar la revisión.</p>}
      <Tabs defaultValue="services">
        <TabsList>
          {kinds.map((k) => (
            <TabsTrigger key={k} value={k}>
              {KIND_LABELS[k]}{!!q.data?.[k].length && <Badge className="ml-2 h-5 px-1.5">{q.data[k].length}</Badge>}
            </TabsTrigger>
          ))}
        </TabsList>
        {kinds.map((k) => {
          const items = q.data?.[k] ?? [];
          const sel = selected[k];
          const allSelected = items.length > 0 && items.every((it) => sel.has(it.id));
          return (
          <TabsContent key={k} value={k} className="mt-4 space-y-3">
            {q.isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
            {items.length === 0 && <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No hay {KIND_LABELS[k].toLowerCase()} pendientes.</p>}
            {isAdmin && k !== "services" && k !== "itinerary_templates" && items.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-2">
                <Button
                  size="sm" variant="ghost" disabled={bulkApprove.isPending}
                  onClick={() => setSelected((prev) => ({ ...prev, [k]: allSelected ? new Set<string>() : new Set(items.map((it) => it.id)) }))}
                >
                  {allSelected ? <CheckSquare className="mr-1.5 h-4 w-4" /> : <Square className="mr-1.5 h-4 w-4" />}
                  {allSelected ? "Quitar selección" : "Seleccionar todos"}
                </Button>
                <span className="text-xs text-muted-foreground">{sel.size} de {items.length} seleccionados</span>
                <div className="ml-auto flex gap-2">
                  <Button
                    size="sm" disabled={sel.size === 0 || bulkApprove.isPending}
                    onClick={() => bulkApprove.mutate({ kind: k, ids: items.filter((it) => sel.has(it.id)).map((it) => it.id) })}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />Aprobar seleccionados{sel.size > 0 ? ` (${sel.size})` : ""}
                  </Button>
                  <Button size="sm" variant="outline" disabled={bulkApprove.isPending} onClick={() => bulkApprove.mutate({ kind: k, ids: items.map((it) => it.id) })}>
                    <CheckSquare className="mr-1 h-3.5 w-3.5" />Aprobar todos ({items.length})
                  </Button>
                </div>
              </div>
            )}
            {items.map((it) => (
              <Card key={it.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                {isAdmin && k !== "services" && k !== "itinerary_templates" && (
                  <button
                    type="button" aria-label={sel.has(it.id) ? "Quitar de la selección" : "Seleccionar"}
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => toggle(k, it.id)}
                  >
                    {sel.has(it.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                  </button>
                )}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="font-medium text-foreground">{it.title}</div>
                  <div className="font-mono text-xs text-muted-foreground">{it.code}</div>
                  <div className="flex flex-wrap gap-1.5">{it.facts.map((f, i) => <Badge key={i} variant="secondary" className="font-normal">{f}</Badge>)}</div>
                  {it.issues.map((iss, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-brand-orange-deep"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{iss}</div>
                  ))}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => setOpen({ kind: k, id: it.id })}><Pencil className="mr-1 h-3.5 w-3.5" />Editar</Button>
                  {manager && (
                    <>
                      <Button size="sm" disabled={decide.isPending} onClick={() => decide.mutate({ kind: k, id: it.id, status: "activo" })}><Check className="mr-1 h-3.5 w-3.5" />Aprobar</Button>
                      <Button size="sm" variant="outline" className="text-destructive" disabled={decide.isPending} onClick={() => decide.mutate({ kind: k, id: it.id, status: "inactivo" })}><X className="mr-1 h-3.5 w-3.5" />Rechazar</Button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>
          );
        })}
      </Tabs>
      <ServiceDetail serviceId={open?.kind === "services" ? open.id : null} onClose={close} />
      <ModuleEditor id={open?.kind === "activity_modules" ? open.id : null} onClose={close} onCreated={() => {}} />
      <BlockEditor id={open?.kind === "day_blocks" ? open.id : null} onClose={close} onCreated={() => {}} />
      <TemplateEditor id={open?.kind === "itinerary_templates" ? open.id : null} onClose={close} onCreated={() => {}} />
    </div>
  );
}
