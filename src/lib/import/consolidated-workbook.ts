import { strFromU8, unzipSync } from "fflate";
import { XMLParser } from "fast-xml-parser";

export const CONSOLIDATED_WORKBOOK_SHEETS = [
  "00_RESUMEN",
  "01_TARIFARIO_2026",
  "02_TARIFARIO_2027",
  "03_INDEX_HOTELES",
  "04_TOURS_ELEGIDOS",
  "05_ESCENARIOS",
  "06_DESGLOSE",
  "07_RECORRIDOS_WORD",
  "08_CONTROL_CALIDAD",
  "09_BLOQUES_PAX_DIA",
] as const;

type SheetName = (typeof CONSOLIDATED_WORKBOOK_SHEETS)[number];
type CellValue = string | number | boolean | null;
type SourceRef = { sheet: string; row: number; cell?: string; sourceSheet?: string; sourceRow?: number };

export interface ConsolidatedService {
  importKey: string;
  fingerprint: string;
  sku: string;
  name: string;
  location: string | null;
  country: string | null;
  supplierName: string | null;
  type: "transporte" | "alojamiento" | "comida" | "guia" | "entrada" | "actividad" | "paquete" | "extra" | "vuelo";
  pricingUnit: "per_person" | "per_group" | "per_room" | "per_vehicle" | "per_staff" | "per_unit" | null;
  currency: string | null;
  roomType: string | null;
  vehicleMaxPax: number | null;
  mealPlan: "NONE" | "BB" | "HB" | "FB" | null;
  multiDaySpan: number;
  status: "activo" | "pendiente";
  notes: string | null;
  sourceRef: SourceRef;
}

export interface ConsolidatedRate {
  importKey: string;
  fingerprint: string;
  serviceSku: string;
  year: number;
  season: string | null;
  validFrom: string | null;
  validTo: string | null;
  paxMin: number | null;
  paxMax: number | null;
  priceNet: number | null;
  sourcePriceUsd: number | null;
  sourcePriceNet: number | null;
  sourceCurrency: string | null;
  pricingEnabled: boolean;
  exclusionText: string | null;
  notes: string | null;
  sourceRef: SourceRef;
}

export interface ConsolidatedTemplate {
  importKey: string;
  fingerprint: string;
  sku: string;
  name: string;
  days: number;
  nights: number;
  modality: "privado" | "compartido" | "grupo";
  category: "BUDGET" | "COMFORT" | "VIP" | "MIXTO";
  seasons: string[];
  sourceRef: SourceRef;
}

export interface ConsolidatedNarrativeDay {
  importKey: string;
  fingerprint: string;
  tourSku: string;
  dayNumber: number;
  visibleCode: string;
  title: string;
  description: string;
  lodging: string | null;
  meals: string | null;
  note: string | null;
  sourceRef: SourceRef;
}

export interface ConsolidatedScenario {
  importKey: string;
  fingerprint: string;
  tourSku: string;
  year: number;
  season: string;
  pax: number;
  days: number;
  expectedCostUsd: number | null;
  detailCostUsd: number | null;
  differenceUsd: number | null;
  reviewStatus: string;
  sourceRef: SourceRef;
}

export interface ConsolidatedScenarioDay {
  importKey: string;
  fingerprint: string;
  scenarioKey: string;
  tourSku: string;
  year: number;
  season: string;
  pax: number;
  dayNumber: number;
  visibleCode: string;
  title: string | null;
  description: string | null;
  hotel: string | null;
  meals: string | null;
  costUsd: number | null;
  reviewStatus: string;
  sourceRef: SourceRef;
}

export interface ConsolidatedScenarioLine {
  importKey: string;
  fingerprint: string;
  scenarioKey: string;
  dayKey: string;
  lineKey: string;
  dayNumber: number;
  serviceSku: string | null;
  supplierName: string | null;
  unresolvedServiceRef: string | null;
  description: string;
  quantity: number;
  billingUnit: "PER_PERSON" | "PER_GROUP" | "PER_ROOM" | "PER_ROOM_PER_DAY" | "PER_SERVICE" | "PER_UNIT";
  costBasis: "UNIT_RATE" | "LINE_TOTAL";
  referenceUnitCost: number | null;
  originalAmount: number | null;
  originalCurrency: string | null;
  amountUsd: number | null;
  chargeOnceKey: string | null;
  resolutionIssue: string | null;
  sourceRef: SourceRef;
}

export interface ConsolidatedIssue {
  importKey: string;
  scenarioKey: string | null;
  dayKey: string | null;
  lineKey: string | null;
  code: string;
  issueType: "identification" | "missing_price" | "date_exclusion" | "reconciliation" | "technical";
  detail: string;
  sourceRef: SourceRef;
}

function issueType(code: string | null, detail: string | null): ConsolidatedIssue["issueType"] {
  const text = `${code ?? ""} ${detail ?? ""}`.toUpperCase();
  if (/DIFERENCIA TOTAL|CONCILIA/.test(text)) return "reconciliation";
  if (/SIN PRECIO|PRECIO.*FALT|IMPORTE.*FALT/.test(text)) return "missing_price";
  if (/EXCLU|VIGENCIA|FECHA/.test(text)) return "date_exclusion";
  if (/CÓDIGO|CODIGO|REFERENCIA|VINCULA/.test(text)) return "identification";
  return "technical";
}

export interface ConsolidatedWorkbookPreview {
  schemaVersion: "uyuni-consolidated-v1";
  sourceSha256: string;
  sheetNames: string[];
  headerRows: Record<SheetName, number>;
  summary: Record<string, CellValue>;
  suppliers: { name: string; country: string | null }[];
  services: ConsolidatedService[];
  rates: ConsolidatedRate[];
  hotelCodes: { code: string; name: string; combination: string | null; sourceRef: SourceRef }[];
  templates: ConsolidatedTemplate[];
  narrativeDays: ConsolidatedNarrativeDay[];
  scenarios: ConsolidatedScenario[];
  scenarioDays: ConsolidatedScenarioDay[];
  lines: ConsolidatedScenarioLine[];
  issues: ConsolidatedIssue[];
  counts: {
    services: number;
    activeServices: number;
    pendingServices: number;
    rates: number;
    scenarios: number;
    scenarioDays: number;
    narrativeDays: number;
    templates: number;
    issues: number;
  };
}

type ParsedRow = { rowNumber: number; cells: Record<string, CellValue | undefined>; cellRefs: Record<string, string> };
type ParsedSheet = { name: string; rows: { rowNumber: number; values: Map<number, CellValue>; refs: Map<number, string> }[] };

const REQUIRED_HEADERS: Record<SheetName, string[]> = {
  "00_RESUMEN": ["Indicador / regla", "Valor / explicación"],
  "01_TARIFARIO_2026": ["TariffCode", "ETIQUETA", "PRECIO_USD", "UnitType"],
  "02_TARIFARIO_2027": ["TariffCode", "ETIQUETA", "PRECIO_USD", "UnitType"],
  "03_INDEX_HOTELES": ["Código hotel", "Nombre del hotel"],
  "04_TOURS_ELEGIDOS": ["SKU_normalizado", "Temporada", "Días", "Noches"],
  "05_ESCENARIOS": ["SKU", "Temporada", "PAX", "Bloques_día"],
  "06_DESGLOSE": ["SKU", "Temporada", "PAX", "Día", "Costo_línea_USD"],
  "07_RECORRIDOS_WORD": ["SKU", "Día", "Título", "Recorrido_completo_Word"],
  "08_CONTROL_CALIDAD": ["Tipo", "SKU_o_servicio", "Acción_o_problema", "Detalle"],
  "09_BLOQUES_PAX_DIA": ["SKU_tour", "Temporada", "Año", "PAX", "Día", "SKU_bloque"],
};

const xml = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  removeNSPrefix: true,
});
const list = <T>(value: T | T[] | undefined): T[] => value == null ? [] : Array.isArray(value) ? value : [value];
const text = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object" && "#text" in value) return text((value as { "#text": unknown })["#text"]);
  return "";
};
const cellColumn = (reference: string) => {
  const letters = reference.match(/^[A-Z]+/)?.[0] ?? "A";
  return [...letters].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1;
};
const clean = (value: CellValue | undefined): CellValue => typeof value === "string" ? value.trim() : (value ?? null);
const stringValue = (value: CellValue | undefined) => {
  const result = clean(value);
  return result == null || result === "" ? null : String(result);
};
const upper = (value: CellValue | undefined) => stringValue(value)?.toUpperCase() ?? null;
const numberValue = (value: CellValue | undefined) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};
const integerValue = (value: CellValue | undefined) => {
  const parsed = numberValue(value);
  return parsed == null || !Number.isInteger(parsed) ? null : parsed;
};
const isoDate = (value: CellValue | undefined) => {
  const raw = stringValue(value);
  if (!raw) return null;
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? null;
};
const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
};
export function importFingerprint(value: unknown) {
  let hash = 0x811c9dc5;
  for (const char of stable(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function sharedText(node: unknown): string {
  if (!node || typeof node !== "object") return text(node);
  const record = node as { t?: unknown; r?: unknown };
  if (record.t != null) return text(record.t);
  return list(record.r).map((run) => text((run as { t?: unknown }).t)).join("");
}

function parseCell(cell: Record<string, unknown>, sharedStrings: string[]): CellValue {
  const type = String(cell["@_t"] ?? "");
  if (type === "inlineStr") return sharedText(cell["is"]);
  const raw = text(cell["v"]);
  if (type === "s") return sharedStrings[Number(raw)] ?? "";
  if (type === "str") return raw;
  if (type === "b") return raw === "1";
  if (raw === "") return null;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : raw;
}

function parseXlsx(bytes: Uint8Array): ParsedSheet[] {
  const files = unzipSync(bytes);
  const readXml = (path: string) => {
    const value = files[path];
    if (!value) throw new Error(`El Excel no contiene ${path}.`);
    return xml.parse(strFromU8(value));
  };
  const sharedStrings = files["xl/sharedStrings.xml"]
    ? list(readXml("xl/sharedStrings.xml").sst?.si).map(sharedText)
    : [];
  const workbook = readXml("xl/workbook.xml").workbook;
  const relationships = list(readXml("xl/_rels/workbook.xml.rels").Relationships?.Relationship);
  const targets = new Map(relationships.map((relationship: Record<string, unknown>) => [String(relationship["@_Id"]), String(relationship["@_Target"])]));
  return list(workbook?.sheets?.sheet).map((sheet: Record<string, unknown>) => {
    const name = String(sheet["@_name"]);
    const target = targets.get(String(sheet["@_id"] ?? sheet["@_r:id"]));
    if (!target) throw new Error(`No se pudo resolver la hoja ${name}.`);
    const path = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`.replace("xl/xl/", "xl/");
    const document = readXml(path);
    const rows = list(document.worksheet?.sheetData?.row).map((row: Record<string, unknown>) => {
      const values = new Map<number, CellValue>();
      const refs = new Map<number, string>();
      for (const rawCell of list(row["c"]) as Record<string, unknown>[]) {
        const reference = String(rawCell["@_r"] ?? "A1");
        const column = cellColumn(reference);
        values.set(column, parseCell(rawCell, sharedStrings));
        refs.set(column, reference);
      }
      return { rowNumber: Number(row["@_r"] ?? 0), values, refs };
    });
    return { name, rows };
  });
}

function tabular(sheet: ParsedSheet, required: string[]): { headerRow: number; rows: ParsedRow[] } {
  const header = sheet.rows.find((row) => {
    const values = new Set([...row.values.values()].map((value) => stringValue(value)).filter(Boolean));
    return required.every((name) => values.has(name));
  });
  if (!header) throw new Error(`No se encontraron las cabeceras reales de ${sheet.name}.`);
  const columns = new Map<number, string>();
  for (const [column, value] of header.values) {
    const name = stringValue(value);
    if (name) columns.set(column, name);
  }
  return {
    headerRow: header.rowNumber,
    rows: sheet.rows.filter((row) => row.rowNumber > header.rowNumber).flatMap((row) => {
      const cells: Record<string, CellValue> = {};
      const cellRefs: Record<string, string> = {};
      let populated = false;
      for (const [column, name] of columns) {
        const value = clean(row.values.get(column) ?? null);
        cells[name] = value;
        if (value != null && value !== "") populated = true;
        const reference = row.refs.get(column);
        if (reference) cellRefs[name] = reference;
      }
      return populated ? [{ rowNumber: row.rowNumber, cells, cellRefs }] : [];
    }),
  };
}

const scenarioKey = (tourSku: string, year: number, season: string, pax: number) => `${tourSku}|${year}|${season}|P${pax}`;
const dayKey = (scenario: string, day: number) => `${scenario}|D${day}`;
const normalizeSeason = (value: CellValue | undefined) => upper(value);
const currencyCode = (value: CellValue | undefined) => {
  const raw = upper(value);
  if (raw === "BS") return "BOB";
  return raw && ["USD", "CLP", "BOB", "ARS", "PEN", "EUR"].includes(raw) ? raw : null;
};
const serviceType = (value: CellValue | undefined): ConsolidatedService["type"] => {
  const type = upper(value) ?? "";
  if (/TRANSFER|TRANSPORT/.test(type)) return "transporte";
  if (/HOTEL|LODGE|ALOJA/.test(type)) return "alojamiento";
  if (/MEAL|FOOD|COMIDA/.test(type)) return "comida";
  if (/GUIDE|GUIA|GUÍA/.test(type)) return "guia";
  if (/TICKET|ENTRADA/.test(type)) return "entrada";
  if (/FLIGHT|VUELO/.test(type)) return "vuelo";
  if (/PACKAGE|PAQUETE/.test(type)) return "paquete";
  if (/TOUR|ACTIV/.test(type)) return "actividad";
  return "extra";
};
const pricingUnit = (value: CellValue | undefined): ConsolidatedService["pricingUnit"] => {
  const unit = upper(value)?.replace(/\s+/g, "_").replace(/^PER_:PERSON$/, "PER_PERSON") ?? "";
  if (/PER_PERSON|PER_PAX/.test(unit)) return "per_person";
  if (/PER_GROUP/.test(unit)) return "per_group";
  if (/PER_ROOM/.test(unit)) return "per_room";
  if (/PER_VEHICLE/.test(unit)) return "per_vehicle";
  if (/PER_STAFF/.test(unit)) return "per_staff";
  if (/PER_UNIT|PER_SERVICE|PER_EXTRA_BED/.test(unit)) return "per_unit";
  return null;
};
/** Interpret approved tariff units without changing the source Excel. */
const tariffPricingUnit = (sku: string, unitType: CellValue | undefined, pricingBasis: CellValue | undefined): ConsolidatedService["pricingUnit"] => {
  // Andrea confirms PER_PERSON for both unit columns of this specific bicycle service.
  if (sku === "EXP_UYU_LEO_BIKE") return "per_person";
  return pricingUnit(unitType ?? pricingBasis);
};
const billingUnit = (value: CellValue | undefined): ConsolidatedScenarioLine["billingUnit"] => {
  const unit = upper(value) ?? "";
  if (/PER_PERSON|PER_PAX/.test(unit)) return "PER_PERSON";
  if (/PER_ROOM_PER_(DAY|NIGHT)/.test(unit)) return "PER_ROOM_PER_DAY";
  if (/PER_ROOM/.test(unit)) return "PER_ROOM";
  if (/PER_GROUP|PER_VEHICLE/.test(unit)) return "PER_GROUP";
  if (/PER_SERVICE/.test(unit)) return "PER_SERVICE";
  return "PER_UNIT";
};
const category = (value: CellValue | undefined): ConsolidatedTemplate["category"] => {
  const raw = upper(value) ?? "";
  if (raw.includes("VIP")) return "VIP";
  if (raw.includes("BUDGET")) return "BUDGET";
  if (raw.includes("MIX")) return "MIXTO";
  return "COMFORT";
};
const modality = (value: CellValue | undefined): ConsolidatedTemplate["modality"] => {
  const raw = upper(value) ?? "";
  if (raw.includes("COMPART")) return "compartido";
  if (raw.includes("GRUPO")) return "grupo";
  return "privado";
};
const mealPlan = (value: CellValue | undefined): ConsolidatedService["mealPlan"] => {
  const raw = upper(value);
  return raw && ["NONE", "BB", "HB", "FB"].includes(raw) ? raw as ConsolidatedService["mealPlan"] : null;
};
const sourceRef = (sheet: string, row: ParsedRow, column?: string): SourceRef => ({
  sheet,
  row: row.rowNumber,
  ...(column && row.cellRefs[column] ? { cell: row.cellRefs[column] } : {}),
  ...(stringValue(row.cells["Hoja_origen"]) ? { sourceSheet: stringValue(row.cells["Hoja_origen"])! } : {}),
  ...(integerValue(row.cells["Fila_origen"]) ? { sourceRow: integerValue(row.cells["Fila_origen"])! } : {}),
});

async function sha256(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy.buffer);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

/** Reads only the approved consolidated workbook. It never performs catalog writes. */
export async function parseConsolidatedWorkbook(input: ArrayBuffer | Uint8Array): Promise<ConsolidatedWorkbookPreview> {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const parsed = parseXlsx(bytes);
  const sheetNames = parsed.map((sheet) => sheet.name);
  const missing = CONSOLIDATED_WORKBOOK_SHEETS.filter((name) => !sheetNames.includes(name));
  const extra = sheetNames.filter((name) => !CONSOLIDATED_WORKBOOK_SHEETS.includes(name as SheetName));
  if (missing.length || extra.length || sheetNames.length !== CONSOLIDATED_WORKBOOK_SHEETS.length)
    throw new Error(`Estructura inválida. Faltan: ${missing.join(", ") || "ninguna"}. Sobran: ${extra.join(", ") || "ninguna"}.`);
  const tables = Object.fromEntries(CONSOLIDATED_WORKBOOK_SHEETS.map((name) => {
    const sheet = parsed.find((candidate) => candidate.name === name)!;
    return [name, tabular(sheet, REQUIRED_HEADERS[name])];
  })) as Record<SheetName, ReturnType<typeof tabular>>;
  const sourceSha256 = await sha256(bytes);

  const tariffRows = [
    ...tables["01_TARIFARIO_2026"].rows.map((row) => ({ row, year: 2026, sheet: "01_TARIFARIO_2026" as const })),
    ...tables["02_TARIFARIO_2027"].rows.map((row) => ({ row, year: 2027, sheet: "02_TARIFARIO_2027" as const })),
  ];
  const services = tariffRows.map(({ row, sheet }) => {
    const sku = stringValue(row.cells["TariffCode"]);
    if (!sku) throw new Error(`${sheet}, fila ${row.rowNumber}: falta TariffCode.`);
    const name = stringValue(row.cells["ETIQUETA"]) ?? sku;
    const unit = tariffPricingUnit(sku, row.cells["UnitType"], row.cells["PricingBasis"]);
    const sourceCurrency = currencyCode(row.cells["Currency"]);
    const priceUsd = numberValue(row.cells["PRECIO_USD"]);
    const sourceNet = numberValue(row.cells["Price NETO"]);
    // When the workbook has no native net but does have an approved USD value,
    // USD becomes the operational currency; the original label is still traced on the rate.
    const currency = sourceNet == null && priceUsd != null ? "USD" : sourceCurrency;
    const status = priceUsd != null && unit != null && currency != null ? "activo" as const : "pendiente" as const;
    const value = {
      sku,
      name,
      location: stringValue(row.cells["Location"]),
      country: upper(row.cells["Pais"]),
      supplierName: upper(row.cells["Supplier"]),
      type: serviceType(row.cells["ServiceType"] ?? row.cells["Type"]),
      pricingUnit: unit,
      currency,
      roomType: upper(row.cells["RoomType"]),
      vehicleMaxPax: integerValue(row.cells["VehicleMaxPax"]),
      mealPlan: mealPlan(row.cells["IncludesMeals"]),
      multiDaySpan: Math.max(1, integerValue(row.cells["DaysCount"]) ?? 1),
      status,
      notes: stringValue(row.cells["Notes"]),
      sourceRef: sourceRef(sheet, row, "TariffCode"),
    };
    return { importKey: `service:${sku}`, fingerprint: importFingerprint(value), ...value };
  });
  if (new Set(services.map((service) => service.sku)).size !== services.length)
    throw new Error("El tarifario consolidado contiene TariffCode duplicados.");

  const rates = tariffRows.map(({ row, year, sheet }) => {
    const serviceSku = stringValue(row.cells["TariffCode"]);
    if (!serviceSku) throw new Error(`${sheet}, fila ${row.rowNumber}: tarifa sin TariffCode.`);
    const sourcePriceUsd = numberValue(row.cells["PRECIO_USD"]);
    const sourcePriceNet = numberValue(row.cells["Price NETO"]);
    const sourceCurrency = currencyCode(row.cells["Currency"]);
    // Keep native net when it exists. The pricing engine gives source_price_usd
    // precedence, avoiding a second conversion while preserving the original cost.
    const priceNet = sourcePriceNet ?? sourcePriceUsd;
    const rawSeason = normalizeSeason(row.cells["Season"]);
    const season = rawSeason && ["ALL", "DRY", "RAIN", "BAJA", "MEDIA", "ALTA", "FESTIVO"].includes(rawSeason)
      ? rawSeason
      : null;
    const value = {
      serviceSku,
      year,
      season,
      validFrom: isoDate(row.cells["ValidFrom"]),
      validTo: isoDate(row.cells["ValidTo"]),
      paxMin: integerValue(row.cells["PaxMin"]),
      paxMax: integerValue(row.cells["PaxMax"]),
      priceNet,
      sourcePriceUsd,
      sourcePriceNet,
      sourceCurrency,
      pricingEnabled: sourcePriceUsd != null && priceNet != null,
      exclusionText: rawSeason && season == null ? rawSeason : null,
      notes: stringValue(row.cells["Notes"]),
      sourceRef: sourceRef(sheet, row, "PRECIO_USD"),
    };
    const importKey = `rate:${year}:${serviceSku}:${season ?? "NULL"}:${value.paxMin ?? ""}:${value.paxMax ?? ""}`;
    return { importKey, fingerprint: importFingerprint(value), ...value };
  });

  const suppliersByName = new Map<string, { name: string; country: string | null }>();
  services.forEach((service) => {
    if (service.supplierName && !suppliersByName.has(service.supplierName))
      suppliersByName.set(service.supplierName, { name: service.supplierName, country: service.country });
  });

  const hotelCodes = tables["03_INDEX_HOTELES"].rows.flatMap((row) => {
    const code = stringValue(row.cells["Código hotel"]);
    const name = stringValue(row.cells["Nombre del hotel"]);
    if (!code || !name) return [];
    return [{ code, name, combination: stringValue(row.cells["Código combinación"]), sourceRef: sourceRef("03_INDEX_HOTELES", row, "Código hotel") }];
  });

  const tourRows = tables["04_TOURS_ELEGIDOS"].rows;
  const seasonsBySku = new Map<string, Set<string>>();
  for (const row of tourRows) {
    const sku = stringValue(row.cells["SKU_normalizado"]);
    const season = normalizeSeason(row.cells["Temporada"]);
    if (sku && season) {
      if (!seasonsBySku.has(sku)) seasonsBySku.set(sku, new Set());
      seasonsBySku.get(sku)!.add(season);
    }
  }
  const templates = [...new Map(tourRows.flatMap((row) => {
    const sku = stringValue(row.cells["SKU_normalizado"]);
    const days = integerValue(row.cells["Días"]);
    const nights = integerValue(row.cells["Noches"]);
    if (!sku || days == null || nights == null) return [];
    const value = {
      sku,
      name: stringValue(row.cells["Descripción_oficial"]) ?? sku,
      days,
      nights,
      modality: modality(row.cells["Modalidad"]),
      category: category(row.cells["Categoría"]),
      seasons: [...(seasonsBySku.get(sku) ?? [])].sort(),
      sourceRef: sourceRef("04_TOURS_ELEGIDOS", row, "SKU_normalizado"),
    };
    return [[sku, { importKey: `template:${sku}`, fingerprint: importFingerprint(value), ...value }] as const];
  })).values()];

  const narrativeDays = tables["07_RECORRIDOS_WORD"].rows.map((row) => {
    const tourSku = stringValue(row.cells["SKU"]);
    const dayNumber = integerValue(row.cells["Día"]);
    if (!tourSku || dayNumber == null) throw new Error(`07_RECORRIDOS_WORD, fila ${row.rowNumber}: día sin identidad.`);
    const value = {
      tourSku,
      dayNumber,
      visibleCode: `${tourSku}-D${dayNumber}`,
      title: stringValue(row.cells["Título"]) ?? `${tourSku} · Día ${dayNumber}`,
      description: stringValue(row.cells["Recorrido_completo_Word"]) ?? "",
      lodging: stringValue(row.cells["Alojamiento_narrado"]),
      meals: stringValue(row.cells["Comidas_narradas"]),
      note: stringValue(row.cells["Notas_del_día"]),
      sourceRef: sourceRef("07_RECORRIDOS_WORD", row, "Recorrido_completo_Word"),
    };
    return { importKey: `narrative:${tourSku}:D${dayNumber}`, fingerprint: importFingerprint(value), ...value };
  });

  const scenarios = tables["05_ESCENARIOS"].rows.map((row) => {
    const tourSku = stringValue(row.cells["SKU"]);
    const season = normalizeSeason(row.cells["Temporada"]);
    const pax = integerValue(row.cells["PAX"]);
    const days = integerValue(row.cells["Bloques_día"]);
    if (!tourSku || !season || pax == null || days == null) throw new Error(`05_ESCENARIOS, fila ${row.rowNumber}: escenario sin identidad exacta.`);
    const year = 2026;
    const importKey = scenarioKey(tourSku, year, season, pax);
    const value = {
      tourSku,
      year,
      season,
      pax,
      days,
      expectedCostUsd: numberValue(row.cells["Costo_Excel_USD"]),
      detailCostUsd: numberValue(row.cells["Suma_detalle_USD"]),
      differenceUsd: numberValue(row.cells["Diferencia_USD"]),
      reviewStatus: stringValue(row.cells["Estado"]) ?? "REVISAR",
      sourceRef: sourceRef("05_ESCENARIOS", row, "Costo_Excel_USD"),
    };
    return { importKey, fingerprint: importFingerprint(value), ...value };
  });
  const scenarioKeys = new Set(scenarios.map((scenario) => scenario.importKey));

  const scenarioDays = tables["09_BLOQUES_PAX_DIA"].rows.map((row) => {
    const tourSku = stringValue(row.cells["SKU_tour"]);
    const season = normalizeSeason(row.cells["Temporada"]);
    const year = integerValue(row.cells["Año"]);
    const pax = integerValue(row.cells["PAX"]);
    const dayNumber = integerValue(row.cells["Día"]);
    const visibleCode = stringValue(row.cells["SKU_bloque"]);
    if (!tourSku || !season || year == null || pax == null || dayNumber == null || !visibleCode)
      throw new Error(`09_BLOQUES_PAX_DIA, fila ${row.rowNumber}: bloque sin identidad exacta.`);
    const exactScenario = scenarioKey(tourSku, year, season, pax);
    if (!scenarioKeys.has(exactScenario)) throw new Error(`09_BLOQUES_PAX_DIA, fila ${row.rowNumber}: escenario inexistente ${exactScenario}.`);
    const importKey = dayKey(exactScenario, dayNumber);
    const value = {
      scenarioKey: exactScenario,
      tourSku,
      year,
      season,
      pax,
      dayNumber,
      visibleCode,
      title: stringValue(row.cells["Título_Word"]),
      description: stringValue(row.cells["Recorrido_Word"]),
      hotel: stringValue(row.cells["Hotel_Word"]),
      meals: stringValue(row.cells["Comidas_Word"]),
      costUsd: numberValue(row.cells["Costo_día_USD"]),
      reviewStatus: stringValue(row.cells["Estado_revisión"]) ?? "REVISAR",
      sourceRef: sourceRef("09_BLOQUES_PAX_DIA", row, "Costo_día_USD"),
    };
    return { importKey, fingerprint: importFingerprint(value), ...value };
  });
  const scenarioDayKeys = new Set(scenarioDays.map((day) => day.importKey));

  const lines = tables["06_DESGLOSE"].rows.map((row, index) => {
    const tourSku = stringValue(row.cells["SKU"]);
    const season = normalizeSeason(row.cells["Temporada"]);
    const pax = integerValue(row.cells["PAX"]);
    const dayNumber = integerValue(row.cells["Día"]);
    if (!tourSku || !season || pax == null || dayNumber == null) throw new Error(`06_DESGLOSE, fila ${row.rowNumber}: línea sin escenario.`);
    const exactScenario = scenarioKey(tourSku, 2026, season, pax);
    const exactDay = dayKey(exactScenario, dayNumber);
    if (!scenarioDayKeys.has(exactDay)) throw new Error(`06_DESGLOSE, fila ${row.rowNumber}: día económico inexistente.`);
    const serviceSku = stringValue(row.cells["TariffCode_resuelto"]);
    const vinculation = stringValue(row.cells["Vinculación"]);
    const amountUsd = numberValue(row.cells["Costo_línea_USD"]);
    const quantity = numberValue(row.cells["Cantidad_indicativa"]) ?? 1;
    const unitCost = numberValue(row.cells["Precio_unitario_USD"]);
    const formula = stringValue(row.cells["Fórmula_Excel_texto"]);
    const lineKey = `${row.rowNumber}:${row.cellRefs["Costo_línea_USD"] ?? index + 1}`;
    const multiDay = /MULTI.?DAY|\d+D\d+N/i.test(`${row.cells["Servicio"] ?? ""} ${formula ?? ""}`);
    const value = {
      scenarioKey: exactScenario,
      dayKey: exactDay,
      lineKey,
      dayNumber,
      serviceSku,
      supplierName: upper(row.cells["Proveedor"]),
      unresolvedServiceRef: serviceSku ? null : (stringValue(row.cells["Códigos_en_fórmula"]) ?? stringValue(row.cells["Servicio"])),
      description: stringValue(row.cells["Servicio"]) ?? "Servicio sin descripción",
      quantity: Math.max(quantity, 0.0001),
      billingUnit: billingUnit(row.cells["Tipo"]),
      // Costo_línea_USD is already the approved group total. Never multiply it again.
      costBasis: "LINE_TOTAL" as const,
      referenceUnitCost: unitCost,
      originalAmount: amountUsd,
      originalCurrency: "USD",
      amountUsd,
      chargeOnceKey: multiDay && serviceSku ? `${exactScenario}:${serviceSku}` : null,
      resolutionIssue: vinculation && vinculation !== "CÓDIGO IDENTIFICADO" ? vinculation : null,
      sourceRef: {
        ...sourceRef("06_DESGLOSE", row, "Costo_línea_USD"),
        ...(stringValue(row.cells["Hoja_origen"]) ? { sourceSheet: stringValue(row.cells["Hoja_origen"])! } : {}),
        ...(integerValue(row.cells["Fila"]) ? { sourceRow: integerValue(row.cells["Fila"])! } : {}),
      },
    };
    return { importKey: `line:${exactDay}:${lineKey}`, fingerprint: importFingerprint(value), ...value };
  });

  const issues = tables["08_CONTROL_CALIDAD"].rows.flatMap((row) => {
    const type = stringValue(row.cells["Tipo"]);
    if (type === "CAMBIO") return [];
    const identity = stringValue(row.cells["SKU_o_servicio"]) ?? stringValue(row.cells["Fila_o_celda"]);
    const bracket = identity?.match(/^(.+?) \[([^,]+), P(\d+), D(\d+)\]/);
    const compact = identity?.match(/^(.+)-(ALL|DRY|RAIN)-P(\d+)(?:-D(\d+))?$/);
    const exactScenario = bracket
      ? scenarioKey(bracket[1]!, 2026, bracket[2]!, Number(bracket[3]))
      : compact
        ? scenarioKey(compact[1]!, 2026, compact[2]!, Number(compact[3]))
        : null;
    const issueDay = bracket?.[4] ?? compact?.[4];
    const exactDay = exactScenario && issueDay ? dayKey(exactScenario, Number(issueDay)) : null;
    const code = stringValue(row.cells["Acción_o_problema"]) ?? type ?? "INCIDENCIA";
    const detail = stringValue(row.cells["Detalle"]) ?? identity ?? "Incidencia sin detalle";
    return [{
      importKey: `issue:${row.rowNumber}`,
      scenarioKey: exactScenario,
      dayKey: exactDay,
      lineKey: null,
      code,
      issueType: issueType(code, detail),
      detail,
      sourceRef: sourceRef("08_CONTROL_CALIDAD", row, "Detalle"),
    }];
  });

  const summary = Object.fromEntries(tables["00_RESUMEN"].rows.flatMap((row) => {
    const key = stringValue(row.cells["Indicador / regla"]);
    return key ? [[key, row.cells["Valor / explicación"] ?? null]] : [];
  }));
  const counts = {
    services: services.length,
    activeServices: services.filter((service) => service.status === "activo").length,
    pendingServices: services.filter((service) => service.status === "pendiente").length,
    rates: rates.length,
    scenarios: scenarios.length,
    scenarioDays: scenarioDays.length,
    narrativeDays: narrativeDays.length,
    templates: templates.length,
    issues: issues.length,
  };
  if (counts.rates !== 1244 || counts.scenarios !== 155 || counts.scenarioDays !== 536 || counts.narrativeDays !== 96 || counts.templates !== 28)
    throw new Error(`Conteos inesperados: ${JSON.stringify(counts)}.`);
  return {
    schemaVersion: "uyuni-consolidated-v1",
    sourceSha256,
    sheetNames,
    headerRows: Object.fromEntries(CONSOLIDATED_WORKBOOK_SHEETS.map((name) => [name, tables[name].headerRow])) as Record<SheetName, number>,
    summary,
    suppliers: [...suppliersByName.values()].sort((a, b) => a.name.localeCompare(b.name)),
    services,
    rates,
    hotelCodes,
    templates,
    narrativeDays,
    scenarios,
    scenarioDays,
    lines,
    issues,
    counts,
  };
}

export function publicImportPayload(preview: ConsolidatedWorkbookPreview) {
  return {
    schemaVersion: preview.schemaVersion,
    sourceSha256: preview.sourceSha256,
    suppliers: preview.suppliers,
    services: preview.services,
    rates: preview.rates,
    hotelCodes: preview.hotelCodes,
    templates: preview.templates,
    narrativeDays: preview.narrativeDays,
    scenarios: preview.scenarios,
    scenarioDays: preview.scenarioDays,
    lines: preview.lines,
    issues: preview.issues,
  };
}
