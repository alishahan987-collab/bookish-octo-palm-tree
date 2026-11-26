import "server-only";
import { fillTemplate, fullAddress } from "../links";
import { formatDateLong, formatTime } from "../dates";
import type { Appointment, Design, EmailKind, NotificationLog, Settings } from "../types";

/**
 * Transactional email through Resend (https://resend.com). Without
 * RESEND_API_KEY and EMAIL_FROM nothing is sent and the result says
 * "skipped", which the admin shows next to each appointment.
 */

const API = process.env.RESEND_API_URL || "https://api.resend.com/emails";
export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function renderHtml(body: string, settings: Settings, design: Design): string {
  const c = design.colors;
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const signature = esc(settings.emails.signature).replace(/\n/g, "<br>");
  return `<!doctype html><html><body style="margin:0;background:${c.background};font-family:Helvetica,Arial,sans-serif;color:${c.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.background};padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${c.surface};border:1px solid ${c.alt}">
<tr><td style="padding:28px 32px;border-bottom:1px solid ${c.alt};font-family:Georgia,serif;font-size:22px;letter-spacing:1px">${esc(settings.business.name)}</td></tr>
<tr><td style="padding:28px 32px;font-size:15px">${paragraphs}</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid ${c.alt};font-size:12px;color:#6b6259;line-height:1.6">${signature}</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendEmail(msg: { to: string; subject: string; text: string; html: string; replyTo?: string }): Promise<{ status: NotificationLog["status"]; detail: string }> {
  if (!msg.to) return { status: "skipped", detail: "No recipient email address" };
  if (!emailConfigured()) return { status: "skipped", detail: "Email is not configured (RESEND_API_KEY / EMAIL_FROM)" };
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [msg.to], subject: msg.subject, text: msg.text, html: msg.html, ...(msg.replyTo ? { reply_to: msg.replyTo } : {}) }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { status: "failed", detail: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }
    const json = (await res.json().catch(() => ({}))) as { id?: string };
    return { status: "sent", detail: json.id ? `Resend id ${json.id}` : "Sent" };
  } catch (e) {
    return { status: "failed", detail: (e as Error).message };
  }
}

export function appointmentVars(a: Appointment, settings: Settings, reason = ""): Record<string, string> {
  return {
    name: a.name.split(" ")[0] || a.name,
    fullname: a.name,
    treatment: a.treatmentName,
    date: formatDateLong(a.date),
    time: formatTime(a.time),
    reference: a.reference,
    business: settings.business.name,
    phone: settings.business.phoneDisplay,
    address: fullAddress(settings.business),
    reason,
  };
}

/** Email to the customer using an editable template. */
export async function emailCustomer(kind: EmailKind, a: Appointment, settings: Settings, design: Design, reason = ""): Promise<NotificationLog> {
  const t = settings.emails[kind];
  const vars = appointmentVars(a, settings, reason);
  const subject = fillTemplate(t.subject, vars);
  const body = fillTemplate(t.body, vars).replace(/\n{3,}/g, "\n\n").trim();
  const r = await sendEmail({
    to: a.email, subject, text: `${body}\n\n${settings.emails.signature}`, html: renderHtml(body, settings, design),
    replyTo: settings.business.email || settings.business.notificationEmail || undefined,
  });
  return { at: new Date().toISOString(), to: "customer", kind, ...r };
}

/** New-request alert to the spa. */
export async function emailClinicNewRequest(a: Appointment, settings: Settings, design: Design, adminUrl: string): Promise<NotificationLog> {
  const to = settings.business.notificationEmail || settings.business.email;
  const body = [
    `New appointment request (${a.reference}).`,
    `Treatment: ${a.treatmentName}\nRequested: ${formatDateLong(a.date)} at ${formatTime(a.time)}\nName: ${a.name}\nPhone: ${a.phone}\nEmail: ${a.email || "-"}`,
    a.message ? `Message:\n${a.message}` : "",
    `This request is pending. Approve, reject or reschedule it in the admin dashboard:\n${adminUrl}`,
  ].filter(Boolean).join("\n\n");
  const r = await sendEmail({ to, subject: `New appointment request: ${a.treatmentName}, ${formatDateLong(a.date)} ${formatTime(a.time)}`, text: body, html: renderHtml(body, settings, design), replyTo: a.email || undefined });
  return { at: new Date().toISOString(), to: "clinic", kind: "new-request", ...r, detail: to ? r.detail : "No notification email set (Admin → Business info)" };
}
