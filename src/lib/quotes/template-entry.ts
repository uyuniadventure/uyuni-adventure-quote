import { db } from "../db";
import { templateSuggestionError } from "./suggestions";
import { templatePassengerDefaults } from "./template-defaults";

/** Load the selected catalogue row through the caller's RLS, without creating
 * a quote or reading any client. The creation RPC rechecks availability. */
export async function getTemplateForQuote(id: string) {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))
    throw new Error("El identificador de la plantilla no es válido.");
  const { data, error } = await db
    .from("itinerary_templates")
    .select(
      "id, sku, name, route_from, route_to, days, nights, category, modality, status, quote_defaults, import_warnings",
    )
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") throw new Error("La plantilla no existe o no tienes acceso.");
    throw templateSuggestionError(error);
  }
  if (!data) throw new Error("La plantilla no existe o no tienes acceso.");
  if (data.status !== "activo" && data.status !== "pendiente")
    throw new Error("La plantilla está archivada y no se puede usar para cotizar.");
  return data;
}
export type TemplateForQuote = Awaited<ReturnType<typeof getTemplateForQuote>>;

/** Only itinerary/passenger fields are prefilled. Client/date stay with the user. */
export function templateQuotePrefill(
  template: Pick<
    TemplateForQuote,
    "route_from" | "route_to" | "days" | "category" | "modality" | "quote_defaults"
  >,
) {
  const reference = templatePassengerDefaults(template.quote_defaults);
  return {
    route_from: template.route_from ?? "",
    route_to: template.route_to ?? "",
    days: String(template.days),
    ...(template.category ? { category: template.category } : {}),
    modality: template.modality,
    ...(reference.pax_paying !== undefined ? { pax_paying: String(reference.pax_paying) } : {}),
    ...(reference.tc_count !== undefined ? { tc_count: String(reference.tc_count) } : {}),
  };
}

export function quoteCreationSearch(search: Record<string, unknown>): {
  quote?: string;
  template?: string;
} {
  // An existing quote takes precedence; a template must never replace its contents.
  if (typeof search["quote"] === "string" && search["quote"].trim())
    return { quote: search["quote"] };
  if (typeof search["template"] === "string" && search["template"].trim())
    return { template: search["template"] };
  return {};
}
