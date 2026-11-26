import { describe, expect, it } from "vitest";
import { SEED_SETTINGS } from "./seed";
import { getDayAvailability, isSlotAvailable, type BusyAppointment } from "./slots";
import type { Settings } from "./types";
import { normalizePhone, safeHref, validateAppointmentRequest } from "./validation";
import { contrast, readable, sanitizeDesign } from "./theme";
import { SEED_DESIGN } from "./seed";

const settings = (patch: Partial<Settings["booking"]> = {}): Settings => ({ ...SEED_SETTINGS, booking: { ...SEED_SETTINGS.booking, minNoticeHours: 0, ...patch } });
const now = new Date(2026, 11, 1, 8, 0); // Tue 1 Dec 2026, 8:00 spa time
const appt = (time: string, dur = 60, status: BusyAppointment["status"] = "pending", date = "2026-12-01"): BusyAppointment => ({ id: time + status, date, time, durationMinutes: dur, status });

describe("availability engine", () => {
  it("follows opening hours and treatment length", () => {
    const d = getDayAvailability(settings(), [], "2026-12-01", 60, { now });
    expect(d.open).toBe(true);
    if (!d.open) return;
    expect(d.slots[0].time).toBe("09:30");
    expect(d.slots.at(-1)!.time).toBe("17:00"); // Tue closes 18:00, 60 min must fit
  });

  it("is closed on Sunday and on blocked days", () => {
    expect(getDayAvailability(settings(), [], "2026-12-06", 60, { now }).open).toBe(false);
    const s = settings({ blocked: [{ id: "x", date: "2026-12-02", start: "", end: "", reason: "Holiday" }] });
    expect(getDayAvailability(s, [], "2026-12-02", 60, { now })).toEqual({ date: "2026-12-02", open: false, reason: "Holiday" });
  });

  it("marks overlapping times full with capacity 1, and frees them when rejected", () => {
    const busy = [appt("10:00", 60)];
    expect(isSlotAvailable(settings(), busy, "2026-12-01", "10:30", 30, { now }).ok).toBe(false);
    expect(isSlotAvailable(settings(), busy, "2026-12-01", "09:30", 30, { now }).ok).toBe(true);
    expect(isSlotAvailable(settings(), busy, "2026-12-01", "09:30", 60, { now }).ok).toBe(false); // would run into 10:00
    expect(isSlotAvailable(settings(), [appt("10:00", 60, "rejected")], "2026-12-01", "10:30", 30, { now }).ok).toBe(true);
  });

  it("allows overlaps up to capacity", () => {
    const busy = [appt("10:00", 60)];
    expect(isSlotAvailable(settings({ capacity: 2 }), busy, "2026-12-01", "10:00", 60, { now }).ok).toBe(true);
    expect(isSlotAvailable(settings({ capacity: 2 }), [...busy, appt("10:30", 30, "approved")], "2026-12-01", "10:30", 30, { now }).ok).toBe(false);
  });

  it("respects minimum notice, including across midnight, and blocked time ranges", () => {
    const late = new Date(2026, 11, 1, 20, 0);
    expect(isSlotAvailable(settings({ minNoticeHours: 24 }), [], "2026-12-02", "10:00", 30, { now: late }).ok).toBe(false);
    expect(isSlotAvailable(settings({ minNoticeHours: 12 }), [], "2026-12-02", "10:00", 30, { now: late }).ok).toBe(true);
    const s = settings({ blocked: [{ id: "b", date: "2026-12-01", start: "12:00", end: "14:00", reason: "Training" }] });
    expect(isSlotAvailable(s, [], "2026-12-01", "11:30", 60, { now }).ok).toBe(false);
    expect(isSlotAvailable(s, [], "2026-12-01", "14:00", 60, { now }).ok).toBe(true);
  });

  it("never offers past times or dates beyond the booking window", () => {
    const noon = new Date(2026, 11, 1, 12, 10);
    expect(isSlotAvailable(settings(), [], "2026-12-01", "11:30", 30, { now: noon }).ok).toBe(false);
    expect(getDayAvailability(settings({ windowDays: 7 }), [], "2026-12-20", 30, { now }).open).toBe(false);
  });
});

describe("validation", () => {
  it("normalises US and international phone numbers", () => {
    expect(normalizePhone("(305) 336-7129")).toBe("+13053367129");
    expect(normalizePhone("1-305-336-7129")).toBe("+13053367129");
    expect(normalizePhone("+57 300 123 4567")).toBe("+573001234567");
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("call me")).toBeNull();
  });

  it("rejects unsafe links", () => {
    expect(safeHref("javascript:alert(1)")).toBe("");
    expect(safeHref("//evil.com")).toBe("");
    expect(safeHref("/book")).toBe("/book");
    expect(safeHref("tel:+13053367129")).toBe("tel:+13053367129");
  });

  it("requires consent and core fields", () => {
    const e = validateAppointmentRequest({ treatmentId: "t", date: "2026-12-01", time: "10:00", name: "Al", email: "x", phone: "3055550100", consent: false }, { requireEmail: true });
    expect(Object.keys(e).sort()).toEqual(["consent", "email"]);
  });
});

describe("design safety", () => {
  it("strips injected CSS from colours and fonts", () => {
    const bad = sanitizeDesign({ ...SEED_DESIGN, colors: { ...SEED_DESIGN.colors, accent: "red;}</style><script>" }, fonts: { ...SEED_DESIGN.fonts, heading: "x;}" as never } });
    expect(bad.colors.accent).toBe("#B49A70");
    expect(bad.fonts.heading).toBe("cormorant");
  });

  it("darkens accent text until it is readable", () => {
    const c = readable("#B49A70", "#F8F6F1", 4.5);
    expect(contrast(c, "#F8F6F1")).toBeGreaterThanOrEqual(4.5);
  });
});
