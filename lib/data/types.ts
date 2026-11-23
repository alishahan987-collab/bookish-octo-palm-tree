/**
 * Domain types for the Aesthetica prototype.
 *
 * These are the contract between the UI and the data layer. In Phase 2 the
 * Supabase tables mirror these shapes (snake_case columns mapped in the
 * repository), so the UI does not change.
 */

export type ISODate = string; // "YYYY-MM-DD" (clinic local date, Asia/Karachi)
export type HHmm = string; // "14:30"

/* ---------------------------------- Pricing --------------------------------- */

export interface SessionPackage {
  sessions: number;
  price: number; // PKR, total for the package
}

export type PriceModel =
  | { type: "fixed"; amount: number; unit?: string }
  | { type: "from"; amount: number; unit?: string }
  | { type: "range"; min: number; max: number; unit?: string }
  | { type: "consultation"; note?: string }
  | { type: "promo"; regular: number; promo: number; label?: string; validUntil?: ISODate; unit?: string }
  | { type: "package"; perSession: number; packages: SessionPackage[] };

export type PriceType = PriceModel["type"];

/* -------------------------------- Treatments -------------------------------- */

export type CategoryId = "laser" | "facials" | "peels" | "skin-concerns" | "hair" | "consultation";

export type ConcernId =
  | "acne"
  | "acne-scars"
  | "pigmentation"
  | "melasma"
  | "wrinkles"
  | "hair-loss"
  | "uneven-tone"
  | "ageing"
  | "unwanted-hair"
  | "dull-skin";

export interface FAQ {
  q: string;
  a: string;
}

export interface Treatment {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  tagline: string;
  shortDescription: string;
  description: string;
  howItWorks: string[];
  benefits: string[];
  suitableFor: string[];
  downtime: string;
  sessions: string;
  sessionLength: string;
  sideEffects: string[];
  faqs: FAQ[];
  price: PriceModel;
  concerns: ConcernId[];
  doctorIds: string[];
  featured: boolean;
  active: boolean;
  /** Index into the abstract gradient palette used for artwork. */
  palette: number;
  updatedAt: string;
}

export type TreatmentInput = Omit<Treatment, "id" | "updatedAt"> & { id?: string };

/* ---------------------------------- Doctors --------------------------------- */

export interface Doctor {
  id: string;
  name: string;
  role: string;
  /** Placeholder until the clinic supplies an approved bio. */
  bio: string | null;
}

/* --------------------------------- Settings --------------------------------- */

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export interface BreakTime {
  id: string;
  label: string;
  start: HHmm;
  end: HHmm;
  /** Days the break applies to. Empty = every working day. */
  days: Weekday[];
}

export interface Holiday {
  id: string;
  date: ISODate;
  label: string;
}

export interface ClinicSettings {
  clinicName: string;
  addressLine: string;
  city: string;
  mapsQuery: string;
  /** International format without "+", e.g. 923001234567. Empty until supplied by the clinic. */
  whatsappNumber: string;
  phoneDisplay: string;
  email: string;
  workingDays: Weekday[];
  openTime: HHmm;
  closeTime: HHmm;
  slotMinutes: number;
  breaks: BreakTime[];
  holidays: Holiday[];
  maxPerDay: number;
  bookingWindowDays: number;
  /** Minimum notice before a same-day slot can be booked. */
  minNoticeMinutes: number;
}

/* --------------------------------- Bookings --------------------------------- */

export type ContactMethod = "whatsapp" | "email" | "both";

export type BookingStatus = "pending" | "confirmed" | "arrived" | "completed" | "cancelled";

export interface BookingEvent {
  at: string; // ISO timestamp
  action: "created" | "confirmed" | "cancelled" | "rescheduled" | "arrived" | "completed";
  note?: string;
}

export interface Booking {
  id: string;
  reference: string; // AES-2026-0001
  treatmentId: string;
  /** Snapshot so the record still reads correctly if the treatment is renamed or deleted. */
  treatmentName: string;
  doctorId: string;
  date: ISODate;
  time: HHmm;
  patientName: string;
  phone: string; // normalised +92 3XX XXXXXXX
  email?: string;
  contactMethod: ContactMethod;
  consent: { given: true; at: string; text: string };
  notes?: string;
  status: BookingStatus;
  createdAt: string;
  history: BookingEvent[];
  /** True for seeded demo rows. */
  demo?: boolean;
}

export interface BookingInput {
  treatmentId: string;
  doctorId: string;
  date: ISODate;
  time: HHmm;
  patientName: string;
  phone: string;
  email?: string;
  contactMethod: ContactMethod;
  consent: boolean;
  notes?: string;
}

export interface BookingFilters {
  scope?: "today" | "upcoming" | "all";
  search?: string;
  treatmentId?: string;
  doctorId?: string;
  status?: BookingStatus;
}

/* --------------------------------- Journeys --------------------------------- */

export interface JourneyStep {
  id: string;
  week: number;
  title: string;
  detail: string;
  done: boolean;
}

export interface Journey {
  id: string;
  patientName: string;
  bookingId?: string;
  treatmentId: string;
  treatmentName: string;
  startDate: ISODate;
  steps: JourneyStep[];
  createdAt: string;
}

export type JourneyInput = Omit<Journey, "id" | "createdAt" | "treatmentName">;

/* ---------------------------------- Slots ----------------------------------- */

export type SlotState = "available" | "booked" | "past" | "full";

export interface Slot {
  time: HHmm;
  state: SlotState;
}

export type DayAvailability =
  | { date: ISODate; open: true; slots: Slot[]; availableCount: number }
  | { date: ISODate; open: false; reason: string };
