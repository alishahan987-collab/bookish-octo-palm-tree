import "server-only";
import { buildClinicAlert, buildMessages, whatsappTemplateParams, type MessageKind } from "../messages";
import type { Booking, NotificationLog, SiteContent } from "../data/types";

/**
 * Real notification delivery (server-side only).
 *   Email:    Resend REST API      (RESEND_API_KEY, EMAIL_FROM)
 *   WhatsApp: Meta Cloud API       (WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE_*)
 * If a channel is not configured it is recorded as "skipped": nothing is faked.
 * Delivery never throws: a failed message must not lose the booking.
 */

const env = (k: string) => process.env[k]?.trim() || "";

export const notifyConfig = () => ({
  email: Boolean(env("RESEND_API_KEY") && env("EMAIL_FROM")),
  whatsapp: Boolean(env("WHATSAPP_TOKEN") && env("WHATSAPP_PHONE_NUMBER_ID")),
});

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function emailHtml(body: string, clinic: string) {
  return `<!doctype html><html><body style="margin:0;background:#f5efe5;font-family:Helvetica,Arial,sans-serif;color:#1f1d1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf9;border-radius:16px;border:1px solid #e4d9c6">
<tr><td style="padding:28px 32px 8px;font-family:Georgia,serif;font-size:24px;color:#1f1d1a">${escapeHtml(clinic)}</td></tr>
<tr><td style="padding:8px 32px 32px;font-size:15px;line-height:1.6">${escapeHtml(body).replace(/\n/g, "<br>")}</td></tr>
</table></td></tr></table></body></html>`;
}

async function sendEmail(to: string, subject: string, text: string, clinic: string, replyTo?: string): Promise<{ ok: boolean; detail: string }> {
  if (!notifyConfig().email) return { ok: false, detail: "skipped:Email is not configured" };
  try {
    const res = await fetch(`${env("RESEND_API_URL") || "https://api.resend.com"}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env("EMAIL_FROM"), to: [to], subject, text, html: emailHtml(text, clinic), ...(replyTo ? { reply_to: replyTo } : {}) }),
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    return res.ok ? { ok: true, detail: json.id ?? "sent" } : { ok: false, detail: json.message ?? `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : "Network error" };
  }
}

const TEMPLATE_ENV: Record<MessageKind | "clinic", string> = {
  confirmation: "WHATSAPP_TEMPLATE_CONFIRMATION",
  accepted: "WHATSAPP_TEMPLATE_ACCEPTED",
  rejected: "WHATSAPP_TEMPLATE_REJECTED",
  cancellation: "WHATSAPP_TEMPLATE_CANCELLED",
  reschedule: "WHATSAPP_TEMPLATE_RESCHEDULED",
  reminder: "WHATSAPP_TEMPLATE_REMINDER",
  clinic: "WHATSAPP_TEMPLATE_CLINIC_ALERT",
};

async function sendWhatsApp(toDigits: string, kind: MessageKind | "clinic", params: string[]): Promise<{ ok: boolean; detail: string }> {
  if (!notifyConfig().whatsapp) return { ok: false, detail: "skipped:WhatsApp is not configured" };
  const template = env(TEMPLATE_ENV[kind]);
  if (!template) return { ok: false, detail: `skipped:No approved template set (${TEMPLATE_ENV[kind]})` };
  try {
    const base = env("WHATSAPP_API_URL") || "https://graph.facebook.com/v21.0";
    const res = await fetch(`${base}/${env("WHATSAPP_PHONE_NUMBER_ID")}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env("WHATSAPP_TOKEN")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toDigits,
        type: "template",
        template: {
          name: template,
          language: { code: env("WHATSAPP_TEMPLATE_LANG") || "en" },
          components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }],
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message: string } };
    return res.ok ? { ok: true, detail: json.messages?.[0]?.id ?? "sent" } : { ok: false, detail: json.error?.message ?? `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : "Network error" };
  }
}

function log(channel: NotificationLog["channel"], audience: NotificationLog["audience"], kind: string, r: { ok: boolean; detail: string }): NotificationLog {
  const skipped = r.detail.startsWith("skipped:");
  return {
    at: new Date().toISOString(),
    channel,
    audience,
    kind,
    status: r.ok ? "sent" : skipped ? "skipped" : "failed",
    detail: skipped ? r.detail.slice(8) : r.detail.slice(0, 200),
  };
}

export async function notifyPatient(
  kind: MessageKind,
  b: Booking,
  content: SiteContent,
  extra: Parameters<typeof buildMessages>[3] = {},
): Promise<NotificationLog[]> {
  const msg = buildMessages(kind, b, content, extra);
  const jobs: Promise<NotificationLog>[] = [];
  if (msg.email && b.email) {
    jobs.push(sendEmail(b.email, msg.email.subject, msg.email.body, content.brand.clinicName, content.contact.email || undefined).then((r) => log("email", "patient", kind, r)));
  }
  if (msg.whatsapp) {
    jobs.push(sendWhatsApp(b.phone.replace(/\D/g, ""), kind, whatsappTemplateParams(b)).then((r) => log("whatsapp", "patient", kind, r)));
  }
  return Promise.all(jobs);
}

export async function notifyClinic(b: Booking, content: SiteContent): Promise<NotificationLog[]> {
  const alert = buildClinicAlert(b, content, env("NEXT_PUBLIC_SITE_URL") || undefined);
  const to = content.contact.bookingAlertEmail || content.contact.email || env("CLINIC_ALERT_EMAIL");
  const jobs: Promise<NotificationLog>[] = [];
  jobs.push(
    to
      ? sendEmail(to, alert.subject, alert.body, content.brand.clinicName, b.email).then((r) => log("email", "clinic", "clinic-alert", r))
      : Promise.resolve(log("email", "clinic", "clinic-alert", { ok: false, detail: "skipped:No clinic alert email set" })),
  );
  if (content.contact.whatsapp) {
    jobs.push(sendWhatsApp(content.contact.whatsapp, "clinic", whatsappTemplateParams(b)).then((r) => log("whatsapp", "clinic", "clinic-alert", r)));
  }
  return Promise.all(jobs);
}
