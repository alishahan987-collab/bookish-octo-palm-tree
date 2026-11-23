import { expect, test } from "@playwright/test";
import { fillDetails, pickSlot, trackErrors } from "./helpers";

const NAV = [
  ["Home", "/"], ["About the Doctor", "/about"], ["Skin Treatments", "/skin-treatments"], ["Hair Treatments", "/hair-treatments"],
  ["Aesthetic Procedures", "/aesthetic-procedures"], ["Before & After", "/before-after"], ["Pricing", "/pricing"],
  ["Blog & Skincare Education", "/blog"], ["Contact Us", "/contact"],
] as const;

test("navigation: every menu item works (desktop bar or mobile menu)", async ({ page, isMobile }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  for (const [label, href] of NAV) {
    if (isMobile) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.locator("#mobile-menu").getByRole("link", { name: label, exact: true }).click();
    } else {
      await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: label, exact: true }).click();
    }
    await expect(page).toHaveURL(new RegExp(`${href === "/" ? "/$" : href}`));
    await expect(page.locator("h1").first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("every internal link resolves; no horizontal overflow; no console errors", async ({ page, request }) => {
  const errors = trackErrors(page);
  const seen = new Set<string>();
  for (const p of ["/", "/conditions", "/treatments", "/blog", "/pricing", "/about", "/contact", "/before-after"]) {
    await page.goto(p);
    (await page.locator("a[href^='/']").evaluateAll((as) => as.map((a) => a.getAttribute("href")!))).forEach((h) => seen.add(h.split("#")[0] || "/"));
  }
  expect(seen.size).toBeGreaterThan(40);
  for (const href of seen) {
    const res = await request.get(href);
    expect(res.status(), href).toBeLessThan(400);
  }
  for (const href of [...seen].filter((h) => !h.startsWith("/admin")).slice(0, 60)) {
    await page.goto(href);
    await expect(page.locator("h1").first(), href).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `horizontal overflow on ${href}`).toBeLessThanOrEqual(0);
  }
  expect(errors).toEqual([]);
});

test("homepage: hero with doctor placeholder, all sections, 14 conditions", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Expert care for skin");
  await expect(page.getByTestId("doctor-portrait")).toContainText("upload in admin");
  for (const s of ["intro", "conditions", "procedures", "doctor", "why", "beforeAfter", "pricing", "blog", "cta", "faq", "contact"])
    await expect(page.locator(`[data-section="${s}"]`)).toHaveCount(1);
  await page.getByRole("button", { name: /Show all 14 conditions/ }).click();
  await expect(page.locator("[data-section=conditions] [data-condition]")).toHaveCount(14);
  await page.getByRole("tab", { name: "Hair procedures" }).click();
  await expect(page.locator("[data-section=procedures] [data-procedure]").first()).toBeVisible();
  await expect(page.locator("[data-section=procedures] [data-procedure=prp-hair-treatment]")).toBeVisible();
});

test("search: header dialog and results page, patient language", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("open-search").click();
  await page.getByLabel("Search treatments, conditions and articles").fill("hair fall");
  const results = page.getByTestId("search-results");
  await expect(results).toContainText("Hair Loss");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Hair/);

  await page.goto("/search?q=pimples");
  await expect(page.getByTestId("search-page-results")).toContainText("Acne");
  await page.locator("#search-page-input").fill("sunscreen");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=sunscreen/);
  await expect(page.getByTestId("search-page-results")).toContainText("Sunscreen");
});

test("condition page has the five required sections", async ({ page }) => {
  await page.goto("/conditions");
  await expect(page.locator("[data-testid=condition-list] [data-condition]")).toHaveCount(14);
  await page.getByRole("link", { name: "Learn more about Melasma" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Melasma");
  for (const h of [/What is melasma\?/, "Common symptoms", "Causes", "Available treatments", "When to consult a dermatologist"])
    await expect(page.getByRole("heading", { name: h })).toBeVisible();
});

test("procedure page has every required block and a Book button", async ({ page }) => {
  await page.goto("/aesthetic-procedures");
  await page.getByRole("link", { name: "Botox (Anti-Wrinkle Injections)" }).click();
  for (const h of ["Procedure overview", "How it works", "Benefits", "Suitable candidates", "Duration, sessions & recovery", "Frequently asked questions"])
    await expect(page.getByRole("heading", { name: h })).toBeVisible();
  await expect(page.getByTestId("price-block")).toContainText("Starting from");
  await page.getByTestId("price-block").getByRole("link", { name: "Book appointment" }).click();
  await expect(page.getByRole("heading", { name: "Pick a date and time" })).toBeVisible();
});

test("pricing page lists every procedure with image, price and Book now", async ({ page }) => {
  await page.goto("/pricing");
  const items = page.locator("[data-price-item]");
  expect(await items.count()).toBeGreaterThanOrEqual(19);
  const hydra = page.locator("[data-price-item=hydrafacial]");
  await expect(hydra).toContainText("PKR 9,500");
  await expect(hydra.locator("img")).toHaveCount(1);
  await hydra.getByRole("link", { name: /Book now/ }).click();
  await expect(page).toHaveURL(/book\?treatment=hydrafacial/);
});

test("before & after gallery: filters and slider", async ({ page }) => {
  await page.goto("/before-after");
  await expect(page.locator("[data-gallery-item]")).toHaveCount(3);
  await page.getByRole("button", { name: "Hair", exact: true }).click();
  await expect(page.locator("[data-gallery-item]")).toHaveCount(1);
  const slider = page.getByRole("slider").first();
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("51");
});

test("blog list and article", async ({ page }) => {
  await page.goto("/blog");
  await page.getByRole("link", { name: /Sunscreen: how to choose/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Sunscreen");
  await expect(page.getByRole("heading", { name: "What to look for" })).toBeVisible();
});

test("booking: full flow with validation, reference, honest notification status", async ({ page }) => {
  const errors = trackErrors(page);
  await pickSlot(page);
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("Please enter your full name.")).toBeVisible();
  await expect(page.getByText(/Enter a Pakistani mobile number/)).toBeVisible();
  await expect(page.getByText("Please enter your email address.")).toBeVisible();
  await expect(page.getByText(/Please tick to agree/)).toBeVisible();
  await page.getByRole("textbox", { name: /Email address/ }).fill("not-an-email");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
  await page.getByLabel("Full name").fill("Test Patient");
  await page.getByLabel("Phone number").fill("+92 300 1234567");
  await page.getByRole("textbox", { name: /Email address/ }).fill("patient@example.com");
  await page.getByLabel("Notes (optional)").fill("First visit");
  await page.locator("#f-consent").check();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByTestId("review")).toContainText("HydraFacial");
  await page.getByTestId("confirm").click();
  await expect(page.getByTestId("confirmation")).toBeVisible();
  await expect(page.getByTestId("reference")).toHaveText(/^AES-\d{4}-\d{4}$/);
  await expect(page.getByTestId("notification-status")).toContainText("Demo mode");
  await expect(page.getByTestId("message-preview")).toContainText("Preview only");
  expect(errors).toEqual([]);
});

test("booking: a booked slot cannot be booked again", async ({ page }) => {
  const { date, time } = await pickSlot(page);
  await fillDetails(page);
  await page.getByTestId("confirm").click();
  await expect(page.getByTestId("confirmation")).toBeVisible();
  await page.goto("/book?treatment=hydrafacial");
  await page.locator(`[data-date="${date}"]`).click();
  const slot = page.locator(`[data-testid=time-grid] [data-time="${time}"]`);
  await expect(slot).toHaveAttribute("data-state", "booked");
  await expect(slot).toBeDisabled();
});

test("skin concern finder", async ({ page }) => {
  await page.goto("/skin-finder");
  await expect(page.getByText("This is not a diagnosis.")).toBeVisible();
  await page.locator("[data-concern=hair-loss]").check({ force: true });
  await page.getByTestId("show-results").click();
  await expect(page.getByTestId("finder-results")).toContainText("PRP Hair Treatment");
});

test("floating WhatsApp explains when no number is set; Google Maps loads on contact", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByTestId("map").locator("iframe")).toHaveAttribute("src", /google\.com\/maps/);
  await page.getByRole("button", { name: "Chat on WhatsApp" }).click();
  await expect(page.getByRole("dialog", { name: "WhatsApp" })).toContainText("has not been added yet");
});
