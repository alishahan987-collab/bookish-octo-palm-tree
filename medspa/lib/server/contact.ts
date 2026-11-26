import "server-only";
import { repo } from "../repo";
import type { ContactMessage, NotificationLog } from "../types";
import { fillTemplate } from "../links";
import { formatPhone, normalizePhone, validateContact } from "../validation";
import { renderHtml, sendEmail } from "./email";
import { ApiError } from "./http";

export async function submitContact(input: { name: string; email: string; phone?: string; subject?: string; message: string; website?: string }, adminUrl: string) {
  if (input.website) throw new ApiError(400, "Your message could not be sent.");
  const errors = validateContact(input);
  if (Object.keys(errors).length) throw new ApiError(400, "Please check the highlighted fields.", errors as Record<string, string>);
  const [settings, design] = await Promise.all([repo.getDoc("settings"), repo.getDoc("design")]);
  const phone = input.phone ? formatPhone(normalizePhone(input.phone)!) : "";
  const saved = await repo.insertMessage({
    id: crypto.randomUUID(), name: input.name.trim(), email: input.email.trim().toLowerCase(), phone,
    subject: (input.subject ?? "").trim(), message: input.message.trim(), status: "new", notifications: [], createdAt: new Date().toISOString(),
  } satisfies ContactMessage);

  const clinicTo = settings.business.notificationEmail || settings.business.email;
  const body = `New website message from ${saved.name}\n\nEmail: ${saved.email}\nPhone: ${saved.phone || "-"}\nSubject: ${saved.subject || "-"}\n\n${saved.message}\n\nView all messages: ${adminUrl}`;
  const vars = { name: saved.name.split(" ")[0], business: settings.business.name, phone: settings.business.phoneDisplay };
  const replyBody = fillTemplate(settings.emails.contactReply.body, vars);
  const [clinic, customer] = await Promise.all([
    sendEmail({ to: clinicTo, subject: `Website message: ${saved.subject || saved.name}`, text: body, html: renderHtml(body, settings, design), replyTo: saved.email }),
    sendEmail({ to: saved.email, subject: fillTemplate(settings.emails.contactReply.subject, vars), text: `${replyBody}\n\n${settings.emails.signature}`, html: renderHtml(replyBody, settings, design), replyTo: settings.business.email || undefined }),
  ]);
  const logs: NotificationLog[] = [
    { at: new Date().toISOString(), to: "clinic", kind: "contact", ...clinic, detail: clinicTo ? clinic.detail : "No notification email set (Admin → Business info)" },
    { at: new Date().toISOString(), to: "customer", kind: "contactReply", ...customer },
  ];
  await repo.updateMessage(saved.id, { notifications: logs }).catch(() => undefined);
  return { ok: true };
}
