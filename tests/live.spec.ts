import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import { IMG, fillDetails, pickSlot, trackErrors } from "./helpers";

/**
 * Production-mode tests: real Supabase (database, auth, storage) and stand-in
 * email/WhatsApp providers that record every request (tests/mock-providers.mjs).
 * Run with LIVE=1 after building with the Supabase env into .next-supa.
 */
test.describe.configure({ mode: "serial" });

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });
const anon = createClient(URL_, ANON, { auth: { persistSession: false } });
const STAFF = { email: "admin@example.com", password: "test-password-123" };

type MockReq = { url: string; body: { to: string | string[]; subject?: string; template?: { name: string; components: { parameters: { text: string }[] }[] } } };
const mock = {
  reset: () => fetch("http://localhost:4010/__requests", { method: "DELETE" }),
  all: async (): Promise<MockReq[]> => (await fetch("http://localhost:4010/__requests")).json(),
  emails: async () => (await mock.all()).filter((r) => !r.url.startsWith("/wa/")),
  whatsapp: async () => (await mock.all()).filter((r) => r.url.startsWith("/wa/")),
};

async function staffLogin(page: Page, tab = "appointments") {
  await page.goto(`/admin#${tab}`);
  const email = page.getByLabel("Email");
  await expect(email.or(page.locator("[data-admin-panel]"))).toBeVisible();
  if (await email.isVisible()) {
    await email.fill(STAFF.email);
    await page.getByLabel("Password").fill(STAFF.password);
    await page.getByRole("button", { name: "Sign in" }).click();
  }
  await expect(page.locator(`[data-admin-panel="${tab}"]`)).toBeVisible({ timeout: 15_000 });
}

test.beforeAll(async () => {
  await admin.from("bookings").delete().neq("reference", "");
  await mock.reset();
});

test("security: anonymous visitors cannot read or write private data", async () => {
  expect((await anon.from("bookings").select("*")).data).toEqual([]);
  expect((await anon.from("journeys").select("*")).data).toEqual([]);
  const ins = await anon.from("bookings").insert({ reference: "X", treatment_id: "t", treatment_name: "t", doctor_id: "main", date: "2030-01-01", time: "11:00", patient_name: "Evil", phone: "1", contact_method: "email", consent: {} });
  expect(ins.error?.code).toBe("42501");
  const upd = await anon.from("procedures").update({ active: false }).eq("slug", "botox").select();
  expect(upd.data ?? []).toEqual([]);
  const up = await anon.storage.from("media").upload("hack/x.png", new Blob(["x"], { type: "image/png" }));
  expect(up.error).toBeTruthy();
  const draft = await admin.from("posts").upsert({ id: "post-draft-test", slug: "secret-draft", data: { title: "Secret" }, status: "draft" });
  expect(draft.error).toBeNull();
  expect((await anon.from("posts").select("id").eq("slug", "secret-draft")).data).toEqual([]);
});

test("staff auth: wrong password, non-staff account and real login", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Email").fill(STAFF.email);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("#pw-err")).toContainText("Incorrect email or password");

  const outsider = `outsider-${Date.now()}@example.com`;
  await admin.auth.admin.createUser({ email: outsider, password: "outsider-pass-123", email_confirm: true });
  await page.getByLabel("Email").fill(outsider);
  await page.getByLabel("Password").fill("outsider-pass-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "No admin access" })).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();

  await staffLogin(page);
});

test("admin sets the clinic alert email (saved to the database)", async ({ page }) => {
  await staffLogin(page, "contact");
  await page.getByLabel("Email for new-booking alerts").fill("frontdesk@example.com");
  await page.getByLabel("WhatsApp number").fill("0300 7654321");
  await page.getByTestId("save-content").click();
  await expect(page.getByText("All changes saved.")).toBeVisible();
  const { data } = await admin.from("site_config").select("data").eq("key", "content").single();
  expect(data!.data.contact.bookingAlertEmail).toBe("frontdesk@example.com");
  expect(data!.data.contact.whatsapp).toBe("923007654321");
});

let bookedRef = "";
let bookedSlot = { date: "", time: "" };

test("patient books online: stored in DB, confirmation email + WhatsApp sent, clinic alerted", async ({ page }) => {
  const errors = trackErrors(page);
  await mock.reset();
  bookedSlot = await pickSlot(page, "hydrafacial", 1);
  await fillDetails(page, { name: "Ayesha Live", email: "ayesha@example.com" });
  await page.getByTestId("confirm").click();
  await expect(page.getByTestId("confirmation")).toBeVisible();
  bookedRef = (await page.getByTestId("reference").textContent())!;
  await expect(page.getByTestId("notification-status")).toContainText("Email confirmation sent to ayesha@example.com");
  await expect(page.getByTestId("notification-status")).toContainText("WhatsApp confirmation sent");

  const { data } = await admin.from("bookings").select("*").eq("reference", bookedRef).single();
  expect(data).toMatchObject({ patient_name: "Ayesha Live", phone: "+92 300 1234567", email: "ayesha@example.com", status: "pending", date: bookedSlot.date, time: bookedSlot.time });
  expect(data!.consent.given).toBe(true);

  const emails = await mock.emails();
  expect(emails.map((e) => e.body.to).flat()).toEqual(expect.arrayContaining(["ayesha@example.com", "frontdesk@example.com"]));
  expect(emails.find((e) => (e.body.to as string[]).includes("frontdesk@example.com"))!.body.subject).toContain("New appointment request: Ayesha Live");
  const wa = await mock.whatsapp();
  expect(wa.map((w) => w.body.template!.name).sort()).toEqual(["appointment_received", "new_booking_alert"]);
  expect(wa.find((w) => w.body.to === "923001234567")!.body.template!.components[0].parameters.map((p) => p.text)).toEqual(
    expect.arrayContaining(["Ayesha", "HydraFacial", bookedRef]),
  );
  expect(errors).toEqual([]);
});

test("double booking is impossible: UI hides the slot and the API refuses it", async ({ page, request }) => {
  await page.goto("/book?treatment=hydrafacial");
  await page.locator(`[data-date="${bookedSlot.date}"]`).click();
  await expect(page.locator(`[data-testid=time-grid] [data-time="${bookedSlot.time}"]`)).toHaveAttribute("data-state", "booked");
  const res = await request.post("/api/bookings", {
    data: { treatmentId: "t-hydrafacial", doctorId: "main", ...bookedSlot, patientName: "Racer", phone: "03001112222", email: "r@example.com", contactMethod: "email", consent: true },
  });
  expect(res.status()).toBe(409);
});

test("admin accepts, reschedules and cancels: patient notified each time", async ({ page }) => {
  await mock.reset();
  await staffLogin(page);
  await page.getByRole("button", { name: "all", exact: true }).click();
  await page.getByLabel("Search appointments").fill(bookedRef);
  const row = page.locator(`[data-ref="${bookedRef}"]`);
  await row.getByRole("button", { name: /^Accept/ }).click();
  await expect(page.getByTestId("notification-log").first()).toContainText("sent");
  await page.getByRole("button", { name: "Done" }).click();
  await expect(row.locator("[data-status]")).toHaveText("Accepted");
  expect((await mock.emails()).some((e) => e.body.subject?.startsWith(`Appointment confirmed – ${bookedRef}`))).toBe(true);
  expect((await mock.whatsapp()).some((w) => w.body.template!.name === "appointment_confirmed")).toBe(true);

  await row.getByRole("button", { name: /^Reschedule/ }).click();
  const dlg = page.getByRole("dialog", { name: "Reschedule appointment" });
  await dlg.locator("[data-testid=day-strip] button:not([disabled])").nth(3).click();
  await dlg.locator("[data-testid=time-grid] button[data-state=available]").first().click();
  await dlg.getByRole("button", { name: "Save new time" }).click();
  await expect(page.getByRole("dialog", { name: /Rescheduled/ })).toContainText("sent");
  await page.getByRole("button", { name: "Done" }).click();
  expect((await mock.emails()).some((e) => e.body.subject?.startsWith(`Appointment rescheduled – ${bookedRef}`))).toBe(true);

  await row.getByRole("button", { name: /^Cancel/ }).click();
  await page.getByRole("button", { name: "Cancel appointment" }).click();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(row.locator("[data-status]")).toHaveText("Cancelled");
  const { data } = await admin.from("bookings").select("status,history,notifications").eq("reference", bookedRef).single();
  expect(data!.status).toBe("cancelled");
  expect(data!.history.map((h: { action: string }) => h.action)).toEqual(["created", "confirmed", "rescheduled", "cancelled"]);
  expect(data!.notifications.filter((n: { status: string }) => n.status === "sent").length).toBeGreaterThanOrEqual(6);
});

test("reject frees the slot and tells the patient why", async ({ page }) => {
  const slot = await pickSlot(page, "skin-consultation", 2);
  await fillDetails(page, { name: "Reject Live", email: "reject@example.com" });
  await page.getByTestId("confirm").click();
  const ref = (await page.getByTestId("reference").textContent())!;
  await mock.reset();
  await staffLogin(page);
  await page.getByRole("button", { name: "all", exact: true }).click();
  await page.getByLabel("Search appointments").fill(ref);
  await page.locator(`[data-ref="${ref}"]`).getByRole("button", { name: /^Reject/ }).click();
  await page.getByLabel(/Message to the patient/).fill("The doctor is at a conference that day.");
  await page.getByRole("button", { name: "Reject request" }).click();
  await page.getByRole("button", { name: "Done" }).click();
  const mail = (await mock.emails()).find((e) => (e.body.to as string[]).includes("reject@example.com"))!;
  expect(mail.body.subject).toContain(ref);
  expect(JSON.stringify(mail.body)).toContain("The doctor is at a conference that day.");
  await page.goto("/book?treatment=skin-consultation");
  await page.locator(`[data-date="${slot.date}"]`).click();
  await expect(page.locator(`[data-testid=time-grid] [data-time="${slot.time}"]`)).toHaveAttribute("data-state", "available");
});

test("price edit in admin updates the server-rendered public pages", async ({ page }) => {
  await staffLogin(page, "procedures");
  const row = page.locator('[data-slug="microneedling"]');
  await row.getByRole("button", { name: /Price/ }).click();
  await page.locator("#p-amount").fill("8800");
  await page.getByTestId("save-price").click();
  await expect(row.getByTestId("admin-price")).toContainText("8,800");
  await expect
    .poll(async () => {
      const html = await (await page.request.get("/treatments/microneedling")).text();
      return html.includes("PKR 8,800");
    }, { timeout: 20_000 })
    .toBe(true);
  await page.goto("/pricing");
  await expect(page.locator("[data-price-item=microneedling]")).toContainText("8,800");
});

test("doctor photo upload goes to Supabase Storage and appears on the homepage", async ({ page }) => {
  await staffLogin(page, "doctor");
  await page.getByTestId("doctor-photo").setInputFiles(IMG("p-consultation.jpg"));
  await expect(page.getByRole("button", { name: "Remove" })).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("save-content").click();
  await expect(page.getByText("All changes saved.")).toBeVisible();
  const { data } = await admin.from("site_config").select("data").eq("key", "content").single();
  const photo: string = data!.data.doctor.photo;
  expect(photo).toMatch(/\/storage\/v1\/object\/public\/media\/doctor\/.+\.webp$/);
  expect((await fetch(photo)).status).toBe(200);
  await expect
    .poll(async () => {
      await page.goto("/");
      return page.getByTestId("doctor-portrait").locator("img").getAttribute("src");
    }, { timeout: 20_000 })
    .toContain("/_next/image?url=");
});

test("gallery: database refuses publishing without consent; consented item is public", async ({ page }) => {
  const bad = await admin.from("gallery").insert({ id: "g-bad", data: {}, published: true, consent_confirmed: false });
  expect(bad.error?.message).toContain("gallery_consent_required");
  await staffLogin(page, "gallery");
  await page.getByRole("button", { name: "Add result" }).click();
  const dlg = page.getByRole("dialog");
  await dlg.getByLabel("Title").fill("Live consented result");
  await dlg.getByTestId("gallery-before").setInputFiles(IMG("c-acne.jpg"));
  await dlg.getByTestId("gallery-after").setInputFiles(IMG("p-skin-rejuvenation.jpg"));
  await expect(dlg.getByRole("button", { name: "Remove" })).toHaveCount(2, { timeout: 15_000 });
  await dlg.getByTestId("gallery-consent").check();
  await dlg.getByTestId("gallery-publish").click();
  await dlg.getByRole("button", { name: "Save" }).click();
  await expect(page.locator('[data-gallery-admin="Live consented result"]')).toContainText("Published");
  expect((await anon.from("gallery").select("id").eq("published", true)).data!.length).toBeGreaterThanOrEqual(4);
});
