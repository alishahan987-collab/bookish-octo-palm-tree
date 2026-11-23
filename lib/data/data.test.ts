import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { addDays, todayISO, weekdayOf } from "../dates";
import { normalisePkMobile } from "../phone";
import { validatePrice, priceSummary } from "../pricing";
import { SEED_SETTINGS } from "./seed";
import { baseTimes, getDayAvailability } from "./slots";
import type { Booking, ClinicSettings, Weekday } from "./types";

/* Minimal browser shim so the localStorage source can run under Node. */
const store = new Map<string, string>();
beforeAll(() => {
  (globalThis as any).window = {
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
    ["0300 1234567", "+92 300 1234567"],
    ["0300-1234567", "+92 300 1234567"],
    ["+92 345 1234567", "+92 345 1234567"],
    ["923451234567", "+92 345 1234567"],
    ["0092 312 1234567", "+92 312 1234567"],
  ])("accepts %s", (input, out) => expect(normalisePkMobile(input)).toBe(out));

  it.each(["", "0992 330000", "0300123456", "03001234567890", "0423 1234567", "abc0300 1234567", "300 1234567"])(
    "rejects %s",
    (input) => expect(normalisePkMobile(input)).toBeNull(),
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
    expect(priceSummary({ type: "from", amount: 5000 })).toBe("From PKR 5,000");
    expect(priceSummary({ type: "consultation" })).toBe("Price after consultation");
  });
});

describe("slot engine", () => {
  it("skips breaks", () => {
    const monday = nextWeekday(1);
    const times = baseTimes(settings(), monday);
    expect(times).toContain("13:00");
    expect(times).not.toContain("13:30");
    expect(times).not.toContain("14:00");
    expect(times).toContain("14:30");
    expect(times[0]).toBe("11:00");
    expect(times.at(-1)).toBe("18:30");
  });

  it("applies the Friday Jumu'ah break only on Fridays", () => {
    const friday = nextWeekday(5);
    expect(baseTimes(settings(), friday)).not.toContain("12:30");
    expect(baseTimes(settings(), nextWeekday(2))).toContain("12:30");
  });

  it("closes non-working days and holidays", () => {
    const sunday = nextWeekday(0);
    const s = settings({ workingDays: [1, 2, 3, 4, 5, 6] });
    expect(getDayAvailability(s, [], sunday, "dr-sajjad").open).toBe(false);
    const monday = nextWeekday(1);
    const h = settings({ holidays: [{ id: "h", date: monday, label: "Eid" }] });
    const day = getDayAvailability(h, [], monday, "dr-sajjad");
    expect(day.open).toBe(false);
    if (!day.open) expect(day.reason).toContain("Eid");
  });

  it("marks booked slots and enforces max per day", () => {
    const tue = nextWeekday(2);
    const mk = (time: string, status: Booking["status"] = "pending") =>
      ({ id: time, date: tue, time, doctorId: "dr-sajjad", status }) as Booking;
    const day = getDayAvailability(settings(), [mk("11:00"), mk("11:30", "cancelled")], tue, "dr-sajjad");
    if (!day.open) throw new Error("expected open");
    expect(day.slots.find((s) => s.time === "11:00")?.state).toBe("booked");
    expect(day.slots.find((s) => s.time === "11:30")?.state).toBe("available"); // cancelled frees the slot

    const full = getDayAvailability(settings({ maxPerDay: 1 }), [mk("11:00")], tue, "dr-sajjad");
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
      const d = getDayAvailability(s, await data.getBookings(), date, "dr-sajjad");
      const free = d.open ? d.slots.find((x) => x.state === "available") : undefined;
      if (free) time = free.time;
      if (time) break;
    }
    const input = {
      treatmentId: t.id, doctorId: "dr-sajjad", date, time, patientName: "Test Person",
      phone: "0300 1234567", contactMethod: "whatsapp" as const, consent: true,
    };
    const b = await data.createBooking(input);
    expect(b.reference).toMatch(/^AES-\d{4}-\d{4}$/);
    expect(b.phone).toBe("+92 300 1234567");
    await expect(data.createBooking(input)).rejects.toMatchObject({ code: "SLOT_UNAVAILABLE" });

    // cancelling frees it again
    await data.setBookingStatus(b.id, "cancelled");
    await expect(data.createBooking(input)).resolves.toBeTruthy();
  });

  it("rejects invalid input and invalid transitions", async () => {
    const data = await import("./index");
    await data.resetDemoData();
    const [t] = await data.getTreatments();
    await expect(
      data.createBooking({ treatmentId: t.id, doctorId: "dr-sajjad", date: addDays(todayISO(), 2), time: "11:00",
        patientName: "A B", phone: "12345", contactMethod: "whatsapp", consent: true }),
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
