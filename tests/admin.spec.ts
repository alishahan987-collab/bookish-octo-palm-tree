import { expect, test, type Page } from "@playwright/test";
import { IMG, demoLogin, fillDetails, pickSlot } from "./helpers";

const sectionRow = (page: Page, type: string, nth = 0) => page.locator(`[data-section-type="${type}"]`).nth(nth);

test("login: wrong password rejected, demo password accepted", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Password").fill("nope");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("#pw-err")).toContainText("Incorrect password");
  await page.getByLabel("Password").fill("demo1234");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("[data-admin-panel=appointments]")).toBeVisible();
});

test("homepage builder: edit, hide, move, duplicate, remove and add sections", async ({ page }) => {
  await demoLogin(page, "site");
  // Edit the hero
  const hero = sectionRow(page, "hero");
  await hero.getByRole("button", { name: /^Edit/ }).click();
  await hero.getByLabel("Heading", { exact: true }).fill("Radiance, by appointment,");
  await hero.getByLabel("Highlighted words (italic, after the heading)").fill("in Chino.");
  // Hide "Why choose us"
  await page.getByTestId("visible-why").click();
  // Move "Location" above the booking banner
  await page.getByRole("button", { name: /^Move Location & hours: .* up$/ }).click();
  // Duplicate the treatment cards and switch the copy to laser treatments only
  await sectionRow(page, "treatments").getByRole("button", { name: /^Duplicate/ }).click();
  const copy = sectionRow(page, "treatments", 1);
  await copy.getByLabel("Heading", { exact: true }).fill("Laser treatments");
  await copy.getByLabel("Show").selectOption("laser");
  // Remove the team section (with confirmation)
  await sectionRow(page, "team").getByRole("button", { name: /^Remove/ }).click();
  await page.getByRole("button", { name: "Remove section" }).click();
  await expect(sectionRow(page, "team")).toHaveCount(0);
  // Add an FAQ section from the library
  await page.getByLabel("Add a section").selectOption("faq");
  await page.getByTestId("add-section").click();
  // Announcement
  await page.getByTestId("announcement-toggle").click();
  await page.getByLabel("Message").fill("Holiday gift cards are available.");
  await page.getByTestId("save-content").click();
  await expect(page.getByText("All changes saved.")).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Radiance, by appointment, in Chino.");
  await expect(page.locator("[data-section=why]")).toHaveCount(0);
  await expect(page.locator("[data-section=team]")).toHaveCount(0);
  await expect(page.locator("[data-section=faq]")).toHaveCount(1);
  await expect(page.getByText("Holiday gift cards are available.")).toBeVisible();
  const laser = page.locator("[data-section=treatments]").nth(1);
  await expect(laser.getByRole("heading", { name: "Laser treatments" })).toBeVisible();
  await expect(laser.locator("[data-procedure]")).toHaveCount(2);
  const order = await page.locator("[data-section]").evaluateAll((els) => els.map((e) => e.getAttribute("data-section")));
  expect(order.indexOf("location")).toBeLessThan(order.indexOf("booking"));
  expect(order.at(-1)).toBe("faq");
});

test("homepage: add a custom section with image and button, then move it up", async ({ page }) => {
  await demoLogin(page, "site");
  await page.getByLabel("Add a section").selectOption("custom");
  await page.getByTestId("add-section").click();
  const item = sectionRow(page, "custom");
  await item.getByLabel("Heading", { exact: true }).fill("Our new laser suite");
  await item.getByLabel("Text", { exact: true }).fill("Opening this winter.");
  await item.getByLabel("Button text").fill("Book a visit");
  await item.getByLabel("Button link").fill("/book");
  await item.locator("input[type=file]").setInputFiles(IMG("about-serum.jpg"));
  await expect(item.getByRole("button", { name: "Remove", exact: true })).toBeVisible();
  for (let i = 0; i < 6; i++) await item.getByRole("button", { name: /^Move .* up$/ }).click();
  await page.getByTestId("save-content").click();
  await expect(page.getByText("All changes saved.")).toBeVisible();
  await page.goto("/");
  const sec = page.locator("[data-section=custom]");
  await expect(sec.getByRole("heading", { name: "Our new laser suite" })).toBeVisible();
  await expect(sec.getByRole("link", { name: "Book a visit" })).toHaveAttribute("href", "/book");
  await expect(sec.locator("img")).toHaveCount(1);
  const order = await page.locator("[data-section]").evaluateAll((els) => els.map((e) => e.getAttribute("data-section")));
  expect(order.indexOf("custom")).toBeLessThan(order.indexOf("beforeAfter"));
});

test("team & reviews: verified team member and permitted testimonial reach the site", async ({ page }) => {
  await demoLogin(page, "team");
  await page.getByTestId("add-team-member").click();
  await page.getByLabel("Full name").fill("Jane Example");
  await page.getByLabel("Role").fill("Nurse Injector");
  await page.getByLabel("Qualifications & license").fill("RN, BSN");
  await page.getByLabel("Short biography").fill("Written in the admin.");
  await page.getByTestId("team-photo-0").setInputFiles(IMG("p-consultation.jpg"));
  await expect(page.locator("[data-team-admin]").getByRole("button", { name: "Remove", exact: true }).nth(1)).toBeVisible();

  await page.getByTestId("add-testimonial").click();
  await page.getByLabel("Review text (exactly as written)").fill("Wonderful, calm experience.");
  await page.getByLabel("Name shown").fill("Sam K.");
  await expect(page.getByText("Hidden on the website until permission is confirmed.")).toBeVisible();
  await page.getByTestId("save-content").click();
  await expect(page.getByText("All changes saved.")).toBeVisible();

  await page.goto("/");
  await expect(page.getByTestId("team")).toContainText("Jane Example");
  await expect(page.getByTestId("team")).toContainText("RN, BSN");
  await expect(page.getByTestId("team").locator("img")).toHaveAttribute("src", /^blob:/);
  await expect(page.getByText("Wonderful, calm experience.")).toHaveCount(0); // no permission yet

  await demoLogin(page, "team");
  await page.getByLabel("The client gave permission to publish this review").check();
  await page.getByLabel("Number of reviews").fill("200");
  await page.getByTestId("save-content").click();
  await expect(page.getByText("All changes saved.")).toBeVisible();
  await page.goto("/");
  await expect(page.getByTestId("testimonials")).toContainText("Wonderful, calm experience.");
  await expect(page.getByTestId("rating-summary")).toContainText("200 reviews on Google");
  await page.goto("/about");
  await expect(page.getByTestId("about-team")).toContainText("Nurse Injector");
});

test("appearance: logo upload and color preset update the site", async ({ page }) => {
  await demoLogin(page, "appearance");
  await page.getByTestId("logo-upload").setInputFiles(IMG("s-serum.jpg"));
  await expect(page.getByRole("button", { name: "Remove", exact: true })).toBeVisible();
  await page.locator("[data-preset=noir]").click();
  await expect(page.getByText(/too low/)).toHaveCount(0);
  await page.getByTestId("save-content").click();
  await expect(page.getByText("All changes saved.")).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("link", { name: /home$/i }).first().locator("img")).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--color-champagne").trim().toLowerCase())).toBe("#a88b5e");
});

test("treatments: edit price & discount, add a new treatment with image", async ({ page }) => {
  await demoLogin(page, "procedures");
  const row = page.locator('[data-slug="hydrafacial"]');
  await row.getByRole("button", { name: /Price/ }).click();
  await page.getByRole("dialog").getByText("Discounted price", { exact: true }).click();
  await page.locator("#p-regular").fill("250");
  await page.locator("#p-promo").fill("199");
  await page.getByLabel("Discount label").fill("Holiday offer");
  await page.getByTestId("save-price").click();
  await expect(row.getByTestId("admin-price")).toContainText("$199");

  await page.getByRole("button", { name: "Add treatment" }).click();
  const dlg = page.getByRole("dialog");
  await dlg.getByLabel("Name *").fill("Tattoo Removal");
  await dlg.getByLabel("Short description *").fill("Laser treatment to fade unwanted tattoos.");
  await dlg.getByLabel("Overview").fill("Overview text.");
  await dlg.getByTestId("procedure-image").setInputFiles(IMG("p-laser-rejuvenation.jpg"));
  await expect(dlg.getByRole("button", { name: "Remove", exact: true })).toBeVisible();
  await dlg.getByLabel("Number of sessions").fill("6–10 sessions");
  await dlg.getByRole("button", { name: "Add treatment" }).click();
  await expect(page.locator('[data-slug="tattoo-removal"]')).toBeVisible();

  await page.goto("/treatments/hydrafacial");
  await expect(page.getByTestId("price-block")).toContainText("$199");
  await expect(page.getByTestId("price-block")).toContainText("Holiday offer");
  await page.goto("/pricing");
  await expect(page.locator("[data-price-item=hydrafacial]")).toContainText("$199");
  await page.goto("/treatments/tattoo-removal");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tattoo Removal");
  await expect(page.getByText("6–10 sessions").first()).toBeVisible();
  await page.goto("/search?q=tattoo");
  await expect(page.getByTestId("search-page-results")).toContainText("Tattoo Removal");
});

test("skin concerns: add a new concern with its page", async ({ page }) => {
  await demoLogin(page, "conditions");
  await page.getByRole("button", { name: "Add condition" }).click();
  const dlg = page.getByRole("dialog");
  await dlg.getByLabel("Name *").fill("Dark Circles");
  await dlg.getByLabel("Short description (card)").fill("Shadows and hollowness under the eyes.");
  await dlg.getByLabel("1. What is the condition?").fill("A common concern with several causes.");
  await dlg.getByLabel("2. Common symptoms").fill("Shadowing\nHollowness");
  await dlg.getByTestId("condition-image").setInputFiles(IMG("c-melasma.jpg"));
  await dlg.getByRole("button", { name: "Add condition" }).click();
  await expect(page.locator('[data-slug="dark-circles"]')).toBeVisible();
  await page.goto("/conditions/dark-circles");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Dark Circles");
  await expect(page.getByText("Hollowness", { exact: true })).toBeVisible();
});

test("gallery: upload before/after, consent required to publish, then it appears on the homepage", async ({ page }) => {
  await demoLogin(page, "gallery");
  await page.getByRole("button", { name: "Add result" }).click();
  const dlg = page.getByRole("dialog");
  await dlg.getByLabel("Title").fill("Texture: microneedling");
  await dlg.getByTestId("gallery-before").setInputFiles(IMG("c-acne.jpg"));
  await dlg.getByTestId("gallery-after").setInputFiles(IMG("hero-skin.jpg"));
  await expect(dlg.getByRole("button", { name: "Remove", exact: true })).toHaveCount(2);
  await dlg.getByTestId("gallery-publish").click();
  await expect(dlg.getByTestId("gallery-publish")).toHaveAttribute("aria-checked", "false"); // blocked without consent
  await dlg.getByTestId("gallery-consent").check();
  await dlg.getByTestId("gallery-publish").click();
  await expect(dlg.getByTestId("gallery-publish")).toHaveAttribute("aria-checked", "true");
  await dlg.getByRole("button", { name: "Save" }).click();
  await expect(page.locator('[data-gallery-admin="Texture: microneedling"]')).toContainText("Published");

  await page.goto("/before-after");
  await expect(page.locator("[data-gallery-item]")).toHaveCount(1);
  await page.goto("/");
  await expect(page.locator("[data-section=beforeAfter] [data-gallery-item]")).toHaveCount(1);
  const slider = page.locator("[data-section=beforeAfter]").getByRole("slider").first();
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("51");

  await demoLogin(page, "gallery");
  await page.locator('[data-gallery-admin="Texture: microneedling"]').getByRole("button", { name: /Delete/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.locator('[data-gallery-admin="Texture: microneedling"]')).toHaveCount(0);
});

test("blog: draft stays private, publish makes it public, edit and delete", async ({ page }) => {
  await demoLogin(page, "blog");
  await page.getByRole("button", { name: "New article" }).click();
  const dlg = page.getByRole("dialog");
  await dlg.getByLabel("Title *").fill("Winter skincare tips");
  await dlg.getByLabel("Summary").fill("Keeping skin comfortable in cold weather.");
  await dlg.getByTestId("post-cover").setInputFiles(IMG("b-routine.jpg"));
  await dlg.getByLabel("Article").fill("## Moisturize\n\nUse a richer cream in winter.\n\n- Short showers\n- Daily sunscreen");
  await dlg.getByRole("button", { name: "Preview" }).click();
  await expect(dlg.getByRole("heading", { name: "Moisturize" })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "Moisturize" })).toBeVisible();

  await demoLogin(page, "blog");
  await page.locator('[data-post-admin="winter-skincare-tips"]').getByRole("button", { name: /Delete/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.locator('[data-post-admin="winter-skincare-tips"]')).toHaveCount(0);
});

test("contact: phone, optional WhatsApp, Instagram and visit notes reach the site", async ({ page }) => {
  await demoLogin(page, "contact");
  await page.getByLabel("Phone number").fill("(909) 555-0100");
  await page.getByLabel("WhatsApp number (optional)").fill("(909) 555-0199");
  await page.getByLabel("Instagram URL").fill("https://instagram.com/clinic");
  await page.getByTestId("save-content").click();
  await expect(page.getByText("All changes saved.")).toBeVisible();
  await page.goto("/contact");
  await expect(page.locator("main").getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", /wa\.me\/19095550199/);
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "(909) 555-0100" })).toHaveAttribute("href", "tel:+19095550100");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Instagram" })).toHaveAttribute("href", "https://instagram.com/clinic");
  await expect(page.locator("main")).toContainText("Wheelchair-accessible entrance");

  await demoLogin(page, "contact");
  await page.getByLabel("Phone number").fill("12345");
  await page.getByTestId("save-content").click();
  await expect(page.getByText(/Phone number looks invalid/)).toBeVisible();
});

test("appointments: accept, reject (frees slot), reschedule, cancel with notification previews", async ({ page }) => {
  const { date, time } = await pickSlot(page, "consultation", 2);
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
  await expect(page.getByRole("dialog", { name: /Rescheduled/ })).toContainText("has been rescheduled");
  await page.getByRole("button", { name: "Done" }).click();

  await row.getByRole("button", { name: /^Cancel/ }).click();
  await page.getByRole("button", { name: "Cancel appointment" }).click();
  await expect(page.getByRole("dialog", { name: /Cancelled/ })).toContainText("has been cancelled");
  await page.getByRole("button", { name: "Done" }).click();
  await expect(row.locator("[data-status]")).toHaveText("Cancelled");

  const again = await pickSlot(page, "consultation", 2);
  expect(again).toEqual({ date, time });
  await fillDetails(page, { name: "Reject Me" });
  await page.getByTestId("confirm").click();
  const ref2 = (await page.getByTestId("reference").textContent())!;
  await demoLogin(page, "appointments");
  await page.getByRole("button", { name: "all", exact: true }).click();
  await page.getByLabel("Search appointments").fill(ref2);
  await page.locator(`[data-ref="${ref2}"]`).getByRole("button", { name: /^Reject/ }).click();
  await page.getByLabel(/Message to the client/).fill("Our provider is away that day.");
  await page.getByRole("button", { name: "Reject request" }).click();
  await expect(page.getByRole("dialog", { name: /Rejected/ })).toContainText("Our provider is away that day.");
  await page.getByRole("button", { name: "Done" }).click();
  await page.goto("/book?treatment=consultation");
  await page.locator(`[data-date="${date}"]`).click();
  await expect(page.locator(`[data-testid=time-grid] [data-time="${time}"]`)).toHaveAttribute("data-state", "available");
});

test("booking hours: per-day hours, closed weekday, holiday and blocked slot", async ({ page }) => {
  await page.goto("/book?treatment=hydrafacial");
  const days = page.locator("[data-testid=day-strip] button:not([disabled])");
  const closeDate = (await days.nth(2).getAttribute("data-date"))!;
  const holidayDate = (await days.nth(4).getAttribute("data-date"))!;
  const blockDate = (await days.nth(5).getAttribute("data-date"))!;
  const blockDay = new Date(`${blockDate}T12:00:00`).getDay();
  const weekday = new Date(`${closeDate}T12:00:00`).getDay();

  await demoLogin(page, "availability");
  await page.locator(`button[data-day="${weekday}"]`).click();
  await page.locator(`#dh-c-${blockDay}`).fill("15:00");
  await page.getByLabel("Date", { exact: true }).first().fill(holidayDate);
  await page.getByLabel("Reason").first().fill("Thanksgiving");
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
  await expect(page.locator('[data-testid=time-grid] [data-time="14:30"]')).toHaveCount(1);
  await expect(page.locator('[data-testid=time-grid] [data-time="15:00"]')).toHaveCount(0); // closes at 3 PM that day
});
