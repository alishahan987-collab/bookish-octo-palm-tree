import { expect, test, type Page } from "@playwright/test";

/* -------------------------------- helpers -------------------------------- */

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  return errors;
}

async function loginAdmin(page: Page, tab?: string) {
  await page.goto(`/admin${tab ? `#${tab}` : ""}`);
  const pw = page.getByLabel("Password");
  await expect(pw.or(page.getByRole("tablist"))).toBeVisible();
  if (await pw.isVisible()) {
    await pw.fill("demo1234");
    await page.getByRole("button", { name: "Sign in" }).click();
  }
  await expect(page.getByRole("tablist")).toBeVisible();
  if (tab) await page.getByRole("tab", { name: new RegExp(tab === "treatments" ? "Treatments" : tab === "settings" ? "Clinic settings" : tab, "i") }).click();
}

/** Walk the booking flow up to the details step; returns chosen date/time. */
async function pickSlot(page: Page, slug = "hydrafacial", dayIndex = 1) {
  await page.goto(`/book?treatment=${slug}`);
  await expect(page.getByRole("heading", { name: "Choose your doctor" })).toBeVisible();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByRole("heading", { name: "Pick a date and time" })).toBeVisible();
  const day = page.locator("[data-testid=day-strip] button:not([disabled])").nth(dayIndex);
  const date = (await day.getAttribute("data-date"))!;
  await day.click();
  const slot = page.locator("[data-testid=time-grid] button[data-state=available]").first();
  const time = (await slot.getAttribute("data-time"))!;
  await slot.click();
  return { date, time };
}

async function fillDetailsAndConfirm(page: Page) {
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByLabel("Full name").fill("Test Patient");
  await page.getByLabel("Mobile number").fill("0300-1234567");
  await page.locator("#f-consent").check();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByTestId("review")).toBeVisible();
  await page.getByTestId("confirm").click();
}

/* --------------------------------- tests --------------------------------- */

test("1. full booking flow with validation, reference and message preview", async ({ page }) => {
  const errors = trackErrors(page);
  const { date, time } = await pickSlot(page);
  await page.getByRole("button", { name: /Continue/ }).click();

  // validation
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("Please enter your full name.")).toBeVisible();
  await page.getByLabel("Mobile number").fill("12345");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText(/Enter a Pakistani mobile number/)).toBeVisible();
  await expect(page.getByText(/Please tick to agree/)).toBeVisible();

  // email required when "Both" chosen
  await page.getByLabel("Full name").fill("Test Patient");
  await page.getByLabel("Mobile number").fill("+92 300 1234567");
  await page.getByText("Both", { exact: true }).click();
  await page.locator("#f-consent").check();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText(/Add an email address/)).toBeVisible();
  await page.getByRole("textbox", { name: "Email" }).fill("test@example.com");
  await page.getByRole("button", { name: /Continue/ }).click();

  await expect(page.getByTestId("review")).toContainText("HydraFacial");
  await page.getByTestId("confirm").click();

  await expect(page.getByTestId("confirmation")).toBeVisible();
  await expect(page.getByTestId("reference")).toHaveText(/^AES-\d{4}-\d{4}$/);
  const preview = page.getByTestId("message-preview");
  await expect(preview).toContainText("Preview only");
  await expect(preview).toContainText("WhatsApp");
  await expect(preview).toContainText("Email");

  // the new booking appears in the admin
  const ref = await page.getByTestId("reference").textContent();
  await loginAdmin(page);
  await page.getByRole("button", { name: "all", exact: true }).click();
  await page.getByLabel("Search appointments").fill(ref!);
  await expect(page.locator(`[data-ref="${ref}"]`)).toContainText("Test Patient");
  expect(date && time).toBeTruthy();
  expect(errors).toEqual([]);
});

test("2. a booked slot cannot be booked again", async ({ page, context }) => {
  const { date, time } = await pickSlot(page);
  await fillDetailsAndConfirm(page);
  await expect(page.getByTestId("confirmation")).toBeVisible();

  // Re-open booking: the slot is disabled
  await page.goto("/book?treatment=hydrafacial");
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.locator(`[data-date="${date}"]`).click();
  const slot = page.locator(`[data-testid=time-grid] [data-time="${time}"]`);
  await expect(slot).toHaveAttribute("data-state", "booked");
  await expect(slot).toBeDisabled();

  // Race: two tabs pick the same slot; the second confirm is rejected.
  const a = await context.newPage();
  const b = await context.newPage();
  const sa = await pickSlot(a, "skin-consultation", 2);
  await b.goto("/book?treatment=skin-consultation");
  await b.getByRole("button", { name: /Continue/ }).click();
  await b.locator(`[data-date="${sa.date}"]`).click();
  await b.locator(`[data-testid=time-grid] [data-time="${sa.time}"]`).click();
  await fillDetailsAndConfirm(a);
  await expect(a.getByTestId("confirmation")).toBeVisible();
  // Tab b's picker updates live (storage event) and drops the taken slot
  await expect(b.locator(`[data-testid=time-grid] [data-time="${sa.time}"]`)).toHaveAttribute("data-state", "booked");
  await expect(b.getByRole("button", { name: /Continue/ })).toBeDisabled();
});

test("3. price edits in admin show on treatment page and homepage offers", async ({ page }) => {
  await loginAdmin(page, "treatments");
  const row = page.locator('[data-slug="hydrafacial"]');
  await row.getByRole("button", { name: /Edit price/ }).click();
  await page.getByLabel("Promotional price (PKR)").fill("7777");
  await page.getByTestId("save-price").click();
  await expect(row.getByTestId("admin-price")).toContainText("7,777");
  await expect(row).toContainText("Demo price");

  await page.goto("/treatments/hydrafacial");
  await expect(page.getByTestId("price-block")).toContainText("PKR 7,777");

  await page.goto("/#offers");
  await expect(page.getByTestId("offer-hydrafacial").getByTestId("offer-price")).toHaveText("PKR 7,777");

  // switching to a non-promo type removes it from offers
  await loginAdmin(page, "treatments");
  await page.locator('[data-slug="hydrafacial"]').getByRole("button", { name: /Edit price/ }).click();
  await page.getByText("Fixed price", { exact: true }).click();
  await page.getByLabel("Price (PKR)").fill("11000");
  await page.getByTestId("save-price").click();
  await page.goto("/");
  await expect(page.locator("#offers")).toBeVisible();
  await expect(page.getByTestId("offer-hydrafacial")).toHaveCount(0);
  await expect(page.getByTestId("offer-carbon-laser-peel")).toBeVisible();
});

test("4. settings: closed weekday and holiday remove those slots", async ({ page }) => {
  await page.goto("/book?treatment=hydrafacial");
  await page.getByRole("button", { name: /Continue/ }).click();
  const days = page.locator("[data-testid=day-strip] button:not([disabled])");
  const closeDate = (await days.nth(2).getAttribute("data-date"))!;
  const holidayDate = (await days.nth(4).getAttribute("data-date"))!;
  const weekday = new Date(`${closeDate}T12:00:00`).getDay();

  await loginAdmin(page, "settings");
  await page.locator(`button[data-day="${weekday}"]`).click();
  await page.getByLabel("Date", { exact: true }).fill(holidayDate);
  await page.getByLabel("Reason").fill("Eid holiday");
  await page.getByRole("button", { name: "Add holiday" }).click();
  await page.getByTestId("save-settings").click();
  await expect(page.getByText("All changes saved.")).toBeVisible();
  await expect(page.locator(`[data-testid=availability-preview] [data-date="${closeDate}"]`)).toHaveAttribute("data-open", "false");

  await page.goto("/book?treatment=hydrafacial");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.locator(`[data-testid=day-strip] [data-date="${closeDate}"]`)).toBeDisabled();
  const hol = page.locator(`[data-testid=day-strip] [data-date="${holidayDate}"]`);
  await expect(hol).toBeDisabled();
  await expect(hol).toContainText("Holiday");

  // every date on that weekday is closed
  for (const btn of await page.locator("[data-testid=day-strip] button").all()) {
    const d = (await btn.getAttribute("data-date"))!;
    if (new Date(`${d}T12:00:00`).getDay() === weekday) await expect(btn).toBeDisabled();
  }
});

test("5a. every internal link resolves and pages have no console errors", async ({ page }) => {
  const errors = trackErrors(page);
  const pages = ["/", "/treatments", "/skin-finder", "/book", "/admin"];
  const seen = new Set<string>();
  for (const p of pages) {
    await page.goto(p);
    const hrefs = await page.locator("a[href^='/']").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!));
    hrefs.forEach((h) => seen.add(h.split("#")[0] || "/"));
  }
  for (const href of seen) {
    const res = await page.request.get(href);
    expect(res.status(), href).toBeLessThan(400);
  }
  for (const href of seen) {
    await page.goto(href);
    await expect(page.locator("h1").first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("5b. treatments filter, treatment page and skin finder", async ({ page }) => {
  await page.goto("/treatments");
  await page.getByRole("button", { name: /^Laser/ }).click();
  await expect(page).toHaveURL(/category=laser/);
  await expect(page.locator("main article")).toHaveCount(2);
  await page.getByRole("link", { name: "Carbon Laser Peel" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Carbon Laser Peel");
  for (const h of ["How it works", "Benefits", "Who it may suit", "Downtime & sessions", "Possible side effects", "Frequently asked questions"])
    await expect(page.getByRole("heading", { name: h })).toBeVisible();

  await page.goto("/treatments/prp-hair-treatment");
  await expect(page.getByTestId("price-block")).toContainText("3 sessions");
  await expect(page.getByTestId("price-block")).toContainText("PKR 32,000");

  await page.goto("/skin-finder");
  await expect(page.getByText("This is not a diagnosis.")).toBeVisible();
  await page.getByText("Hair loss", { exact: true }).click();
  await page.getByTestId("show-results").click();
  await expect(page.getByTestId("finder-results")).toContainText("PRP Hair Treatment");
  await page.getByRole("link", { name: /Book a consultation/ }).click();
  await expect(page.getByRole("heading", { name: "Choose your doctor" })).toBeVisible();
});

test("5c. admin: confirm, cancel and reschedule with notification previews", async ({ page }) => {
  await loginAdmin(page);
  await page.getByRole("button", { name: "upcoming", exact: true }).click();
  await page.getByLabel("Status").selectOption("pending");
  const first = page.locator("[data-testid=appointment-list] > li").first();
  const ref = (await first.getAttribute("data-ref"))!;
  await first.getByRole("button", { name: /^Confirm/ }).click();
  await page.getByLabel("Status").selectOption("");
  const row = page.locator(`[data-ref="${ref}"]`);
  await expect(row.locator("[data-status]")).toHaveText("Confirmed");

  await row.getByRole("button", { name: /^Reschedule/ }).click();
  const dlg = page.getByRole("dialog");
  await dlg.locator("[data-testid=day-strip] button:not([disabled])").nth(3).click();
  await dlg.locator("[data-testid=time-grid] button[data-state=available]").first().click();
  await dlg.getByRole("button", { name: "Save new time" }).click();
  await expect(page.getByRole("dialog", { name: "Reschedule notice preview" })).toContainText("Preview only");
  await page.getByRole("button", { name: "Done" }).click();

  await row.getByRole("button", { name: /^Cancel/ }).click();
  await page.getByRole("button", { name: "Cancel appointment" }).click();
  await expect(page.getByRole("dialog", { name: "Cancellation notice preview" })).toContainText("has been cancelled");
  await page.getByRole("button", { name: "Done" }).click();
  await expect(row.locator("[data-status]")).toHaveText("Cancelled");
});

test("5d. admin: add treatment, journey, reset demo data", async ({ page }) => {
  await loginAdmin(page, "treatments");
  await page.getByRole("button", { name: "Add treatment" }).click();
  await page.getByLabel("Name *").fill("Microneedling");
  await page.getByLabel("Short description (cards) *").fill("Collagen induction treatment (demo).");
  await page.getByRole("dialog").getByText("Starting from", { exact: true }).click();
  await page.getByLabel("Starting price (PKR)").fill("8000");
  await page.getByRole("dialog").getByRole("button", { name: "Add treatment" }).click();
  await expect(page.locator('[data-slug="microneedling"]')).toBeVisible();
  await page.goto("/treatments/microneedling");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Microneedling");
  await expect(page.getByTestId("price-block")).toContainText("PKR 8,000");

  await loginAdmin(page, "journeys");
  await page.getByRole("button", { name: "New journey" }).click();
  await page.getByLabel("Patient").fill("Sana Mir");
  await page.getByLabel("Treatment", { exact: true }).selectOption({ label: "Laser Hair Removal" });
  await page.getByRole("button", { name: "Create journey" }).click();
  const card = page.locator('[data-patient="Sana Mir"]');
  await expect(card).toContainText("Week 25");
  await card.getByRole("checkbox").first().click();
  await expect(card).toContainText("1 of 6 steps complete");

  await page.getByRole("button", { name: /Reset demo data/ }).click();
  await page.getByRole("button", { name: "Reset data" }).click();
  await expect(page.locator('[data-patient="Sana Mir"]')).toHaveCount(0);
  await page.goto("/treatments/microneedling");
  await expect(page.getByText("This treatment is not available")).toBeVisible();
});

test("banner and noindex on every page", async ({ page }) => {
  for (const p of ["/", "/treatments", "/treatments/hydrafacial", "/book", "/skin-finder", "/admin"]) {
    await page.goto(p);
    await expect(page.getByText("Design preview prepared for Aesthetica by Dr. Sajjad. Not the official website.")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
});
