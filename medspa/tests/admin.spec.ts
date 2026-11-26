import path from "node:path";
import { expect, test } from "@playwright/test";
import { clearEmails, emails, login, nextOpenSlot, save } from "./helpers";

test.describe("admin security", () => {
  test("admin APIs require a signed-in admin", async ({ request }) => {
    for (const [method, url] of [["get", "/api/admin/bootstrap"], ["get", "/api/admin/appointments"], ["get", "/api/admin/messages"], ["post", "/api/admin/items/pages"], ["put", "/api/admin/docs/settings"], ["delete", "/api/admin/media?path=x"]] as const) {
      const r = await request[method](url, { data: {} });
      expect(r.status(), `${method} ${url}`).toBe(401);
    }
  });

  test("wrong password is rejected", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill("admin@test.local");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  });

  test("admin pages are noindex and cross-site writes are blocked", async ({ page, request }) => {
    await login(page);
    const res = await page.goto("/admin");
    expect(res?.headers()["x-robots-tag"]).toContain("noindex");
    const r = await page.request.post("/api/admin/items/pages", { headers: { Origin: "https://evil.example" }, data: {} });
    expect(r.status()).toBe(403);
    expect((await request.get("/api/admin/session")).status()).toBe(200);
  });
});

test.describe("content management", () => {
  test.beforeEach(async ({ page }) => login(page));

  test("edit homepage heading, hide and restore a section", async ({ page }) => {
    await page.goto("/admin/pages/p_home");
    await page.locator('[data-section="hero"]').getByRole("button", { name: /Hero banner/ }).click();
    await page.getByLabel("Headline", { exact: true }).fill("Glow, thoughtfully.");
    await save(page);
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("Glow, thoughtfully.");

    await page.goto("/admin/pages/p_home");
    await page.locator('[data-section="features"]').getByRole("button", { name: "Hide section" }).click();
    await save(page);
    await page.goto("/");
    await expect(page.getByText("Booking is simple")).toHaveCount(0);

    await page.goto("/admin/pages/p_home");
    await page.locator('[data-section="features"]').getByRole("button", { name: "Show section" }).click();
    await page.locator('[data-section="hero"]').getByRole("button", { name: /Hero banner/ }).click();
    await page.getByLabel("Headline", { exact: true }).fill("Skincare & body treatments, thoughtfully done.");
    await save(page);
    await page.goto("/");
    await expect(page.getByText("Booking is simple")).toBeVisible();
  });

  test("reorder sections with the move buttons", async ({ page }) => {
    await page.goto("/admin/pages/p_about");
    const sections = page.locator("[data-section]");
    const firstTwo = async () => [await sections.nth(1).getAttribute("data-section"), await sections.nth(2).getAttribute("data-section")];
    expect(await firstTwo()).toEqual(["text", "imageText"]);
    await sections.nth(2).getByRole("button", { name: "Move up" }).click();
    expect(await firstTwo()).toEqual(["imageText", "text"]);
    await save(page);
    await page.goto("/about");
    const order = await page.locator("main [data-block]").evaluateAll((els) => els.map((e) => e.getAttribute("data-block")));
    expect(order.indexOf("b_about_space")).toBeLessThan(order.indexOf("b_about_intro"));
  });

  test("drag and drop reorders homepage sections (mouse and keyboard)", async ({ page }) => {
    await page.goto("/admin/pages/p_home");
    const types = () => page.locator("[data-section]").evaluateAll((els) => els.map((e) => e.getAttribute("data-section")));
    await expect(page.locator("[data-section]")).toHaveCount(8);
    const before = await types();
    // keyboard drag: focus the handle of section 3, lift, move down one, drop
    const handle = page.locator("[data-section]").nth(2).getByRole("button", { name: "Drag to reorder" });
    await handle.focus();
    for (const key of ["Space", "ArrowDown", "Space"]) {
      await page.keyboard.press(key);
      await page.waitForTimeout(250); // let the drag animation settle between keys
    }
    await expect.poll(types).toEqual([before[0], before[1], before[3], before[2], ...before.slice(4)]);
    // mouse drag it back up
    const src = await page.locator("[data-section]").nth(3).getByRole("button", { name: "Drag to reorder" }).boundingBox();
    const dst = await page.locator("[data-section]").nth(2).boundingBox();
    await page.mouse.move(src!.x + 10, src!.y + 10);
    await page.mouse.down();
    await page.mouse.move(src!.x + 10, src!.y - 20, { steps: 5 });
    await page.mouse.move(dst!.x + 10, dst!.y + 5, { steps: 10 });
    await page.mouse.up();
    await expect.poll(types).toEqual(before);
    await expect(page.getByText("All changes saved.")).toBeVisible();
  });

  test("create a page, add a section, publish, add to the menu, duplicate and delete", async ({ page }) => {
    await page.goto("/admin/pages");
    await page.getByRole("button", { name: "+ New page" }).click();
    await page.getByLabel("Page title").fill("Holiday Specials");
    await page.getByRole("button", { name: "Create page" }).click();
    await expect(page).toHaveURL(/\/admin\/pages\/p_/);
    await page.getByTestId("add-section").click();
    await page.getByRole("button", { name: /Questions \(FAQ\)/ }).click();
    await page.getByRole("button", { name: "+ Add question" }).click();
    await page.getByRole("textbox", { name: "Question" }).fill("Can I buy a gift card?");
    await page.getByLabel("Published (visible on the website)").check({ force: true });
    await save(page);

    await page.goto("/holiday-specials");
    await expect(page.locator("h1")).toHaveText("Holiday Specials");
    await expect(page.getByText("Can I buy a gift card?")).toBeVisible();

    await page.goto("/admin/pages");
    const row = page.locator('[data-page="holiday-specials"]');
    await row.getByRole("button", { name: "Add to menu" }).click();
    await expect(row.getByText("In menu")).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Holiday Specials" })).toBeVisible();

    await page.goto("/admin/pages");
    await page.locator('[data-page="holiday-specials"]').getByRole("button", { name: "Duplicate" }).click();
    await expect(page).toHaveURL(/\/admin\/pages\/p_/);
    await page.goto("/admin/pages");
    await expect(page.locator('[data-page="holiday-specials-copy"]')).toBeVisible();

    for (const slug of ["holiday-specials-copy", "holiday-specials"]) {
      page.once("dialog", (d) => d.accept());
      await page.locator(`[data-page="${slug}"]`).getByRole("button", { name: "Delete" }).click();
      await expect(page.locator(`[data-page="${slug}"]`)).toHaveCount(0);
    }
    expect((await page.request.get("/holiday-specials")).status()).toBe(404);
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Holiday Specials" })).toHaveCount(0);
  });

  test("required pages cannot be deleted (API)", async ({ page }) => {
    const r = await page.request.delete("/api/admin/items/pages/p_home");
    expect(r.status()).toBe(400);
  });

  test("change a price inline, hide and show a treatment", async ({ page }) => {
    await page.goto("/admin/treatments");
    const row = page.locator('[data-treatment-row="facial-treatments"]');
    await row.getByLabel("Price for Facial Treatments").fill("From $95");
    await row.getByRole("button", { name: "Save price" }).click();
    await expect(page.getByText("Price saved.")).toBeVisible();
    await page.goto("/treatments/facial-treatments");
    await expect(page.getByText("From $95").first()).toBeVisible();

    await page.goto("/admin/treatments");
    await page.locator('[data-treatment-row="venus-legacy"]').getByRole("button", { name: "Hide" }).click();
    await expect(page.getByText("Hidden from the website.")).toBeVisible();
    expect((await page.request.get("/treatments/venus-legacy")).status()).toBe(404);
    await page.locator('[data-treatment-row="venus-legacy"]').getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("Published.")).toBeVisible();
    expect((await page.request.get("/treatments/venus-legacy")).status()).toBe(200);
  });

  test("edit treatment details, verified benefits and upload an image", async ({ page }) => {
    await page.goto("/admin/treatments/t_brows");
    await page.getByLabel("Duration shown to visitors").fill("45 minutes");
    await page.getByRole("button", { name: "+ Add", exact: true }).first().click();
    await page.getByLabel("Benefits 1").fill("Shaped to suit your features");
    await page.getByLabel("These benefits are verified and may be shown").check({ force: true });
    await page.getByLabel("Verified by the business").check({ force: true });
    await page.locator('input[type="file"]').first().setInputFiles(path.join(__dirname, "fixtures", "brow.jpg"));
    await expect(page.getByText("Image uploaded. Remember to save.")).toBeVisible();
    await save(page);

    await page.goto("/treatments/eyebrow-design");
    await expect(page.getByText("45 minutes")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Benefits" })).toBeVisible();
    await expect(page.getByTestId("unverified-notice")).toHaveCount(0);
    const src = await page.locator("main img").first().getAttribute("src");
    expect(src).toMatch(/media|storage/);
  });

  test("create, duplicate and delete a treatment", async ({ page }) => {
    await page.goto("/admin/treatments");
    await page.getByRole("button", { name: "+ New treatment" }).click();
    await page.getByLabel("Treatment name").fill("Chemical Peel");
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page).toHaveURL(/\/admin\/treatments\/t_/);
    await page.getByLabel("Short description (cards and search results)").fill("A test treatment.");
    await page.getByLabel("Published (visible on the website)").check({ force: true });
    await save(page);
    await page.goto("/treatments");
    await expect(page.locator('[data-treatment="chemical-peel"]')).toBeVisible();

    await page.goto("/admin/treatments");
    await page.locator('[data-treatment-row="chemical-peel"]').getByRole("button", { name: "Duplicate" }).click();
    await page.goto("/admin/treatments");
    for (const slug of ["chemical-peel-copy", "chemical-peel"]) {
      page.once("dialog", (d) => d.accept());
      await page.locator(`[data-treatment-row="${slug}"]`).getByRole("button", { name: "Delete" }).click();
      await expect(page.locator(`[data-treatment-row="${slug}"]`)).toHaveCount(0);
    }
  });

  test("testimonial requires permission before publishing", async ({ page }) => {
    await page.goto("/admin/testimonials");
    await page.getByRole("button", { name: "+ Add testimonial" }).click();
    await page.getByLabel("Review text (exactly as written by the client)").fill("Lovely, calm experience.");
    await page.getByLabel("Name to display").fill("Test R.");
    await expect(page.getByLabel("Published on the website")).toBeDisabled();
    await page.getByLabel(/This is a genuine review/).check({ force: true });
    await page.getByLabel("Published on the website").check({ force: true });
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Testimonial saved.")).toBeVisible();
    await page.goto("/reviews");
    await expect(page.getByText("Lovely, calm experience.")).toBeVisible();

    const r = await page.request.post("/api/admin/items/testimonials", { data: { id: "r_bad", name: "X", text: "Y", rating: 5, source: "google", sourceUrl: "", date: "", treatment: "", permissionConfirmed: false, featured: false, published: true, order: 0 } });
    expect(r.status()).toBe(400);
  });

  test("before/after cannot be published without consent (API and database)", async ({ page }) => {
    const base = { id: "g_test", title: "Test", category: "Body", treatmentId: "", before: "/images/body-treatments.jpg", after: "/images/venus-legacy.jpg", beforeAlt: "", afterAlt: "", caption: "", display: "slider", consentNote: "", order: 0 };
    const r = await page.request.post("/api/admin/items/gallery", { data: { ...base, consentConfirmed: false, published: true } });
    expect(r.status()).toBe(400);
    const ok = await page.request.post("/api/admin/items/gallery", { data: { ...base, consentConfirmed: true, published: true } });
    expect(ok.status()).toBe(200);
    await page.goto("/gallery");
    await expect(page.locator('[data-gallery-item="g_test"]')).toBeVisible();
    await page.request.delete("/api/admin/items/gallery/g_test");
  });

  test("design: colours and fonts change the live site", async ({ page }) => {
    await page.goto("/admin/design");
    await page.getByLabel("Accent (muted gold)", { exact: true }).fill("#9A7B4F");
    await page.getByLabel("Headings").selectOption("playfair");
    await save(page);
    await page.goto("/");
    const css = await page.locator("style#theme").textContent();
    expect(css).toContain("--c-accent:#9A7B4F");
    expect(css).toContain("--font-heading:var(--font-playfair)");
    // invalid colours are refused by the server
    const bad = await page.request.put("/api/admin/docs/design", { data: { colors: { background: "red;}</style><script>", surface: "#fff", alt: "#fff", accent: "#fff", muted: "#fff", ink: "#000" } } });
    expect(bad.status()).toBe(400);
    await page.goto("/admin/design");
    await page.getByRole("button", { name: "Restore original design" }).click();
    await save(page);
  });

  test("business hours and contact details update everywhere", async ({ page }) => {
    await page.goto("/admin/business");
    await page.getByLabel("Saturday closing time").fill("15:00");
    await page.getByLabel("Public email (optional)").fill("hello@example.com");
    await save(page);
    await page.goto("/contact");
    await expect(page.locator("footer")).toContainText("10:00 AM – 3:00 PM");
    await expect(page.locator('a[href="mailto:hello@example.com"]').first()).toBeVisible();
  });

  test("menus: rename and hide a header link", async ({ page }) => {
    await page.goto("/admin/navigation");
    const labels = page.getByLabel("Link label");
    await labels.nth(4).fill("Client Reviews");
    await save(page);
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Client Reviews" })).toBeVisible();
    await page.goto("/admin/navigation");
    await page.getByLabel("Link label").nth(4).fill("Reviews");
    await save(page);
  });

  test("booking mode Booksy sends Book buttons to Booksy", async ({ page }) => {
    await page.goto("/admin/booking");
    await page.getByText("Booksy only", { exact: true }).click();
    await save(page);
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Book an Appointment" }).first()).toHaveAttribute("href", /booksy\.com/);
    const r = await page.request.post("/api/appointments", { data: {} });
    expect(r.status()).toBe(400);
    await page.goto("/admin/booking");
    await page.getByText("Website requests + Booksy (recommended)").click();
    await save(page);
  });
});

test.describe("appointment management", () => {
  test("approve, reschedule, complete, reject: customer is emailed each time", async ({ page, request }) => {
    const slot = await nextOpenSlot(request, "t_facial", 1);
    const a = await request.post("/api/appointments", { data: { treatmentId: "t_facial", ...slot, name: "Ana Manage", email: "ana@example.com", phone: "+44 7700 900123", consent: true } });
    expect(a.status()).toBe(201);
    const ref = (await a.json()).appointment.reference;
    const slot2 = await nextOpenSlot(request, "t_facial", 2);
    const b = await request.post("/api/appointments", { data: { treatmentId: "t_facial", ...slot2, name: "Ben Reject", email: "ben@example.com", phone: "3055550177", consent: true } });
    const refB = (await b.json()).appointment.reference;

    await clearEmails();
    await login(page);
    await page.goto("/admin/appointments");
    await page.locator(`[data-appointment="${ref}"]`).click();
    await page.getByTestId("approve").click();
    await expect(page.getByText(/Appointment approved\. Email: sent/)).toBeVisible();
    await expect(page.getByRole("dialog").getByText("Approved", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Reschedule" }).click();
    const dates = page.getByRole("radiogroup", { name: "Date" }).getByRole("radio");
    await dates.and(page.locator(":not([disabled])")).nth(3).click();
    await page.getByRole("radiogroup", { name: "Time" }).getByRole("radio").and(page.locator(":not([disabled])")).first().click();
    await page.getByRole("button", { name: /^Move to/ }).click();
    await expect(page.getByText(/Appointment rescheduled/)).toBeVisible();

    await page.getByRole("button", { name: "Mark completed" }).click();
    await expect(page.getByText("Marked as completed.")).toBeVisible();
    await page.keyboard.press("Escape");

    await page.getByRole("tab", { name: "All" }).click();
    await page.locator(`[data-appointment="${refB}"]`).click();
    await page.getByRole("button", { name: "Reject", exact: true }).click();
    await page.getByLabel("Message to the customer (optional)").fill("We are fully booked that afternoon.");
    await page.getByRole("button", { name: "Confirm reject" }).click();
    await expect(page.getByText(/Request rejected/)).toBeVisible();

    const mail = await emails();
    expect(mail.find((m) => m.to[0] === "ana@example.com" && m.subject.startsWith("Your appointment is confirmed"))).toBeTruthy();
    expect(mail.find((m) => m.to[0] === "ana@example.com" && m.subject.startsWith("Your appointment time has changed"))).toBeTruthy();
    const rej = mail.find((m) => m.to[0] === "ben@example.com");
    expect(rej?.text).toContain("We are fully booked that afternoon.");

    // the rejected slot is free again
    const again = await request.post("/api/appointments", { data: { treatmentId: "t_facial", ...slot2, name: "Cara New", email: "cara@example.com", phone: "3055550178", consent: true } });
    expect(again.status()).toBe(201);
  });

  test("new requests alert the spa's notification email", async ({ page, request }) => {
    await login(page);
    await page.goto("/admin/business");
    await page.getByLabel("Notification email (private)").fill("spa-alerts@example.com");
    await save(page);
    await clearEmails();
    const slot = await nextOpenSlot(request, "t_body", 3);
    const r = await request.post("/api/appointments", { data: { treatmentId: "t_body", ...slot, name: "Alert Test", email: "alert@example.com", phone: "3055550155", consent: true, message: "Hi" } });
    expect(r.status()).toBe(201);
    const alert = (await emails()).find((m) => m.to[0] === "spa-alerts@example.com");
    expect(alert?.subject).toContain("New appointment request: Body Treatments");
    expect(alert?.text).toContain("/admin/appointments");
  });

  test("staff can add a phone booking", async ({ page }) => {
    await login(page);
    await page.goto("/admin/appointments");
    await page.getByRole("button", { name: "+ Add appointment" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Treatment").selectOption("t_laser");
    await dialog.getByLabel("Customer name").fill("Phone Booking");
    await dialog.getByLabel("Phone").fill("305-555-0144");
    await dialog.getByRole("radiogroup", { name: "Date" }).getByRole("radio").and(page.locator(":not([disabled])")).first().click();
    await dialog.getByRole("radiogroup", { name: "Time" }).getByRole("radio").and(page.locator(":not([disabled])")).first().click();
    await dialog.getByRole("button", { name: "Add appointment" }).click();
    await expect(page.getByText("Appointment added.")).toBeVisible();
  });

  test("messages inbox shows contact form messages", async ({ page }) => {
    await page.request.post("/api/contact", { data: { name: "Inbox Test", email: "inbox@example.com", message: "Hello there" } });
    await login(page);
    await page.goto("/admin/messages");
    await page.getByRole("button", { name: /Inbox Test/ }).click();
    await expect(page.getByRole("paragraph").filter({ hasText: "Hello there" })).toBeVisible();
    await page.getByRole("button", { name: "Archive", exact: true }).click();
    await expect(page.getByRole("button", { name: /Inbox Test/ })).toHaveCount(0);
  });

  test("dashboard checklist reports real configuration", async ({ page }) => {
    await login(page);
    await expect(page.locator('[data-check="email"]')).toHaveAttribute("data-ok", "true");
    await expect(page.locator('[data-check="indexing"]')).toHaveAttribute("data-ok", "false");
  });
});
