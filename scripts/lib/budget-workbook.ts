import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { posix } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { XMLParser } from "fast-xml-parser";

type Xml = { [key: string]: unknown };
const object = (v: unknown): Xml => (v && typeof v === "object" ? (v as Xml) : {});
const array = (v: unknown): unknown[] => (v == null ? [] : Array.isArray(v) ? v : [v]);
function text(v: unknown): string {
  if (typeof v === "string" || typeof v === "number") return String(v);
  const n = object(v);
  return n["#text"] != null
    ? String(n["#text"])
    : n["t"] != null
      ? text(n["t"])
      : array(n["r"])
          .map((r) => text(object(r)["t"]))
          .join("");
}
export interface Cell {
  value: string | number | null;
  formula?: string;
  error?: string;
}
export interface Sheet {
  name: string;
  cells: Map<string, Cell>;
  lastRow: number;
}
export async function openBudgetWorkbook(path: string) {
  const bytes = await readFile(path);
  const zip = unzipSync(bytes);
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    trimValues: false,
  });
  const xml = (name: string): Xml => {
    if (!zip[name]) throw new Error(`Missing XLSX entry: ${name}`);
    return parser.parse(strFromU8(zip[name])) as Xml;
  };
  const shared = zip["xl/sharedStrings.xml"]
    ? array(object(xml("xl/sharedStrings.xml")["sst"])["si"]).map(text)
    : [];
  const relationships = array(
    object(xml("xl/_rels/workbook.xml.rels")["Relationships"])["Relationship"],
  );
  const names = array(object(object(xml("xl/workbook.xml")["workbook"])["sheets"])["sheet"]);
  const sheets = names.map((entry) => {
    const n = object(entry);
    const rel = object(relationships.find((r) => object(r)["@_Id"] === n["@_r:id"]));
    const target = String(rel["@_Target"]);
    return {
      name: String(n["@_name"]),
      path: target.startsWith("/") ? target.slice(1) : posix.join("xl", target),
    };
  });
  return {
    sha256: createHash("sha256").update(bytes).digest("hex"),
    names: sheets.map((s) => s.name),
    sheet(name: string): Sheet {
      const match = sheets.filter((s) => s.name.replace(/\s/g, "") === name.replace(/\s/g, ""));
      if (match.length !== 1)
        throw new Error(`Expected one sheet matching ${name}; found ${match.length}`);
      const found = match[0]!;
      const rows = array(object(object(xml(found.path)["worksheet"])["sheetData"])["row"]);
      const cells = new Map<string, Cell>();
      const sharedFormulas = new Map<string, { address: string; formula: string }>();
      const formulaFollowers: { address: string; si: string }[] = [];
      let lastRow = 0;
      for (const r of rows)
        for (const raw of array(object(r)["c"])) {
          const c = object(raw),
            address = String(c["@_r"]),
            type = c["@_t"];
          const f = object(c["f"]);
          if (f["@_t"] === "shared") {
            if (text(c["f"]))
              sharedFormulas.set(String(f["@_si"]), { address, formula: text(c["f"]) });
            else formulaFollowers.push({ address, si: String(f["@_si"]) });
          }
          const cached = text(c["v"]);
          const value =
            type === "s"
              ? (shared[Number(cached)] ?? null)
              : type === "inlineStr"
                ? text(c["is"])
                : cached === ""
                  ? null
                  : ["str", "e"].includes(String(type))
                    ? cached
                    : Number(cached);
          cells.set(address, {
            value,
            ...(c["f"] != null ? { formula: "=" + text(c["f"]) } : {}),
            ...(type === "e" ? { error: cached } : {}),
          });
          lastRow = Math.max(lastRow, Number(address.match(/\d+$/)?.[0] ?? 0));
        }
      for (const follower of formulaFollowers) {
        const base = sharedFormulas.get(follower.si);
        const conversion = base?.formula.match(/^G([0-9]+)\/([0-9.]+)$/);
        // The source exports FX as shared formulas. Support that explicit shape only.
        cells.get(follower.address)!.formula =
          conversion && base?.address === `H${conversion[1]}`
            ? `=G${follower.address.slice(1)}/${conversion[2]}`
            : "=UNSUPPORTED_SHARED_FORMULA";
      }
      return { name: found.name, cells, lastRow };
    },
  };
}

export interface SourceLine {
  cell: string;
  day: number;
  row_day: number | null;
  description: string;
  supplier: string;
  sku: string | null;
  quantity: number | null;
  unit_cost_usd: number | null;
  cost_usd: number;
  formula: string | null;
  room_type?: "DBL" | "SGL" | "TPL" | "MAT";
  covered_by?: string;
  vehicle?: { quantity: number; pax_min: number | null; pax_max: number | null };
}
export const cellValue = (sheet: Sheet, address: string) => sheet.cells.get(address)?.value ?? null;
const string = (sheet: Sheet, address: string) => String(cellValue(sheet, address) ?? "").trim();
function number(sheet: Sheet, address: string) {
  const c = sheet.cells.get(address);
  if (c?.error || typeof c?.value !== "number" || !Number.isFinite(c.value))
    throw new Error(`${sheet.name}!${address}: falta importe numérico guardado`);
  return c.value;
}
/** Deliberately bounded grammar: one exact lookup, optionally multiplied by a number.
 * Never evaluate a formula as code, infer quantities from totals, or take the first SKU of a sum. */
export function parseLookup(formula: string) {
  const m =
    /^=INDEX\(TARIFARIO_MAESTRO!\$H:\$H,MATCH\("([A-Z0-9_]+)",TARIFARIO_MAESTRO!\$Y:\$Y,0\)\)(?:\*([0-9]+(?:\.[0-9]+)?))?$/i.exec(
      formula,
    );
  return m ? { sku: m[1]!, quantity: m[2] ? Number(m[2]) : 1 } : null;
}
export function extractScenario(sheet: Sheet, master: Sheet, sku: string, pax: number) {
  const starts = [...sheet.cells]
    .filter(([a, c]) => /^A\d+$/.test(a) && c.value === "INFORMACIÓN GENERAL")
    .map(([a]) => Number(a.slice(1)))
    .sort((a, b) => a - b);
  const candidates = starts
    .map((start, i) => ({ start, end: (starts[i + 1] ?? sheet.lastRow + 1) - 1 }))
    .filter(({ start, end }) =>
      Array.from({ length: end - start + 1 }, (_, i) => start + i).some(
        (r) => string(sheet, `A${r}`) === "N. PAX" && cellValue(sheet, `B${r}`) === pax,
      ),
    );
  if (candidates.length !== 1)
    throw new Error(`Se requiere un único escenario de ${pax} pax en ${sheet.name}`);
  const { start, end } = candidates[0]!;
  const declared = Array.from({ length: end - start + 1 }, (_, i) =>
    string(sheet, `B${start + i}`),
  ).find((v) => v.startsWith("SKU:"));
  if (declared?.replace(/^SKU:\s*/, "").replace(/\s/g, "") !== sku)
    throw new Error(`SKU de cabecera distinto: ${declared}`);
  const warnings: string[] = [],
    blockers: string[] = [],
    lines: SourceLine[] = [];
  let day = 0,
    totalCell = "";
  const masterRows = new Map<string, number[]>();
  for (const [a, c] of master.cells)
    if (/^Y\d+$/.test(a) && typeof c.value === "string")
      masterRows.set(c.value, [...(masterRows.get(c.value) ?? []), Number(a.slice(1))]);
  const fx: Record<string, number> = { USD: 1 };
  for (let r = start; r <= end; r++) {
    if (string(sheet, `C${r}`) === "COSTO") totalCell = `D${r}`;
    const label = string(sheet, `A${r}`),
      header = /^DÍA\s+(\d+)$/.exec(label);
    if (header && (string(sheet, `B${r}`) === "TIPO" || string(sheet, `B${r}`) === label)) {
      day = Number(header[1]);
      continue;
    }
    if (!day || !string(sheet, `D${r}`)) continue;
    if (string(sheet, `C${r}`) !== "INCLUDED") {
      blockers.push(`F${r}: inclusión no soportada; revisar explícitamente`);
      continue;
    }
    const cell = `F${r}`,
      formula = sheet.cells.get(cell)?.formula ?? null,
      lookup = formula ? parseLookup(formula) : null;
    const rowDay = Number(label.match(/\d+/)?.[0] ?? 0) || null;
    if (rowDay !== day)
      warnings.push(
        `${cell}: fila dice día ${rowDay}, se usa encabezado día ${day} (Andrea, 2026-10-11).`,
      );
    const line: SourceLine = {
      cell,
      day,
      row_day: rowDay,
      description: string(sheet, `D${r}`),
      supplier: string(sheet, `E${r}`),
      sku: lookup?.sku ?? null,
      quantity: lookup?.quantity ?? null,
      unit_cost_usd: null,
      cost_usd: number(sheet, cell),
      formula,
    };
    if (!lookup) {
      const matches = lines.filter(
        (l) =>
          l.sku &&
          !l.covered_by &&
          l.description === line.description &&
          l.supplier === line.supplier,
      );
      if (!formula && line.cost_usd === 0 && matches.length === 1) {
        const first = matches[0]!;
        line.sku = first.sku;
        line.quantity = 0;
        line.unit_cost_usd = 0;
        line.covered_by = first.cell;
      } else blockers.push(`${cell}: fórmula o fila sin SKU/cantidad inequívocos`);
    } else {
      const rows = masterRows.get(lookup.sku) ?? [];
      if (rows.length !== 1)
        blockers.push(`${cell}: ${lookup.sku} aparece ${rows.length} veces en TARIFARIO_MAESTRO`);
      else {
        const m = rows[0]!;
        line.unit_cost_usd = number(master, `H${m}`);
        const currency = string(master, `E${m}`);
        if (/TARIFA POR VEH[IÍ]CULO/i.test(string(master, `S${m}`))) {
          const min = cellValue(master, `Q${m}`),
            max = cellValue(master, `R${m}`);
          line.vehicle = {
            quantity: lookup.quantity,
            pax_min: typeof min === "number" ? min : null,
            pax_max: typeof max === "number" ? max : null,
          };
        }
        if (currency !== "USD") {
          const conversion = master.cells
            .get(`H${m}`)
            ?.formula?.match(new RegExp(`^=G${m}/([0-9.]+)$`));
          if (!conversion || (fx[currency] != null && fx[currency] !== Number(conversion[1])))
            blockers.push(`${cell}: conversión de ${currency} no reproducible`);
          else fx[currency] = Number(conversion[1]);
        }
        if (/HAB/i.test(line.description)) {
          const room = /DOBLE|DBL|TWIN/i.test(line.description)
            ? "DBL"
            : /SINGLE|SIMPLE|SGL/i.test(line.description)
              ? "SGL"
              : /TRIPLE|TPL/i.test(line.description)
                ? "TPL"
                : /MATRIMONIAL|MAT/i.test(line.description)
                  ? "MAT"
                  : undefined;
          if (room) line.room_type = room;
          const masterType = string(master, `N${m}`);
          if (
            !line.room_type ||
            (["DBL", "SGL", "TPL", "MAT"].includes(masterType) && line.room_type !== masterType)
          )
            blockers.push(
              `${cell}: descripción de habitación y tarifa requieren revisión (${masterType})`,
            );
        }
      }
    }
    lines.push(line);
  }
  const expectedCost = number(sheet, totalCell);
  if (Math.abs(lines.reduce((sum, l) => sum + l.cost_usd, 0) - expectedCost) > 0.01)
    blockers.push("Las líneas extraídas no cuadran con COSTO de la hoja");
  return {
    sheet: sheet.name,
    range: `A${start}:G${Math.max(...lines.map((l) => Number(l.cell.slice(1))))}`,
    totalCell,
    expectedCost,
    fx,
    lines,
    warnings,
    blockers,
  };
}
