import { addDays, timeToMinutes, minutesToTime, toISODate, weekdayOf } from "./dates";
import type { Appointment, DayAvailability, ISODate, Settings, Slot } from "./types";
import { ACTIVE_STATUSES } from "./types";

/**
 * Pure availability engine (no storage access), shared by the website, the
 * admin and the server. Rules:
 *   - Start times every `slotInterval` minutes within the day's opening hours.
 *   - A start time is offered only if the whole treatment fits before closing.
 *   - Up to `capacity` appointments may overlap (rooms / providers).
 *   - Pending requests hold their place, so two people cannot request the
 *     same place; rejected / cancelled requests free it again.
 *   - Blocked days / time ranges, minimum notice and booking window apply.
 * The database repeats the capacity check inside a lock when saving.
 */

export type BusyAppointment = Pick<Appointment, "id" | "date" | "time" | "durationMinutes" | "status">;

export const isActive = (a: Pick<Appointment, "status">) => ACTIVE_STATUSES.includes(a.status);

export function overlapping(appts: BusyAppointment[], date: ISODate, start: number, end: number, ignoreId?: string): number {
  return appts.filter((a) => {
    if (a.id === ignoreId || a.date !== date || !isActive(a)) return false;
    const s = timeToMinutes(a.time);
    return s < end && s + a.durationMinutes > start;
  }).length;
}

export function dayHours(settings: Settings, date: ISODate) {
  const h = settings.business.hours.find((d) => d.day === weekdayOf(date));
  if (!h || h.closed) return null;
  const open = timeToMinutes(h.open);
  const close = timeToMinutes(h.close);
  return close > open ? { open, close } : null;
}

export function getDayAvailability(
  settings: Settings,
  appts: BusyAppointment[],
  date: ISODate,
  durationMinutes: number,
  opts: { now: Date; ignoreId?: string; ignoreNotice?: boolean },
): DayAvailability {
  const b = settings.booking;
  const today = toISODate(opts.now);
  if (date < today) return { date, open: false, reason: "Past date" };
  if (!opts.ignoreNotice && date > addDays(today, Math.max(1, b.windowDays) - 1)) return { date, open: false, reason: "Not open for booking yet" };

  const dayBlock = b.blocked.find((x) => x.date === date && (!x.start || !x.end));
  if (dayBlock) return { date, open: false, reason: dayBlock.reason || "Closed" };

  const hours = dayHours(settings, date);
  if (!hours) return { date, open: false, reason: "Closed" };

  const step = Math.max(5, b.slotInterval || 30);
  const duration = Math.max(5, durationMinutes || b.defaultMinutes || 60);
  const capacity = Math.max(1, b.capacity || 1);
  const blocks = b.blocked
    .filter((x) => x.date === date && x.start && x.end)
    .map((x) => [timeToMinutes(x.start), timeToMinutes(x.end)] as const);
  const nowMin = opts.now.getHours() * 60 + opts.now.getMinutes();
  const noticeCutoff = opts.ignoreNotice ? -1 : nowMin + Math.max(0, b.minNoticeHours) * 60;

  const slots: Slot[] = [];
  for (let t = hours.open; t + duration <= hours.close; t += step) {
    const end = t + duration;
    const time = minutesToTime(t);
    if (date === today && t < Math.max(noticeCutoff, nowMin)) slots.push({ time, state: "past" });
    else if (!opts.ignoreNotice && date !== today && b.minNoticeHours > 0 && isWithinNotice(opts.now, date, t, b.minNoticeHours)) slots.push({ time, state: "past" });
    else if (blocks.some(([bs, be]) => t < be && end > bs)) slots.push({ time, state: "blocked" });
    else if (overlapping(appts, date, t, end, opts.ignoreId) >= capacity) slots.push({ time, state: "full" });
    else slots.push({ time, state: "available" });
  }

  const visible = slots.filter((s) => s.state === "available" || s.state === "full");
  if (visible.length === 0) return { date, open: false, reason: date === today ? "No times left today" : "Unavailable" };
  return { date, open: true, slots: visible, available: visible.filter((s) => s.state === "available").length };
}

/** Minimum notice that spills over midnight (e.g. 24h notice). */
function isWithinNotice(now: Date, date: ISODate, startMin: number, hours: number): boolean {
  const [y, m, d] = date.split("-").map(Number);
  const start = new Date(y, m - 1, d, Math.floor(startMin / 60), startMin % 60);
  return start.getTime() - now.getTime() < hours * 3600_000;
}

export function getAvailabilityRange(
  settings: Settings,
  appts: BusyAppointment[],
  durationMinutes: number,
  opts: { now: Date; days?: number; from?: ISODate; ignoreId?: string; ignoreNotice?: boolean },
): DayAvailability[] {
  const start = opts.from ?? toISODate(opts.now);
  const days = Math.min(Math.max(opts.days ?? settings.booking.windowDays, 1), 120);
  return Array.from({ length: days }, (_, i) => getDayAvailability(settings, appts, addDays(start, i), durationMinutes, opts));
}

export function isSlotAvailable(
  settings: Settings,
  appts: BusyAppointment[],
  date: ISODate,
  time: string,
  durationMinutes: number,
  opts: { now: Date; ignoreId?: string; ignoreNotice?: boolean },
): { ok: true } | { ok: false; reason: string } {
  const day = getDayAvailability(settings, appts, date, durationMinutes, opts);
  if (!day.open) return { ok: false, reason: day.reason };
  const slot = day.slots.find((s) => s.time === time);
  if (!slot) return { ok: false, reason: "That time is not offered on this day." };
  if (slot.state !== "available") return { ok: false, reason: "That time has just been taken. Please choose another time." };
  return { ok: true };
}
