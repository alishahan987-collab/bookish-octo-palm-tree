import { formatDateLong, formatTime } from "./dates";
import type { Booking, ContactMethod, SiteContent } from "./data/types";

/**
 * Notification templates (single source of truth).
 *
 * - Email: sent as-is through Resend (server-side) when configured.
 * - WhatsApp: business-initiated messages must use Meta-approved templates.
 *   `whatsappTemplateParams` gives the 4 variables to register in your
 *   template ({{1}} name, {{2}} treatment, {{3}} date & time, {{4}} reference).
 *   The `whatsapp` text below is the human-readable version shown in previews
 *   and suggested as the template body.
 */

export type MessageKind = "confirmation" | "accepted" | "rejected" | "cancellation" | "reschedule" | "reminder";

export interface MessagePreview {
  whatsapp?: string;
  email?: { subject: string; body: string };
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;
const whenText = (b: Pick<Booking, "date" | "time">) => `${formatDateLong(b.date)} at ${formatTime(b.time)}`;

export function buildMessages(
  kind: MessageKind,
  b: Booking,
  content: SiteContent,
  extra: { previous?: Pick<Booking, "date" | "time">; reason?: string } = {},
): MessagePreview {
  const name = firstName(b.patientName);
  const clinic = content.brand.clinicName;
  const where = [content.contact.address, content.contact.city].filter(Boolean).join(", ");
  const contactLine = [content.contact.phone && `Phone: ${content.contact.phone}`, content.contact.email && `Email: ${content.contact.email}`]
    .filter(Boolean)
    .join("\n");
  const when = whenText(b);
  const ref = b.reference;
  const sign = `\n\nWarm regards,\n${clinic}${contactLine ? `\n${contactLine}` : ""}`;

  let wa = "";
  let subject = "";
  let body = "";

  switch (kind) {
    case "confirmation":
      wa = `Assalam-o-Alaikum ${name}, thank you for booking with ${clinic}.\n\n*${b.treatmentName}*\n${when}\nRef: ${ref}\n\nWe have received your request and will confirm shortly. Location: ${where}.`;
      subject = `Appointment request received – ${ref}`;
      body = `Dear ${b.patientName},\n\nThank you for choosing ${clinic}. We have received your appointment request:\n\nTreatment: ${b.treatmentName}\nDate & time: ${when}\nReference: ${ref}\n\nOur team will confirm your appointment shortly.\n\nAddress: ${where}${sign}`;
      break;
    case "accepted":
      wa = `Assalam-o-Alaikum ${name}, your appointment at ${clinic} is *confirmed*.\n\n*${b.treatmentName}*\n${when}\nRef: ${ref}\n\nLocation: ${where}. Please arrive 10 minutes early.`;
      subject = `Appointment confirmed – ${ref}`;
      body = `Dear ${b.patientName},\n\nYour appointment is confirmed.\n\nTreatment: ${b.treatmentName}\nDate & time: ${when}\nReference: ${ref}\nAddress: ${where}\n\nPlease arrive 10 minutes early. If you need to change your appointment, reply to this email.${sign}`;
      break;
    case "rejected":
      wa = `Assalam-o-Alaikum ${name}, unfortunately we are unable to accommodate your request for *${b.treatmentName}* on ${when} (Ref: ${ref}).${extra.reason ? `\n\nNote: ${extra.reason}` : ""}\n\nPlease book another time online or reply to this message.`;
      subject = `About your appointment request – ${ref}`;
      body = `Dear ${b.patientName},\n\nThank you for your request. Unfortunately we are unable to accommodate ${b.treatmentName} on ${when} (reference ${ref}).${extra.reason ? `\n\nNote from the clinic: ${extra.reason}` : ""}\n\nPlease choose another time on our website or reply to this email and we will help.${sign}`;
      break;
    case "cancellation":
      wa = `Assalam-o-Alaikum ${name}, your appointment for *${b.treatmentName}* on ${when} (Ref: ${ref}) has been cancelled.\n\nTo book a new time, visit our website or reply to this message.`;
      subject = `Appointment cancelled – ${ref}`;
      body = `Dear ${b.patientName},\n\nYour appointment for ${b.treatmentName} on ${when} (reference ${ref}) has been cancelled.\n\nIf you would like to book another time, reply to this email or book online.${sign}`;
      break;
    case "reschedule": {
      const was = extra.previous ? whenText(extra.previous) : "your previous time";
      wa = `Assalam-o-Alaikum ${name}, your appointment for *${b.treatmentName}* has been moved.\n\nNew time: ${when}\nPreviously: ${was}\nRef: ${ref}\n\nReply to this message if the new time does not suit you.`;
      subject = `Appointment rescheduled – ${ref}`;
      body = `Dear ${b.patientName},\n\nYour appointment for ${b.treatmentName} has been rescheduled.\n\nNew date & time: ${when}\nPrevious: ${was}\nReference: ${ref}\n\nIf the new time does not suit you, reply to this email.${sign}`;
      break;
    }
    case "reminder":
      wa = `Reminder: ${name}, your *${b.treatmentName}* appointment at ${clinic} is on ${when}. Ref: ${ref}.`;
      subject = `Reminder: your appointment on ${formatDateLong(b.date)}`;
      body = `Dear ${b.patientName},\n\nThis is a reminder of your ${b.treatmentName} appointment on ${when}.\n\nAddress: ${where}\nReference: ${ref}${sign}`;
      break;
  }

  const out: MessagePreview = {};
  if (wantsWhatsApp(b.contactMethod)) out.whatsapp = wa;
  if (b.email) out.email = { subject, body };
  return out;
}

/** Alert sent to the clinic for every new booking request. */
export function buildClinicAlert(b: Booking, content: SiteContent, siteUrl?: string) {
  const subject = `New appointment request: ${b.patientName} – ${b.treatmentName} (${b.reference})`;
  const body = [
    `New appointment request on ${content.brand.clinicName} website.`,
    "",
    `Reference: ${b.reference}`,
    `Treatment: ${b.treatmentName}`,
    `Requested: ${whenText(b)}`,
    `Patient: ${b.patientName}`,
    `Mobile: ${b.phone}`,
    `Email: ${b.email ?? "—"}`,
    `Prefers: ${{ whatsapp: "WhatsApp", email: "Email", both: "WhatsApp and email" }[b.contactMethod]}`,
    b.notes ? `Notes: ${b.notes}` : "",
    "",
    siteUrl ? `Review and accept or reject: ${siteUrl.replace(/\/$/, "")}/admin` : "Review it in the admin dashboard.",
  ]
    .filter((l) => l !== null)
    .join("\n");
  const whatsapp = `New booking request ${b.reference}: ${b.patientName}, ${b.treatmentName}, ${whenText(b)}. Mobile ${b.phone}.`;
  return { subject, body, whatsapp };
}

export function whatsappTemplateParams(b: Booking): string[] {
  return [firstName(b.patientName), b.treatmentName, whenText(b), b.reference];
}

export const wantsWhatsApp = (m: ContactMethod) => m === "whatsapp" || m === "both";
export const wantsEmail = (m: ContactMethod) => m === "email" || m === "both";

export const CONSENT_TEXT =
  "I agree that the clinic may store my details to manage this appointment and contact me about it by email and, if selected, WhatsApp. I can withdraw this consent at any time.";
