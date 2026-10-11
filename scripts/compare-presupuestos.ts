import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compareReference, type QuoteReference } from "../src/lib/pricing/reference";

const root = fileURLToPath(new URL("../", import.meta.url));
const reports: string[] = [];
let failed = false;
for (const filename of ["SPAUYU-3D2N-MP", "BOLIVIA-5D4N-9+1", "SIVOLA-10D-14+1"]) {
  const fixture = JSON.parse(
    await readFile(resolve(root, `tests/fixtures/${filename}.json`), "utf8"),
  ) as QuoteReference;
  const result = compareReference(fixture);
  failed ||= !result.pass;
  reports.push(`${result.pass ? "COINCIDE" : "REQUIERE DECISIÓN"}\n${result.report}`);
}
const report = reports.join("\n\n") + "\n";
console.log(report);
if (process.argv.includes("--write-report")) {
  await mkdir(resolve(root, "docs/pendientes"), { recursive: true });
  await writeFile(resolve(root, "docs/pendientes/comparacion_presupuestos.txt"), report, "utf8");
}
process.exitCode = failed ? 1 : 0;
