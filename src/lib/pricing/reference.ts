import { calculateQuote, type QuoteInput, type QuoteResult } from "./index";

export interface ReferenceLine {
  cell: string;
  day: number;
  description: string;
  sku: string | null;
  quantity: number | null;
  unit_cost_usd: number | null;
  cost_usd: number | null;
  formula?: string | null;
  note?: string;
}
export interface QuoteReference {
  name: string;
  source: {
    file?: string;
    sha256?: string;
    url?: string;
    sheet: string;
    range: string;
    total_cell: string;
    read_on: string;
  };
  pax_paying: number;
  tc_count: number;
  expected: { cost_usd: number | null; cost_per_pax_usd: number | null; price_usd: number | null };
  input: QuoteInput | null;
  lines: ReferenceLine[];
  blockers: string[];
  notes: string[];
}
const display = (n: number | null | undefined) =>
  n == null ? "N/D" : (Math.abs(n) < 0.005 ? 0 : n).toFixed(2);
const escape = (s: string) => s.replace(/\|/g, "/").replace(/[\r\n]+/g, " ");

/** Report missing data as missing, never as zero or as a passing skipped case. */
export function compareReference(reference: QuoteReference, input = reference.input) {
  let result: QuoteResult | undefined;
  const blockers = [...reference.blockers];
  if (!reference.lines.length) blockers.push("La referencia no contiene líneas verificables.");
  if (new Set(reference.lines.map((l) => l.cell)).size !== reference.lines.length)
    blockers.push("Hay celdas repetidas en la referencia.");
  if (input && (input.pax_paying !== reference.pax_paying || input.tc_count !== reference.tc_count))
    blockers.push("Los pagantes/TC de la entrada no coinciden con el escenario de referencia.");
  try {
    if (input) result = calculateQuote(input);
    else blockers.push("No hay QuoteInput verificable: faltan datos de la fuente indicados abajo.");
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error));
  }
  const header =
    "| Celda | Servicio | Cantidad Sheets / app | Tarifa USD Sheets / app | Costo app | Costo Sheets | Diferencia | Causa probable |\n|---|---|---|---|---:|---:|---:|---|";
  const rows = reference.lines.map((line) => {
    const actual = result?.items.find((i) => i.id === line.cell);
    const delta =
      actual?.total_cost_usd != null && line.cost_usd != null
        ? actual.total_cost_usd - line.cost_usd
        : null;
    const cause =
      line.note ??
      (actual == null
        ? "Falta configuración verificable"
        : (actual.warning ??
          (Math.abs(delta ?? 0) > 0.01
            ? actual.quantity !== line.quantity
              ? "Cantidad/unidad de cobro distinta"
              : "Tarifa, vigencia o cambio de moneda distinto"
            : "Coincide")));
    return `| ${line.cell} | ${escape(line.description)} | ${line.quantity ?? "N/D"} / ${actual?.quantity ?? "N/D"} | ${display(line.unit_cost_usd)} / ${display(actual?.unit_cost_usd)} | ${display(actual?.total_cost_usd)} | ${display(line.cost_usd)} | ${display(delta)} | ${escape(cause)} |`;
  });
  const extra = result?.items.filter((i) => !reference.lines.some((l) => l.cell === i.id)) ?? [];
  if (extra.length)
    blockers.push(`Ítems no presentes en Sheets: ${extra.map((i) => i.id).join(", ")}`);
  const costDelta =
    result?.total_cost_usd != null && reference.expected.cost_usd != null
      ? result.total_cost_usd - reference.expected.cost_usd
      : null;
  const priceDelta =
    result?.total_price_usd != null && reference.expected.price_usd != null
      ? result.total_price_usd - reference.expected.price_usd
      : null;
  const lineMismatch = reference.lines.some((l) => {
    const actual = result?.items.find((i) => i.id === l.cell);
    return (
      actual == null ||
      actual.total_cost_usd == null ||
      l.cost_usd == null ||
      Math.abs(actual.total_cost_usd - l.cost_usd) > 1 ||
      (l.quantity != null && actual.quantity !== l.quantity)
    );
  });
  const pass =
    blockers.length === 0 &&
    result?.status === "ok" &&
    !lineMismatch &&
    costDelta != null &&
    Math.abs(costDelta) <= 1 &&
    (reference.expected.price_usd == null || (priceDelta != null && Math.abs(priceDelta) <= 1));
  const report = [
    reference.name,
    `Fuente: ${reference.source.url ?? reference.source.file} · ${reference.source.sheet}!${reference.source.range}`,
    header,
    ...rows,
    `Costo: app ${display(result?.total_cost_usd)} / Sheets ${display(reference.expected.cost_usd)} / diferencia ${display(costDelta)} USD.`,
    `Venta: app ${display(result?.total_price_usd)} / Sheets ${display(reference.expected.price_usd)} / diferencia ${display(priceDelta)} USD.`,
    ...blockers.map((b) => `Pendiente: ${b}`),
    ...reference.notes.map((n) => `Nota: ${n}`),
  ].join("\n");
  return { pass, result, blockers, report };
}
