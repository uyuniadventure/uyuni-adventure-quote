import type { Tables } from "@/types/db";
import { resolveDay } from "@/lib/quotes/days";
import { Card } from "@/components/ui/card";

/** Only frozen operation data: no lookups of the current quote or catalog. */
export function OperationItinerary({ service }: { service: Tables<"ops_services"> }) {
  const quote = service.quote_snapshot as Partial<Tables<"quotes">>;
  const days = service.days_snapshot as unknown as Tables<"quote_days">[];
  const language = service.language;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {quote.pax_paying ?? service.pax} pagantes · {quote.tc_count ?? 0} liberados. Copia del
        itinerario al confirmar la venta.
      </p>
      {days.map((day) => {
        const content = resolveDay(day);
        return (
          <Card key={day.id} className="p-4">
            <h3 className="font-semibold">
              Día {day.day_number} · {day.date} · {content.title?.[language] ?? day.title}
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm">
              {content.description?.[language] ?? day.description}
            </p>
            {(content.start_point || content.end_point) && (
              <p className="mt-2 text-xs text-muted-foreground">
                {content.start_point || "—"} → {content.end_point || "—"}
              </p>
            )}
          </Card>
        );
      })}
      {days.length === 0 && <p className="text-sm text-muted-foreground">No hay días copiados.</p>}
    </div>
  );
}
