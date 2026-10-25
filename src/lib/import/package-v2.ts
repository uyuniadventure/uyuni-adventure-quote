import Papa from "papaparse";

export type CsvRow = Record<string, string>;
export { diffPackageV2 } from "./plan-v2";
export const packageFiles = [
  "00_tarifario_servicios",
  "01_itinerarios",
  "02_itinerario_dias",
  "03_itinerario_tramos",
  "04_itinerario_alojamiento",
  "05_bloques_texto",
  "06_bloques_servicios",
  "07_reglas_tramo",
  "08_bloques_pdf",
  "09_control_costos",
] as const;
export interface PackageV2 {
  tariffs: CsvRow[];
  templates: CsvRow[];
  days: CsvRow[];
  segments: CsvRow[];
  lodging: CsvRow[];
  texts: CsvRow[];
  blockItems: CsvRow[];
  rules: CsvRow[];
  pdf: CsvRow[];
  controls: CsvRow[];
}
const properties = [
  "tariffs",
  "templates",
  "days",
  "segments",
  "lodging",
  "texts",
  "blockItems",
  "rules",
  "pdf",
  "controls",
] as const;
const requiredColumns = [
  ["TariffCode", "Year", "Supplier", "ETIQUETA", "UnitType", "Currency", "PRECIO_USD"],
  ["sku", "nombre", "dias", "noches"],
  ["sku", "dia", "bloque_texto_id", "bloque_servicios_id"],
  ["sku", "slot", "TariffCode", "dia_desde", "dia_hasta"],
  ["sku", "noche", "slot", "proveedor", "TariffCode"],
  ["bloque_texto_id", "idioma", "titulo", "texto"],
  ["bloque_servicios_id", "bloque_texto_id", "slot", "TariffCode"],
  ["ruta", "dias", "slot", "TariffCode", "dia_desde", "dia_hasta"],
  ["id", "idioma", "texto"],
  ["sku", "pax", "costo_hoja"],
];
export function parsePackageV2(files: Record<string, string>): PackageV2 {
  const result = {} as PackageV2;
  packageFiles.forEach((name, index) => {
    const text = files[`${name}.csv`];
    if (text == null) throw new Error(`Falta ${name}.csv`);
    const parsed = Papa.parse<CsvRow>(text.replace(/^\uFEFF/, ""), {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
      transform: (v) => v.trim(),
    });
    if (parsed.errors.length)
      throw new Error(`${name}: ${parsed.errors.map((e) => e.message).join("; ")}`);
    for (const col of requiredColumns[index]!)
      if (!parsed.meta.fields?.includes(col)) throw new Error(`${name}: falta columna ${col}`);
    result[properties[index]!] = parsed.data;
  });
  return result;
}
export function numberCell(value: string | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value.replace(",", "."));
  if (!Number.isFinite(n)) throw new Error(`Número inválido: ${value}`);
  return n;
}
/**
 * The source workbooks use PAX as a synonym for PERSON in nightly hotel rates.
 * Both labels mean one charge per applicable guest and night; neither represents
 * a room or an occupancy distribution.
 */
export function packageUnitType(value: string | undefined): string {
  return value === "PER_PAX_PER_NIGHT" ? "PER_PERSON_PER_NIGHT" : (value ?? "");
}
export function positiveIntegerCell(value: string | undefined): number | null {
  const n = numberCell(value);
  return n != null && Number.isInteger(n) && n > 0 ? n : null;
}
export function tariffVehicleCapacity(tariff: CsvRow): number | null {
  const configured = tariff["VehicleMaxPax"];
  return configured ? positiveIntegerCell(configured) : positiveIntegerCell(tariff["PaxMax"]);
}
/** Commercial exception authorized only for PER_VEHICLE itinerary transport links. */
export function segmentVehicleCapacity(segment: CsvRow, tariff: CsvRow): number | null {
  if ((segment["unidad"] || tariff["UnitType"]) !== "PER_VEHICLE") return null;
  return tariffVehicleCapacity(tariff);
}
export const routeOf = (r: CsvRow) =>
  r["sku"]!.match(/^(.+?)-\d+D\d+N(?:-|$)/)?.[1] ?? r["sku"]!.split("-")[0]!;
export const routeParts = (r: CsvRow) => {
  const route = routeOf(r);
  return /^[A-Z]{6}$/.test(route)
    ? { route, from: route.slice(0, 3), to: route.slice(3, 6) }
    : null;
};
export const blockVariantKey = (textId: string | undefined, servicesId: string | undefined) => {
  if (!servicesId || !textId) return null;
  if (servicesId === textId) return null;
  return servicesId.startsWith(`${textId}/`) ? servicesId.slice(textId.length + 1) : servicesId;
};
export const lodgingSourceKey = (r: CsvRow) =>
  [r["TariffCode"], r["proveedor"], r["hotel"], r["servicio"], r["unidad"], r["tc_policy"]]
    .map((v) => v ?? "")
    .join("|");

const normalizedExactName = (value: string | undefined) =>
  (value ?? "").trim().replace(/\s+/g, " ").toUpperCase();

/**
 * Confirmed equivalences from the historical migration source. These are exact
 * aliases, not fuzzy hotel-name matches. The source lodging rows have no
 * TariffCode and incorrectly describe Sky Dream as a room rate.
 */
const confirmedHistoricalLodgingTariffs = new Map([
  ["SKY DREAM|SKY DREAM (DON CALIXTO)", "HTL_SKYDREAM_POLQUES_PP_2026"],
]);

export interface LodgingTariffResolution {
  candidates: CsvRow[];
  unit: string;
  tariffCode: string | null;
  issue: string | null;
}

/** Resolve lodging without ever treating another per-person supplier service as a hotel rate. */
export function resolvePackageLodgingTariffs(pkg: PackageV2, row: CsvRow): LodgingTariffResolution {
  const supported = new Set(["PER_ROOM_PER_NIGHT", "PER_PERSON_PER_NIGHT"]);
  const confirmedCode = confirmedHistoricalLodgingTariffs.get(
    `${normalizedExactName(row["hotel"])}|${normalizedExactName(row["proveedor"])}`,
  );
  const requestedCode = row["TariffCode"] || confirmedCode;
  const label = row["hotel"] || row["proveedor"] || "Alojamiento";
  const isHotel = (tariff: CsvRow) => tariff["ServiceType"]?.toLowerCase() === "hotel";

  if (requestedCode) {
    const matches = pkg.tariffs.filter((tariff) => tariff["TariffCode"] === requestedCode);
    if (matches.length !== 1)
      return {
        candidates: [],
        unit: "",
        tariffCode: requestedCode,
        issue: `BLOQUEADO: ${label} requiere TariffCode exacto ${requestedCode}, pero no existe una única tarifa`,
      };
    const tariff = matches[0]!;
    const unit = packageUnitType(tariff["UnitType"]);
    if (!isHotel(tariff))
      return {
        candidates: [],
        unit,
        tariffCode: requestedCode,
        issue: `BLOQUEADO: TariffCode ${requestedCode} no corresponde a un servicio de alojamiento`,
      };
    if (!supported.has(unit))
      return {
        candidates: [],
        unit,
        tariffCode: requestedCode,
        issue: `BLOQUEADO: TariffCode ${requestedCode} usa una unidad de alojamiento no compatible`,
      };
    return { candidates: [tariff], unit, tariffCode: requestedCode, issue: null };
  }

  const requestedUnit = packageUnitType(row["unidad"]);
  const candidates = pkg.tariffs.filter(
    (tariff) =>
      tariff["Supplier"]?.toLowerCase() === row["proveedor"]?.toLowerCase() &&
      isHotel(tariff) &&
      packageUnitType(tariff["UnitType"]) === requestedUnit,
  );
  if (!supported.has(requestedUnit) || candidates.length === 0)
    return {
      candidates: [],
      unit: requestedUnit,
      tariffCode: null,
      issue: `BLOQUEADO: ${label} sin tarifas USD de alojamiento compatibles`,
    };
  if (requestedUnit === "PER_PERSON_PER_NIGHT" && candidates.length !== 1)
    return {
      candidates: [],
      unit: requestedUnit,
      tariffCode: null,
      issue: `BLOQUEADO: ${label} tiene ${candidates.length} tarifas de alojamiento por persona; falta TariffCode exacto`,
    };
  return {
    candidates,
    unit: requestedUnit,
    tariffCode: requestedUnit === "PER_PERSON_PER_NIGHT" ? candidates[0]!["TariffCode"]! : null,
    issue: null,
  };
}
export const routeFamily = (r: CsvRow) =>
  r["ETIQUETA"]!.replace(/\([^)]*PAX[^)]*\)/gi, "")
    .trim()
    .toUpperCase();
export interface ValidationIssue {
  key: string;
  message: string;
}
export function validatePackageV2(pkg: PackageV2, catalog: { services?: { sku: string }[] } = {}) {
  const errors: ValidationIssue[] = [],
    warnings: ValidationIssue[] = [];
  const err = (key: string, message: string) => errors.push({ key, message });
  const duplicate = (rows: CsvRow[], key: (r: CsvRow) => string) => {
    const seen = new Set<string>();
    for (const r of rows) {
      const k = key(r);
      if (!k || seen.has(k)) err(k, "Clave vacía o repetida");
      seen.add(k);
    }
  };
  duplicate(pkg.tariffs, (r) => r["TariffCode"]!);
  duplicate(pkg.templates, (r) => r["sku"]!);
  duplicate(pkg.days, (r) => `${r["sku"]}:${r["dia"]}`);
  duplicate(pkg.texts, (r) => `${r["bloque_texto_id"]}:${r["idioma"]?.toLowerCase()}`);
  duplicate(pkg.blockItems, (r) => `${r["bloque_servicios_id"]}:${r["slot"]}`);
  duplicate(pkg.lodging, (r) => `${r["sku"]}:${r["noche"]}:${r["slot"]}:${lodgingSourceKey(r)}`);
  duplicate(pkg.segments, (r) => `${r["sku"]}:${r["slot"]}:${r["dia_desde"]}`);
  duplicate(pkg.rules, (r) => `${r["ruta"]}:${r["dias"]}:${r["slot"]}`);
  duplicate(pkg.pdf, (r) => `${r["id"]}:${r["idioma"]?.toLowerCase()}`);
  const tariffs = new Map(pkg.tariffs.map((r) => [r["TariffCode"], r]));
  const templates = new Map(pkg.templates.map((r) => [r["sku"], r]));
  const textIds = new Set(pkg.texts.map((r) => r["bloque_texto_id"]));
  const variants = new Set(pkg.blockItems.map((r) => r["bloque_servicios_id"]));
  const pdfIds = new Set(pkg.pdf.map((r) => r["id"]));
  const units = [
    "PER_PERSON",
    "PER_GROUP",
    "PER_VEHICLE",
    "PER_ROOM_PER_NIGHT",
    "PER_PERSON_PER_NIGHT",
    "PER_ROOM_PER_USE",
  ];
  for (const r of pkg.tariffs) {
    const key = r["TariffCode"]!;
    const unitType = packageUnitType(r["UnitType"]);
    if (!["USD", "CLP", "BOB"].includes(r["Currency"]!)) err(key, "Moneda inválida");
    if (!units.includes(unitType)) err(key, "Unidad inválida");
    if (!r["Season"])
      warnings.push({ key, message: "Tarifa sin temporada de origen; queda fuera de pricing" });
    if (!r["Supplier"] || !r["ETIQUETA"])
      warnings.push({ key, message: "Servicio sin proveedor o nombre; queda pendiente" });
    try {
      if (unitType === "PER_VEHICLE" && tariffVehicleCapacity(r) == null)
        err(key, "PER_VEHICLE sin capacidad");
      for (const col of ["VehicleMaxPax", "Occupancy", "PaxMin", "PaxMax"])
        if (r[col] && (!Number.isInteger(Number(r[col])) || Number(r[col]) <= 0))
          err(key, `${col} debe ser entero positivo`);
      for (const col of ["PRECIO_USD", "Occupancy", "PaxMin", "PaxMax", "VehicleMaxPax"])
        if (numberCell(r[col])! < 0) err(key, `${col} negativo`);
      if (numberCell(r["PRECIO_USD"]) == null) err(key, "Falta PRECIO_USD");
      if (
        !Number.isInteger(Number(r["Year"])) ||
        Number(r["Year"]) < 2000 ||
        Number(r["Year"]) > 2200
      )
        err(key, "Año inválido");
      if (r["PaxMin"] && r["PaxMax"] && Number(r["PaxMax"]) < Number(r["PaxMin"]))
        err(key, "Rango de pasajeros inválido");
      for (const col of ["ValidFrom", "ValidTo"])
        if (
          r[col] &&
          (!/^\d{4}-\d{2}-\d{2}$/.test(r[col]!) || !Number.isFinite(Date.parse(r[col]!)))
        )
          err(key, "Fecha inválida");
      if (r["ValidFrom"] && r["ValidTo"] && r["ValidFrom"] > r["ValidTo"])
        err(key, "Vigencia invertida");
    } catch (e) {
      err(key, String(e));
    }
  }
  for (const r of [...pkg.blockItems, ...pkg.segments, ...pkg.rules, ...pkg.lodging]) {
    const key = r["TariffCode"] || r["sku"] || r["ruta"] || r["bloque_servicios_id"]!;
    if (r["TariffCode"] && !tariffs.has(r["TariffCode"])) err(key, "TariffCode inexistente");
    if (r["sku"] && !templates.has(r["sku"])) err(key, "Plantilla inexistente");
    if (r["tc_policy"] && !["free", "charged", "excluded"].includes(r["tc_policy"]))
      err(key, "tc_policy inválida");
    if (
      r["dia_desde"] &&
      (!Number.isInteger(+r["dia_desde"]) ||
        +r["dia_desde"] < 1 ||
        +r["dia_hasta"]! < +r["dia_desde"] ||
        !Number.isInteger(+r["dia_hasta"]!))
    )
      err(key, "Rango de días inválido");
    if (r["sku"] && r["dia_hasta"] && +r["dia_hasta"] > +(templates.get(r["sku"])?.["dias"] ?? 0))
      err(key, "Tramo fuera de plantilla");
  }
  for (const r of pkg.segments)
    if (r["se_cobra"] !== "una vez") err(r["sku"]!, "El tramo se cobra una vez");
    else {
      const tariff = tariffs.get(r["TariffCode"]);
      if (
        tariff &&
        (r["unidad"] || tariff["UnitType"]) === "PER_VEHICLE" &&
        segmentVehicleCapacity(r, tariff) == null
      )
        err(r["sku"]!, "Tramo PER_VEHICLE sin capacidad entera positiva");
    }
  for (const r of pkg.blockItems)
    if (
      ["ALOJAMIENTO", "CENA", "STAFF"].includes(r["slot"]!) ||
      pkg.segments.some((s) => s["TariffCode"] === r["TariffCode"])
    )
      err(
        r["bloque_servicios_id"]!,
        "Tramos y servicios de hotel pertenecen a la plantilla, no al bloque",
      );
  for (const r of pkg.blockItems) {
    if (!r["bloque_texto_id"])
      warnings.push({
        key: r["bloque_servicios_id"]!,
        message: "Bloque de servicios sin texto; se conserva pendiente",
      });
    else if (
      !textIds.has(r["bloque_texto_id"]) ||
      (r["bloque_servicios_id"] !== r["bloque_texto_id"] &&
        !r["bloque_servicios_id"]?.startsWith(`${r["bloque_texto_id"]}/`))
    )
      err(r["bloque_servicios_id"]!, "Texto de bloque inexistente o variante incoherente");
  }
  for (const r of pkg.days) {
    if (!templates.has(r["sku"])) err(r["sku"]!, "Plantilla inexistente");
    if (!r["bloque_texto_id"])
      warnings.push({ key: r["sku"]!, message: "Día sin texto; se conserva pendiente" });
    else if (!textIds.has(r["bloque_texto_id"])) err(r["sku"]!, "Texto inexistente");
    if (
      r["bloque_servicios_id"] &&
      (!variants.has(r["bloque_servicios_id"]) ||
        (r["bloque_texto_id"] &&
          r["bloque_servicios_id"] !== r["bloque_texto_id"] &&
          !r["bloque_servicios_id"].startsWith(`${r["bloque_texto_id"]}/`)))
    )
      err(r["sku"]!, "Variante inexistente o de otro texto");
  }
  for (const r of pkg.lodging) {
    const t = templates.get(r["sku"]);
    if (!t || !Number.isInteger(+r["noche"]!) || +r["noche"]! < 1 || +r["noche"]! > +t["noches"]!)
      err(r["sku"]!, "Noche fuera de plantilla");
    if (!["ALOJAMIENTO", "CENA", "STAFF"].includes(r["slot"]!))
      err(r["sku"]!, "Puesto de noche inválido");
    if (r["slot"] === "ALOJAMIENTO") {
      const resolution = resolvePackageLodgingTariffs(pkg, r);
      if (resolution.issue)
        warnings.push({
          key: r["sku"]!,
          message: resolution.issue,
        });
    }
    if (r["slot"] !== "ALOJAMIENTO" && !r["TariffCode"])
      err(r["sku"]!, "Falta TariffCode de noche");
  }
  for (const t of pkg.templates) {
    if (!routeParts(t))
      warnings.push({
        key: t["sku"]!,
        message: "SKU sin ruta completa de origen y destino; queda pendiente",
      });
    if (!Number.isInteger(+t["noches"]!) || +t["noches"]! < 0 || +t["noches"]! > +t["dias"]!)
      err(t["sku"]!, "Noches inválidas");
    if (!t["categoria"] || !["BUDGET", "COMFORT", "VIP", "MIXTO"].includes(t["categoria"]))
      warnings.push({
        key: t["sku"]!,
        message: `Categoría de origen pendiente: ${t["categoria"] || "vacía"}`,
      });
    const days = pkg.days
      .filter((r) => r["sku"] === t["sku"])
      .map((r) => +r["dia"]!)
      .sort((a, b) => a - b);
    if (
      !Number.isInteger(+t["dias"]!) ||
      +t["dias"]! < 1 ||
      days.length !== +t["dias"]! ||
      days.some((d, i) => d !== i + 1)
    )
      err(t["sku"]!, "Días de plantilla no coinciden con dias");
    for (const k of ["bloque_incluye", "bloque_no_incluye"])
      if (t[k] && !pdfIds.has(t[k])) err(t["sku"]!, "Bloque PDF inexistente");
    if (
      t["servicios"]?.toLowerCase() === "no" ||
      (!pkg.days.some((d) => d["sku"] === t["sku"] && d["bloque_servicios_id"]) &&
        !pkg.segments.some((s) => s["sku"] === t["sku"]))
    )
      warnings.push({ key: t["sku"]!, message: "Plantilla sin servicios" });
    if (t["estado"] === "sin_textos")
      warnings.push({ key: t["sku"]!, message: "Plantilla sin_textos" });
  }
  for (const r of [...pkg.texts, ...pkg.pdf])
    if (!["es", "en", "it"].includes((r["idioma"] ?? "").toLowerCase()))
      err(r["id"] || r["bloque_texto_id"]!, "Idioma inválido");
  for (const r of pkg.controls)
    if (
      !templates.has(r["sku"]) ||
      !Number.isInteger(+r["pax"]!) ||
      +r["pax"]! < 1 ||
      r["costo_hoja"] === "" ||
      !Number.isFinite(Number(r["costo_hoja"]))
    )
      err(r["sku"]!, "Control de costos inválido");
  for (const t of pkg.texts)
    if (
      !pkg.days.some((d) => d["bloque_texto_id"] === t["bloque_texto_id"]) &&
      (!t["usado_en"] || t["veces_usado"] === "0")
    )
      warnings.push({ key: t["bloque_texto_id"]!, message: "Bloque usado 0 veces" });
  for (const s of catalog.services ?? [])
    if (!tariffs.has(s["sku"]))
      warnings.push({ key: s["sku"], message: "Servicio del catálogo ausente; se conserva" });
  return { errors, warnings };
}

export type CatalogRow = Record<string, unknown>;
export type ImportCatalog = Record<string, CatalogRow[]>;
export interface ImportChange {
  table_name: string;
  natural_key: string;
  action: "insert" | "update" | "skip" | "error";
  payload: CatalogRow;
  before: CatalogRow | null;
  message?: string;
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
        .join(",") +
      "}"
    );
  return JSON.stringify(value) ?? "null";
}
/** Diff existing database-shaped rows, comparing only managed fields. */
export function diffRows(
  rows: { table_name: string; natural_key: string; payload: CatalogRow }[],
  catalog: ImportCatalog,
): ImportChange[] {
  return rows.map((r) => {
    const keys = r.table_name.endsWith("_translations") ? ["block_id", "lang"] : ["id"];
    const current = catalog[r.table_name]?.find((v) => keys.every((k) => v[k] === r.payload[k]));
    const before = current
      ? Object.fromEntries(Object.keys(r.payload).map((k) => [k, current[k] ?? null]))
      : null;
    return {
      ...r,
      before,
      action: !before ? "insert" : canonical(before) === canonical(r.payload) ? "skip" : "update",
    };
  });
}
