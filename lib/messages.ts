import { formatDateLong, formatTime } from "./dates";
import type { Booking, ClinicSettings, ContactMethod } from "./data/types";

/**
 * Notification templates.
 *
 * In the prototype these are only RENDERED as a preview. Nothing is sent.
 * In Phase 2 the same templates feed the WhatsApp Business Cloud API (as
 * pre-approved message templates) and Resend (email).
 */

export type MessageKind = "confirmation" | "cancellation" | "reschedule" | "reminder";

export interface MessagePreview {
  whatsapp?: string;
  email?: { subject: string; body: string };
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

function whenText(b: Pick<Booking, "date" | "time">) {
  return `${formatDateLong(b.date)} at ${formatTime(b.time)}`;
}

export function buildMessages(
  kind: MessageKind,
  b: Booking,
  settings: ClinicSettings,
  extra: { previous?: Pick<Booking, "date" | "time"> } = {},
): MessagePreview {
  const name = firstName(b.patientName);
  const clinic = settings.clinicName;
  const where = `${settings.addressLine}, ${settings.city}`;
  const when = whenText(b);
  const ref = b.reference;

  let wa = "";
  let subject = "";
  let body = "";

  switch (kind) {
    case "confirmation":
      wa = `Assalam-o-Alaikum ${name}, thank you for booking with ${clinic}.\n\n*${b.treatmentName}*\n${when}\nRef: ${ref}\n\nOur team will confirm your appointment shortly. Location: ${where}.\nReply to this message to make changes.`;
      subject = `Appointment request received – ${ref}`;
      body = `Dear ${b.patientName},\n\nThank you for choosing ${clinic}. We have received your appointment request:\n\nTreatment: ${b.treatmentName}\nDate & time: ${when}\nReference: ${ref}\n\nOur team will confirm your appointment shortly.\n\nAddress: ${where}\n\nIf you need to change or cancel, simply reply to this email.\n\nWarm regards,\n${clinic}`;
      break;
    case "cancellation":
      wa = `Assalam-o-Alaikum ${name}, your appointment for *${b.treatmentName}* on ${when} (Ref: ${ref}) has been cancelled.\n\nTo book a new time, reply to this message or visit our website.`;
      subject = `Appointment cancelled – ${ref}`;
      body = `Dear ${b.patientName},\n\nYour appointment for ${b.treatmentName} on ${when} (reference ${ref}) has been cancelled.\n\nIf you would like to book another time, reply to this email or book online.\n\nWarm regards,\n${clinic}`;
      break;
    case "reschedule": {
      const was = extra.previous ? whenText(extra.previous) : "your previous time";
      wa = `Assalam-o-Alaikum ${name}, your appointment for *${b.treatmentName}* has been moved.\n\nNew time: ${when}\nPreviously: ${was}\nRef: ${ref}\n\nReply to this message if the new time does not suit you.`;
      subject = `Appointment rescheduled – ${ref}`;
      body = `Dear ${b.patientName},\n\nYour appointment for ${b.treatmentName} has been rescheduled.\n\nNew date & time: ${when}\nPrevious: ${was}\nReference: ${ref}\n\nIf the new time does not suit you, reply to this email.\n\nWarm regards,\n${clinic}`;
      break;
    }
    case "reminder":
      wa = `Reminder: ${name}, your *${b.treatmentName}* appointment at ${clinic} is on ${when}. Ref: ${ref}.`;
      subject = `Reminder: your appointment on ${formatDateLong(b.date)}`;
      body = `Dear ${b.patientName},\n\nThis is a reminder of your ${b.treatmentName} appointment on ${when}.\n\nAddress: ${where}\nReference: ${ref}\n\nWarm regards,\n${clinic}`;
      break;
  }

  const out: MessagePreview = {};
  if (wantsWhatsApp(b.contactMethod)) out.whatsapp = wa;
  if (wantsEmail(b.contactMethod) && b.email) out.email = { subject, body };
  return out;
}

export const wantsWhatsApp = (m: ContactMethod) => m === "whatsapp" || m === "both";
export const wantsEmail = (m: ContactMethod) => m === "email" || m === "both";

export const CONSENT_TEXT =
  "I agree that Aesthetica by Dr. Sajjad may contact me about this appointment using the method(s) I selected. I understand I can withdraw this consent at any time.";
