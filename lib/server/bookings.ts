import "server-only";
import { addDays, todayISO } from "../dates";
import { applyStatus, buildBooking, canReschedule, validateBooking } from "../data/rules";
import { SEED_CONTENT, SEED_SETTINGS } from "../data/seed";
import { getAvailabilityRange, getDayAvailability } from "../data/slots";
import { DataError } from "../data/source";
import type { Booking, BookingInput, BookingResult, BookingStatus, ClinicSettings, DayAvailability, SiteContent, Treatment } from "../data/types";
import { bookingToRow, rowToBooking, rowToTreatment, type BookingRow } from "../supabase/mappers";
import { serviceClient } from "../supabase/server";
import { clinicNow } from "../tz";
import { notifyClinic, notifyPatient } from "./notify";

/** Server-side booking operations (service role). The only path that writes bookings in production. */

async function loadConfig(svc = serviceClient()) {
  const { data } = await svc.from("site_config").select("key,data");
  const map = Object.fromEntries((data ?? []).map((r: { key: string; data: unknown }) => [r.key, r.data]));
  return {
    content: { ...SEED_CONTENT, ...(map.content as SiteContent | undefined) } as SiteContent,
    settings: { ...SEED_SETTINGS, ...(map.settings as ClinicSettings | undefined) } as ClinicSettings,
  };
}

/** Only what the slot engine needs: no patient details leave this function. */
async function activeBookings(svc = serviceClient(), from = addDays(todayISO(clinicNow()), -1)): Promise<Booking[]> {
  const { data, error } = await svc
    .from("bookings")
    .select("id,doctor_id,date,time,status")
    .gte("date", from)
    .not("status", "in", "(cancelled,rejected)");
  if (error) throw new DataError("SERVER", "Could not load availability.");
  return (data ?? []).map((r) => ({ id: r.id, doctorId: r.doctor_id, date: r.date, time: r.time, status: r.status }) as Booking);
}

export async function availability(doctorId: string, opts: { days?: number; ignoreBookingId?: string } = {}): Promise<DayAvailability[]> {
  const svc = serviceClient();
  const [{ settings }, bookings] = await Promise.all([loadConfig(svc), activeBookings(svc)]);
  const days = Math.min(Math.max(opts.days ?? settings.bookingWindowDays, 1), 120);
  return getAvailabilityRange(settings, bookings, doctorId, { days, ignoreBookingId: opts.ignoreBookingId, now: clinicNow() });
}

async function saveNotifications(svc: ReturnType<typeof serviceClient>, b: Booking) {
  await svc.from("bookings").update({ notifications: b.notifications ?? [] }).eq("id", b.id);
}

export async function createBooking(input: BookingInput & { website?: string }): Promise<BookingResult> {
  const svc = serviceClient();
  const [{ settings, content }, bookings, { data: tRows }] = await Promise.all([
    loadConfig(svc),
    activeBookings(svc),
    svc.from("procedures").select("id,slug,data,active,sort").eq("id", input.treatmentId),
  ]);
  const treatments: Treatment[] = (tRows ?? []).map(rowToTreatment);
  const now = clinicNow();
  const n = validateBooking(input, { treatments, settings, bookings, now });

  const { data: reference, error: refErr } = await svc.rpc("next_booking_reference", { p_year: now.getFullYear() });
  if (refErr || !reference) throw new DataError("SERVER", "Could not create a booking reference.");

  const draft = buildBooking(n, input, { id: "pending", reference: reference as string }, new Date());
  const { data: row, error } = await svc.from("bookings").insert(bookingToRow(draft)).select("*").single();
  if (error) {
    if (error.code === "23505") throw new DataError("SLOT_UNAVAILABLE", "Sorry, that time has just been taken. Please choose another slot.");
    throw new DataError("SERVER", "Could not save your booking. Please try again.");
  }
  const booking = rowToBooking(row as BookingRow);
  const notifications = [...(await notifyPatient("confirmation", booking, content)), ...(await notifyClinic(booking, content))];
  booking.notifications = notifications;
  await saveNotifications(svc, booking);
  return { booking, notifications };
}

async function getBookingRow(svc: ReturnType<typeof serviceClient>, id: string): Promise<Booking> {
  const { data, error } = await svc.from("bookings").select("*").eq("id", id).maybeSingle();
  if (error || !data) throw new DataError("NOT_FOUND", "Appointment not found.");
  return rowToBooking(data as BookingRow);
}

export async function changeStatus(id: string, status: Exclude<BookingStatus, "pending">, note?: string): Promise<BookingResult> {
  const svc = serviceClient();
  const [current, { content }] = await Promise.all([getBookingRow(svc, id), loadConfig(svc)]);
  const updated = applyStatus(current, status, note);
  const { error } = await svc.from("bookings").update({ status: updated.status, history: updated.history }).eq("id", id).eq("status", current.status);
  if (error) throw new DataError("SERVER", "Could not update the appointment.");
  const kind = status === "confirmed" ? "accepted" : status === "rejected" ? "rejected" : status === "cancelled" ? "cancellation" : null;
  const notifications = kind ? await notifyPatient(kind, updated, content, { reason: note }) : [];
  updated.notifications = [...(updated.notifications ?? []), ...notifications];
  await saveNotifications(svc, updated);
  return { booking: updated, notifications };
}

export async function reschedule(id: string, date: string, time: string): Promise<BookingResult & { previous: { date: string; time: string } }> {
  const svc = serviceClient();
  const [current, { settings, content }, bookings] = await Promise.all([getBookingRow(svc, id), loadConfig(svc), activeBookings(svc)]);
  if (!canReschedule(current.status)) throw new DataError("INVALID_TRANSITION", "Only pending or confirmed appointments can be rescheduled.");
  const day = getDayAvailability(settings, bookings, date, current.doctorId, { ignoreBookingId: id, now: clinicNow() });
  if (!day.open) throw new DataError("DAY_CLOSED", `The clinic is closed on that day (${day.reason}).`);
  const slot = day.slots.find((s) => s.time === time);
  if (!slot || slot.state !== "available") throw new DataError("SLOT_UNAVAILABLE", "That time is not available.");

  const previous = { date: current.date, time: current.time };
  const history = [...current.history, { at: new Date().toISOString(), action: "rescheduled" as const, note: `From ${previous.date} ${previous.time}` }];
  const { error } = await svc.from("bookings").update({ date, time, history }).eq("id", id);
  if (error) {
    if (error.code === "23505") throw new DataError("SLOT_UNAVAILABLE", "That time has just been taken.");
    throw new DataError("SERVER", "Could not reschedule the appointment.");
  }
  const updated: Booking = { ...current, date, time, history };
  const notifications = await notifyPatient("reschedule", updated, content, { previous });
  updated.notifications = [...(updated.notifications ?? []), ...notifications];
  await saveNotifications(svc, updated);
  return { booking: updated, notifications, previous };
}

/* --------------------------- simple rate limiter --------------------------- */

const hits = new Map<string, number[]>();
export function rateLimited(key: string, limit = Number(process.env.BOOKING_RATE_LIMIT ?? 6), windowMs = 10 * 60_000): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > limit;
}
