import { isHHmm, isISODate } from "./dates";
import type { AppointmentRequest } from "./types";

/** Shared by the browser (instant feedback) and the server (authoritative). */

export const isValidEmail = (v: string) => /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}$/.test(v.trim()) && v.trim().length <= 200;

/** Accepts US numbers in common formats, and international numbers starting with +. Returns E.164 or null. */
export function normalizePhone(input: string): string | null {
  const raw = input.trim();
  if (!raw || /[^\d\s\-+().]/.test(raw)) return null;
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+")) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  if (digits.length === 10 && /^[2-9]/.test(digits)) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export function formatPhone(e164: string): string {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

export type FieldErrors = Partial<Record<"treatmentId" | "date" | "time" | "name" | "email" | "phone" | "message" | "consent" | "subject", string>>;

export function validateAppointmentRequest(r: Partial<AppointmentRequest>, opts: { requireEmail: boolean }): FieldErrors {
  const e: FieldErrors = {};
  if (!r.treatmentId) e.treatmentId = "Please choose a treatment.";
  if (!isISODate(r.date)) e.date = "Please choose a date.";
  if (!isHHmm(r.time)) e.time = "Please choose a time.";
  const name = (r.name ?? "").trim();
  if (name.length < 2) e.name = "Please enter your full name.";
  else if (name.length > 100) e.name = "Please use 100 characters or fewer.";
  const email = (r.email ?? "").trim();
  if (opts.requireEmail || email) {
    if (!email) e.email = "Please enter your email address.";
    else if (!isValidEmail(email)) e.email = "Please enter a valid email address.";
  }
  if (!normalizePhone(r.phone ?? "")) e.phone = "Please enter a valid phone number, e.g. (305) 555-0123.";
  if ((r.message ?? "").length > 1000) e.message = "Please keep your message under 1,000 characters.";
  if (r.consent !== true) e.consent = "Please confirm so we can contact you about your request.";
  return e;
}

export function validateContact(m: { name?: string; email?: string; phone?: string; message?: string; subject?: string }): FieldErrors {
  const e: FieldErrors = {};
  const name = (m.name ?? "").trim();
  if (name.length < 2 || name.length > 100) e.name = "Please enter your name.";
  if (!isValidEmail(m.email ?? "")) e.email = "Please enter a valid email address.";
  if (m.phone && !normalizePhone(m.phone)) e.phone = "Please enter a valid phone number or leave it empty.";
  const msg = (m.message ?? "").trim();
  if (msg.length < 2) e.message = "Please write a message.";
  else if (msg.length > 3000) e.message = "Please keep your message under 3,000 characters.";
  if ((m.subject ?? "").length > 150) e.subject = "Please use a shorter subject.";
  return e;
}

/** Allows only safe link targets in admin-entered content. */
export function safeHref(href: string | undefined): string {
  const h = (href ?? "").trim();
  if (!h) return "";
  if (/^(https?:\/\/|mailto:|tel:|sms:|\/(?!\/)|#)/i.test(h)) return h;
  return "";
}

export const isExternal = (href: string) => /^(https?:)?\/\//i.test(href);
