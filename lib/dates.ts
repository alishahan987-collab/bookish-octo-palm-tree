import type { HHmm, ISODate, Weekday } from "./data/types";

/**
 * Date helpers. All dates are clinic-local calendar dates ("YYYY-MM-DD").
 * The prototype uses the viewer's local clock, which is Asia/Karachi for the
 * clinic and its patients. Phase 2 should compute "today" server-side in
 * Asia/Karachi.
 */

const pad = (n: number) => String(n).padStart(2, "0");

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now);
}

export function addDays(s: ISODate, days: number): ISODate {
  const d = parseISODate(s);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function weekdayOf(s: ISODate): Weekday {
  return parseISODate(s).getDay() as Weekday;
}

export function timeToMinutes(t: HHmm): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(min: number): HHmm {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

export function formatTime(t: HHmm): string {
  const min = timeToMinutes(t);
  const h = Math.floor(min / 60);
  const m = min % 60;
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${suffix}`;
}

export function formatDate(s: ISODate, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }): string {
  return parseISODate(s).toLocaleDateString("en-GB", opts);
}

export function formatDateLong(s: ISODate): string {
  return formatDate(s, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export const WEEKDAYS: { id: Weekday; short: string; long: string }[] = [
  { id: 1, short: "Mon", long: "Monday" },
  { id: 2, short: "Tue", long: "Tuesday" },
  { id: 3, short: "Wed", long: "Wednesday" },
  { id: 4, short: "Thu", long: "Thursday" },
  { id: 5, short: "Fri", long: "Friday" },
  { id: 6, short: "Sat", long: "Saturday" },
  { id: 0, short: "Sun", long: "Sunday" },
];
