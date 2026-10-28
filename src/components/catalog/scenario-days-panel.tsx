import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ANY = "__all__";

export function ScenarioDaysPanel() {
  const [tour, setTour] = useState("");
  const [year, setYear] = useState(ANY);
  const [season, setSeason] = useState(ANY);
  const [pax, setPax] = useState(ANY);
  const query = useQuery({
    queryKey: ["scenario-days", tour, year, season, pax],
    queryFn: async () => {
      let request = db.from("tour_cost_scenarios").select("id,tour_sku,rate_year,season,pax,approved_cost_usd,detail_cost_usd,cost_difference_usd,reconciliation_status").eq("status", "activo");
      if (tour.trim()) request = request.ilike("tour_sku", `%${tour.trim()}%`);
      if (year !== ANY) request = request.eq("rate_year", Number(year));
      if (season !== ANY) request = request.eq("season", season);
      if (pax !== ANY) request = request.eq("pax", Number(pax));
      const scenarios = await request.order("tour_sku").limit(200);
      if (scenarios.error) throw scenarios.error;
      if (!scenarios.data.length) return [];
      const days = await db.from("tour_cost_scenario_days").select("id,scenario_id,day_number,visible_code,title").in("scenario_id", scenarios.data.map((row) => row.id)).order("day_number").limit(1000);
      if (days.error) throw days.error;
      const byId = new Map(scenarios.data.map((row) => [row.id, row]));
      return days.data.map((day) => ({ ...day, scenario: byId.get(day.scenario_id)! }));
    },
  });
  return <Card className="space-y-4 p-4">
    <div><h2 className="font-semibold text-foreground">Días económicos por escenario</h2><p className="text-sm text-muted-foreground">Referencia importada; no sustituye los bloques narrativos editables.</p></div>
    <div className="grid gap-2 sm:grid-cols-4">
      <Input aria-label="Filtrar tour" placeholder="Tour / SKU" value={tour} onChange={(e) => setTour(e.target.value)} />
      <Select value={year} onValueChange={setYear}><SelectTrigger aria-label="Filtrar año"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ANY}>Todos los años</SelectItem><SelectItem value="2026">2026</SelectItem><SelectItem value="2027">2027</SelectItem></SelectContent></Select>
      <Select value={season} onValueChange={setSeason}><SelectTrigger aria-label="Filtrar temporada"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ANY}>Todas las temporadas</SelectItem>{["ALL","DRY","RAIN"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
      <Select value={pax} onValueChange={setPax}><SelectTrigger aria-label="Filtrar pasajeros"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ANY}>Pax 1–5</SelectItem>{[1,2,3,4,5].map((v) => <SelectItem key={v} value={String(v)}>P{v}</SelectItem>)}</SelectContent></Select>
    </div>
    {query.isError && <p role="alert" className="text-sm text-destructive">{query.error.message}</p>}
    <div className="max-h-96 overflow-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Código visible</TableHead><TableHead>Escenario exacto</TableHead><TableHead>Conciliación</TableHead><TableHead>Título</TableHead></TableRow></TableHeader><TableBody>
      {query.data?.map((row) => <TableRow key={row.id}><TableCell className="font-mono text-xs">{row.visible_code}</TableCell><TableCell>{row.scenario.tour_sku} · {row.scenario.rate_year} · {row.scenario.season} · P{row.scenario.pax}</TableCell><TableCell>{row.scenario.reconciliation_status === "difference" ? `Aprobado ${row.scenario.approved_cost_usd} · detalle ${row.scenario.detail_cost_usd} · Δ ${row.scenario.cost_difference_usd}` : "Conciliado"}</TableCell><TableCell>{row.title}</TableCell></TableRow>)}
      {!query.isLoading && query.data?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sin días para estos filtros.</TableCell></TableRow>}
    </TableBody></Table></div>
  </Card>;
}
