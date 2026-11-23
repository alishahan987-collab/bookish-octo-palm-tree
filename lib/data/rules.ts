import { CONSENT_TEXT } from "../messages";
import { isValidEmail, normalisePkMobile } from "../phone";
import { validatePrice } from "../pricing";
import { getDayAvailability } from "./slots";
import { DataError } from "./source";
import type { Booking, BookingInput, BookingStatus, ClinicSettings, Treatment } from "./types";

/**
 * Business rules shared by the browser demo store and the server API routes,
 * so both modes behave identically.
 */

export const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "rejected", "cancelled", "arrived"],
  confirmed: ["arrived", "cancelled", "completed"],
  arrived: ["completed"],
  completed: [],
  cancelled: [],
  rejected: [],
};

export const allowedNextStatuses = (s: BookingStatus) => TRANSITIONS[s];
export const canReschedule = (s: BookingStatus) => s === "pending" || s === "confirmed";

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function uniqueSlug(base: string, taken: (s: string) => boolean): string {
  const root = slugify(base) || "item";
  let slug = root;
  for (let i = 2; taken(slug); i++) slug = `${root}-${i}`;
  return slug;
}

export interface NormalisedBooking {
  treatment: Treatment;
  patientName: string;
  phone: string;
  email?: string;
  notes?: string;
}

/** Validates a booking request against the catalogue, settings and existing bookings. Throws DataError. */
export function validateBooking(
  input: BookingInput & { website?: string },
  ctx: { treatments: Treatment[]; settings: ClinicSettings; bookings: Booking[]; now?: Date },
): NormalisedBooking {
  // Honeypot: real visitors never fill the hidden "website" field.
  if (input.website) throw new DataError("VALIDATION", "Unable to process this request.");
  const treatment = ctx.treatments.find((t) => t.id === input.treatmentId && t.active);
  if (!treatment) throw new DataError("NOT_FOUND", "Please choose a treatment.");
  const patientName = (input.patientName ?? "").trim().replace(/\s+/g, " ");
  if (patientName.length < 2 || patientName.length > 80) throw new DataError("VALIDATION", "Please enter your full name.");
  const phone = normalisePkMobile(input.phone ?? "");
  if (!phone) throw new DataError("VALIDATION", "Please enter a valid Pakistani mobile number.");
  const email = input.email?.trim() || undefined;
  if (email && (!isValidEmail(email) || email.length > 120)) throw new DataError("VALIDATION", "Please enter a valid email address.");
  if (!email && (ctx.settings.requireEmail || input.contactMethod !== "whatsapp"))
    throw new DataError("VALIDATION", "Please enter your email address.");
  if (!["whatsapp", "email", "both"].includes(input.contactMethod)) throw new DataError("VALIDATION", "Choose how we should contact you.");
  if (input.consent !== true) throw new DataError("VALIDATION", "Please agree to be contacted about your appointment.");
  const notes = input.notes?.trim().slice(0, 500) || undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^\d{2}:\d{2}$/.test(input.time)) throw new DataError("VALIDATION", "Please choose a date and time.");

  const day = getDayAvailability(ctx.settings, ctx.bookings, input.date, input.doctorId, { now: ctx.now });
  if (!day.open) throw new DataError("DAY_CLOSED", `Sorry, the clinic is not taking bookings on that day (${day.reason}).`);
  const slot = day.slots.find((s) => s.time === input.time);
  if (!slot || slot.state !== "available") throw new DataError("SLOT_UNAVAILABLE", "Sorry, that time has just been taken. Please choose another slot.");

  return { treatment, patientName, phone, email, notes };
}

export function buildBooking(n: NormalisedBooking, input: BookingInput, ids: { id: string; reference: string }, now = new Date()): Booking {
  const at = now.toISOString();
  return {
    id: ids.id,
    reference: ids.reference,
    treatmentId: n.treatment.id,
    treatmentName: n.treatment.name,
    doctorId: input.doctorId,
    date: input.date,
    time: input.time,
    patientName: n.patientName,
    phone: n.phone,
    email: n.email,
    contactMethod: input.contactMethod,
    consent: { given: true, at, text: CONSENT_TEXT },
    notes: n.notes,
    status: "pending",
    createdAt: at,
    history: [{ at, action: "created", note: "Booked online" }],
    notifications: [],
  };
}

export function applyStatus(b: Booking, status: Exclude<BookingStatus, "pending">, note?: string): Booking {
  if (!TRANSITIONS[b.status].includes(status))
    throw new DataError("INVALID_TRANSITION", `A ${b.status} appointment cannot be changed to ${status}.`);
  return { ...b, status, history: [...b.history, { at: new Date().toISOString(), action: status, note: note?.slice(0, 300) }] };
}

export function referenceFor(year: number, n: number) {
  return `AES-${year}-${String(n).padStart(4, "0")}`;
}

/* ------------------------------ content validation ------------------------------ */

export function assertTreatment(t: { name: string; shortDescription: string; price: Treatment["price"] }) {
  if (!t.name.trim()) throw new DataError("VALIDATION", "Procedure name is required.");
  if (!t.shortDescription.trim()) throw new DataError("VALIDATION", "Add a short description.");
  const err = validatePrice(t.price);
  if (err) throw new DataError("VALIDATION", err);
}

export function assertSettings(s: ClinicSettings) {
  if (s.openTime >= s.closeTime) throw new DataError("VALIDATION", "Opening time must be before closing time.");
  if (!(s.slotMinutes >= 10 && s.slotMinutes <= 180)) throw new DataError("VALIDATION", "Slot length must be 10–180 minutes.");
  if (!(s.maxPerDay >= 1)) throw new DataError("VALIDATION", "Maximum appointments per day must be at least 1.");
  for (const b of s.breaks) if (b.start >= b.end) throw new DataError("VALIDATION", `Break "${b.label || "Untitled"}" must end after it starts.`);
  for (const b of s.blocked ?? []) if (b.start >= b.end) throw new DataError("VALIDATION", "Blocked time must end after it starts.");
}
