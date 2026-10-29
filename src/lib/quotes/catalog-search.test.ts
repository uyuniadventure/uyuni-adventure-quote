import { describe, expect, it } from "vitest";
import { blockTourRouteMap, blocksMatchingTourRoute } from "./catalog-search";

const locations = ["SPA", "UYU"];
const templates = [
  { id: "spaspa", sku: "SPASPA-4D3N-LLTd", route_from: null, route_to: null },
  { id: "spauyu", sku: "SPAUYU-3D2N", route_from: null, route_to: null },
  { id: "uyuspa", sku: "UYUSPA-3D2N", route_from: null, route_to: null },
  { id: "uyuuyu", sku: "UYUUYU-3D2N", route_from: null, route_to: null },
  { id: "unknown", sku: "SIN-RUTA", route_from: null, route_to: null },
];

describe("rutas de tour de los bloques en Nueva cotización", () => {
  it("asocia los cuatro días de SPASPA-4D3N-LLTd al recorrido del tour sin inventar tramos diarios", () => {
    const days = [1, 2, 3, 4].map((day) => ({ block_id: `spaspa-d${day}`, template_id: "spaspa" }));
    const routes = blockTourRouteMap(templates, days, locations);
    expect([...routes.values()]).toEqual([["SPA → SPA"], ["SPA → SPA"], ["SPA → SPA"], ["SPA → SPA"]]);
  });

  it.each([
    ["spaspa", "SPA → SPA"],
    ["spauyu", "SPA → UYU"],
    ["uyuspa", "UYU → SPA"],
    ["uyuuyu", "UYU → UYU"],
  ])("mantiene separada la combinación %s", (template_id, expected) => {
    expect(blockTourRouteMap(templates, [{ block_id: "block", template_id }], locations).get("block")).toEqual([expected]);
  });

  it("no asigna una ruta a plantillas desconocidas o ambiguas", () => {
    expect(blockTourRouteMap(templates, [{ block_id: "block", template_id: "unknown" }], locations).has("block")).toBe(false);
  });

  it.each([
    ["SPA", "SPA", ["spaspa-block"]],
    ["SPA", "UYU", ["spauyu-block"]],
    ["UYU", "SPA", ["uyuspa-block"]],
    ["UYU", "UYU", ["uyuuyu-block"]],
  ])("filtra solamente el recorrido completo %s → %s", (from, to, expected) => {
    const days = templates.map((template) => ({ block_id: `${template.id}-block`, template_id: template.id }));
    expect(blocksMatchingTourRoute(blockTourRouteMap(templates, days, locations), from, to)).toEqual(expected);
  });

  it("excluye del filtro los bloques cuya ruta de tour no puede demostrarse", () => {
    const routes = blockTourRouteMap(templates, [{ block_id: "unknown-block", template_id: "unknown" }], locations);
    expect(blocksMatchingTourRoute(routes, "SPA", "")).toEqual([]);
  });
});
