import { db } from "../db";
import type { Enums, Json } from "@/types/db";

export interface TemplateSearchBasics {
  route_from?: string;
  route_to?: string;
  days?: string | number;
  category?: Enums<"tour_category">;
  modality?: Enums<"itinerary_modality">;
}

export function templateSuggestionError(error: { code?: string; message: string }): Error {
  if (error.code === "42703" || error.code === "PGRST204") {
    const migration = error.message.includes("quote_defaults")
      ? "20261011000100_template_quote_defaults.sql"
      : error.message.includes("import_warnings")
        ? "20261004000300_snapshot_fields.sql"
        : "las migraciones pendientes de supabase/migrations en orden de fecha";
    return new Error(
      `Falta una columna en la base de datos. Aplica ${migration} en Lovable Cloud y vuelve a intentar. Detalle: ${error.message}`,
    );
  }
  return new Error(`No se pudieron cargar las plantillas. ${error.message}`);
}

export function templateImportWarnings(raw: Json): string[] {
  if (raw == null) return [];
  const values = Array.isArray(raw) ? raw : [raw];
  return values.map((value) => (typeof value === "string" ? value : JSON.stringify(value)));
}

/** RLS defines the same catalogue visibility as /plantillas. Ranking never
 * excludes a visible active/pending template, even when its score is zero. */
export async function suggestTemplates(basics: TemplateSearchBasics) {
  const pageSize = 500;
  const page = (offset: number) =>
    db
      .from("itinerary_templates")
      .select(
        "id, sku, name, route_from, route_to, days, nights, category, modality, hotel_combo, meals_summary, status, quote_defaults, import_warnings, template_days(count)",
      )
      .in("status", ["activo", "pendiente"])
      .order("id")
      .range(offset, offset + pageSize - 1);
  const first = await page(0);
  if (first.error) throw templateSuggestionError(first.error);
  const templates = [...(first.data ?? [])];
  for (let offset = pageSize; templates.length === offset; offset += pageSize) {
    const result = await page(offset);
    if (result.error) throw templateSuggestionError(result.error);
    templates.push(...(result.data ?? []));
  }
  const wanted = Number(basics.days);
  return templates
    .map((t) => ({
      ...t,
      score:
        (basics.route_from && t.route_from === basics.route_from ? 3 : 0) +
        (basics.route_to && t.route_to === basics.route_to ? 3 : 0) +
        (wanted > 0 ? (t.days === wanted ? 2 : Math.abs(t.days - wanted) === 1 ? 1 : 0) : 0) +
        (basics.category && t.category === basics.category ? 2 : 0) +
        (basics.modality && t.modality === basics.modality ? 1 : 0),
    }))
    .sort(
      (a, b) =>
        Number(a.status === "pendiente") - Number(b.status === "pendiente") ||
        b.score - a.score ||
        a.sku.localeCompare(b.sku) ||
        a.id.localeCompare(b.id),
    );
}
export type TemplateSuggestion = Awaited<ReturnType<typeof suggestTemplates>>[number];
