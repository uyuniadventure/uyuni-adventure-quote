import { db, unwrap } from "../db";

export interface TemplateSavePreview {
  sku: string | null;
  route_from: string | null;
  route_to: string | null;
  needs_from: boolean;
  needs_to: boolean;
  days: number;
  quote_updated_at: string;
  existing: { id: string; sku: string; name: string; updated_at: string } | null;
}
export interface TemplateRouteInput {
  route_from?: string;
  route_to?: string;
}
export type TemplateSaveMode = "create" | "new" | "replace";
export class TemplateSkuConflict extends Error {}

export async function listTemplateLocations() {
  return unwrap(await db.from("location_codes").select("code, name").order("name")).filter(
    (location) => location.code !== "XXX",
  );
}

export async function prepareQuoteTemplate(quoteId: string, route: TemplateRouteInput = {}) {
  return unwrap(
    await db.rpc("prepare_quote_template", {
      p_id: quoteId,
      p_route_from: route.route_from ?? "",
      p_route_to: route.route_to ?? "",
    }),
  ) as unknown as TemplateSavePreview;
}

export async function saveQuoteAsTemplate(
  quoteId: string,
  preview: TemplateSavePreview,
  mode: TemplateSaveMode,
) {
  if (!preview.sku)
    throw new Error("Selecciona el origen del primer día y el destino del último día.");
  const { data, error } = await db.rpc("save_quote_as_template", {
    p_id: quoteId,
    p_mode: mode,
    p_route_from: preview.route_from ?? "",
    p_route_to: preview.route_to ?? "",
    p_expected_sku: preview.sku,
    p_updated_at: preview.quote_updated_at,
    ...(mode === "replace" && preview.existing
      ? {
          p_replace_id: preview.existing.id,
          p_replace_updated_at: preview.existing.updated_at,
        }
      : {}),
  });
  if (error) {
    if (error.hint === "template_sku_conflict" || error.code === "23505") {
      throw new TemplateSkuConflict(
        "Ese SKU ya existe. Guarda como nueva para usar el siguiente sufijo libre (-V2, -V3…).",
      );
    }
    if (error.code === "42501")
      throw new Error("No tienes permiso para guardar o reemplazar esta plantilla.");
    if (error.code === "PGRST202")
      throw new Error("Falta aplicar la migración de guardado de plantillas. Contacta con Admin.");
    throw new Error(error.message);
  }
  return unwrap({ data, error }) as unknown as { id: string; sku: string; replaced: boolean };
}
