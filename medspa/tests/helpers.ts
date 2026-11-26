import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || "admin@test.local",
  password: process.env.TEST_ADMIN_PASSWORD || "test-password-123",
};

export async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

export interface Email { to: string[]; subject: string; text: string; html: string }
export const emails = async (): Promise<Email[]> => (await fetch("http://127.0.0.1:4010/emails")).json();
export const clearEmails = () => fetch("http://127.0.0.1:4010/emails", { method: "DELETE" });

/** First available slot for a treatment, skipping the first `skip` open days. */
export async function nextOpenSlot(request: APIRequestContext, treatmentId: string, skip = 0) {
  const r = await (await request.get(`/api/availability?treatment=${treatmentId}`)).json();
  const days = r.days.filter((d: { open: boolean; available: number }) => d.open && d.available > 0);
  const day = days[skip];
  const slot = day.slots.find((s: { state: string }) => s.state === "available");
  return { date: day.date as string, time: slot.time as string };
}

export async function save(page: Page) {
  await page.getByTestId("save").click();
  await expect(page.getByText("All changes saved.")).toBeVisible();
}
