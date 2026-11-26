import type { HHmm, ISODate } from "./types";

/** Calendar helpers. All dates are spa-local calendar dates ("YYYY-MM-DD"). */

const pad = (n: number) => String(n).padStart(2, "0");

export const toISODate = (d: Date): ISODate => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const isISODate = (s: unknown): s is ISODate =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && toISODate(parseISODate(s)) === s;

export const isHHmm = (s: unknown): s is HHmm => typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

export function addDays(s: ISODate, days: number): ISODate {
  const d = parseISODate(s);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export const weekdayOf = (s: ISODate) => parseISODate(s).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function timeToMinutes(t: HHmm): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export const minutesToTime = (min: number): HHmm => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

/** "14:30" → "2:30 PM" */
export function formatTime(t: HHmm): string {
  const min = timeToMinutes(t);
  const h = Math.floor(min / 60);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(min % 60)} ${suffix}`;
}

export function formatDate(s: ISODate, opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }): string {
  return parseISODate(s).toLocaleDateString("en-US", opts);
}

export const formatDateLong = (s: ISODate) => formatDate(s, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

export const WEEKDAYS = [
  { id: 1, short: "Mon", long: "Monday" },
  { id: 2, short: "Tue", long: "Tuesday" },
  { id: 3, short: "Wed", long: "Wednesday" },
  { id: 4, short: "Thu", long: "Thursday" },
  { id: 5, short: "Fri", long: "Friday" },
  { id: 6, short: "Sat", long: "Saturday" },
  { id: 0, short: "Sun", long: "Sunday" },
] as const;

/** Spa time zone. Servers (Vercel) run in UTC; availability must use the spa's wall clock. */
export const SPA_TIME_ZONE = process.env.NEXT_PUBLIC_SPA_TIMEZONE || "America/New_York";

/** A Date whose local fields equal the spa's current wall-clock time. */
export function spaNow(at = new Date(), timeZone = SPA_TIME_ZONE): Date {
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
      }).formatToParts(at).map((p) => [p.type, p.value]),
    );
    return new Date(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  } catch {
    return at;
  }
}
