import { WEEKDAYS, formatTime, timeToMinutes } from "./dates";
import type { ClinicSettings, HHmm, Weekday } from "./data/types";

/** Opening hours for a weekday, or null when closed. */
export function hoursFor(s: ClinicSettings, day: Weekday): { open: HHmm; close: HHmm } | null {
  if (!s.workingDays.includes(day)) return null;
  return s.dayHours?.[String(day)] ?? { open: s.openTime, close: s.closeTime };
}

export interface HoursRow {
  days: string;
  time: string;
  closed?: boolean;
}

/** Groups consecutive days with identical hours: "Mon – Fri  9:30 AM – 6:30 PM". Week starts on Monday. */
export function groupedHours(s: ClinicSettings): HoursRow[] {
  const rows: { from: string; to: string; key: string; time: string; closed: boolean }[] = [];
  for (const d of WEEKDAYS) {
    const h = hoursFor(s, d.id);
    const key = h ? `${h.open}-${h.close}` : "closed";
    const last = rows[rows.length - 1];
    if (last && last.key === key) last.to = d.short;
    else rows.push({ from: d.short, to: d.short, key, time: h ? `${formatTime(h.open)} – ${formatTime(h.close)}` : "Closed", closed: !h });
  }
  return rows.map((r) => ({ days: r.from === r.to ? r.from : `${r.from} – ${r.to}`, time: r.time, closed: r.closed || undefined }));
}

/** One line per weekday, Monday first (used for the full timetable). */
export function weeklyHours(s: ClinicSettings): { day: string; short: string; time: string; id: Weekday }[] {
  return WEEKDAYS.map((d) => {
    const h = hoursFor(s, d.id);
    return { id: d.id, day: d.long, short: d.short, time: h ? `${formatTime(h.open)} – ${formatTime(h.close)}` : "Closed" };
  });
}

/** "Open now · until 6:30 PM" / "Closed · opens 10:00 AM tomorrow". `now` must be clinic-local (see lib/tz). */
export function openStatus(s: ClinicSettings, now: Date): { open: boolean; label: string } {
  const day = now.getDay() as Weekday;
  const min = now.getHours() * 60 + now.getMinutes();
  const today = hoursFor(s, day);
  if (today && min >= timeToMinutes(today.open) && min < timeToMinutes(today.close)) {
    return { open: true, label: `Open now · until ${formatTime(today.close)}` };
  }
  if (today && min < timeToMinutes(today.open)) return { open: false, label: `Closed · opens ${formatTime(today.open)} today` };
  for (let i = 1; i <= 7; i++) {
    const d = ((day + i) % 7) as Weekday;
    const h = hoursFor(s, d);
    if (h) {
      const when = i === 1 ? "tomorrow" : WEEKDAYS.find((w) => w.id === d)!.long;
      return { open: false, label: `Closed · opens ${formatTime(h.open)} ${when}` };
    }
  }
  return { open: false, label: "By appointment" };
}
