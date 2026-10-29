import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import spa from "../fixtures/SPAUYU-3D2N-MP.json" with { type: "json" };
import bolivia from "../fixtures/BOLIVIA-5D4N-9+1.json" with { type: "json" };
import { compareReference, type QuoteReference } from "../../src/lib/pricing/reference";
import { localOnly } from "./local-only.mjs";

const runtime = JSON.parse(readFileSync("tests/e2e/.local/runtime.json", "utf8"));
localOnly(runtime.api, 54321);
const seller = createClient(runtime.api, runtime.anonKey, { auth: { persistSession: false } });

test.beforeAll(async () => {
  const { error } = await seller.auth.signInWithPassword({
    email: runtime.email,
    password: runtime.password,
  });
  if (error) throw error;
  const profile = await seller.from("profiles").select("role").eq("id", runtime.sellerId).single();
  expect(profile.data?.role).toBe("vendedor");
});
test.beforeEach(async ({ page }) => {
  // No storageState shortcut: every repeat logs in through the real Auth UI.
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(runtime.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(runtime.password);
  await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});

async function basics(page: Page, pax = 2, tc = 0, date = spa.input.start_date) {
  await page.goto("/nueva-cotizacion");
  await page.getByRole("combobox", { name: "Buscar cliente…" }).click();
  await page.getByPlaceholder("Buscar…", { exact: true }).fill("Cliente E2E SPA");
  await page.getByRole("option", { name: /Cliente E2E SPA/ }).click();
  await page.getByLabel("Fecha de inicio", { exact: true }).fill(date);
  await page.getByLabel("Pax pagantes", { exact: true }).fill(String(pax));
  await page.getByLabel("TC (liberados)", { exact: true }).fill(String(tc));
  await page.getByRole("button", { name: "Ver plantillas sugeridas" }).click();
}
async function quote(page: Page) {
  await expect(page).toHaveURL(/quote=[a-f0-9-]+/);
  const id = new URL(page.url()).searchParams.get("quote")!;
  const { data, error } = await seller.from("quotes").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}
async function fromTemplate(page: Page, sku: string) {
  const card = page.getByRole("group", { name: `Plantilla ${sku}`, exact: true });
  await card.getByRole("button", { name: "Usar plantilla" }).click();
  await expect(page.getByRole("heading", { name: "Cotización", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Marcar revisada" })).toBeEnabled();
  return quote(page);
}
async function assertTotals(page: Page, expectedCost: number, expectedPrice: number | null) {
  await expect
    .poll(async () => Math.abs(Number((await quote(page)).total_cost_usd) - expectedCost))
    .toBeLessThanOrEqual(1);
  const q = await quote(page);
  expect(
    Math.abs(Number(q.total_cost_usd) - expectedCost),
    "Costo vs Sheets, tolerancia USD 1",
  ).toBeLessThanOrEqual(1);
  expect(q.calculation.status).toBe("ok");
  await expect(page.getByTestId("quote-total")).toHaveText(
    `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(Number(q.total_price_usd))} USD`,
  );
  if (expectedPrice !== null)
    expect(
      Math.abs(Number(q.total_price_usd) - expectedPrice),
      "Venta vs referencia, tolerancia USD 1",
    ).toBeLessThanOrEqual(1);
  await test.info().attach("quote-calculation.json", {
    body: JSON.stringify(
      { cost: q.total_cost_usd, sale: q.total_price_usd, calculation: q.calculation },
      null,
      2,
    ),
    contentType: "application/json",
  });
  return q;
}
async function deliver(page: Page) {
  await page.getByRole("button", { name: "Marcar revisada" }).click();
  await expect(page.getByText("Revisada", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "PDF y envío" }).click();
  await page.getByLabel("Enlace a términos y condiciones").fill("https://example.invalid/terms");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Generar PDF", exact: true }).click();
  const download = await downloadPromise;
  const pdfPath = test.info().outputPath("proposal.pdf");
  await download.saveAs(pdfPath);
  const pdf = readFileSync(pdfPath);
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  expect(pdf.length).toBeGreaterThan(2000);
  await test.info().attach("proposal.pdf", { path: pdfPath, contentType: "application/pdf" });
  await page.getByRole("button", { name: "Enviar por email" }).click();
  await expect(page.getByText("Enviada", { exact: true })).toBeVisible();
  const q = await quote(page);
  const emails = await seller.from("quote_emails").select("*").eq("quote_id", q.id);
  expect(emails.error).toBeNull();
  expect(emails.data).toHaveLength(1);
  expect(emails.data![0]).toMatchObject({
    status: "enviado",
    pdf_path: q.pdf_path,
    recipient: "customer-e2e@example.invalid",
  });
  expect(emails.data![0].provider_id).toMatch(/^e2e-mock-/);
  return q;
}

test("SPA 2 pax: plantilla → PDF → email → depósito → Operación", async ({ page }) => {
  await basics(page);
  await fromTemplate(page, "SPAUYU-3D2N-MP");
  // Sheets certifies cost only. Sale is the explicit business rule, not a Sheets sale cell.
  const q = await assertTotals(page, spa.expected.cost_usd!, spa.expected.cost_usd! * 1.25);
  const sent = await deliver(page);
  await page.getByRole("tab", { name: "Pagos", exact: true }).click();
  const deposit = Math.round(Number(sent.total_price_usd) * Number(sent.deposit_pct)) / 100;
  await page.getByLabel("Fecha", { exact: true }).fill("2026-10-12");
  await page.getByLabel("Monto", { exact: true }).fill(String(deposit));
  await page.getByLabel("Método", { exact: true }).fill("Transferencia E2E");
  await page.getByLabel("Banco", { exact: true }).fill("Banco de prueba");
  await page.getByRole("button", { name: "Registrar pago", exact: true }).click();
  await expect(page.getByText("Vendida", { exact: true })).toBeVisible();
  const operations = await seller.from("ops_services").select("*").eq("quote_id", q.id);
  expect(operations.error).toBeNull();
  expect(operations.data).toHaveLength(1);
  const operation = operations.data![0];
  expect(operation.pax).toBe(2);
  expect(operation.days_snapshot).toHaveLength(3);
  expect(Number(operation.quoted_cost_usd)).toBeCloseTo(Number(q.total_cost_usd), 2);
  const copied = await seller.from("ops_items").select("cost_usd").eq("service_id", operation.id);
  expect(copied.error).toBeNull();
  expect(copied.data!.length).toBeGreaterThan(0);
  expect(
    Math.abs(copied.data!.reduce((sum, i) => sum + Number(i.cost_usd), 0) - spa.expected.cost_usd!),
  ).toBeLessThanOrEqual(1);
  await page.getByRole("link", { name: "Ver servicio en Operación" }).click();
  await expect(page).toHaveURL(/\/operacion$/);
  await expect(page.getByRole("row").filter({ hasText: operation.booking_code })).toHaveCount(1);
});

test("SPA 2 pax: los mismos tres bloques conservan el total de la plantilla", async ({ page }) => {
  await basics(page);
  const templateQuote = await fromTemplate(page, "SPAUYU-3D2N-MP");
  await assertTotals(page, spa.expected.cost_usd!, spa.expected.cost_usd! * 1.25);
  await basics(page);
  const suggestionNavigation = page.getByRole("button", { name: "Datos básicos" }).locator("..");
  await expect(
    suggestionNavigation.getByRole("button", { name: "Empezar desde cero" }),
  ).toBeVisible();
  await suggestionNavigation.getByRole("button", { name: "Empezar desde cero" }).click();
  await expect(page.getByRole("heading", { name: "Cotización", exact: true })).toBeVisible();
  for (let n = 1; n <= 3; n++) {
    await page.getByRole("combobox", { name: "Buscar bloque diario…" }).click();
    await page.getByPlaceholder("Buscar…", { exact: true }).fill(`IMPORT_SPAUYU_MP_2PAX_D${n}`);
    await page.getByRole("option", { name: new RegExp(`IMPORT_SPAUYU_MP_2PAX_D${n}`) }).click();
  }
  await page.getByRole("button", { name: "Añadir bloques", exact: true }).click();
  for (let n = 1; n <= 3; n++) {
    await expect(
      page.locator(`#day-${n}`),
      `El bloque ${n} debe poder añadirse, incluido su servicio multi-día`,
    ).toBeVisible();
  }
  const blocks = await assertTotals(
    page,
    spa.expected.cost_usd!,
    Number(templateQuote.total_price_usd),
  );
  expect(blocks.template_id).toBeNull();
});

test("Bolivia 5D4N 9+1: fixture → plantilla → PDF → email", async ({ page }) => {
  const reference = bolivia as QuoteReference;
  const comparison = compareReference(reference);
  await test
    .info()
    .attach("bolivia-diferencias.md", { body: comparison.report, contentType: "text/markdown" });
  expect(reference.input, comparison.report).not.toBeNull();
  expect(comparison.pass, comparison.report).toBe(true);
  // The import must name its reviewed catalogue SKU; never guess or make up tariffs.
  const sku = (bolivia as typeof bolivia & { template_sku?: string }).template_sku;
  expect(sku, "Falta template_sku confirmado en el fixture Bolivia").toBeTruthy();
  await basics(page, 9, 1, reference.input!.start_date);
  await fromTemplate(page, sku!);
  await assertTotals(page, reference.expected.cost_usd!, reference.expected.price_usd);
  await deliver(page);
});
