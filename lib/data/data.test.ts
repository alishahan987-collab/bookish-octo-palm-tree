import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { addDays, todayISO, weekdayOf } from "../dates";
import { normalisePhone } from "../phone";
import { validatePrice, priceSummary } from "../pricing";
import { SEED_SETTINGS } from "./seed";
import { baseTimes, getDayAvailability } from "./slots";
import type { Booking, ClinicSettings, Weekday } from "./types";

/* Minimal browser shim so the localStorage source can run under Node. */
const store = new Map<string, string>();
beforeAll(() => {
  (globalThis as any).window = {
    location: { hostname: "test" },
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
    addEventListener: () => {},
  };
});
beforeEach(() => store.clear());

const settings = (patch: Partial<ClinicSettings> = {}): ClinicSettings => ({ ...SEED_SETTINGS, holidays: [], ...patch });

/** Next date (from tomorrow) that falls on the given weekday. */
function nextWeekday(dow: Weekday): string {
  let d = addDays(todayISO(), 1);
  while (weekdayOf(d) !== dow) d = addDays(d, 1);
  return d;
}

describe("phone validation", () => {
  it.each([
    ["(909) 516-7066", "+1 (909) 516-7066"],
    ["909-516-7066", "+1 (909) 516-7066"],
    ["9095167066", "+1 (909) 516-7066"],
    ["+1 909 516 7066", "+1 (909) 516-7066"],
    ["1 (909) 516-7066", "+1 (909) 516-7066"],
    ["909.516.7066", "+1 (909) 516-7066"],
    ["+44 7700 900123", "+447700900123"],
    ["0086 138 0013 8000", "+8613800138000"],
  ])("accepts %s", (input, out) => expect(normalisePhone(input)).toBe(out));

  it.each(["", "516-7066", "(109) 516-7066", "(909) 116-7066", "909516706", "90951670661", "abc 909 516 7066", "+0 123456789", "+1234567"])(
    "rejects %s",
    (input) => expect(normalisePhone(input)).toBeNull(),
  );
});

describe("pricing", () => {
  it("validates every price model", () => {
    expect(validatePrice({ type: "fixed", amount: 2000 })).toBeNull();
    expect(validatePrice({ type: "fixed", amount: 0 })).not.toBeNull();
    expect(validatePrice({ type: "range", min: 5000, max: 4000 })).not.toBeNull();
    expect(validatePrice({ type: "promo", regular: 9000, promo: 9500 })).not.toBeNull();
    expect(validatePrice({ type: "package", perSession: 12000, packages: [{ sessions: 3, price: 32000 }] })).toBeNull();
    expect(validatePrice({ type: "consultation" })).toBeNull();
  });
  it("summarises prices", () => {
    expect(priceSummary({ type: "from", amount: 168 })).toBe("From $168");
    expect(priceSummary({ type: "from", amount: 8, unit: "per unit" })).toBe("From $8 per unit");
    expect(priceSummary({ type: "range", min: 1200, max: 1500 })).toBe("$1,200–$1,500");
    expect(priceSummary({ type: "promo", regular: 250, promo: 199 })).toBe("$199 (was $250)");
    expect(priceSummary({ type: "consultation" })).toBe("Priced at consultation");
  });
});

describe("slot engine", () => {
  it("uses weekday and weekend opening hours", () => {
    const monday = baseTimes(settings(), nextWeekday(1));
    expect(monday[0]).toBe("09:30");
    expect(monday.at(-1)).toBe("18:00");
    const saturday = baseTimes(settings(), nextWeekday(6));
    expect(saturday[0]).toBe("10:00");
    expect(saturday.at(-1)).toBe("18:30");
    expect(baseTimes(settings(), nextWeekday(0))[0]).toBe("10:00");
  });

  it("skips breaks only on their days", () => {
    const s = settings({ breaks: [{ id: "b", label: "Team meeting", start: "13:00", end: "14:00", days: [1] }] });
    const monday = baseTimes(s, nextWeekday(1));
    expect(monday).toContain("12:30");
    expect(monday).not.toContain("13:00");
    expect(monday).not.toContain("13:30");
    expect(monday).toContain("14:00");
    expect(baseTimes(s, nextWeekday(2))).toContain("13:00");
  });

  it("rejects per-day hours that close before they open", async () => {
    const { assertSettings } = await import("./rules");
    expect(() => assertSettings(settings({ dayHours: { "6": { open: "19:00", close: "10:00" } } }))).toThrow(/Saturday/);
  });

  it("closes non-working days and holidays", () => {
    const sunday = nextWeekday(0);
    const s = settings({ workingDays: [1, 2, 3, 4, 5, 6] });
    expect(getDayAvailability(s, [], sunday, "main").open).toBe(false);
    const monday = nextWeekday(1);
    const h = settings({ holidays: [{ id: "h", date: monday, label: "Thanksgiving" }] });
    const day = getDayAvailability(h, [], monday, "main");
    expect(day.open).toBe(false);
    if (!day.open) expect(day.reason).toContain("Thanksgiving");
  });

  it("marks booked slots and enforces max per day", () => {
    const tue = nextWeekday(2);
    const mk = (time: string, status: Booking["status"] = "pending") =>
      ({ id: time, date: tue, time, doctorId: "main", status }) as Booking;
    const day = getDayAvailability(settings(), [mk("11:00"), mk("11:30", "cancelled")], tue, "main");
    if (!day.open) throw new Error("expected open");
    expect(day.slots.find((s) => s.time === "11:00")?.state).toBe("booked");
    expect(day.slots.find((s) => s.time === "11:30")?.state).toBe("available"); // cancelled frees the slot

    const full = getDayAvailability(settings({ maxPerDay: 1 }), [mk("11:00")], tue, "main");
    if (!full.open) throw new Error("expected open");
    expect(full.slots.every((s) => s.state !== "available")).toBe(true);
  });
});

describe("local data source", () => {
  it("prevents double booking of the same slot", async () => {
    const data = await import("./index");
    await data.resetDemoData();
    const [t] = await data.getTreatments();
    const s = await data.getSettings();
    // find an available slot
    let date = addDays(todayISO(), 1);
    let time = "";
    for (let i = 0; i < 30 && !time; i++, date = addDays(date, 1)) {
      const d = getDayAvailability(s, await data.getBookings(), date, "main");
      const free = d.open ? d.slots.find((x) => x.state === "available") : undefined;
      if (free) time = free.time;
      if (time) break;
    }
    const input = {
      treatmentId: t.id, doctorId: "main", date, time, patientName: "Test Person",
      phone: "(909) 555-0142", email: "test@example.com", contactMethod: "phone" as const, consent: true,
    };
    const { booking: b, notifications } = await data.createBooking(input);
    expect(notifications.every((n) => n.status === "skipped")).toBe(true); // demo mode never sends
    expect(b.reference).toMatch(/^VIP-\d{4}-\d{4}$/);
    expect(b.phone).toBe("+1 (909) 555-0142");
    await expect(data.createBooking(input)).rejects.toMatchObject({ code: "SLOT_UNAVAILABLE" });

    // rejecting frees it again
    await data.setBookingStatus(b.id, "rejected", "Provider unavailable");
    const again = await data.createBooking(input);
    expect(again.booking.reference).not.toBe(b.reference);
    // email is required by default
    await expect(data.createBooking({ ...input, time: "11:00", date: addDays(date, 1), email: undefined })).rejects.toMatchObject({ code: "VALIDATION" });
    // honeypot
    await expect(data.createBooking({ ...input, website: "spam" } as never)).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("rejects invalid input and invalid transitions", async () => {
    const data = await import("./index");
    await data.resetDemoData();
    const [t] = await data.getTreatments();
    await expect(
      data.createBooking({ treatmentId: t.id, doctorId: "main", date: addDays(todayISO(), 2), time: "11:00",
        patientName: "A B", phone: "12345", email: "a@b.co", contactMethod: "whatsapp", consent: true }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    const done = (await data.getBookings()).find((b) => b.status === "completed")!;
    await expect(data.setBookingStatus(done.id, "confirmed")).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });

  it("price updates are visible to readers immediately", async () => {
    const data = await import("./index");
    await data.resetDemoData();
    const hydra = (await data.getTreatmentBySlug("hydrafacial"))!;
    await data.updatePrice(hydra.id, { type: "promo", regular: 12000, promo: 8000 });
    const again = (await data.getTreatmentBySlug("hydrafacial"))!;
    expect(again.price).toMatchObject({ promo: 8000 });
  });
});

describe("blocked slots", () => {
  it("removes blocked ranges from availability", () => {
    const tue = nextWeekday(2);
    const s = settings({ blocked: [{ id: "b", date: tue, start: "15:00", end: "16:00", reason: "Away" }] });
    const day = getDayAvailability(s, [], tue, "main");
    if (!day.open) throw new Error("expected open");
    const times = day.slots.map((x) => x.time);
    expect(times).not.toContain("15:00");
    expect(times).not.toContain("15:30");
    expect(times).toContain("16:00");
  });
});

describe("gallery consent", () => {
  it("refuses to publish real photos without consent", async () => {
    const data = await import("./index");
    await data.resetDemoData();
    await expect(
      data.saveGalleryItem({ title: "x", category: "skin", before: "/a.jpg", after: "/b.jpg", consentConfirmed: false, published: true, order: 0 }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    const ok = await data.saveGalleryItem({ title: "x", category: "skin", before: "/a.jpg", after: "/b.jpg", consentConfirmed: true, published: true, order: 0 });
    expect((await data.getGallery()).some((g) => g.id === ok.id)).toBe(true);
  });
});

describe("search", () => {
  it("understands patient language and typos", async () => {
    const { buildIndex, search } = await import("../search");
    const { SEED_TREATMENTS, SEED_CONDITIONS, SEED_POSTS } = await import("./seed");
    const index = buildIndex({ treatments: SEED_TREATMENTS, conditions: SEED_CONDITIONS, posts: SEED_POSTS });
    expect(search(index, "hair removal")[0].title).toBe("Laser Hair Removal");
    expect(search(index, "pimples").some((h) => h.title === "Acne & Breakouts")).toBe(true);
    expect(search(index, "hydrafacal").some((h) => h.title === "HydraFacial")).toBe(true); // typo
    expect(search(index, "botox")[0].title).toMatch(/Botox/);
    expect(search(index, "wrinkles").some((h) => h.title === "Botox")).toBe(true);
    expect(search(index, "iv drip").some((h) => h.title === "IV Wellness Therapy")).toBe(true);
    expect(search(index, "skin tag").some((h) => /Skin Tag/.test(h.title))).toBe(true);
    expect(search(index, "sunscreen").some((h) => h.type === "article")).toBe(true);
    expect(search(index, "x")).toEqual([]);
  });
});
