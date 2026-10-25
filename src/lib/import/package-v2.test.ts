// @vitest-environment node
import { readFile } from "node:fs/promises";
import Papa from "papaparse";
import { describe, it, expect, beforeAll } from "vitest";
import {
  diffPackageV2,
  numberCell,
  packageFiles,
  parsePackageV2,
  validatePackageV2,
  type PackageV2,
} from "./package-v2";
import { costPackageTemplate } from "../pricing/template-cost";
import { assessPackageTemplates } from "./index";
let pkg: PackageV2;
const root = new URL("../../test/fixtures/import-v2-sintetico/", import.meta.url);
beforeAll(async () => {
  pkg = parsePackageV2(
    Object.fromEntries(
      await Promise.all(
        packageFiles.map(async (name) => [
          `${name}.csv`,
          await readFile(new URL(`${name}.csv`, root), "utf8"),
        ]),
      ),
    ),
  );
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
    expect(v.warnings).toHaveLength(3);
    expect(v.warnings.some((w) => w.message.includes("sin servicios"))).toBe(true);
    expect(v.warnings.filter((w) => w.message.includes("Categoría de origen"))).toHaveLength(2);
  });
  it("detecta TariffCode repetido y vehículo sin capacidad", () => {
    const p = structuredClone(pkg);
    p.tariffs.push({ ...p.tariffs[0]! });
    p.tariffs[0]!["VehicleMaxPax"] = "";
    p.tariffs[0]!["PaxMax"] = "";
    expect(validatePackageV2(p).errors.some((e) => e.message.includes("repetida"))).toBe(true);
    expect(validatePackageV2(p).errors.some((e) => e.message.includes("capacidad"))).toBe(true);
  });
  it("usa PaxMax sólo cuando falta VehicleMaxPax y acepta enteros decimales del CSV", () => {
    const p = structuredClone(pkg);
    p.tariffs[0]!["VehicleMaxPax"] = "";
    p.tariffs[0]!["PaxMax"] = "6.0";
    expect(validatePackageV2(p).errors).toEqual([]);

    p.tariffs[0]!["VehicleMaxPax"] = "6.0";
    p.tariffs[0]!["PaxMax"] = "";
    expect(validatePackageV2(p).errors).toEqual([]);

    p.tariffs[0]!["VehicleMaxPax"] = "6.5";
    p.tariffs[0]!["PaxMax"] = "9";
    expect(validatePackageV2(p).errors.some((e) => e.message.includes("capacidad"))).toBe(true);
  });
  it("conserva el proveedor de un alojamiento bloqueado aunque no tenga tarifa", () => {
    const p = structuredClone(pkg);
    const unresolved = p.lodging.find((row) => row["slot"] === "ALOJAMIENTO")!;
    unresolved["TariffCode"] = "";
    unresolved["proveedor"] = "HOTEL SIN TARIFA";
    unresolved["hotel"] = "HOTEL SIN TARIFA";
    const changes = diffPackageV2(p, {});
    expect(
      changes.some(
        (change) =>
          change.table_name === "suppliers" && change.payload["name"] === "HOTEL SIN TARIFA",
      ),
    ).toBe(true);
    expect(
      changes.some(
        (change) =>
          change.table_name === "template_day_items" &&
          change.payload["source_hotel_name"] === "HOTEL SIN TARIFA" &&
          change.payload["service_id"] === null &&
          change.payload["supplier_id"] != null,
      ),
    ).toBe(true);
  });
  it("resuelve un TariffCode existente como alias sin duplicar ni reescribir el servicio", () => {
    const p = structuredClone(pkg);
    const tariff = p.tariffs[0]!;
    const serviceId = crypto.randomUUID();
    const supplierId = crypto.randomUUID();
    const changes = diffPackageV2(p, {
      suppliers: [{ id: supplierId, name: tariff["Supplier"] }],
      services: [
        {
          id: serviceId,
          sku: "SKU_PRIMARIO_HISTORICO",
          source: "importacion_anterior",
          supplier_id: supplierId,
        },
      ],
      service_sku_aliases: [
        { id: crypto.randomUUID(), sku: tariff["TariffCode"], service_id: serviceId },
      ],
      service_rates: [],
    });
    expect(
      changes.find(
        (change) => change.table_name === "services" && change.natural_key === tariff["TariffCode"],
      ),
    ).toMatchObject({ action: "skip", payload: { id: serviceId } });
    expect(
      changes.find(
        (change) =>
          change.table_name === "service_rates" && change.natural_key === tariff["TariffCode"],
      )?.payload["service_id"],
    ).toBe(serviceId);
  });
  it("rechaza un TariffCode que es SKU y alias de servicios distintos", () => {
    const p = structuredClone(pkg);
    const code = p.tariffs[0]!["TariffCode"]!;
    expect(() =>
      diffPackageV2(p, {
        services: [
          { id: crypto.randomUUID(), sku: code, source: "manual" },
          { id: "22000000-0000-0000-0000-000000000002", sku: "OTRO", source: "manual" },
        ],
        service_sku_aliases: [
          {
            id: crypto.randomUUID(),
            sku: code,
            service_id: "22000000-0000-0000-0000-000000000002",
          },
        ],
      }),
    ).toThrow(/apunta a dos servicios distintos/);
  });
  it("rechaza sobrescribir una tarifa protegida encontrada por alias", () => {
    const p = structuredClone(pkg);
    const tariff = p.tariffs[0]!;
    const serviceId = crypto.randomUUID();
    const supplierId = crypto.randomUUID();
    expect(() =>
      diffPackageV2(p, {
        suppliers: [{ id: supplierId, name: tariff["Supplier"] }],
        services: [
          {
            id: serviceId,
            sku: "SKU_PRIMARIO_HISTORICO",
            source: "manual",
            supplier_id: supplierId,
          },
        ],
        service_sku_aliases: [
          { id: crypto.randomUUID(), sku: tariff["TariffCode"], service_id: serviceId },
        ],
        service_rates: [
          {
            id: crypto.randomUUID(),
            service_id: serviceId,
            valid_from: tariff["ValidFrom"] || `${tariff["Year"]}-01-01`,
            valid_to: tariff["ValidTo"] || `${tariff["Year"]}-12-31`,
            season: tariff["Season"],
            pax_min: numberCell(tariff["PaxMin"]),
            pax_max: numberCell(tariff["PaxMax"]),
            price_net: 999999,
            price_rack: null,
          },
        ],
      }),
    ).toThrow(/Tarifa protegida en conflicto/);
  });
  it("rechaza relaciones rotas, moneda y tramos invertidos", () => {
    const p = structuredClone(pkg);
    p.days[0]!["bloque_servicios_id"] = "XX/A";
    p.tariffs[0]!["Currency"] = "EUR";
    p.segments[0]!["dia_hasta"] = "0";
    expect(validatePackageV2(p).errors.length).toBeGreaterThanOrEqual(3);
  });
  it("usa PRECIO_USD y deja pendiente el pasajero sin banda comercial", async () => {
    const cases = Papa.parse<Record<string, string>>(
      await readFile(new URL("expected_costs.csv", root), "utf8"),
      { header: true, skipEmptyLines: true },
    ).data;
    expect(cases).toHaveLength(10);
    for (const c of cases.filter((c) => !(c["sku"] === "SPASPA-4D3N-AB" && c["pax"] === "1")))
      expect(
        costPackageTemplate({ pkg, sku: c["sku"]! }, { pax: +c["pax"]!, tc: +c["tc"]! })
          .total_cost_usd,
        c["sku"] + " pax " + c["pax"],
      ).toBeCloseTo(+c["costo_esperado_usd"]!, 2);
    expect(() => costPackageTemplate({ pkg, sku: "SPASPA-4D3N-AB" }, { pax: 1 })).toThrow(
      /sin tramo de pasajeros/,
    );
  });
  it.each([1, 2, 3, 5])(
    "calcula Sky Dream a USD 43,42 por persona/noche para %i pasajeros",
    (pax) => {
      const p = structuredClone(pkg);
      const lodging = p.lodging.find(
        (row) => row["sku"] === "UYUUYU-3D2N-AB" && row["slot"] === "ALOJAMIENTO",
      )!;
      const base = p.tariffs.find((row) => row["TariffCode"] === "H_A_DBL")!;
      p.tariffs.push({
        ...base,
        TariffCode: "HTL_SKYDREAM_POLQUES_PP_2026",
        Supplier: "SKY DREAM (DON CALIXTO)",
        ServiceName: "Sky Dream",
        UnitType: "PER_PAX_PER_NIGHT",
        RoomType: "STD",
        PRECIO_USD: "43.42",
      });
      p.tariffs.push({
        ...base,
        TariffCode: "MEAL_SKYDREAM_BREAKFAST_2026",
        Supplier: "SKY DREAM (DON CALIXTO)",
        ServiceType: "meal",
        UnitType: "PER_PERSON_PER_NIGHT",
        PRECIO_USD: "1",
      });
      lodging["TariffCode"] = "";
      lodging["proveedor"] = "SKY DREAM (DON CALIXTO)";
      lodging["hotel"] = "Sky Dream";
      lodging["unidad"] = "PER_ROOM_PER_NIGHT";
      lodging["tc_policy"] = "free";

      expect(validatePackageV2(p).errors).toEqual([]);
      const result = costPackageTemplate({ pkg: p, sku: "UYUUYU-3D2N-AB" }, { pax, tc: 2 });
      const sky = result.lines.find((line) => line.sku === "HTL_SKYDREAM_POLQUES_PP_2026")!;
      expect(sky.qty).toBe(pax);
      expect(sky.cost_usd).toBeCloseTo(43.42 * pax, 2);
      expect(result.lines.some((line) => line.sku === "MEAL_SKYDREAM_BREAKFAST_2026")).toBe(false);
    },
  );
  it("incluye al TC en Sky Dream sólo cuando la política lo cobra", () => {
    const p = structuredClone(pkg);
    const lodging = p.lodging.find(
      (row) => row["sku"] === "UYUUYU-3D2N-AB" && row["slot"] === "ALOJAMIENTO",
    )!;
    const tariff = p.tariffs.find((row) => row["TariffCode"] === "H_A_DBL")!;
    tariff["UnitType"] = "PER_PERSON_PER_NIGHT";
    tariff["RoomType"] = "STD";
    tariff["PRECIO_USD"] = "43.42";
    lodging["TariffCode"] = tariff["TariffCode"]!;
    lodging["unidad"] = "PER_PAX_PER_NIGHT";
    lodging["tc_policy"] = "charged";
    const result = costPackageTemplate({ pkg: p, sku: "UYUUYU-3D2N-AB" }, { pax: 3, tc: 2 });
    const line = result.lines.find((candidate) => candidate.sku === tariff["TariffCode"])!;
    expect(line.qty).toBe(5);
    expect(line.cost_usd).toBeCloseTo(217.1, 2);
  });
  it("cobra el 4x4 una vez y marca días cubiertos", () => {
    const r = costPackageTemplate({ pkg, sku: "SPASPA-4D3N-AB" }, { pax: 2 });
    expect(r.lines.filter((l) => l["sku"] === "T_4X4_4D")).toHaveLength(1);
    expect(r.included.map((d) => d.day)).toEqual([2, 3, 4]);
    expect(r.lines[0]!.span_days).toBe(4);
  });
  it("ignora los importes nativos y conserva PRECIO_USD como única fuente económica", () => {
    const p = structuredClone(pkg);
    const lunch = p.tariffs.find((t) => t["TariffCode"] === "T_ALM")!;
    lunch["Price NETO"] = "999999";
    lunch["Valor RACK"] = "999999";
    lunch["Currency"] = "CLP";
    const result = costPackageTemplate({ pkg: p, sku: "UYUUYU-3D2N-AB" }, { pax: 2 });
    expect(result.lines.filter((l) => l.sku === "T_ALM").every((l) => l.cost_usd === 30)).toBe(
      true,
    );
  });
  it("aplica unidades de enlace para tramos y STAFF sin alterar el SKU de tarifa", () => {
    const p = structuredClone(pkg);
    const transport = p.tariffs.find((t) => t["TariffCode"] === "T_4X4_4D")!;
    transport["UnitType"] = "PER_GROUP";
    transport["VehicleMaxPax"] = "";
    transport["PaxMax"] = "6";
    expect(validatePackageV2(p).errors).toEqual([]);
    for (const [pax, staff, vehicles] of [
      [2, 0, 1],
      [6, 0, 1],
      [7, 0, 2],
      [9, 4, 3],
    ] as const) {
      const result = costPackageTemplate({ pkg: p, sku: "SPASPA-4D3N-AB" }, { pax, staff });
      const segment = result.lines.find((l) => l.sku === "T_4X4_4D")!;
      expect(segment.qty, `pax ${pax}`).toBe(vehicles);
      expect(segment.cost_usd, `pax ${pax}`).toBe(800 * vehicles);
      expect(result.lines.filter((l) => l.slot === "STAFF").map((l) => l.qty)).toEqual([
        vehicles,
        vehicles,
      ]);
    }
  });
  it("conserva dos filas STAFF de una noche y cobra cada TariffCode una vez por vehículo", () => {
    const p = structuredClone(pkg);
    const staff = p.tariffs.find((t) => t["TariffCode"] === "H_A_STAFF")!;
    p.tariffs.push({ ...staff, TariffCode: "H_A_STAFF_DINNER", PRECIO_USD: "5" });
    p.lodging.push({
      ...p.lodging.find(
        (n) => n["sku"] === "SPASPA-4D3N-AB" && n["noche"] === "1" && n["slot"] === "STAFF",
      )!,
      TariffCode: "H_A_STAFF_DINNER",
      servicio: "CENA CONDUCTOR",
    });
    expect(validatePackageV2(p).errors).toEqual([]);
    const before = costPackageTemplate({ pkg, sku: "SPASPA-4D3N-AB" }, { pax: 7 });
    const result = costPackageTemplate({ pkg: p, sku: "SPASPA-4D3N-AB" }, { pax: 7 });
    expect(result.lines.filter((l) => l.day === 1 && l.slot === "STAFF").map((l) => l.sku)).toEqual(
      ["H_A_STAFF", "H_A_STAFF_DINNER"],
    );
    expect(result.total_cost_usd - before.total_cost_usd).toBe(10);
  });
  it("conserva bloques KV sin texto como pendientes sin romper sus servicios", () => {
    const p = structuredClone(pkg);
    p.days[0]!["bloque_texto_id"] = "";
    p.days[0]!["bloque_servicios_id"] = "KV-D1";
    p.blockItems[0]!["bloque_texto_id"] = "";
    p.blockItems[0]!["bloque_servicios_id"] = "KV-D1";
    const validation = validatePackageV2(p);
    expect(validation.errors).toEqual([]);
    expect(validation.warnings.some((w) => w.message.includes("sin texto"))).toBe(true);
  });
  it("no usa tarifas con una temporada expresamente excluida", () => {
    const p = structuredClone(pkg);
    p.tariffs.find((t) => t["TariffCode"] === "T_ALM")!["Season"] =
      "EXCLUYE AÑO NUEVO Y CARNAVALES";
    expect(() => costPackageTemplate({ pkg: p, sku: "UYUUYU-3D2N-AB" }, { pax: 2 })).toThrow(
      /Temporada excluida/,
    );
  });
  it.each([
    ["2026-06-01", "DRY"],
    ["2026-12-01", "RAIN"],
  ] as const)("aplica %s como fecha de temporada %s usando PRECIO_USD", (date, season) => {
    const p = structuredClone(pkg);
    const lunch = p.tariffs.find((t) => t["TariffCode"] === "T_ALM")!;
    lunch["Season"] = season;
    lunch["Year"] = date.slice(0, 4);
    lunch["ValidFrom"] = `${date.slice(0, 4)}-01-01`;
    lunch["ValidTo"] = `${date.slice(0, 4)}-12-31`;
    lunch["Price NETO"] = "999999";
    lunch["Valor RACK"] = "999999";
    const result = costPackageTemplate({ pkg: p, sku: "UYUUYU-3D2N-AB" }, { pax: 2, date });
    expect(result.lines.filter((l) => l.sku === "T_ALM").every((l) => l.cost_usd === 30)).toBe(
      true,
    );
  });
  it("exige fecha y respeta la vigencia de una tarifa DRY/RAIN", () => {
    const p = structuredClone(pkg);
    const lunch = p.tariffs.find((t) => t["TariffCode"] === "T_ALM")!;
    lunch["Season"] = "DRY";
    lunch["ValidFrom"] = "2026-07-01";
    lunch["ValidTo"] = "2026-11-30";
    expect(() => costPackageTemplate({ pkg: p, sku: "UYUUYU-3D2N-AB" }, { pax: 2 })).toThrow(
      /Fecha requerida/,
    );
    expect(() =>
      costPackageTemplate({ pkg: p, sku: "UYUUYU-3D2N-AB" }, { pax: 2, date: "2026-06-01" }),
    ).toThrow(/fuera de temporada o vigencia/);
  });
  it("separa avisos comerciales del estado económico y conserva diferencias pendientes", () => {
    const assessment = assessPackageTemplates(pkg);
    expect(assessment.find((row) => row.sku === "UYUUYU-3D2N-AB")).toMatchObject({
      status: "validated",
      reasons: [],
    });
    expect(assessment.find((row) => row.sku === "SPASPA-4D3N-AB")).toMatchObject({
      status: "pending",
    });
    expect(
      assessment
        .find((row) => row.sku === "SPASPA-4D3N-AB")!
        .reasons.some((reason) => reason.includes("diferencia económica")),
    ).toBe(true);
  });
  it("mantiene pendiente un control cuya temporada requiere una fecha ausente", () => {
    const p = structuredClone(pkg);
    p.tariffs.find((row) => row["TariffCode"] === "T_ALM")!["Season"] = "DRY";
    const assessment = assessPackageTemplates(p).find((row) => row.sku === "UYUUYU-3D2N-AB")!;
    expect(assessment.status).toBe("pending");
    expect(assessment.reasons.some((reason) => reason.includes("Fecha requerida"))).toBe(true);
  });
  it("mantiene bloqueado un alojamiento sin tarifa compatible", () => {
    const p = structuredClone(pkg);
    const lodging = p.lodging.find(
      (row) => row["sku"] === "UYUUYU-3D2N-AB" && row["slot"] === "ALOJAMIENTO",
    )!;
    lodging["TariffCode"] = "";
    lodging["proveedor"] = "HOTEL SIN TARIFA";
    lodging["hotel"] = "HOTEL SIN TARIFA";
    const assessment = assessPackageTemplates(p).find((row) => row.sku === "UYUUYU-3D2N-AB")!;
    expect(assessment.status).toBe("blocked");
    expect(assessment.reasons.some((reason) => reason.startsWith("BLOQUEADO:"))).toBe(true);
  });
  it("bloquea dos tarifas por persona del mismo hotel sin TariffCode exacto", () => {
    const p = structuredClone(pkg);
    const lodging = p.lodging.find(
      (row) => row["sku"] === "UYUUYU-3D2N-AB" && row["slot"] === "ALOJAMIENTO",
    )!;
    const base = p.tariffs.find((row) => row["TariffCode"] === "H_A_DBL")!;
    p.tariffs.push(
      { ...base, TariffCode: "HOTEL_PERSON_1", UnitType: "PER_PERSON_PER_NIGHT" },
      { ...base, TariffCode: "HOTEL_PERSON_2", UnitType: "PER_PERSON_PER_NIGHT" },
    );
    lodging["TariffCode"] = "";
    lodging["unidad"] = "PER_PERSON_PER_NIGHT";
    const assessment = assessPackageTemplates(p).find((row) => row.sku === "UYUUYU-3D2N-AB")!;
    expect(assessment.status).toBe("blocked");
    expect(assessment.reasons).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Hotel A tiene \d+ tarifas.*falta TariffCode exacto/),
      ]),
    );
    expect(() => costPackageTemplate({ pkg: p, sku: "UYUUYU-3D2N-AB" }, { pax: 2 })).toThrow(
      /falta TariffCode exacto/,
    );
  });
  it("un único control coincidente no basta para validar", () => {
    const p = structuredClone(pkg);
    p.controls = p.controls.filter((row) => row["sku"] !== "UYUUYU-3D2N-AB" || row["pax"] === "2");
    const assessment = assessPackageTemplates(p).find((row) => row.sku === "UYUUYU-3D2N-AB")!;
    expect(assessment.status).toBe("pending");
    expect(assessment.reasons).toEqual(
      expect.arrayContaining([
        "Falta control económico independiente para pax 1",
        "Falta control económico independiente para pax 3",
        "Falta control económico independiente para pax 4",
        "Falta control económico independiente para pax 5",
      ]),
    );
  });
});
