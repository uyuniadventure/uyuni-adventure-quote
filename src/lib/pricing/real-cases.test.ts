import { describe, expect, it } from "vitest";
import spa from "../../../tests/fixtures/SPAUYU-3D2N-MP.json";
import bolivia from "../../../tests/fixtures/BOLIVIA-5D4N-9+1.json";
import sivola from "../../../tests/fixtures/SIVOLA-10D-14+1.json";
import { compareReference, type QuoteReference } from "./reference";

describe("casos reales contra Sheets · tolerancia USD 1", () => {
  // Missing source data intentionally FAILS with a line-by-line report. Never skip,
  // turn this into test.fails, or fit a rate/margin to a published grand total.
  it.each([spa, bolivia, sivola] as QuoteReference[])("$name", (fixture) => {
    const comparison = compareReference(fixture);
    expect(comparison.pass, comparison.report).toBe(true);
  });
});
