import { db } from "../db";
import type { Json } from "@/types/db";
import { filterAndRankTemplateSuggestions, type TemplateSearchBasics } from "./suggestion-ranking";

export type { TemplateSearchBasics } from "./suggestion-ranking";

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

/** RLS defines the same catalogue visibility as /plantillas. A requested route
 * is mandatory; duration, category and modality only rank compatible rows. */
export async function suggestTemplates(basics: TemplateSearchBasics) {
  const pageSize = 500;
  const page = (offset: number) =>
    db
      .from("itinerary_templates")
      .select(
        "id, sku, name, route_from, route_to, days, nights, category, modality, hotel_combo, meals_summary, status, quote_defaults, import_warnings, template_days(count)",
      )
      .in("status", ["activo", "pendiente"])
      .eq("economic_status", "validated")
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
  return filterAndRankTemplateSuggestions(templates, basics);
}
export type TemplateSuggestion = Awaited<ReturnType<typeof suggestTemplates>>[number];
