import { addDays, minutesToTime, timeToMinutes, todayISO, weekdayOf } from "../dates";
import type { Booking, ClinicSettings, DayAvailability, ISODate, Slot } from "./types";

/**
 * Pure slot engine. No storage access: the same function runs in the browser
 * today and can run in a Supabase Edge Function / API route in Phase 2.
 */

const ACTIVE = (b: Booking) => b.status !== "cancelled";

export function isSlotTaken(bookings: Booking[], doctorId: string, date: ISODate, time: string, ignoreBookingId?: string): boolean {
  return bookings.some(
    (b) => ACTIVE(b) && b.id !== ignoreBookingId && b.doctorId === doctorId && b.date === date && b.time === time,
  );
}

export function closedReason(settings: ClinicSettings, date: ISODate): string | null {
  const holiday = settings.holidays.find((h) => h.date === date);
  if (holiday) return holiday.label ? `Holiday: ${holiday.label}` : "Holiday";
  if (!settings.workingDays.includes(weekdayOf(date))) return "Closed";
  return null;
}

/** Times the clinic offers on that weekday, before bookings are considered. */
export function baseTimes(settings: ClinicSettings, date: ISODate): string[] {
  const dow = weekdayOf(date);
  const open = timeToMinutes(settings.openTime);
  const close = timeToMinutes(settings.closeTime);
  const step = Math.max(5, settings.slotMinutes);
  const breaks = settings.breaks
    .filter((b) => b.days.length === 0 || b.days.includes(dow))
    .map((b) => [timeToMinutes(b.start), timeToMinutes(b.end)] as const);

  const times: string[] = [];
  for (let t = open; t + step <= close; t += step) {
    const end = t + step;
    const overlapsBreak = breaks.some(([bs, be]) => t < be && end > bs);
    if (!overlapsBreak) times.push(minutesToTime(t));
  }
  return times;
}

export function getDayAvailability(
  settings: ClinicSettings,
  bookings: Booking[],
  date: ISODate,
  doctorId: string,
  opts: { now?: Date; ignoreBookingId?: string } = {},
): DayAvailability {
  const now = opts.now ?? new Date();
  const today = todayISO(now);
  if (date < today) return { date, open: false, reason: "Past date" };

  const reason = closedReason(settings, date);
  if (reason) return { date, open: false, reason };

  const times = baseTimes(settings, date);
  if (times.length === 0) return { date, open: false, reason: "No sessions" };

  const dayCount = bookings.filter((b) => ACTIVE(b) && b.date === date && b.id !== opts.ignoreBookingId).length;
  const full = dayCount >= settings.maxPerDay;
  const nowMin = now.getHours() * 60 + now.getMinutes() + settings.minNoticeMinutes;

  const slots: Slot[] = times.map((time) => {
    if (date === today && timeToMinutes(time) < nowMin) return { time, state: "past" };
    if (isSlotTaken(bookings, doctorId, date, time, opts.ignoreBookingId)) return { time, state: "booked" };
    if (full) return { time, state: "full" };
    return { time, state: "available" };
  });

  const visible = slots.filter((s) => s.state !== "past");
  if (visible.length === 0) return { date, open: false, reason: "No times left today" };

  const availableCount = visible.filter((s) => s.state === "available").length;
  return { date, open: true, slots: visible, availableCount };
}

export function getAvailabilityRange(
  settings: ClinicSettings,
  bookings: Booking[],
  doctorId: string,
  opts: { now?: Date; days?: number; ignoreBookingId?: string } = {},
): DayAvailability[] {
  const start = todayISO(opts.now ?? new Date());
  const days = opts.days ?? settings.bookingWindowDays;
  return Array.from({ length: days }, (_, i) =>
    getDayAvailability(settings, bookings, addDays(start, i), doctorId, opts),
  );
}
