import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  CONSOLIDATED_WORKBOOK_SHEETS,
  parseConsolidatedWorkbook,
  publicImportPayload,
} from "./consolidated-workbook";

const workbookPath = resolve(
  process.cwd(),
  "data/import/UyuniQuote_BASE_UNICA_IMPORTACION_2026_2027.xlsx",
);

describe.skipIf(!existsSync(workbookPath))("importador consolidado 2026–2027", () => {
  let parsed: Awaited<ReturnType<typeof parseConsolidatedWorkbook>>;

  beforeAll(async () => {
    parsed = await parseConsolidatedWorkbook(readFileSync(workbookPath));
  });

  it("detecta las diez hojas y sus cabeceras reales", () => {
    expect(parsed.sheetNames).toEqual(CONSOLIDATED_WORKBOOK_SHEETS);
    expect(Object.values(parsed.headerRows)).toEqual(Array(10).fill(4));
  });

  it("conserva los controles aprobados del libro", () => {
    expect(parsed.counts).toMatchObject({
      services: 1244,
      activeServices: 1225,
      pendingServices: 19,
      rates: 1244,
      scenarios: 155,
      scenarioDays: 536,
      narrativeDays: 96,
      templates: 28,
      issues: 310,
    });
    expect(parsed.rates.filter((rate) => rate.year === 2026)).toHaveLength(1203);
    expect(parsed.rates.filter((rate) => rate.year === 2027)).toHaveLength(41);
    expect(parsed.rates.filter((rate) => rate.priceNet == null)).toHaveLength(3);
    expect(parsed.rates.filter((rate) => rate.priceNet == null).every((rate) => !rate.pricingEnabled)).toBe(true);
  });

  it("mantiene escenarios exactos por temporada y pasajeros", () => {
    expect(new Set(parsed.scenarios.map((scenario) => scenario.pax))).toEqual(new Set([1, 2, 3, 4, 5]));
    expect(new Set(parsed.scenarios.map((scenario) => scenario.season))).toEqual(
      new Set(["ALL", "DRY", "RAIN"]),
    );
    expect(parsed.scenarios.filter((scenario) => scenario.reviewStatus === "REVISAR")).toHaveLength(10);
    expect(parsed.scenarios.filter((scenario) => Math.abs(scenario.differenceUsd ?? 0) > 0.005)).toHaveLength(10);
    expect(parsed.scenarios.every((scenario) => scenario.expectedCostUsd != null)).toBe(true);
    expect(new Set(parsed.scenarios.map((scenario) => scenario.importKey)).size).toBe(155);
    expect(new Set(parsed.scenarioDays.map((day) => day.importKey)).size).toBe(536);
  });

  it("conserva SPASPA-4D3N-LLTd 2026 ALL P2 con cuatro días, veinte líneas y USD 2166", () => {
    const scenario = parsed.scenarios.find(
      (candidate) =>
        candidate.tourSku === "SPASPA-4D3N-LLTd" &&
        candidate.year === 2026 &&
        candidate.season === "ALL" &&
        candidate.pax === 2,
    );
    expect(scenario).toMatchObject({
      days: 4,
      expectedCostUsd: 2166.001728,
      detailCostUsd: 2166.0017,
    });
    const days = parsed.scenarioDays.filter((day) => day.scenarioKey === scenario!.importKey);
    const lines = parsed.lines.filter((line) => line.scenarioKey === scenario!.importKey);
    expect(days).toHaveLength(4);
    expect(lines).toHaveLength(20);
    expect(lines.reduce((sum, line) => sum + (line.amountUsd ?? 0), 0)).toBeCloseTo(
      2166.001728,
      6,
    );
    expect(lines.every((line) => line.sourceRef.sheet === "06_DESGLOSE")).toBe(true);
  });

  it("preserva el costo total de cada línea sin volver a multiplicarlo", () => {
    expect(parsed.lines).toHaveLength(2749);
    expect(parsed.lines.every((line) => line.costBasis === "LINE_TOTAL")).toBe(true);
    expect(parsed.lines.every((line) => line.originalAmount === line.amountUsd)).toBe(true);
    expect(parsed.lines.every((line) => line.amountUsd != null)).toBe(true);
    expect(parsed.lines.filter((line) => line.amountUsd === 0)).toHaveLength(527);
    expect(parsed.lines.filter((line) => line.serviceSku == null && line.amountUsd != null)).toHaveLength(823);
    expect(parsed.lines.filter((line) => line.serviceSku == null && line.amountUsd !== 0)).toHaveLength(296);
    expect(parsed.lines.filter((line) => line.serviceSku == null && line.amountUsd === 0)).toHaveLength(527);
    expect(parsed.lines.filter((line) => line.resolutionIssue)).toHaveLength(823);
    expect(parsed.issues.filter((issue) => issue.issueType === "identification")).toHaveLength(296);
    expect(parsed.issues.filter((issue) => issue.issueType === "missing_price")).toHaveLength(3);
    expect(parsed.issues.filter((issue) => issue.issueType === "reconciliation")).toHaveLength(10);
  });

  it("produce un payload independiente sin escribir en el catálogo", () => {
    const payload = publicImportPayload(parsed);
    expect(payload.sourceSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(payload.scenarioDays).toHaveLength(536);
    expect(payload).not.toHaveProperty("summary");
  });
});
