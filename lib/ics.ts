import { addDays } from "./dates";
import type { Booking, SiteContent } from "./data/types";
import { CLINIC_TIME_ZONE } from "./tz";

/** Build an .ics calendar file so clients can save the appointment locally (times in the clinic time zone). */
export function bookingToICS(b: Booking, c: SiteContent, durationMin = 30): string {
  const [h, m] = b.time.split(":").map(Number);
  const endMin = h * 60 + m + durationMin;
  const d = b.date.replace(/-/g, "");
  const endDate = endMin >= 1440 ? addDays(b.date, 1).replace(/-/g, "") : d;
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = `${d}T${pad(h)}${pad(m)}00`;
  const end = `${endDate}T${pad(Math.floor(endMin / 60) % 24)}${pad(endMin % 60)}00`;
  const esc = (t: string) => t.replace(/[,;\\]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Clinic website//EN",
    "BEGIN:VEVENT",
    `UID:${b.id}@clinic-website`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;TZID=${CLINIC_TIME_ZONE}:${start}`,
    `DTEND;TZID=${CLINIC_TIME_ZONE}:${end}`,
    `SUMMARY:${esc(`${b.treatmentName} – ${c.brand.clinicName}`)}`,
    `LOCATION:${esc([c.contact.address, c.contact.city].filter(Boolean).join(", "))}`,
    `DESCRIPTION:${esc(`Reference ${b.reference}. Awaiting confirmation from the clinic.`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
