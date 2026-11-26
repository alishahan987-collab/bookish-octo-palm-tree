import { expect, test } from "@playwright/test";
import { fillDetails, pickSlot, trackErrors } from "./helpers";

const NAV = [
  ["Results", "/before-after"], ["About", "/about"], ["Pricing", "/pricing"], ["Contact", "/contact"],
] as const;
const GROUPS = [
  ["Facials & Skin", "/skin-care"], ["Injectables", "/injectables"], ["Laser", "/laser"], ["Wellness", "/wellness"],
] as const;

test("navigation: main links and the treatment menu (desktop bar or mobile menu)", async ({ page, isMobile }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  for (const [label, href] of NAV) {
    if (isMobile) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.locator("#mobile-menu").getByRole("link", { name: label, exact: true }).click();
    } else {
      await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: label, exact: true }).click();
    }
    await expect(page).toHaveURL(new RegExp(href));
    await expect(page.locator("h1").first()).toBeVisible();
  }
  for (const [label, href] of GROUPS) {
    if (isMobile) {
      await page.getByRole("button", { name: "Open menu" }).click();
      const menu = page.locator("#mobile-menu");
      const toggle = menu.getByRole("button", { name: "Treatments" });
      if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
      await menu.getByRole("link", { name: new RegExp(`^${label}`) }).click();
    } else {
      await page.getByRole("button", { name: "Treatments", exact: true }).click();
      await page.locator("#treatment-menu").getByRole("link", { name: label, exact: true }).click();
    }
    await expect(page).toHaveURL(new RegExp(href));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(label);
  }
  expect(errors).toEqual([]);
});

test("treatment menu: keyboard opens and Escape closes it", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop menu");
  await page.goto("/", { waitUntil: "networkidle" });
  const btn = page.getByRole("button", { name: "Treatments", exact: true });
  await btn.focus();
  await page.keyboard.press("Enter");
  await expect(btn).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#treatment-menu").getByRole("link", { name: "Laser Hair Removal" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(btn).toHaveAttribute("aria-expanded", "false");
  await expect(btn).toBeFocused();
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

test("responsive: no horizontal scroll and key actions visible at every required width", async ({ browser }) => {
  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 800 : 900 }, isMobile: width < 768, hasTouch: width < 1024 });
    const page = await ctx.newPage();
    for (const path of ["/", "/treatments", "/treatments/botox", "/book?treatment=hydrafacial", "/contact"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(0);
    }
    await page.goto("/");
    // Booking is one tap away at every size: the action bar on phones, the header button from tablets up.
    const book = width < 768 ? page.getByRole("navigation", { name: "Quick actions" }).getByRole("link", { name: /Book now/ }) : page.locator("header").getByRole("link", { name: "Book an Appointment" });
    await expect(book, `book button at ${width}px`).toBeVisible();
    const box = (await book.boundingBox())!;
    expect(box.height, `book button height at ${width}px`).toBeGreaterThanOrEqual(44);
    if (width < 768) await expect(page.getByRole("navigation", { name: "Quick actions" }).getByRole("link", { name: /Call/ })).toHaveAttribute("href", "tel:+19095167066");
    await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
    await ctx.close();
  }
});

test("homepage: the ten-part structure with verified clinic facts", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Personalized skin care");
  for (const s of ["hero", "treatments", "about", "why", "beforeAfter", "testimonials", "team", "booking", "location"])
    await expect(page.locator(`[data-section="${s}"]`)).toHaveCount(1);
  await expect(page.locator("footer")).toBeVisible();
  await expect(page.locator("[data-section=treatments] [data-procedure]")).toHaveCount(6);
  await expect(page.getByTestId("rating-summary")).toContainText("193 reviews on Google");
  await expect(page.getByTestId("hours")).toContainText("9:30 AM – 6:30 PM");
  await expect(page.getByTestId("hours")).toContainText("10:00 AM – 7:00 PM");
  await expect(page.locator("[data-section=location]")).toContainText("13788 Roswell Ave, #118");
  // Nothing is invented: team, testimonials and results show only preview-mode placeholders.
  await expect(page.locator("[data-section=team] [data-testid=preview-placeholder]")).toBeVisible();
  await expect(page.locator("[data-section=testimonials] [data-testid=testimonials]")).toHaveCount(0);
});

test("search: header dialog and results page, everyday language", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("open-search").click();
  await page.getByLabel("Search treatments, skin concerns and articles").fill("hair removal");
  const results = page.getByTestId("search-results");
  await expect(results).toContainText("Laser Hair Removal");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Laser Hair Removal");

  await page.goto("/search?q=wrinkles");
  await expect(page.getByTestId("search-page-results")).toContainText("Botox");
  await page.locator("#search-page-input").fill("sunscreen");
  await page.locator("main").getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=sunscreen/);
  await expect(page.getByTestId("search-page-results")).toContainText("Sunscreen");
});

test("treatment directory filters by category and by typed search", async ({ page }) => {
  await page.goto("/treatments");
  const list = page.locator("[data-testid=procedure-list] [data-procedure]");
  await expect(list).toHaveCount(17);
  await page.getByRole("button", { name: "Wellness", exact: true }).click();
  await expect(list).toHaveCount(4);
  await page.getByRole("button", { name: "All", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search treatments", exact: true }).fill("laser");
  await expect(list).toHaveCount(3); // both laser treatments, plus the anti-aging plan that includes laser
});

test("skin concern page has its five sections", async ({ page }) => {
  await page.goto("/conditions");
  await expect(page.locator("[data-testid=condition-list] [data-condition]")).toHaveCount(8);
  await page.getByRole("link", { name: "Learn more about Skin Tags, Moles & Warts" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Skin Tags, Moles & Warts");
  for (const h of [/About skin tags/, "Common signs", "Common causes", "Treatments that may help", "When to see a medical professional"])
    await expect(page.getByRole("heading", { name: h }).first()).toBeVisible();
});

test("treatment page has every block, the published price and a Book button", async ({ page }) => {
  await page.goto("/injectables");
  await page.getByRole("link", { name: "Botox", exact: true }).click();
  for (const h of ["Overview", "How it works", "Benefits", "Ideal for", "Possible side effects", "Questions"])
    await expect(page.getByRole("heading", { name: h, exact: true })).toBeVisible();
  await expect(page.getByTestId("price-block")).toContainText("Starting from");
  await expect(page.getByTestId("price-block")).toContainText("$8");
  await expect(page.getByTestId("price-block")).toContainText("per unit");
  await page.getByTestId("price-block").getByRole("link", { name: "Book an Appointment" }).click();
  await expect(page.getByRole("heading", { name: "Pick a date and time" })).toBeVisible();
});

test("pricing page lists every treatment with image, price and Book now", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.locator("[data-price-item]")).toHaveCount(17);
  const laser = page.locator("[data-price-item=laser-hair-removal]");
  await expect(laser).toContainText("From $168");
  await expect(laser.locator("img")).toHaveCount(1);
  await expect(page.locator("[data-price-item=hydrafacial]")).toContainText("Priced at consultation");
  await laser.getByRole("link", { name: /Book now/ }).click();
  await expect(page).toHaveURL(/book\?treatment=laser-hair-removal/);
});

test("before & after gallery is empty until real, consented photos are added", async ({ page }) => {
  await page.goto("/before-after");
  await expect(page.locator("[data-gallery-item]")).toHaveCount(0);
  await expect(page.getByText("Our results gallery is being curated.")).toBeVisible();
});

test("blog list and article", async ({ page }) => {
  await page.goto("/blog");
  await page.getByRole("link", { name: /Sunscreen: how to choose/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Sunscreen");
  await expect(page.getByRole("heading", { name: "What to look for" })).toBeVisible();
});

test("booking: full flow with validation, US phone, reference, honest notification status", async ({ page }) => {
  const errors = trackErrors(page);
  await pickSlot(page);
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("Please enter your full name.")).toBeVisible();
  await expect(page.getByText(/Enter a valid phone number/)).toBeVisible();
  await expect(page.getByText("Please enter your email address.")).toBeVisible();
  await expect(page.getByText(/Please check the box/)).toBeVisible();
  await page.getByRole("textbox", { name: /Email address/ }).fill("not-an-email");
  await page.getByLabel("Phone number").fill("516-7066");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
  await expect(page.getByText(/Enter a valid phone number/)).toBeVisible();
  await page.getByLabel("Full name").fill("Test Client");
  await page.getByLabel("Phone number").fill("909-555-0142");
  await page.getByRole("textbox", { name: /Email address/ }).fill("client@example.com");
  await page.getByLabel("Notes (optional)").fill("First visit");
  await page.locator("#f-consent").check();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByTestId("review")).toContainText("HydraFacial");
  await expect(page.getByTestId("review")).toContainText("+1 (909) 555-0142");
  await expect(page.getByTestId("review")).toContainText("Phone call or text");
  await page.getByTestId("confirm").click();
  await expect(page.getByTestId("confirmation")).toBeVisible();
  await expect(page.getByTestId("reference")).toHaveText(/^VIP-\d{4}-\d{4}$/);
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

test("treatment finder", async ({ page }) => {
  await page.goto("/skin-finder");
  await expect(page.getByText("This is not a diagnosis.")).toBeVisible();
  await page.locator("[data-concern=unwanted-hair]").check({ force: true });
  await page.getByTestId("show-results").click();
  await expect(page.getByTestId("finder-results")).toContainText("Laser Hair Removal");
});

test("contact: map loads, phone is a US tel link, WhatsApp is hidden until configured", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByTestId("map").locator("iframe")).toHaveAttribute("src", /google\.com\/maps/);
  await expect(page.locator("main").getByRole("link", { name: "(909) 516-7066" })).toHaveAttribute("href", "tel:+19095167066");
  await expect(page.getByRole("link", { name: /WhatsApp/ })).toHaveCount(0);
});

test("reduced motion: content is visible without animation", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("/");
  const duration = await page.locator("[data-testid=hero] h1").evaluate((el) => getComputedStyle(el).animationDuration);
  expect(parseFloat(duration)).toBeLessThan(0.01);
  await ctx.close();
});
