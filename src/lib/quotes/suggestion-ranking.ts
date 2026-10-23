import type { Enums } from "@/types/db";

export interface TemplateSearchBasics {
  route_from?: string;
  route_to?: string;
  days?: string | number;
  category?: Enums<"tour_category">;
  modality?: Enums<"itinerary_modality">;
}

interface SuggestionCandidate {
  id: string;
  sku: string;
  route_from: string | null;
  route_to: string | null;
  days: number;
  category: string | null;
  modality: string | null;
  status: string;
}

/** A blank requested endpoint is unrestricted; a blank template endpoint never
 * satisfies a concrete route because compatibility uses exact catalogue codes. */
export function filterAndRankTemplateSuggestions<T extends SuggestionCandidate>(
  templates: readonly T[],
  basics: TemplateSearchBasics,
) {
  const routeFrom = basics.route_from?.trim() || undefined;
  const routeTo = basics.route_to?.trim() || undefined;
  const wanted = Number(basics.days);

  return templates
    .filter(
      (template) =>
        (!routeFrom || template.route_from === routeFrom) &&
        (!routeTo || template.route_to === routeTo),
    )
    .map((template) => ({
      ...template,
      score:
        (routeFrom && template.route_from === routeFrom ? 3 : 0) +
        (routeTo && template.route_to === routeTo ? 3 : 0) +
        (wanted > 0
          ? template.days === wanted
            ? 2
            : Math.abs(template.days - wanted) === 1
              ? 1
              : 0
          : 0) +
        (basics.category && template.category === basics.category ? 2 : 0) +
        (basics.modality && template.modality === basics.modality ? 1 : 0),
    }))
    .sort(
      (a, b) =>
        Number(a.status === "pendiente") - Number(b.status === "pendiente") ||
        b.score - a.score ||
        a.sku.localeCompare(b.sku) ||
        a.id.localeCompare(b.id),
    );
}
