import { addDays, todayISO } from "../dates";
import { CONSENT_TEXT } from "../messages";
import { isValidEmail, normalisePkMobile } from "../phone";
import { validatePrice } from "../pricing";
import { suggestJourneySteps } from "../journey";
import { uid } from "../id";
import { DEMO_PATIENT_NAMES, SEED_DOCTORS, SEED_SETTINGS, SEED_TREATMENTS } from "./seed";
import { baseTimes, closedReason, getAvailabilityRange, getDayAvailability } from "./slots";
import { DataError, type DataSource } from "./source";
import type {
  Booking,
  BookingEvent,
  BookingStatus,
  ClinicSettings,
  ContactMethod,
  Doctor,
  Journey,
  Treatment,
} from "./types";

/**
 * localStorage implementation of the DataSource.
 * Everything lives in one JSON document so "Reset demo data" is atomic.
 */

export const STORAGE_KEY = "aesthetica-demo:v1";
const SCHEMA_VERSION = 1;

interface DB {
  version: number;
  treatments: Treatment[];
  doctors: Doctor[];
  settings: ClinicSettings;
  bookings: Booking[];
  journeys: Journey[];
  counters: Record<string, number>; // booking sequence per year
}

/* ------------------------------ helpers ------------------------------ */


const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const isBrowser = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function nextReference(db: DB, at: Date): string {
  const year = String(at.getFullYear());
  const n = (db.counters[year] ?? 0) + 1;
  db.counters[year] = n;
  return `AES-${year}-${String(n).padStart(4, "0")}`;
}

/* ------------------------------ seeding ------------------------------ */

/** Tiny deterministic PRNG so demo data looks the same on every reset. */
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
  const methods: ContactMethod[] = ["whatsapp", "whatsapp", "both", "email", "whatsapp"];
  const out: Booking[] = [];
  let nameIdx = 0;

  for (let offset = -12; offset <= 12; offset++) {
    const date = addDays(today, offset);
    if (closedReason(db.settings, date)) continue;
    const times = baseTimes(db.settings, date);
    const count = offset === 0 ? 5 : Math.floor(rand() * 4); // 0–3 a day, 5 today
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
      const method = pick(methods);
      const createdAt = new Date(`${addDays(date, -3)}T10:00:00`).toISOString();
      const phoneTail = String(100 + nameIdx).padStart(7, "0");
      const history: BookingEvent[] = [{ at: createdAt, action: "created", note: "Booked online (demo)" }];
      if (status !== "pending" && status !== "cancelled") history.push({ at: createdAt, action: "confirmed" });
      if (status === "arrived" || status === "completed") history.push({ at: createdAt, action: "arrived" });
      if (status === "completed") history.push({ at: createdAt, action: "completed" });
      if (status === "cancelled") history.push({ at: createdAt, action: "cancelled", note: "Patient requested (demo)" });

      out.push({
        id: uid("bk"),
        reference: "",
        treatmentId: treatment.id,
        treatmentName: treatment.name,
        doctorId: db.doctors[0].id,
        date,
        time,
        patientName: name,
        phone: `+92 300 ${phoneTail}`,
        email: method === "whatsapp" ? undefined : `${slugify(name).replace("-", ".")}@example.com`,
        contactMethod: method,
        consent: { given: true, at: createdAt, text: CONSENT_TEXT },
        notes: rand() < 0.25 ? "First visit (demo note)" : undefined,
        status,
        createdAt,
        history,
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
    treatments: clone(SEED_TREATMENTS),
    doctors: clone(SEED_DOCTORS),
    settings: clone(SEED_SETTINGS),
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

/* ---------------------------- persistence ---------------------------- */

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

if (isBrowser()) {
  // Keep multiple tabs (e.g. public site + admin side by side) in sync.
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY || e.key === null) notify();
  });
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function read(): DB {
  if (!isBrowser()) return createServerSnapshot();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const db = JSON.parse(raw) as DB;
      if (db?.version === SCHEMA_VERSION && Array.isArray(db.treatments)) return db;
    }
  } catch {
    /* corrupted or blocked storage: fall through to a fresh seed */
  }
  const fresh = createSeedDB();
  write(fresh, false);
  return fresh;
}

function write(db: DB, emit = true) {
  if (!isBrowser()) throw new DataError("VALIDATION", "Writes are only available in the browser in this prototype.");
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* private mode / quota: keep working in memory for this page view */
  }
  if (emit) notify();
}

/** On the server there is no localStorage, so render from the seed catalogue. */
function createServerSnapshot(): DB {
  return {
    version: SCHEMA_VERSION,
    treatments: SEED_TREATMENTS,
    doctors: SEED_DOCTORS,
    settings: SEED_SETTINGS,
    bookings: [],
    journeys: [],
    counters: {},
  };
}

/* ------------------------------ transitions ------------------------------ */

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled", "arrived"],
  confirmed: ["arrived", "cancelled"],
  arrived: ["completed"],
  completed: [],
  cancelled: [],
};

export function allowedNextStatuses(s: BookingStatus): BookingStatus[] {
  return TRANSITIONS[s];
}

/* ------------------------------ the source ------------------------------ */

export const localSource: DataSource = {
  async getTreatments(opts) {
    const list = read().treatments;
    return clone(opts?.includeInactive ? list : list.filter((t) => t.active));
  },

  async getTreatmentBySlug(slug) {
    const t = read().treatments.find((x) => x.slug === slug && x.active);
    return t ? clone(t) : null;
  },

  async saveTreatment(input) {
    const db = read();
    const name = input.name.trim();
    if (!name) throw new DataError("VALIDATION", "Treatment name is required.");
    const priceError = validatePrice(input.price);
    if (priceError) throw new DataError("VALIDATION", priceError);

    let slug = slugify(input.slug || name) || uid("treatment");
    const clash = (s: string) => db.treatments.some((t) => t.slug === s && t.id !== input.id);
    for (let i = 2; clash(slug); i++) slug = `${slugify(input.slug || name)}-${i}`;

    const now = new Date().toISOString();
    const existing = input.id ? db.treatments.find((t) => t.id === input.id) : undefined;
    const record: Treatment = { ...input, name, slug, id: existing?.id ?? uid("t"), updatedAt: now };
    if (existing) {
      db.treatments = db.treatments.map((t) => (t.id === existing.id ? record : t));
    } else {
      db.treatments.push(record);
    }
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
    if (!t) throw new DataError("NOT_FOUND", "Treatment not found.");
    const err = validatePrice(price);
    if (err) throw new DataError("VALIDATION", err);
    t.price = price;
    t.updatedAt = new Date().toISOString();
    write(db);
    return clone(t);
  },

  async getDoctors() {
    return clone(read().doctors);
  },

  async getSettings() {
    return clone(read().settings);
  },

  async updateSettings(patch) {
    const db = read();
    const next = { ...db.settings, ...patch };
    if (next.openTime >= next.closeTime) throw new DataError("VALIDATION", "Opening time must be before closing time.");
    if (!(next.slotMinutes >= 10 && next.slotMinutes <= 180)) throw new DataError("VALIDATION", "Slot length must be 10–180 minutes.");
    if (!(next.maxPerDay >= 1)) throw new DataError("VALIDATION", "Maximum appointments per day must be at least 1.");
    for (const b of next.breaks) {
      if (b.start >= b.end) throw new DataError("VALIDATION", `Break "${b.label || "Untitled"}" must end after it starts.`);
    }
    db.settings = next;
    write(db);
    return clone(next);
  },

  async getAvailability(doctorId, opts = {}) {
    const db = read();
    return getAvailabilityRange(db.settings, db.bookings, doctorId, opts);
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
          (qDigits && qDigits.length >= 3 && b.phone.replace(/\D/g, "").includes(qDigits.replace(/^0/, ""))),
      );
    }
    const sorted = [...list].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    // "All" reads best newest-first; today/upcoming read best in time order.
    return clone(filters.scope === "all" || !filters.scope ? sorted.reverse() : sorted);
  },

  async createBooking(input) {
    const db = read();
    const treatment = db.treatments.find((t) => t.id === input.treatmentId && t.active);
    if (!treatment) throw new DataError("NOT_FOUND", "Please choose a treatment.");
    const doctor = db.doctors.find((d) => d.id === input.doctorId);
    if (!doctor) throw new DataError("NOT_FOUND", "Please choose a doctor.");
    const name = input.patientName.trim();
    if (name.length < 2) throw new DataError("VALIDATION", "Please enter your full name.");
    const phone = normalisePkMobile(input.phone);
    if (!phone) throw new DataError("VALIDATION", "Please enter a valid Pakistani mobile number.");
    const email = input.email?.trim() || undefined;
    if (email && !isValidEmail(email)) throw new DataError("VALIDATION", "Please enter a valid email address.");
    if ((input.contactMethod === "email" || input.contactMethod === "both") && !email)
      throw new DataError("VALIDATION", "An email address is needed for email updates.");
    if (!input.consent) throw new DataError("VALIDATION", "Consent is required so the clinic can contact you.");

    // Re-check availability at write time: this is what prevents double booking
    // (Phase 2: a partial unique index on (doctor_id, date, time) where status <> 'cancelled').
    const day = getDayAvailability(db.settings, db.bookings, input.date, input.doctorId);
    if (!day.open) throw new DataError("DAY_CLOSED", `Sorry, the clinic is not taking bookings on that day (${day.reason}).`);
    const slot = day.slots.find((s) => s.time === input.time);
    if (!slot || slot.state !== "available")
      throw new DataError("SLOT_UNAVAILABLE", "Sorry, that time has just been taken. Please choose another slot.");

    const now = new Date();
    const booking: Booking = {
      id: uid("bk"),
      reference: nextReference(db, now),
      treatmentId: treatment.id,
      treatmentName: treatment.name,
      doctorId: doctor.id,
      date: input.date,
      time: input.time,
      patientName: name,
      phone,
      email,
      contactMethod: input.contactMethod,
      consent: { given: true, at: now.toISOString(), text: CONSENT_TEXT },
      notes: input.notes?.trim() || undefined,
      status: "pending",
      createdAt: now.toISOString(),
      history: [{ at: now.toISOString(), action: "created", note: "Booked online" }],
    };
    db.bookings.push(booking);
    write(db);
    return clone(booking);
  },

  async setBookingStatus(id, status, note) {
    const db = read();
    const b = db.bookings.find((x) => x.id === id);
    if (!b) throw new DataError("NOT_FOUND", "Appointment not found.");
    if (!TRANSITIONS[b.status].includes(status))
      throw new DataError("INVALID_TRANSITION", `Cannot change a ${b.status} appointment to ${status}.`);
    b.status = status;
    b.history.push({ at: new Date().toISOString(), action: status, note });
    write(db);
    return clone(b);
  },

  async rescheduleBooking(id, date, time) {
    const db = read();
    const b = db.bookings.find((x) => x.id === id);
    if (!b) throw new DataError("NOT_FOUND", "Appointment not found.");
    if (b.status !== "pending" && b.status !== "confirmed")
      throw new DataError("INVALID_TRANSITION", "Only pending or confirmed appointments can be rescheduled.");
    const day = getDayAvailability(db.settings, db.bookings, date, b.doctorId, { ignoreBookingId: b.id });
    if (!day.open) throw new DataError("DAY_CLOSED", `The clinic is closed on that day (${day.reason}).`);
    const slot = day.slots.find((s) => s.time === time);
    if (!slot || slot.state !== "available") throw new DataError("SLOT_UNAVAILABLE", "That time is not available.");
    const previous = { date: b.date, time: b.time };
    b.date = date;
    b.time = time;
    b.history.push({ at: new Date().toISOString(), action: "rescheduled", note: `From ${previous.date} ${previous.time}` });
    write(db);
    return { booking: clone(b), previous };
  },

  async getJourneys() {
    return clone([...read().journeys].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },

  async createJourney(input) {
    const db = read();
    const t = db.treatments.find((x) => x.id === input.treatmentId);
    if (!t) throw new DataError("NOT_FOUND", "Treatment not found.");
    if (!input.patientName.trim()) throw new DataError("VALIDATION", "Patient name is required.");
    if (input.steps.length === 0) throw new DataError("VALIDATION", "Add at least one step.");
    const journey: Journey = {
      ...input,
      patientName: input.patientName.trim(),
      id: uid("jr"),
      treatmentName: t.name,
      steps: [...input.steps].sort((a, b) => a.week - b.week),
      createdAt: new Date().toISOString(),
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
    write(createSeedDB());
  },
};
