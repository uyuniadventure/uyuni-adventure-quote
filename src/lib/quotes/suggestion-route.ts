export interface RouteCandidate {
  route_from?: string | null;
  route_to?: string | null;
  sku?: string | null;
}

export interface ResolvedSuggestionRoute {
  route_from: string;
  route_to: string;
  source: "structured" | "sku";
}

function code(value: string | null | undefined) {
  return value?.trim().toUpperCase() || null;
}

/**
 * Resolves a catalogue route without guessing. Structured endpoints win. A SKU
 * is used only when exactly one pair of known location codes matches its
 * leading route token (the part before the first hyphen).
 */
export function resolveSuggestionRoute(
  candidate: RouteCandidate,
  locationCodes: readonly string[],
): ResolvedSuggestionRoute | null {
  const structuredFrom = code(candidate.route_from);
  const structuredTo = code(candidate.route_to);
  if (structuredFrom && structuredTo) {
    return { route_from: structuredFrom, route_to: structuredTo, source: "structured" };
  }

  const routeToken = code(candidate.sku)?.split("-", 1)[0];
  if (!routeToken) return null;
  const known = [...new Set(locationCodes.map(code).filter((value): value is string => Boolean(value)))];
  const matches = known.flatMap((routeFrom) =>
    known.flatMap((routeTo) =>
      routeFrom + routeTo === routeToken &&
      (!structuredFrom || structuredFrom === routeFrom) &&
      (!structuredTo || structuredTo === routeTo)
        ? [{ route_from: routeFrom, route_to: routeTo, source: "sku" as const }]
        : [],
    ),
  );
  return matches.length === 1 ? matches[0]! : null;
}

export function matchesSuggestionRoute(
  candidate: RouteCandidate,
  requested: Pick<RouteCandidate, "route_from" | "route_to">,
  locationCodes: readonly string[],
) {
  const wantedFrom = code(requested.route_from);
  const wantedTo = code(requested.route_to);
  if (!wantedFrom && !wantedTo) return true;
  const resolved = resolveSuggestionRoute(candidate, locationCodes);
  return Boolean(
    resolved &&
      (!wantedFrom || resolved.route_from === wantedFrom) &&
      (!wantedTo || resolved.route_to === wantedTo),
  );
}
