import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import type { Enums } from "@/types/db";
import { SECTIONS, sectionHead } from "@/components/section";
import { canManageCatalog, useCurrentUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATUSES, StatusBadge, cap } from "@/components/catalog/shared";
import {
  ALL,
  CATEGORIES,
  Filter,
  PageHeader,
  ilikeTerm,
  primaryBtn,
  useDebounced,
  useHotelCodes,
  useLocationCodes,
} from "@/components/catalog/kit";
import { Checkbox } from "@/components/ui/checkbox";
import { CatalogRowMenu, CatalogSelectionBar, useCatalogActions } from "@/components/catalog/catalog-actions";
import { useCatalogSelection } from "@/components/catalog/catalog-selection";
import { TemplateEditor } from "@/components/catalog/template-editor";
import { TemplateQuoteLink } from "@/components/quote/template-quote-link";

const s = SECTIONS.plantillas;

export const Route = createFileRoute("/_authenticated/plantillas")({
  head: () => sectionHead(s),
  component: TemplatesPage,
});

function TemplatesPage() {
  const { user, role } = useCurrentUser();
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState(ALL);
  const [to, setTo] = useState(ALL);
  const [days, setDays] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [hotels, setHotels] = useState("");
  const [status, setStatus] = useState(ALL);
  const term = useDebounced(search.trim());
  const hotelTerm = useDebounced(hotels.trim());
  const locs = useLocationCodes();
  const hotelCodes = useHotelCodes();

  const filterKey = JSON.stringify({ search, from, to, days, category, hotels, status });
  const applyFilters = <T extends ReturnType<typeof baseQuery>>(query: T) => {
    if (term) query = query.ilike("sku", `%${ilikeTerm(term)}%`);
    if (from !== ALL) query = query.eq("route_from", from);
    if (to !== ALL) query = query.eq("route_to", to);
    if (days !== ALL) query = query.eq("days", Number(days));
    if (category !== ALL) query = query.eq("category", category as Enums<"tour_category">);
    if (hotelTerm) query = query.like("hotel_combo", `%${ilikeTerm(hotelTerm)}%`);
    if (status !== ALL) query = query.eq("status", status as Enums<"catalog_status">);
    return query;
  };
  const baseQuery = () => db.from("itinerary_templates").select("id, sku, name");
  const actions = useCatalogActions("templates", () => selection.clear());
  const selection = useCatalogSelection(["itinerary_templates"], filterKey, canManageCatalog(role), async (offset, end) => {
    const { data, error } = await applyFilters(baseQuery()).order("sku").order("id").range(offset, end);
    if (error) throw error;
    return data.map((r) => ({ id: r.id, code: r.sku, name: r.name }));
  });
  const q = useQuery({
    queryKey: ["itinerary_templates", { term, from, to, days, category, hotelTerm, status }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = db.from("itinerary_templates").select("id, sku, name, route_from, route_to, route_type, days, nights, category, hotel_combo, modality, status, template_days(count)").order("sku").order("id").limit(500);
      if (term) query = query.ilike("sku", `%${ilikeTerm(term)}%`);
      if (from !== ALL) query = query.eq("route_from", from);
      if (to !== ALL) query = query.eq("route_to", to);
      if (days !== ALL) query = query.eq("days", Number(days));
      if (category !== ALL) query = query.eq("category", category as Enums<"tour_category">);
      if (hotelTerm) query = query.like("hotel_combo", `%${ilikeTerm(hotelTerm)}%`);
      if (status !== ALL) query = query.eq("status", status as Enums<"catalog_status">);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const duplicate = useMutation({
    mutationFn: async (id: string) => {
      const { data: t, error } = await db
        .from("itinerary_templates")
        .select("*, template_days(day_number, block_id)")
        .eq("id", id)
        .single();
      if (error) throw error;
      const {
        id: _i,
        created_at: _c,
        updated_at: _u,
        template_days,
        source_quote_id: _s,
        import_warnings: _w,
        ...rest
      } = t;
      let sku = `${t.sku}-COPIA`;
      for (let n = 2; ; n++) {
        const { count } = await db
          .from("itinerary_templates")
          .select("id", { count: "exact", head: true })
          .eq("sku", sku);
        if (!count) break;
        sku = `${t.sku}-COPIA${n}`;
      }
      const { data: copy, error: e2 } = await db
        .from("itinerary_templates")
        .insert({
          ...rest,
          catalog_origin: "manual",
          sku,
          name: `${t.name} (copia)`,
          created_by: user.id,
          status: canManageCatalog(role) ? t.status : "pendiente",
        })
        .select("id")
        .single();
      if (e2) throw e2;
      if (template_days.length) {
        const { error: e3 } = await db.from("template_days").insert(
          template_days.map((d) => ({
            template_id: copy.id,
            day_number: d.day_number,
            block_id: d.block_id,
          })),
        );
        if (e3) throw e3;
      }
      return copy.id;
    },
    onSuccess: (id) => {
      toast.success("Plantilla duplicada.");
      qc.invalidateQueries({ queryKey: ["itinerary_templates"] });
      setOpenId(id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const locOpts = (locs.data ?? []).map(
    (l) => [l.code, `${l.code} · ${l.name}`] as [string, string],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={s.title}
        subtitle="Biblioteca de itinerarios. Busca por SKU completo o parcial (UYUSPA, 3D2N, -PTd)."
        action={
          <Button className={primaryBtn} onClick={() => setOpenId("new")}>
            <Plus className="mr-1 h-4 w-4" />
            Nueva plantilla
          </Button>
        }
      />
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SKU parcial…"
            className="pl-8 font-mono"
          />
        </div>
        <Filter value={from} onChange={setFrom} placeholder="Origen" options={locOpts} />
        <Filter value={to} onChange={setTo} placeholder="Destino" options={locOpts} />
        <Filter
          value={days}
          onChange={setDays}
          placeholder="Días"
          options={Array.from({ length: 15 }, (_, i) => [String(i + 1), `${i + 1} días`])}
        />
        <Filter
          value={category}
          onChange={setCategory}
          placeholder="Categoría"
          options={CATEGORIES.map((c) => [c, c])}
        />
        <Input
          value={hotels}
          onChange={(e) => setHotels(e.target.value)}
          placeholder="Hoteles (ej. MP)"
          className="w-[150px] font-mono"
          title={hotelCodes.data?.map((h) => `${h.code} = ${h.name}`).join("\n")}
        />
        <Filter
          value={status}
          onChange={setStatus}
          placeholder="Estado"
          options={STATUSES.map((x) => [x, cap(x)])}
        />
      </div>
      {actions.allowed && <label className="flex items-center gap-2 text-sm"><Checkbox aria-label="Seleccionar todo" checked={selection.all ? true : selection.records.length ? "indeterminate" : false} disabled={!selection.ready || actions.busy} onCheckedChange={(v) => selection.selectAll(v === true)} />Seleccionar todo ({selection.loading ? "…" : selection.records.length})</label>}
      {selection.error && <p role="alert" className="text-sm text-destructive">No se pudo cargar la selección completa. Vuelve a intentar.</p>}
      <CatalogSelectionBar records={selection.records} actions={actions} disabled={!selection.ready} />
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {actions.allowed && <TableHead className="w-10" />}
              <TableHead>SKU</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Ruta</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Hoteles</TableHead>
              <TableHead className="text-right">Días armados</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading && (
              <TableRow>
                <TableCell colSpan={actions.allowed ? 10 : 9} className="py-10 text-center text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            )}
            {q.isError && (
              <TableRow>
                <TableCell colSpan={actions.allowed ? 10 : 9} className="py-10 text-center text-destructive">
                  No se pudieron cargar las plantillas.
                </TableCell>
              </TableRow>
            )}
            {q.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={actions.allowed ? 10 : 9} className="py-10 text-center text-muted-foreground">
                  No hay plantillas con estos filtros.
                </TableCell>
              </TableRow>
            )}
            {q.data?.map((t) => {
              const built = (t.template_days as unknown as { count: number }[])[0]?.count ?? 0;
              return (
                <TableRow
                  key={t.id}
                  className="group cursor-pointer"
                  onClick={() => setOpenId(t.id)}
                >
                  {actions.allowed && <TableCell onClick={(e) => e.stopPropagation()}><Checkbox aria-label={`Seleccionar ${t.sku}`} checked={selection.ids.has(t.id)} disabled={!selection.ready || actions.busy} onCheckedChange={(v) => selection.toggle(t.id, v === true)} /></TableCell>}
                  <TableCell className="max-w-[220px] truncate font-mono text-xs">
                    {t.sku}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate font-medium text-foreground">
                    {t.name}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {t.route_from ?? "—"} → {t.route_to ?? "—"}{" "}
                    <span className="text-muted-foreground">
                      {t.route_type === "ROUNDTRIP" ? "RT" : "OW"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {t.days}D{t.nights}N
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.category}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{t.hotel_combo ?? "—"}</TableCell>
                  <TableCell
                    className={`text-right ${built !== t.days ? "text-brand-orange-deep" : ""}`}
                  >
                    {built}/{t.days}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={t.status} />
                  </TableCell>
                  <TableCell>
                    <CatalogRowMenu record={{ id: t.id, code: t.sku, name: t.name }} actions={actions} />
                    <TemplateQuoteLink
                      template={t}
                      className="md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={duplicate.isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicate.mutate(t.id);
                      }}
                    >
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      Duplicar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {actions.dialog}
      <TemplateEditor id={openId} onClose={() => setOpenId(null)} onCreated={setOpenId} />
    </div>
  );
}
