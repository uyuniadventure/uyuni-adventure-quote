// @vitest-environment node
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";
import Papa from "papaparse";
import { describe, it, expect, beforeAll } from "vitest";
import { parsePackageV2, validatePackageV2, type PackageV2 } from "./package-v2";
import { costPackageTemplate } from "../pricing/template-cost";
let pkg: PackageV2;
let fx: Record<string, number>;
const root = new URL("../../test/fixtures/import-v2-sintetico/", import.meta.url);
beforeAll(async () => {
  const zip = unzipSync(new Uint8Array(await readFile(new URL("paquete-v2-sintetico.zip", root))));
  pkg = parsePackageV2(
    Object.fromEntries(Object.entries(zip).map(([k, v]) => [k.split("/").pop()!, strFromU8(v)])),
  );
  fx = JSON.parse(await readFile(new URL("fx.json", root), "utf8")).fx;
});
describe("paquete v2", () => {
  it("lee el zip y conserva párrafos/comillas y las variantes compartidas", () => {
    expect(pkg.tariffs).toHaveLength(16);
    expect(pkg.templates).toHaveLength(3);
    expect(pkg.days).toHaveLength(10);
    expect(pkg.texts).toHaveLength(6);
    expect(pkg.segments).toHaveLength(2);
    expect(new Set(pkg.blockItems.map((i) => i["bloque_servicios_id"])).size).toBe(6);
    expect(pkg.texts.find((t) => t["bloque_texto_id"] === "BD-T02")!["texto"]).toContain("\n");
    expect(pkg.days.filter((d) => d["bloque_servicios_id"] === "BD-T03/A")).toHaveLength(2);
    expect(
      pkg.blockItems
        .filter((i) => i["bloque_servicios_id"] === "BD-T02/B")
        .some((i) => i["slot"] === "COCTEL"),
    ).toBe(false);
  });
  it("valida el fixture con un aviso sin servicios", () => {
    const v = validatePackageV2(pkg);
    expect(v.errors).toEqual([]);
    expect(v.warnings).toHaveLength(1);
    expect(v.warnings[0]!.message).toContain("sin servicios");
  });
  it("detecta TariffCode repetido y vehículo sin capacidad", () => {
    const p = structuredClone(pkg);
    p.tariffs.push({ ...p.tariffs[0]! });
    p.tariffs[0]!["VehicleMaxPax"] = "";
    expect(validatePackageV2(p).errors.some((e) => e.message.includes("repetida"))).toBe(true);
    expect(validatePackageV2(p).errors.some((e) => e.message.includes("capacidad"))).toBe(true);
  });
  it("rechaza relaciones rotas, moneda y tramos invertidos", () => {
    const p = structuredClone(pkg);
    p.days[0]!["bloque_servicios_id"] = "XX/A";
    p.tariffs[0]!["Currency"] = "EUR";
    p.segments[0]!["dia_hasta"] = "0";
    expect(validatePackageV2(p).errors.length).toBeGreaterThanOrEqual(3);
  });
  it("reproduce todas las filas de expected_costs.csv con fx.json", async () => {
    const cases = Papa.parse<Record<string, string>>(
      await readFile(new URL("expected_costs.csv", root), "utf8"),
      { header: true, skipEmptyLines: true },
    ).data;
    expect(cases).toHaveLength(10);
    for (const c of cases)
      expect(
        costPackageTemplate({ pkg, sku: c["sku"]! }, { pax: +c["pax"]!, tc: +c["tc"]!, fx })
          .total_cost_usd,
        c["sku"] + " pax " + c["pax"],
      ).toBeCloseTo(+c["costo_esperado_usd"]!, 2);
  });
  it("cobra el 4x4 una vez y marca días cubiertos", () => {
    const r = costPackageTemplate({ pkg, sku: "SPASPA-4D3N-AB" }, { pax: 1, fx });
    expect(r.lines.filter((l) => l["sku"] === "T_4X4_4D")).toHaveLength(1);
    expect(r.included.map((d) => d.day)).toEqual([2, 3, 4]);
    expect(r.lines[0]!.span_days).toBe(4);
  });
});
