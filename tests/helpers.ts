import { expect, type Page } from "@playwright/test";

export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource.*(favicon|google)/i.test(m.text())) errors.push(`console: ${m.text()}`);
  });
  return errors;
}

export async function demoLogin(page: Page, tab?: string) {
  await page.goto(`/admin${tab ? `#${tab}` : ""}`);
  const pw = page.getByLabel("Password");
  await expect(pw.or(page.locator("[data-admin-panel]"))).toBeVisible();
  if (await pw.isVisible()) {
    await pw.fill("demo1234");
    await page.getByRole("button", { name: "Sign in" }).click();
  }
  await expect(page.locator("[data-admin-panel]")).toBeVisible();
  if (tab) await expect(page.locator(`[data-admin-panel="${tab}"]`)).toBeVisible();
}

/** Walks the booking flow to the details step. Returns the chosen slot. */
export async function pickSlot(page: Page, slug = "hydrafacial", dayIndex = 1) {
  await page.goto(`/book?treatment=${slug}`);
  await expect(page.getByRole("heading", { name: "Pick a date and time" })).toBeVisible();
  const day = page.locator("[data-testid=day-strip] button:not([disabled])").nth(dayIndex);
  const date = (await day.getAttribute("data-date"))!;
  await day.click();
  const slot = page.locator("[data-testid=time-grid] button[data-state=available]").first();
  const time = (await slot.getAttribute("data-time"))!;
  await slot.click();
  return { date, time };
}

export async function fillDetails(page: Page, opts: { name?: string; email?: string } = {}) {
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByLabel("Full name").fill(opts.name ?? "Test Patient");
  await page.getByLabel("Phone number").fill("0300-1234567");
  await page.getByRole("textbox", { name: /Email address/ }).fill(opts.email ?? "patient@example.com");
  await page.locator("#f-consent").check();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByTestId("review")).toBeVisible();
}

export const IMG = (name: string) => `public/images/${name}`;
