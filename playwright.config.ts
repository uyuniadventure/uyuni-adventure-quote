import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
import { localOnly } from "./tests/e2e/local-only.mjs";

const runtime = JSON.parse(readFileSync("tests/e2e/.local/runtime.json", "utf8"));
localOnly(runtime.api, 54321);
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  repeatEach: 2,
  timeout: 90000,
  expect: { timeout: 15000 },
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["junit", { outputFile: "test-results/e2e.xml" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    acceptDownloads: true,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bun --no-env-file run dev --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173/login",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      VITE_SUPABASE_URL: runtime.api,
      VITE_SUPABASE_PUBLISHABLE_KEY: runtime.anonKey,
      SUPABASE_URL: runtime.api,
      SUPABASE_PUBLISHABLE_KEY: runtime.anonKey,
      SUPABASE_PROJECT_ID: "uyuni-quote-e2e",
      VITE_SUPABASE_PROJECT_ID: "uyuni-quote-e2e",
    },
  },
});
