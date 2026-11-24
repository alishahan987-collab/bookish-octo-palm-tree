import { expect, test } from "@playwright/test";
import { IMG, demoLogin, fillDetails, pickSlot } from "./helpers";

test("login: wrong password rejected, demo password accepted", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Password").fill("nope");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("#pw-err")).toContainText("Incorrect password");
  await page.getByLabel("Password").fill("demo1234");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("[data-admin-panel=appointments]")).toBeVisible();
});

test("doctor profile: photo upload, name, designation, credentials appear on site", async ({ page }) => {
  await demoLogin(page, "doctor");
  await page.getByTestId("doctor-photo").setInputFiles(IMG("p-consultation.jpg"));
  await expect(page.getByRole("button", { name: "Remove" })).toBeVisible();
  await page.getByLabel("Full name").fill("Dr. Test Doctor");
  await page.getByLabel("Professional designation").fill("Consultant Dermatologist");
  await page.getByLabel("Qualifications").fill("MBBS\nFCPS (Dermatology)");
  await page.getByLabel("Biography (About page)").fill("Biography written in the admin.");
  await page.getByTestId("save-content").click();
  await expect(page.getByText("All changes saved.")).toBeVisible();

  await page.goto("/");
  await expect(page.getByTestId("doctor-portrait").locator("img")).toHaveAttribute("src", /^blob:/);
  await expect(page.getByText("Dr. Test Doctor").first()).toBeVisible();
  await expect(page.getByText("Consultant Dermatologist").first()).toBeVisible();
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Dr. Test Doctor");
  await expect(page.getByText("FCPS (Dermatology)")).toBeVisible();
  await expect(page.getByText("Biography written in the admin.")).toBeVisible();
});

test("homepage editing: hero text, hide a section, reorder, announcement, logo", async ({ page }) => {
  await demoLogin(page, "site");
  await page.getByLabel("Main heading").fill("Your skin, in expert hands.");
  await page.getByLabel("Highlighted words (gold, italic)").fill("Always.");
  await page.getByTestId("visible-pricing").click();
  await page.getByRole("button", { name: "Move FAQ up" }).click();
  await page.getByTestId("announcement-toggle").click();
  await page.getByLabel("Message").fill("Winter offers are live.");
  await page.getByTestId("save-content").click();
  await expect(page.getByText("All changes saved.")).toBeVisible();

  await demoLogin(page, "appearance");
  await page.getByTestId("logo-upload").setInputFiles(IMG("s-serum.jpg"));
  await expect(page.getByRole("button", { name: "Remove" })).toBeVisible();
  await page.locator("[data-preset=rose]").click();
  await page.getByTestId("save-content").click();
  await expect(page.getByText("All changes saved.")).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your skin, in expert hands. Always.");
  await expect(page.locator("[data-section=pricing]")).toHaveCount(0);
  await expect(page.getByText("Winter offers are live.")).toBeVisible();
  const order = await page.locator("[data-section]").evaluateAll((els) => els.map((e) => e.getAttribute("data-section")));
  expect(order.indexOf("faq")).toBeLessThan(order.indexOf("cta"));
  await expect(page.getByRole("link", { name: /home$/i }).first().locator("img")).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--color-gold").trim())).toBe("#8c4f45");
});

test("procedures: edit price & discount, add new procedure with image", async ({ page }) => {
  await demoLogin(page, "procedures");
  const row = page.locator('[data-slug="botox"]');
  await row.getByRole("button", { name: /Price/ }).click();
  await page.getByRole("dialog").getByText("Discounted price", { exact: true }).click();
  await page.locator("#p-regular").fill("30000");
  await page.locator("#p-promo").fill("24000");
  await page.getByLabel("Discount label").fill("Launch offer");
  await page.getByTestId("save-price").click();
  await expect(row.getByTestId("admin-price")).toContainText("24,000");

  await page.getByRole("button", { name: "Add procedure" }).click();
  const dlg = page.getByRole("dialog");
  await dlg.getByLabel("Name *").fill("Tattoo Removal");
  await dlg.getByLabel("Short description *").fill("Laser treatment to fade unwanted tattoos.");
  await dlg.getByLabel("Procedure overview").fill("Overview text.");
  await dlg.getByTestId("procedure-image").setInputFiles(IMG("p-laser-rejuvenation.jpg"));
  await expect(dlg.getByRole("button", { name: "Remove" })).toBeVisible();
  await dlg.getByLabel("Number of sessions").fill("6–10 sessions");
  await dlg.getByRole("button", { name: "Add procedure" }).click();
  await expect(page.locator('[data-slug="tattoo-removal"]')).toBeVisible();

  await page.goto("/treatments/botox");
  await expect(page.getByTestId("price-block")).toContainText("PKR 24,000");
  await expect(page.getByTestId("price-block")).toContainText("Launch offer");
  await page.goto("/pricing");
  await expect(page.locator("[data-price-item=botox]")).toContainText("24,000");
  await page.goto("/treatments/tattoo-removal");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tattoo Removal");
  await expect(page.getByText("6–10 sessions").first()).toBeVisible();
  await page.goto("/search?q=tattoo");
  await expect(page.getByTestId("search-page-results")).toContainText("Tattoo Removal");
});

test("conditions: add a new condition with its page", async ({ page }) => {
  await demoLogin(page, "conditions");
  await page.getByRole("button", { name: "Add condition" }).click();
  const dlg = page.getByRole("dialog");
  await dlg.getByLabel("Name *").fill("Keratosis Pilaris");
  await dlg.getByLabel("Short description (card)").fill("Small rough bumps, often on the upper arms.");
  await dlg.getByLabel("1. What is the condition?").fill("A common harmless condition.");
  await dlg.getByLabel("2. Common symptoms").fill("Rough bumps\nDry skin");
  await dlg.getByTestId("condition-image").setInputFiles(IMG("c-eczema.jpg"));
  await dlg.getByRole("button", { name: "Add condition" }).click();
  await expect(page.locator('[data-slug="keratosis-pilaris"]')).toBeVisible();
  await page.goto("/conditions/keratosis-pilaris");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Keratosis Pilaris");
  await expect(page.getByText("Rough bumps", { exact: true })).toBeVisible();
});

test("gallery: upload before/after, consent required to publish, edit and delete", async ({ page }) => {
  await demoLogin(page, "gallery");
  await page.getByRole("button", { name: "Add result" }).click();
  const dlg = page.getByRole("dialog");
  await dlg.getByLabel("Title").fill("Acne scars: microneedling");
  await dlg.getByTestId("gallery-before").setInputFiles(IMG("c-acne.jpg"));
  await dlg.getByTestId("gallery-after").setInputFiles(IMG("p-skin-rejuvenation.jpg"));
  await expect(dlg.getByRole("button", { name: "Remove" })).toHaveCount(2);
  await dlg.getByTestId("gallery-publish").click();
  await expect(dlg.getByTestId("gallery-publish")).toHaveAttribute("aria-checked", "false"); // blocked without consent
  await dlg.getByTestId("gallery-consent").check();
  await dlg.getByTestId("gallery-publish").click();
  await expect(dlg.getByTestId("gallery-publish")).toHaveAttribute("aria-checked", "true");
  await dlg.getByRole("button", { name: "Save" }).click();
  const card = page.locator('[data-gallery-admin="Acne scars: microneedling"]');
  await expect(card).toContainText("Published");

  await page.goto("/before-after");
  await expect(page.locator("[data-gallery-item]")).toHaveCount(4);
  await expect(page.getByText("Acne scars: microneedling")).toBeVisible();

  await demoLogin(page, "gallery");
  await page.locator('[data-gallery-admin="Acne scars: microneedling"]').getByRole("button", { name: /Delete/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.locator('[data-gallery-admin="Acne scars: microneedling"]')).toHaveCount(0);
});

test("blog: draft stays private, publish makes it public, edit and delete", async ({ page }) => {
  await demoLogin(page, "blog");
  await page.getByRole("button", { name: "New article" }).click();
  const dlg = page.getByRole("dialog");
  await dlg.getByLabel("Title *").fill("Winter skincare tips");
  await dlg.getByLabel("Summary").fill("Keeping skin comfortable in cold weather.");
  await dlg.getByTestId("post-cover").setInputFiles(IMG("b-routine.jpg"));
  await dlg.getByLabel("Article").fill("## Moisturise\n\nUse a richer cream in winter.\n\n- Short showers\n- Daily sunscreen");
  await dlg.getByRole("button", { name: "Preview" }).click();
  await expect(dlg.getByRole("heading", { name: "Moisturise" })).toBeVisible();
  await dlg.getByRole("button", { name: "Save draft" }).click();
  await expect(page.locator('[data-post-admin="winter-skincare-tips"]')).toContainText("Draft");

  const res = await page.goto("/blog/winter-skincare-tips");
  expect(res?.ok()).toBe(true);
  await expect(page.getByText("This article is not available")).toBeVisible();

  await demoLogin(page, "blog");
  await page.locator('[data-post-admin="winter-skincare-tips"]').getByRole("button", { name: /Edit/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Publish" }).click();
  await page.goto("/blog/winter-skincare-tips");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Winter skincare tips");
  await expect(page.getByRole("heading", { name: "Moisturise" })).toBeVisible();

  await demoLogin(page, "blog");
  await page.locator('[data-post-admin="winter-skincare-tips"]').getByRole("button", { name: /Delete/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.locator('[data-post-admin="winter-skincare-tips"]')).toHaveCount(0);
});

test("contact & social: WhatsApp number, phone, Instagram reach the site", async ({ page }) => {
  await demoLogin(page, "contact");
  await page.getByLabel("WhatsApp number").fill("0300 7654321");
  await page.getByLabel("Phone number (as displayed)").fill("+92 992 123456");
  await page.getByLabel("Instagram URL").fill("https://instagram.com/clinic");
  await page.getByTestId("save-content").click();
  await expect(page.getByText("All changes saved.")).toBeVisible();
  await page.goto("/contact");
  await expect(page.getByRole("link", { name: "Chat on WhatsApp" })).toHaveAttribute("href", /wa\.me\/923007654321/);
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "+92 992 123456" })).toBeVisible();
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Instagram" })).toHaveAttribute("href", "https://instagram.com/clinic");
});

test("appointments: accept, reject (frees slot), reschedule, cancel with notification previews", async ({ page }) => {
  // Patient books a slot
  const { date, time } = await pickSlot(page, "skin-consultation", 2);
  await fillDetails(page, { name: "Admin Flow" });
  await page.getByTestId("confirm").click();
  const ref = (await page.getByTestId("reference").textContent())!;

  await demoLogin(page, "appointments");
  await page.getByRole("button", { name: "all", exact: true }).click();
  await page.getByLabel("Search appointments").fill(ref);
  const row = page.locator(`[data-ref="${ref}"]`);
  await expect(row).toContainText("Admin Flow");

  await row.getByRole("button", { name: /^Accept/ }).click();
  await expect(page.getByRole("dialog", { name: /Accepted/ })).toContainText("Your appointment is confirmed");
  await page.getByRole("button", { name: "Done" }).click();
  await expect(row.locator("[data-status]")).toHaveText("Accepted");

  await row.getByRole("button", { name: /^Reschedule/ }).click();
  const dlg = page.getByRole("dialog", { name: "Reschedule appointment" });
  await dlg.locator("[data-testid=day-strip] button:not([disabled])").nth(4).click();
  await dlg.locator("[data-testid=time-grid] button[data-state=available]").first().click();
  await dlg.getByRole("button", { name: "Save new time" }).click();
  await expect(page.getByRole("dialog", { name: /Rescheduled/ })).toContainText("has been moved");
  await page.getByRole("button", { name: "Done" }).click();

  await row.getByRole("button", { name: /^Cancel/ }).click();
  await page.getByRole("button", { name: "Cancel appointment" }).click();
  await expect(page.getByRole("dialog", { name: /Cancelled/ })).toContainText("has been cancelled");
  await page.getByRole("button", { name: "Done" }).click();
  await expect(row.locator("[data-status]")).toHaveText("Cancelled");

  // A second request on the original slot, rejected with a message → slot free again
  const again = await pickSlot(page, "skin-consultation", 2);
  expect(again).toEqual({ date, time });
  await fillDetails(page, { name: "Reject Me" });
  await page.getByTestId("confirm").click();
  const ref2 = (await page.getByTestId("reference").textContent())!;
  await demoLogin(page, "appointments");
  await page.getByRole("button", { name: "all", exact: true }).click();
  await page.getByLabel("Search appointments").fill(ref2);
  await page.locator(`[data-ref="${ref2}"]`).getByRole("button", { name: /^Reject/ }).click();
  await page.getByLabel(/Message to the patient/).fill("The doctor is away that day.");
  await page.getByRole("button", { name: "Reject request" }).click();
  await expect(page.getByRole("dialog", { name: /Rejected/ })).toContainText("The doctor is away that day.");
  await page.getByRole("button", { name: "Done" }).click();
  await page.goto("/book?treatment=skin-consultation");
  await page.locator(`[data-date="${date}"]`).click();
  await expect(page.locator(`[data-testid=time-grid] [data-time="${time}"]`)).toHaveAttribute("data-state", "available");
});

test("booking hours: closed weekday, holiday and blocked slot remove availability", async ({ page }) => {
  await page.goto("/book?treatment=hydrafacial");
  const days = page.locator("[data-testid=day-strip] button:not([disabled])");
  const closeDate = (await days.nth(2).getAttribute("data-date"))!;
  const holidayDate = (await days.nth(4).getAttribute("data-date"))!;
  const blockDate = (await days.nth(5).getAttribute("data-date"))!;
  const weekday = new Date(`${closeDate}T12:00:00`).getDay();

  await demoLogin(page, "availability");
  await page.locator(`button[data-day="${weekday}"]`).click();
  await page.getByLabel("Date", { exact: true }).first().fill(holidayDate);
  await page.getByLabel("Reason").first().fill("Eid holiday");
  await page.getByRole("button", { name: "Add holiday" }).click();
  await page.locator("#bl-date").fill(blockDate);
  await page.locator("#bl-start").fill("11:00");
  await page.locator("#bl-end").fill("12:00");
  await page.getByRole("button", { name: "Block", exact: true }).click();
  await page.getByTestId("save-settings").click();
  await expect(page.getByText("All changes saved.")).toBeVisible();

  await page.goto("/book?treatment=hydrafacial");
  await expect(page.locator(`[data-testid=day-strip] [data-date="${closeDate}"]`)).toBeDisabled();
  await expect(page.locator(`[data-testid=day-strip] [data-date="${holidayDate}"]`)).toContainText("Holiday");
  await page.locator(`[data-testid=day-strip] [data-date="${blockDate}"]`).click();
  await expect(page.locator('[data-testid=time-grid] [data-time="11:00"]')).toHaveCount(0);
  await expect(page.locator('[data-testid=time-grid] [data-time="11:30"]')).toHaveCount(0);
  await expect(page.locator('[data-testid=time-grid] [data-time="12:00"]')).toHaveCount(1);
});

test("homepage: add a brand-new custom section with image and button", async ({ page }) => {
  await demoLogin(page, "site");
  await page.getByRole("button", { name: "Add a new section" }).click();
  const item = page.locator('[data-section-admin^="custom-"]').last();
  await item.getByLabel("Heading", { exact: true }).fill("Our new laser suite");
  await item.getByLabel("Text", { exact: true }).fill("Opening this winter with the latest technology.");
  await item.getByLabel("Button text").fill("Book a visit");
  await item.getByLabel("Button link").fill("/book");
  await item.locator('input[type=file]').setInputFiles(IMG("s-clinic.jpg"));
  await expect(item.getByRole("button", { name: "Remove" })).toBeVisible();
  for (let i = 0; i < 9; i++) await item.getByRole("button", { name: /Move .* up/ }).click();
  await page.getByTestId("save-content").click();
  await expect(page.getByText("All changes saved.")).toBeVisible();
  await page.goto("/");
  const sec = page.locator('[data-section^="custom-"]');
  await expect(sec.getByRole("heading", { name: "Our new laser suite" })).toBeVisible();
  await expect(sec.getByRole("link", { name: "Book a visit" })).toHaveAttribute("href", "/book");
  const order = await page.locator("[data-section]").evaluateAll((els) => els.map((e) => e.getAttribute("data-section")));
  expect(order.findIndex((s) => s!.startsWith("custom-"))).toBeLessThan(order.indexOf("beforeAfter"));
});
