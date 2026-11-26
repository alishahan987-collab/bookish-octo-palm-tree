import { expect, test, type Page } from "@playwright/test";
import { clearEmails, emails, nextOpenSlot } from "./helpers";

const PAGES = ["/", "/about", "/treatments", "/treatments/laser-hair-removal", "/gallery", "/reviews", "/contact", "/book", "/privacy-policy", "/terms"];
const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920];

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !/google\.com|maps|Failed to load resource/i.test(m.text())) errors.push(m.text());
  });
  return errors;
}

test.describe("public website", () => {
  test("every page renders with one H1, a title and no errors", async ({ page }) => {
    const errors = watchErrors(page);
    for (const path of PAGES) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await expect(page.locator("h1"), path).toHaveCount(1);
      expect(await page.title(), path).toMatch(/MEDSPA|Med Spa|Hollywood/);
      const desc = await page.locator('meta[name="description"]').getAttribute("content");
      expect(desc?.length, `${path} description`).toBeGreaterThan(50);
    }
    expect(errors).toEqual([]);
  });

  test("no horizontal scrolling at any tested width", async ({ page }) => {
    test.setTimeout(240_000);
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ["/", "/treatments", "/treatments/venus-legacy", "/book?treatment=facial-treatments", "/contact", "/about", "/reviews", "/gallery"]) {
        await page.goto(path);
        if (path.startsWith("/book")) await page.getByRole("radiogroup", { name: "Dates" }).waitFor();
        // Measure with clipping switched off, so content hidden by overflow-x: clip is caught too.
        const overflow = await page.evaluate(() => {
          document.body.style.overflowX = "visible";
          const w = document.documentElement.scrollWidth - window.innerWidth;
          document.body.style.overflowX = "";
          return w;
        });
        expect(overflow, `${path} @ ${width}px`).toBeLessThanOrEqual(0);
      }
    }
  });

  test("homepage shows business essentials and the two hero buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Skincare");
    await expect(page.getByRole("link", { name: "Explore Treatments" }).first()).toHaveAttribute("href", "/treatments");
    await expect(page.getByRole("link", { name: "Book an Appointment" }).first()).toHaveAttribute("href", "/book");
    await expect(page.locator("main")).toContainText("2632 Hollywood Blvd, Suite 307");
    await expect(page.locator('a[href="tel:+13053367129"]').first()).toBeVisible();
    await expect(page.locator("[data-treatment]")).toHaveCount(8);
    // Structured data: LocalBusiness without self-serving rating
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    const json = JSON.parse(ld!);
    expect(json["@type"]).toBe("HealthAndBeautyBusiness");
    expect(json.address.postalCode).toBe("33020");
    expect(json.aggregateRating).toBeUndefined();
    expect(json.openingHoursSpecification).toHaveLength(6);
  });

  test("navigation links all work, including the mobile menu", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const label of ["About Us", "Treatments", "Gallery", "Reviews", "Contact", "Home"]) {
      await nav.getByRole("link", { name: label }).click();
      await expect(page.locator("h1")).toBeVisible();
    }
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Gallery" }).click();
    await expect(page).toHaveURL(/\/gallery$/);
    await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0);
  });

  test("treatment page: details, unverified notice, book link, no invented price", async ({ page }) => {
    await page.goto("/treatments/laser-hair-removal");
    await expect(page.locator("h1")).toHaveText("Laser Hair Removal");
    await expect(page.getByTestId("unverified-notice")).toBeVisible();
    await expect(page.getByText("Pricing on request").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Benefits" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Book now/ }).first()).toHaveAttribute("href", "/book?treatment=laser-hair-removal");
  });

  test("category filter on the treatments page", async ({ page }) => {
    await page.goto("/treatments");
    await page.getByRole("button", { name: "Lashes & Brows" }).click();
    await expect(page.locator("[data-treatment]")).toHaveCount(2);
    await page.getByRole("button", { name: "All" }).click();
    await expect(page.locator("[data-treatment]")).toHaveCount(8);
  });

  test("search engines are blocked until launch", async ({ request, page }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /");
    await page.goto("/");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/treatments/venus-legacy");
  });
});

test.describe("appointment requests", () => {
  test("validation messages appear for an empty form", async ({ page }) => {
    await page.goto("/book");
    await page.getByRole("button", { name: "Request appointment" }).click();
    await expect(page.getByText("Please choose a treatment.")).toBeVisible();
    await expect(page.getByText("Please enter your full name.")).toBeVisible();
    await expect(page.getByText("Please enter a valid phone number", { exact: false })).toBeVisible();
  });

  test("full booking flow on a phone, emails sent, slot then unavailable", async ({ page, request }) => {
    await clearEmails();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/book?treatment=eyebrow-design");
    await expect(page.getByRole("radio", { name: /Eyebrow Design/ })).toBeChecked();
    // first available date is preselected; choose its first available time
    const firstTime = page.getByRole("radiogroup", { name: /times/ }).getByRole("radio").and(page.locator(":not([disabled])")).first();
    await firstTime.click();
    const chosen = (await firstTime.getAttribute("aria-label"))!;
    await page.getByLabel("Full name").fill("Test Client");
    await page.getByLabel("Email address").fill("client@example.com");
    await page.getByLabel("Phone number").fill("(305) 555-0123");
    await page.getByLabel("Message (optional)").fill("First visit.");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Request appointment" }).click();
    const ok = page.getByTestId("booking-success");
    await expect(ok).toBeVisible();
    await expect(ok).toContainText("Pending approval");
    await expect(ok).toContainText(/MS-[A-Z0-9]{6}/);

    const mail = await emails();
    const toClient = mail.find((m) => m.to[0] === "client@example.com");
    expect(toClient?.subject).toContain("We received your appointment request");
    expect(toClient?.text).toContain("not confirmed yet");

    // The same place can't be requested twice (capacity 1)
    const avail = await (await request.get("/api/availability?treatment=t_brows")).json();
    const time = chosen.replace(/ (AM|PM).*/, " $1");
    const day = avail.days.find((d: { open: boolean; slots?: { time: string; state: string }[] }) => d.open && d.slots?.some((s) => s.state === "full"));
    expect(day, `a full slot should exist after booking ${time}`).toBeTruthy();
  });

  test("server rejects double booking of the same slot (API)", async ({ request }) => {
    const slot = await nextOpenSlot(request, "t_lashes");
    const body = { treatmentId: "t_lashes", ...slot, name: "A Person", email: "a@example.com", phone: "3055550111", consent: true };
    const a = await request.post("/api/appointments", { data: body });
    expect(a.status()).toBe(201);
    const b = await request.post("/api/appointments", { data: { ...body, name: "B Person", email: "b@example.com" } });
    expect(b.status()).toBe(409);
  });

  test("simultaneous requests for one slot: exactly one wins", async ({ request }) => {
    const slot = await nextOpenSlot(request, "t_vip");
    const make = (i: number) => request.post("/api/appointments", { data: { treatmentId: "t_vip", ...slot, name: `Racer ${i}`, email: `r${i}@example.com`, phone: "3055550199", consent: true } });
    const results = await Promise.all([0, 1, 2, 3, 4].map(make));
    expect(results.filter((r) => r.status() === 201)).toHaveLength(1);
    expect(results.filter((r) => r.status() === 409)).toHaveLength(4);
  });

  test("server validation, honeypot and cross-site protection", async ({ request }) => {
    const bad = await request.post("/api/appointments", { data: { treatmentId: "t_laser", date: "2020-01-01", time: "25:00", name: "", phone: "12", consent: false } });
    expect(bad.status()).toBe(400);
    const json = await bad.json();
    expect(Object.keys(json.fields)).toEqual(expect.arrayContaining(["time", "name", "phone", "consent"]));
    const slot = await nextOpenSlot(request, "t_laser");
    const bot = await request.post("/api/appointments", { data: { treatmentId: "t_laser", ...slot, name: "Bot", email: "b@x.com", phone: "3055550000", consent: true, website: "spam" } });
    expect(bot.status()).toBe(400);
    const xsite = await request.post("/api/appointments", { headers: { Origin: "https://evil.example" }, data: {} });
    expect(xsite.status()).toBe(403);
  });

  test("contact form saves and emails the customer", async ({ page }) => {
    await clearEmails();
    await page.goto("/contact");
    await page.getByLabel("Name", { exact: true }).fill("Maria Example");
    await page.getByLabel("Email", { exact: true }).fill("maria@example.com");
    await page.getByLabel("Message", { exact: true }).fill("Do you offer packages for laser hair removal?");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByTestId("contact-success")).toBeVisible();
    const mail = await emails();
    expect(mail.find((m) => m.to[0] === "maria@example.com")?.subject).toContain("Thank you for contacting");
  });
});
