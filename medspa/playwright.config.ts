import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

/**
 * Default: local file store (no external services).
 * LIVE=1: real local Supabase (see README → Tests); set the Supabase env vars first.
 * Emails go to a stand-in Resend server that records them, so content can be checked.
 */
const live = process.env.LIVE === "1";
const port = live ? 3300 : 3200;
const env = {
  RESEND_API_URL: "http://127.0.0.1:4010/emails",
  RESEND_API_KEY: "test-key",
  EMAIL_FROM: "MEDSPA Test <test@example.com>",
  NEXT_PUBLIC_SITE_URL: `http://localhost:${port}`,
  DISABLE_RATE_LIMIT: "1",
  INSECURE_COOKIES: "1",
  ...(live
    ? { NEXT_DIST_DIR: ".next-live" }
    : { DATA_DIR: ".data-test", ADMIN_EMAIL: "admin@test.local", ADMIN_PASSWORD: "test-password-123", ADMIN_SESSION_SECRET: "test-secret", NEXT_DIST_DIR: ".next-test", SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_URL: "", SUPABASE_SERVICE_ROLE_KEY: "" }),
};

export default defineConfig({
  testDir: "tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${port}`, trace: "off", launchOptions: { executablePath: process.env.PW_CHROMIUM || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined) } },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    { command: "node tests/mock-resend.mjs", port: 4010, reuseExistingServer: true },
    {
      command: live ? `npx next build && npx next start -p ${port}` : `rm -rf .data-test && npx next build && npx next start -p ${port}`,
      port,
      timeout: 300_000,
      reuseExistingServer: false,
      env,
    },
  ],
});
