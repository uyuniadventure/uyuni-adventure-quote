import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, FilePlus2 } from "lucide-react";
import { listQuotes, QUOTES_PAGE_SIZE, QUOTE_STATUSES, type QuoteFilters } from "@/lib/quotes/list";
import { PageHeader, primaryBtn, useDebounced } from "@/components/catalog/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtDate, usd } from "@/components/ops/shared";
import { useCurrentUser } from "@/hooks/use-auth";

export function QuoteList() {
  const { user } = useCurrentUser();
  const [filters, setFilters] = useState<QuoteFilters>({
    code: "",
    client: "",
    status: "all",
    page: 0,
  });
  const current = useDebounced(filters);
  const changing = current !== filters;
  const q = useQuery({
    queryKey: ["quotes", user.id, current],
    queryFn: () => listQuotes(current),
  });
  const total = q.data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / QUOTES_PAGE_SIZE));
  const setFilter = (changes: Partial<QuoteFilters>) =>
    setFilters((f) => ({ ...f, ...changes, page: 0 }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Cotizaciones"
        subtitle="Busca tus cotizaciones y continúa los borradores guardados."
        action={
          <Button className={primaryBtn} asChild>
            <Link to="/nueva-cotizacion" search={{}}>
              <FilePlus2 />
              Nueva cotización
            </Link>
          </Button>
        }
      />
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex-1 space-y-1.5 text-xs text-muted-foreground">
          <span>Código</span>
          <Input
            className="min-w-[220px]"
            placeholder="Buscar por código…"
            value={filters.code}
            onChange={(e) => setFilter({ code: e.target.value })}
          />
        </label>
        <label className="flex-1 space-y-1.5 text-xs text-muted-foreground">
          <span>Cliente</span>
          <Input
            className="min-w-[220px]"
            placeholder="Buscar por nombre o agencia…"
            value={filters.client}
            onChange={(e) => setFilter({ client: e.target.value })}
          />
        </label>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <span id="quote-status-label">Estado</span>
          <Select
            value={filters.status}
            onValueChange={(status) => setFilter({ status: status as QuoteFilters["status"] })}
          >
            <SelectTrigger className="w-[170px]" aria-labelledby="quote-status-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(QUOTE_STATUSES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-md border bg-card" aria-busy={q.isFetching || changing}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Pax + TC</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total USD</TableHead>
              <TableHead>
                <span className="sr-only">Abrir</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(q.isLoading || changing) && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Buscando cotizaciones…
                </TableCell>
              </TableRow>
            )}
            {q.isError && !changing && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center">
                  <p role="alert" className="mb-2 text-destructive">
                    No se pudieron cargar las cotizaciones: {q.error.message}
                  </p>
                  <Button variant="outline" onClick={() => void q.refetch()}>
                    Reintentar
                  </Button>
                </TableCell>
              </TableRow>
            )}
            {q.isSuccess && !changing && total === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No hay cotizaciones con estos filtros.
                </TableCell>
              </TableRow>
            )}
            {q.isSuccess &&
              !changing &&
              q.data.rows.map((quote) => {
                const editable =
                  !quote.archived_at && ["borrador", "revisada"].includes(quote.status);
                return (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono text-xs">
                      <Link
                        className="underline-offset-4 hover:underline"
                        to="/nueva-cotizacion"
                        search={{ quote: quote.id }}
                      >
                        {quote.code}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{quote.clients.name}</div>
                      <div className="text-xs text-muted-foreground">{quote.client_type}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{fmtDate(quote.start_date)}</TableCell>
                    <TableCell>
                      {quote.pax_paying} + {quote.tc_count}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary">{QUOTE_STATUSES[quote.status]}</Badge>
                        {quote.archived_at && <Badge variant="outline">Archivada</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {quote.total_price_usd == null ? (
                        <span className="text-muted-foreground">Sin calcular</span>
                      ) : (
                        usd(quote.total_price_usd)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link
                          to="/nueva-cotizacion"
                          search={{ quote: quote.id }}
                          aria-label={`${editable ? "Continuar" : "Ver"} ${quote.code}`}
                        >
                          {editable ? "Continuar" : "Ver"}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
      {q.isSuccess && !changing && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {total} cotizaciones · Página {current.page + 1} de {pages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={current.page === 0}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            >
              <ChevronLeft />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={current.page + 1 >= pages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            >
              Siguiente
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
