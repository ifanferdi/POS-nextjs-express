import { defineConfig } from "@playwright/test";

/**
 * E2E workspace for POS app + API.
 * UI tests target the deployed app; API tests target the deployed backend.
 * Override via env: E2E_APP_URL, E2E_API_URL, E2E_USERNAME, E2E_PASSWORD.
 */
const APP_URL = process.env.E2E_APP_URL ?? "https://pos-app-ifan.vercel.app";
// Tanpa trailing slash, ".../api" diperlakukan sebagai file oleh URL
// resolution dan segment /api hilang saat path relatif digabung.
const API_URL = (process.env.E2E_API_URL ?? "https://pos-ifan.duckdns.org/api").replace(/\/$/, "") + "/";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1, // shared deployed backend + CRUD cleanup: keep serial
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: APP_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "ui",
      testMatch: /ui\/.*\.spec\.ts/,
    },
    {
      name: "api",
      testMatch: /api\/.*\.spec\.ts/,
      use: { baseURL: API_URL || undefined },
    },
  ],
});
