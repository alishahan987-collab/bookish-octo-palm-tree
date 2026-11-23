import { defineConfig, devices } from "@playwright/test";

/**
 * Two test targets:
 *   demo  – the self-contained browser demo (no backend)       → port 3100
 *   live  – production mode against Supabase + mock providers  → port 3200 (set LIVE=1)
 * Build first:  npm run build            (demo, .next)
 *               NEXT_DIST_DIR=.next-supa npm run build  with Supabase env (live)
 */
const live = process.env.LIVE === "1";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  reporter: [["list"]],
  use: {
    trace: "off",
    contextOptions: { reducedMotion: (process.env.MOTION as "reduce" | "no-preference") ?? "no-preference" },
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "demo-mobile", testMatch: /site\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:3100", viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
    { name: "demo-desktop", testMatch: /(site|admin)\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:3100", viewport: { width: 1366, height: 900 } } },
    ...(live ? [{ name: "live", testMatch: /live\.spec\.ts/, fullyParallel: false, use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:3200", viewport: { width: 1366, height: 900 } } }] : []),
  ],
  webServer: [
    { command: "npx next start -p 3100", url: "http://localhost:3100", reuseExistingServer: true, timeout: 60_000, env: { NEXT_DIST_DIR: ".next" } },
    ...(live
      ? [
          { command: "node tests/mock-providers.mjs", url: "http://localhost:4010/__requests", reuseExistingServer: true },
          { command: "npx next start -p 3200", url: "http://localhost:3200", reuseExistingServer: true, timeout: 60_000, env: { NEXT_DIST_DIR: ".next-supa" } },
        ]
      : []),
  ],
});
