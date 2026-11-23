/**
 * Clinic-local "now". Servers (e.g. Vercel) run in UTC; the slot engine needs
 * the clinic's wall-clock time. Returns a Date whose local fields equal the
 * clinic's local time, so date helpers work unchanged on server and browser.
 */
export const CLINIC_TIME_ZONE = process.env.NEXT_PUBLIC_CLINIC_TIMEZONE || "Asia/Karachi";

export function clinicNow(timeZone = CLINIC_TIME_ZONE, at = new Date()): Date {
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-GB", {
        timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
      }).formatToParts(at).map((p) => [p.type, p.value]),
    );
    return new Date(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  } catch {
    return at;
  }
}
