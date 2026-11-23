import { addDays, todayISO } from "../dates";
import { uid } from "../id";
import { suggestJourneySteps } from "../journey";
import { CONSENT_TEXT, buildMessages } from "../messages";
import { idbClear, idbPut } from "../media/idb";
import { applyStatus, assertSettings, assertTreatment, buildBooking, canReschedule, referenceFor, uniqueSlug, validateBooking } from "./rules";
import {
  DEMO_PATIENT_NAMES,
  MAIN_DOCTOR_ID,
  SEED_CONDITIONS,
  SEED_CONTENT,
  SEED_GALLERY,
  SEED_POSTS,
  SEED_SETTINGS,
  SEED_TREATMENTS,
} from "./seed";
import { baseTimes, closedReason, getAvailabilityRange, getDayAvailability } from "./slots";
import { DataError, type DataSource } from "./source";
import type {
  Booking,
  BookingEvent,
  BookingStatus,
  ClinicSettings,
  Condition,
  ContactMethod,
  GalleryItem,
  Journey,
  NotificationLog,
  Post,
  SiteContent,
  Treatment,
} from "./types";

/**
 * Demo-mode DataSource: one JSON document in localStorage (so "Reset demo
 * data" is atomic) plus IndexedDB for uploaded images. Nothing leaves the
 * browser and no messages are sent.
 */

export const STORAGE_KEY = "aesthetica-site:v2";
const SCHEMA_VERSION = 2;

interface DB {
  version: number;
  content: SiteContent;
  settings: ClinicSettings;
  treatments: Treatment[];
  conditions: Condition[];
  posts: Post[];
  gallery: GalleryItem[];
  bookings: Booking[];
  journeys: Journey[];
  counters: Record<string, number>;
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const isBrowser = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

function nextReference(db: DB, at: Date): string {
  const year = String(at.getFullYear());
  const n = (db.counters[year] ?? 0) + 1;
  db.counters[year] = n;
  return referenceFor(at.getFullYear(), n);
}

/* ------------------------------ seeding ------------------------------ */

function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function seedBookings(db: DB, now: Date): Booking[] {
  const rand = prng(20260101);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const today = todayISO(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const bookable = db.treatments.filter((t) => t.active);
  const methods: ContactMethod[] = ["whatsapp", "both", "email", "both", "whatsapp"];
  const out: Booking[] = [];
  let nameIdx = 0;

  for (let offset = -12; offset <= 12; offset++) {
    const date = addDays(today, offset);
    if (closedReason(db.settings, date)) continue;
    const times = baseTimes(db.settings, date);
    const count = offset === 0 ? 5 : Math.floor(rand() * 4);
    const used = new Set<string>();
    for (let i = 0; i < count && used.size < times.length; i++) {
      let time = pick(times);
      while (used.has(time)) time = pick(times);
      used.add(time);
      const [h, m] = time.split(":").map(Number);
      const slotMin = h * 60 + m;
      let status: BookingStatus;
      if (offset < 0) status = rand() < 0.85 ? "completed" : "cancelled";
      else if (offset === 0) status = slotMin < nowMin ? (rand() < 0.5 ? "completed" : "arrived") : rand() < 0.6 ? "confirmed" : "pending";
      else status = rand() < 0.5 ? "confirmed" : "pending";

      const treatment = pick(bookable);
      const name = DEMO_PATIENT_NAMES[nameIdx++ % DEMO_PATIENT_NAMES.length];
      const createdAt = new Date(`${addDays(date, -3)}T10:00:00`).toISOString();
      const history: BookingEvent[] = [{ at: createdAt, action: "created", note: "Booked online (demo)" }];
      if (!["pending", "cancelled"].includes(status)) history.push({ at: createdAt, action: "confirmed" });
      if (status === "arrived" || status === "completed") history.push({ at: createdAt, action: "arrived" });
      if (status === "completed") history.push({ at: createdAt, action: "completed" });
      if (status === "cancelled") history.push({ at: createdAt, action: "cancelled", note: "Patient requested (demo)" });

      out.push({
        id: uid("bk"),
        reference: "",
        treatmentId: treatment.id,
        treatmentName: treatment.name,
        doctorId: MAIN_DOCTOR_ID,
        date,
        time,
        patientName: name,
        phone: `+92 300 ${String(100 + nameIdx).padStart(7, "0")}`,
        email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
        contactMethod: pick(methods),
        consent: { given: true, at: createdAt, text: CONSENT_TEXT },
        notes: rand() < 0.25 ? "First visit (demo note)" : undefined,
        status,
        createdAt,
        history,
        notifications: [],
        demo: true,
      });
    }
  }
  out.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  for (const b of out) b.reference = nextReference(db, new Date(b.createdAt));
  return out;
}

function createSeedDB(now = new Date()): DB {
  const db: DB = {
    version: SCHEMA_VERSION,
    content: clone(SEED_CONTENT),
    settings: clone(SEED_SETTINGS),
    treatments: clone(SEED_TREATMENTS),
    conditions: clone(SEED_CONDITIONS),
    posts: clone(SEED_POSTS),
    gallery: clone(SEED_GALLERY),
    bookings: [],
    journeys: [],
    counters: {},
  };
  db.bookings = seedBookings(db, now);
  const prp = db.treatments.find((t) => t.slug === "prp-hair-treatment")!;
  const start = addDays(todayISO(now), -14);
  db.journeys.push({
    id: uid("jr"),
    patientName: "Hamza Ali",
    treatmentId: prp.id,
    treatmentName: prp.name,
    startDate: start,
    steps: suggestJourneySteps(prp).map((s, i) => ({ ...s, done: i === 0 })),
    createdAt: new Date(`${start}T09:00:00`).toISOString(),
  });
  return db;
}

/** Server-side / first-paint snapshot: the seed catalogue, no bookings. */
export function seedSnapshot() {
  return {
    content: SEED_CONTENT,
    settings: SEED_SETTINGS,
    treatments: SEED_TREATMENTS,
    conditions: SEED_CONDITIONS,
    posts: SEED_POSTS,
    gallery: SEED_GALLERY,
  };
}

/* ---------------------------- persistence ---------------------------- */

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

if (isBrowser()) {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY || e.key === null) notify();
  });
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function read(): DB {
  if (!isBrowser()) return { ...clone(seedSnapshot()), version: SCHEMA_VERSION, bookings: [], journeys: [], counters: {} } as DB;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const db = JSON.parse(raw) as DB;
      if (db?.version === SCHEMA_VERSION && Array.isArray(db.treatments)) return db;
    }
  } catch {
    /* corrupted or blocked storage: reseed */
  }
  const fresh = createSeedDB();
  write(fresh, false);
  return fresh;
}

function write(db: DB, emit = true) {
  if (!isBrowser()) throw new DataError("VALIDATION", "Saving is only available in the browser in demo mode.");
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    throw new DataError("SERVER", "Browser storage is full. Remove some uploaded images or reset the demo data.");
  }
  if (emit) notify();
}

const now = () => new Date().toISOString();
const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

/** Demo mode never sends messages; it records what would have been sent. */
function demoNotifications(b: Booking, content: SiteContent, kind: Parameters<typeof buildMessages>[0]): NotificationLog[] {
  const preview = buildMessages(kind, b, content);
  const at = now();
  const out: NotificationLog[] = [];
  if (preview.email) out.push({ at, channel: "email", audience: "patient", kind, status: "skipped", detail: "Demo mode: not sent" });
  if (preview.whatsapp) out.push({ at, channel: "whatsapp", audience: "patient", kind, status: "skipped", detail: "Demo mode: not sent" });
  if (kind === "confirmation") out.push({ at, channel: "email", audience: "clinic", kind: "clinic-alert", status: "skipped", detail: "Demo mode: not sent" });
  return out;
}

/* ------------------------------ the source ------------------------------ */

export const localSource: DataSource = {
  mode: "demo",

  async getContent() {
    return clone(read().content);
  },
  async saveContent(next) {
    const db = read();
    db.content = clone(next);
    write(db);
    return clone(db.content);
  },
  async getSettings() {
    return clone(read().settings);
  },
  async updateSettings(patch) {
    const db = read();
    const next = { ...db.settings, ...patch };
    assertSettings(next);
    db.settings = next;
    write(db);
    return clone(next);
  },

  /* procedures */
  async getTreatments(opts) {
    const list = [...read().treatments].sort(byOrder);
    return clone(opts?.includeInactive ? list : list.filter((t) => t.active));
  },
  async getTreatmentBySlug(slug) {
    const t = read().treatments.find((x) => x.slug === slug && x.active);
    return t ? clone(t) : null;
  },
  async saveTreatment(input) {
    const db = read();
    assertTreatment(input);
    const slug = uniqueSlug(input.slug || input.name, (s) => db.treatments.some((t) => t.slug === s && t.id !== input.id));
    const existing = input.id ? db.treatments.find((t) => t.id === input.id) : undefined;
    const record: Treatment = { ...input, name: input.name.trim(), slug, id: existing?.id ?? uid("t"), updatedAt: now() };
    db.treatments = existing ? db.treatments.map((t) => (t.id === record.id ? record : t)) : [...db.treatments, record];
    write(db);
    return clone(record);
  },
  async deleteTreatment(id) {
    const db = read();
    db.treatments = db.treatments.filter((t) => t.id !== id);
    write(db);
  },
  async updatePrice(treatmentId, price) {
    const db = read();
    const t = db.treatments.find((x) => x.id === treatmentId);
    if (!t) throw new DataError("NOT_FOUND", "Procedure not found.");
    assertTreatment({ ...t, price });
    t.price = price;
    t.updatedAt = now();
    write(db);
    return clone(t);
  },

  /* conditions */
  async getConditions(opts) {
    const list = [...read().conditions].sort(byOrder);
    return clone(opts?.includeInactive ? list : list.filter((c) => c.active));
  },
  async getConditionBySlug(slug) {
    const c = read().conditions.find((x) => x.slug === slug && x.active);
    return c ? clone(c) : null;
  },
  async saveCondition(input) {
    const db = read();
    if (!input.name.trim()) throw new DataError("VALIDATION", "Condition name is required.");
    const slug = uniqueSlug(input.slug || input.name, (s) => db.conditions.some((c) => c.slug === s && c.id !== input.id));
    const existing = input.id ? db.conditions.find((c) => c.id === input.id) : undefined;
    const record: Condition = { ...input, name: input.name.trim(), slug, id: existing?.id ?? uid("c"), updatedAt: now() };
    db.conditions = existing ? db.conditions.map((c) => (c.id === record.id ? record : c)) : [...db.conditions, record];
    write(db);
    return clone(record);
  },
  async deleteCondition(id) {
    const db = read();
    db.conditions = db.conditions.filter((c) => c.id !== id);
    write(db);
  },

  /* blog */
  async getPosts(opts) {
    const list = [...read().posts].sort((a, b) => (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt));
    return clone(opts?.includeDrafts ? list : list.filter((p) => p.status === "published"));
  },
  async getPostBySlug(slug, opts) {
    const p = read().posts.find((x) => x.slug === slug && (opts?.includeDrafts || x.status === "published"));
    return p ? clone(p) : null;
  },
  async savePost(input) {
    const db = read();
    if (!input.title.trim()) throw new DataError("VALIDATION", "Article title is required.");
    const slug = uniqueSlug(input.slug || input.title, (s) => db.posts.some((p) => p.slug === s && p.id !== input.id));
    const existing = input.id ? db.posts.find((p) => p.id === input.id) : undefined;
    const publishedAt = input.status === "published" ? input.publishedAt ?? existing?.publishedAt ?? now() : input.publishedAt;
    const record: Post = { ...input, title: input.title.trim(), slug, publishedAt, id: existing?.id ?? uid("post"), updatedAt: now() };
    db.posts = existing ? db.posts.map((p) => (p.id === record.id ? record : p)) : [...db.posts, record];
    write(db);
    return clone(record);
  },
  async deletePost(id) {
    const db = read();
    db.posts = db.posts.filter((p) => p.id !== id);
    write(db);
  },

  /* gallery */
  async getGallery(opts) {
    const list = [...read().gallery].sort(byOrder);
    return clone(opts?.includeUnpublished ? list : list.filter((g) => g.published && (g.consentConfirmed || g.illustrative)));
  },
  async saveGalleryItem(input) {
    const db = read();
    if (!input.before || !input.after) throw new DataError("VALIDATION", "Upload both a before and an after photo.");
    if (input.published && !input.consentConfirmed && !input.illustrative)
      throw new DataError("VALIDATION", "Confirm the patient's written consent before publishing.");
    const existing = input.id ? db.gallery.find((g) => g.id === input.id) : undefined;
    const record: GalleryItem = { ...input, id: existing?.id ?? uid("g"), createdAt: existing?.createdAt ?? now() };
    db.gallery = existing ? db.gallery.map((g) => (g.id === record.id ? record : g)) : [...db.gallery, record];
    write(db);
    return clone(record);
  },
  async deleteGalleryItem(id) {
    const db = read();
    db.gallery = db.gallery.filter((g) => g.id !== id);
    write(db);
  },

  /* media */
  async uploadImage(file) {
    const id = uid("img");
    await idbPut(id, file);
    return `idb:${id}`;
  },

  /* availability & bookings */
  async getAvailability(doctorId, opts = {}) {
    const db = read();
    return getAvailabilityRange(db.settings, db.bookings, doctorId, opts);
  },
  async createBooking(input) {
    const db = read();
    const n = validateBooking(input, { treatments: db.treatments, settings: db.settings, bookings: db.bookings });
    const at = new Date();
    const booking = buildBooking(n, input, { id: uid("bk"), reference: nextReference(db, at) }, at);
    booking.notifications = demoNotifications(booking, db.content, "confirmation");
    db.bookings.push(booking);
    write(db);
    return { booking: clone(booking), notifications: booking.notifications };
  },
  async getBookings(filters = {}) {
    const today = todayISO();
    const q = filters.search?.trim().toLowerCase();
    const qDigits = q?.replace(/\D/g, "");
    let list = read().bookings;
    if (filters.scope === "today") list = list.filter((b) => b.date === today);
    if (filters.scope === "upcoming") list = list.filter((b) => b.date > today);
    if (filters.treatmentId) list = list.filter((b) => b.treatmentId === filters.treatmentId);
    if (filters.doctorId) list = list.filter((b) => b.doctorId === filters.doctorId);
    if (filters.status) list = list.filter((b) => b.status === filters.status);
    if (q) {
      list = list.filter(
        (b) =>
          b.patientName.toLowerCase().includes(q) ||
          b.reference.toLowerCase().includes(q) ||
          b.treatmentName.toLowerCase().includes(q) ||
          (b.email ?? "").toLowerCase().includes(q) ||
          (!!qDigits && qDigits.length >= 3 && b.phone.replace(/\D/g, "").includes(qDigits.replace(/^0/, ""))),
      );
    }
    const sorted = [...list].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    return clone(filters.scope === "all" || !filters.scope ? sorted.reverse() : sorted);
  },
  async setBookingStatus(id, status, note) {
    const db = read();
    const idx = db.bookings.findIndex((x) => x.id === id);
    if (idx < 0) throw new DataError("NOT_FOUND", "Appointment not found.");
    const updated = applyStatus(db.bookings[idx], status, note);
    const kind = status === "confirmed" ? "accepted" : status === "rejected" ? "rejected" : status === "cancelled" ? "cancellation" : null;
    const logs = kind ? demoNotifications(updated, db.content, kind).filter((l) => l.audience === "patient") : [];
    updated.notifications = [...(updated.notifications ?? []), ...logs];
    db.bookings[idx] = updated;
    write(db);
    return { booking: clone(updated), notifications: logs };
  },
  async rescheduleBooking(id, date, time) {
    const db = read();
    const b = db.bookings.find((x) => x.id === id);
    if (!b) throw new DataError("NOT_FOUND", "Appointment not found.");
    if (!canReschedule(b.status)) throw new DataError("INVALID_TRANSITION", "Only pending or confirmed appointments can be rescheduled.");
    const day = getDayAvailability(db.settings, db.bookings, date, b.doctorId, { ignoreBookingId: b.id });
    if (!day.open) throw new DataError("DAY_CLOSED", `The clinic is closed on that day (${day.reason}).`);
    const slot = day.slots.find((s) => s.time === time);
    if (!slot || slot.state !== "available") throw new DataError("SLOT_UNAVAILABLE", "That time is not available.");
    const previous = { date: b.date, time: b.time };
    b.date = date;
    b.time = time;
    b.history.push({ at: now(), action: "rescheduled", note: `From ${previous.date} ${previous.time}` });
    const logs = demoNotifications(b, db.content, "reschedule").filter((l) => l.audience === "patient");
    b.notifications = [...(b.notifications ?? []), ...logs];
    write(db);
    return { booking: clone(b), notifications: logs, previous };
  },

  /* journeys */
  async getJourneys() {
    return clone([...read().journeys].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async createJourney(input) {
    const db = read();
    const t = db.treatments.find((x) => x.id === input.treatmentId);
    if (!t) throw new DataError("NOT_FOUND", "Procedure not found.");
    if (!input.patientName.trim()) throw new DataError("VALIDATION", "Patient name is required.");
    if (input.steps.length === 0) throw new DataError("VALIDATION", "Add at least one step.");
    const journey: Journey = {
      ...input,
      patientName: input.patientName.trim(),
      id: uid("jr"),
      treatmentName: t.name,
      steps: [...input.steps].sort((a, b) => a.week - b.week),
      createdAt: now(),
    };
    db.journeys.push(journey);
    write(db);
    return clone(journey);
  },
  async updateJourneyStep(journeyId, stepId, patch) {
    const db = read();
    const j = db.journeys.find((x) => x.id === journeyId);
    if (!j) throw new DataError("NOT_FOUND", "Journey not found.");
    j.steps = j.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s));
    write(db);
    return clone(j);
  },
  async deleteJourney(id) {
    const db = read();
    db.journeys = db.journeys.filter((j) => j.id !== id);
    write(db);
  },

  async resetDemoData() {
    await idbClear().catch(() => {});
    write(createSeedDB());
  },
};
