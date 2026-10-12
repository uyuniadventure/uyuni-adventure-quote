import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { localOnly } from "./local-only.mjs";

const runtime = JSON.parse(readFileSync("tests/e2e/.local/runtime.json", "utf8"));
localOnly(runtime.api, 54321);
async function signedIn(key: string) {
  const client = createClient(runtime.api, runtime.anonKey, { auth: { persistSession: false } });
  const user = runtime.users[key];
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error) throw error;
  return client;
}
for (const key of ["seller", "operations", "admin"]) {
  test(`Permisos: ${key} respeta RLS y los controles de la interfaz`, async ({ page }) => {
    const user = runtime.users[key];
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill(user.email);
    await page.getByLabel("Contraseña", { exact: true }).fill(user.password);
    await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    const client = await signedIn(key);
    const fixtures = runtime.roleFixtures;
    const quotes = await client
      .from("quotes")
      .select("id")
      .in("id", Object.values(fixtures.quotes));
    expect(quotes.error).toBeNull();
    expect(quotes.data!.map((q) => q.id).sort()).toEqual(
      (key === "admin" ? Object.values(fixtures.quotes) : [fixtures.quotes[key]]).sort(),
    );
    const operations = await client
      .from("ops_services")
      .select("id,quote_snapshot")
      .in("id", Object.values(fixtures.operations));
    expect(operations.error).toBeNull();
    expect(operations.data!.map((o) => o.id).sort()).toEqual(
      (key === "seller" ? [fixtures.operations.seller] : Object.values(fixtures.operations)).sort(),
    );
    const items = await client
      .from("ops_items")
      .select("service_id")
      .in("service_id", Object.values(fixtures.operations));
    expect(items.error).toBeNull();
    expect(items.data!.map((i) => i.service_id).sort()).toEqual(
      operations.data!.map((o) => o.id).sort(),
    );
    await page.goto("/operacion");
    await expect(page.getByRole("heading", { name: "Operación", exact: true })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "ROLE-seller" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "ROLE-otherSeller" })).toHaveCount(
      key === "seller" ? 0 : 1,
    );
    if (key === "seller") {
      const edit = await client
        .from("service_rates")
        .update({ price_net: 999 })
        .eq("id", fixtures.rateId)
        .select("id");
      expect(edit.error).toBeNull();
      expect(edit.data).toEqual([]);
      const insert = await client
        .from("service_rates")
        .insert({ service_id: fixtures.serviceId, price_net: 999 });
      expect(insert.error?.code).toBe("42501");
      const proposal = await client
        .from("service_change_requests")
        .insert({
          rate_id: fixtures.rateId,
          proposed_values: { price_net: 120 },
          reason: `Seller ${randomUUID()}`,
        })
        .select("id")
        .single();
      expect(proposal.error).toBeNull();
      const approval = await client
        .from("service_change_requests")
        .update({ status: "aprobado" })
        .eq("id", proposal.data!.id)
        .select("id");
      expect(approval.error).toBeNull();
      expect(approval.data).toEqual([]);
      const escalation = await client
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", user.id)
        .select("id");
      expect(escalation.error).toBeNull();
      expect(escalation.data).toEqual([]);
      await page.goto("/tarifario");
      await expect(page.getByRole("tab", { name: /Sugerencias/ })).toHaveCount(0);
    } else {
      const edit = await client
        .from("service_rates")
        .update({ price_net: 125 })
        .eq("id", fixtures.rateId)
        .select("id");
      expect(edit.error).toBeNull();
      expect(edit.data).toHaveLength(1);
      const seller = await signedIn("seller");
      const proposal = await seller
        .from("service_change_requests")
        .insert({
          rate_id: fixtures.rateId,
          proposed_values: { price_net: 130 },
          reason: `Review ${randomUUID()}`,
        })
        .select("id")
        .single();
      expect(proposal.error).toBeNull();
      await page.goto("/tarifario");
      await page.getByRole("tab", { name: /Sugerencias/ }).click();
      await page
        .getByTestId(`change-request-${proposal.data!.id}`)
        .getByRole("button", { name: "Aprobar", exact: true })
        .click();
      await expect
        .poll(async () => {
          const r = await client
            .from("service_change_requests")
            .select("status,approved_by")
            .eq("id", proposal.data!.id)
            .single();
          return r.data;
        })
        .toEqual({ status: "aprobado", approved_by: user.id });
      const approvedRate = await client
        .from("service_rates")
        .select("price_net")
        .eq("id", fixtures.rateId)
        .single();
      expect(Number(approvedRate.data?.price_net)).toBe(130);
    }
    await page.goto("/admin");
    const listed = await client.rpc("admin_list_users");
    if (key === "admin") {
      expect(listed.error).toBeNull();
      for (const account of Object.values(runtime.users) as { email: string }[])
        await expect(page.getByRole("row").filter({ hasText: account.email })).toHaveCount(1);
      await expect(page.getByRole("columnheader", { name: "Email", exact: true })).toBeVisible();
    } else {
      expect(listed.error?.code).toBe("42501");
      await expect(page.getByRole("heading", { name: "Acceso restringido" })).toBeVisible();
      await expect(
        page.getByRole("row").filter({ hasText: runtime.users.admin.email }),
      ).toHaveCount(0);
    }
    await test.info().attach("permisos-verificados.json", {
      body: JSON.stringify({
        role: user.role,
        quotes: quotes.data!.length,
        operations: operations.data!.length,
        adminEmails: key === "admin",
      }),
      contentType: "application/json",
    });
  });
}
