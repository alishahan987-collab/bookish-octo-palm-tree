import "server-only";
import { addDays, isHHmm, isISODate, spaNow, toISODate } from "../dates";
import { newId, newReference } from "../id";
import { repo } from "../repo";
import { getAvailabilityRange, isSlotAvailable } from "../slots";
import type { Appointment, AppointmentRequest, AppointmentStatus, DayAvailability, NotificationLog, Treatment } from "../types";
import { formatPhone, normalizePhone, validateAppointmentRequest } from "../validation";
import { emailClinicNewRequest, emailCustomer } from "./email";
import { ApiError } from "./http";

const durationOf = (t: Treatment | undefined, fallback: number) => Math.max(5, t?.bookingMinutes || fallback || 60);

async function bookableTreatment(id: string): Promise<Treatment> {
  const t = await repo.get("treatments", id);
  if (!t || !t.published || !t.bookable) throw new ApiError(400, "This treatment cannot be booked online. Please call us.", { treatmentId: "Please choose another treatment." });
  return t;
}

/** Public availability: slot states only, never customer details. */
export async function publicAvailability(treatmentId: string, days?: number): Promise<{ durationMinutes: number; days: DayAvailability[] }> {
  const [settings, t] = await Promise.all([repo.getDoc("settings"), bookableTreatment(treatmentId)]);
  const now = spaNow();
  const busy = await repo.busy(toISODate(now));
  const duration = durationOf(t, settings.booking.defaultMinutes);
  return { durationMinutes: duration, days: getAvailabilityRange(settings, busy, duration, { now, days: Math.min(days ?? settings.booking.windowDays, settings.booking.windowDays) }) };
}

/** Admin availability (no notice / window limits) for rescheduling and phone bookings. */
export async function adminAvailability(opts: { treatmentId?: string; from?: string; days?: number; ignoreId?: string; durationMinutes?: number }) {
  const settings = await repo.getDoc("settings");
  const t = opts.treatmentId ? await repo.get("treatments", opts.treatmentId) : null;
  const now = spaNow();
  const from = opts.from && isISODate(opts.from) ? opts.from : toISODate(now);
  const busy = await repo.busy(from < toISODate(now) ? from : toISODate(now));
  const duration = opts.durationMinutes || durationOf(t ?? undefined, settings.booking.defaultMinutes);
  return getAvailabilityRange(settings, busy, duration, { now, from, days: opts.days ?? 31, ignoreId: opts.ignoreId, ignoreNotice: true });
}

async function notifyAll(a: Appointment, adminUrl: string): Promise<Appointment> {
  const [settings, design] = await Promise.all([repo.getDoc("settings"), repo.getDoc("design")]);
  const logs: NotificationLog[] = await Promise.all([emailCustomer("received", a, settings, design), emailClinicNewRequest(a, settings, design, adminUrl)]);
  return repo.updateAppointment(a.id, { notifications: [...a.notifications, ...logs] });
}

export async function createRequest(input: AppointmentRequest, adminUrl: string): Promise<{ appointment: Pick<Appointment, "reference" | "date" | "time" | "treatmentName" | "status">; emailed: boolean }> {
  const settings = await repo.getDoc("settings");
  if (settings.booking.mode === "booksy") throw new ApiError(400, "Online requests are closed. Please book through Booksy or call us.");
  if (input.website) throw new ApiError(400, "Your request could not be sent.");
  const errors = validateAppointmentRequest(input, { requireEmail: settings.booking.requireEmail });
  if (Object.keys(errors).length) throw new ApiError(400, "Please check the highlighted fields.", errors as Record<string, string>);

  const t = await bookableTreatment(input.treatmentId);
  const duration = durationOf(t, settings.booking.defaultMinutes);
  const now = spaNow();
  const busy = await repo.busy(toISODate(now));
  const check = isSlotAvailable(settings, busy, input.date, input.time, duration, { now });
  if (!check.ok) throw new ApiError(409, check.reason, { time: check.reason });

  const stamp = new Date().toISOString();
  const draft: Appointment = {
    id: crypto.randomUUID(),
    reference: newReference(),
    treatmentId: t.id,
    treatmentName: t.name,
    date: input.date,
    time: input.time,
    durationMinutes: duration,
    name: input.name.trim().replace(/\s+/g, " "),
    email: (input.email ?? "").trim().toLowerCase(),
    phone: formatPhone(normalizePhone(input.phone)!),
    message: (input.message ?? "").trim().slice(0, 1000),
    status: "pending",
    source: "website",
    internalNotes: "",
    history: [{ at: stamp, action: "created", note: "Requested on the website" }],
    notifications: [],
    createdAt: stamp,
    updatedAt: stamp,
  };
  const saved = await repo.insertAppointment(draft, Math.max(1, settings.booking.capacity));
  const withLogs = await notifyAll(saved, adminUrl).catch((e) => {
    console.error("notify failed", e);
    return saved;
  });
  const emailed = withLogs.notifications.some((n) => n.to === "customer" && n.status === "sent");
  return { appointment: { reference: saved.reference, date: saved.date, time: saved.time, treatmentName: saved.treatmentName, status: saved.status }, emailed };
}

/* --------------------------------- admin --------------------------------- */

const TRANSITIONS: Record<string, { from: AppointmentStatus[]; to: AppointmentStatus; email?: "approved" | "rejected" | "cancelled" }> = {
  approve: { from: ["pending"], to: "approved", email: "approved" },
  reject: { from: ["pending"], to: "rejected", email: "rejected" },
  cancel: { from: ["pending", "approved"], to: "cancelled", email: "cancelled" },
  complete: { from: ["approved"], to: "completed" },
  no_show: { from: ["approved"], to: "no_show" },
};

export type AdminAction =
  | { action: "approve" | "reject" | "cancel" | "complete" | "no_show"; reason?: string; notify?: boolean }
  | { action: "reschedule"; date: string; time: string; notify?: boolean }
  | { action: "notes"; internalNotes: string };

export async function adminUpdate(id: string, body: AdminAction, by: string): Promise<Appointment> {
  const current = await repo.getAppointment(id);
  if (!current) throw new ApiError(404, "Appointment not found.");
  const [settings, design] = await Promise.all([repo.getDoc("settings"), repo.getDoc("design")]);
  const at = new Date().toISOString();

  if (body.action === "notes") {
    return repo.updateAppointment(id, { internalNotes: String(body.internalNotes ?? "").slice(0, 4000) });
  }

  if (body.action === "reschedule") {
    if (!["pending", "approved"].includes(current.status)) throw new ApiError(409, "Only pending or approved appointments can be rescheduled.");
    if (!isISODate(body.date) || !isHHmm(body.time)) throw new ApiError(400, "Choose a valid date and time.");
    const busy = await repo.busy(addDays(toISODate(spaNow()), -1));
    const check = isSlotAvailable(settings, busy, body.date, body.time, current.durationMinutes, { now: spaNow(), ignoreId: id, ignoreNotice: true });
    if (!check.ok) throw new ApiError(409, check.reason);
    const history = [...current.history, { at, action: "rescheduled" as const, note: `From ${current.date} ${current.time} to ${body.date} ${body.time}`, by }];
    let updated = await repo.moveAppointment(id, body.date, body.time, current.durationMinutes, Math.max(1, settings.booking.capacity), { history });
    if (body.notify !== false) {
      const log = await emailCustomer("rescheduled", updated, settings, design);
      updated = await repo.updateAppointment(id, { notifications: [...updated.notifications, log] });
    }
    return updated;
  }

  const rule = TRANSITIONS[body.action];
  if (!rule) throw new ApiError(400, "Unknown action.");
  if (!rule.from.includes(current.status)) throw new ApiError(409, `A ${current.status.replace("_", "-")} appointment cannot be changed this way.`);
  const reason = String(body.reason ?? "").trim().slice(0, 500);
  const history = [...current.history, { at, action: rule.to as Appointment["history"][number]["action"], note: reason || undefined, by }];
  let updated = await repo.updateAppointment(id, { status: rule.to, history }, current.status);
  if (rule.email && body.notify !== false) {
    const log = await emailCustomer(rule.email, updated, settings, design, reason);
    updated = await repo.updateAppointment(id, { notifications: [...updated.notifications, log] });
  }
  return updated;
}

/** Phone / walk-in bookings entered by staff. Same double-booking guard. */
export async function adminCreate(input: Omit<AppointmentRequest, "consent"> & { status?: "pending" | "approved"; notify?: boolean }, by: string): Promise<Appointment> {
  const settings = await repo.getDoc("settings");
  const errors = validateAppointmentRequest({ ...input, consent: true }, { requireEmail: false });
  if (Object.keys(errors).length) throw new ApiError(400, "Please check the highlighted fields.", errors as Record<string, string>);
  const t = await repo.get("treatments", input.treatmentId);
  if (!t) throw new ApiError(400, "Treatment not found.");
  const duration = durationOf(t, settings.booking.defaultMinutes);
  const busy = await repo.busy(toISODate(spaNow()));
  const check = isSlotAvailable(settings, busy, input.date, input.time, duration, { now: spaNow(), ignoreNotice: true });
  if (!check.ok) throw new ApiError(409, check.reason);
  const at = new Date().toISOString();
  const status = input.status === "pending" ? "pending" : "approved";
  let a = await repo.insertAppointment(
    {
      id: crypto.randomUUID(), reference: newReference(), treatmentId: t.id, treatmentName: t.name, date: input.date, time: input.time,
      durationMinutes: duration, name: input.name.trim(), email: (input.email ?? "").trim().toLowerCase(), phone: formatPhone(normalizePhone(input.phone)!),
      message: (input.message ?? "").trim(), status, source: "admin", internalNotes: "",
      history: [{ at, action: "created", note: "Added by staff", by }, ...(status === "approved" ? [{ at, action: "approved" as const, by }] : [])],
      notifications: [], createdAt: at, updatedAt: at,
    },
    Math.max(1, settings.booking.capacity),
  );
  if (input.notify && a.email) {
    const design = await repo.getDoc("design");
    const log = await emailCustomer(status === "approved" ? "approved" : "received", a, settings, design);
    a = await repo.updateAppointment(a.id, { notifications: [log] });
  }
  return a;
}

export { newId };
