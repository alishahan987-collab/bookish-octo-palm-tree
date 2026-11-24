/**
 * Domain types: the contract between the UI and every storage backend
 * (browser demo store or Supabase). Content entities are stored as JSON
 * documents; bookings are relational.
 */

export type ISODate = string; // "YYYY-MM-DD" (clinic local date)
export type HHmm = string; // "14:30"
/** Image reference: "/images/x.jpg", an https URL (Supabase Storage) or "idb:<id>" (demo uploads). */
export type ImageRef = string;

/* ---------------------------------- Pricing --------------------------------- */

export interface SessionPackage {
  sessions: number;
  price: number;
}

export type PriceModel =
  | { type: "fixed"; amount: number; unit?: string }
  | { type: "from"; amount: number; unit?: string }
  | { type: "range"; min: number; max: number; unit?: string }
  | { type: "consultation"; note?: string }
  | { type: "promo"; regular: number; promo: number; label?: string; validUntil?: ISODate; unit?: string }
  | { type: "package"; perSession: number; packages: SessionPackage[] };

export type PriceType = PriceModel["type"];

/* ----------------------------- Procedures ----------------------------- */

export type CategoryId = "skin" | "aesthetic" | "hair" | "consultation";

export interface FAQ {
  q: string;
  a: string;
}

/** A procedure / treatment. (Named Treatment for backwards compatibility.) */
export interface Treatment {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  tagline: string;
  shortDescription: string;
  description: string;
  image?: ImageRef;
  imageAlt?: string;
  howItWorks: string[];
  benefits: string[];
  suitableFor: string[];
  /** Expected recovery time. */
  downtime: string;
  /** Number of sessions (free text, editable). */
  sessions: string;
  /** Procedure duration. */
  sessionLength: string;
  sideEffects: string[];
  faqs: FAQ[];
  price: PriceModel;
  /** Condition slugs this procedure is relevant to. */
  concerns: string[];
  doctorIds: string[];
  featured: boolean;
  active: boolean;
  order: number;
  /** Fallback abstract artwork palette when no image is set. */
  palette: number;
  updatedAt: string;
}

export type TreatmentInput = Omit<Treatment, "id" | "updatedAt"> & { id?: string };

/* ----------------------------- Conditions ----------------------------- */

export interface Condition {
  id: string;
  slug: string;
  name: string;
  summary: string;
  image?: ImageRef;
  imageAlt?: string;
  overview: string;
  symptoms: string[];
  causes: string[];
  treatments: string[];
  whenToConsult: string[];
  /** Show in the Skin Concern Finder. */
  inFinder: boolean;
  active: boolean;
  order: number;
  updatedAt: string;
}

export type ConditionInput = Omit<Condition, "id" | "updatedAt"> & { id?: string };

/* ------------------------------ Gallery ------------------------------ */

export interface GalleryItem {
  id: string;
  title: string;
  treatmentId?: string;
  category: CategoryId;
  before: ImageRef;
  after: ImageRef;
  caption?: string;
  /** Admin must confirm written patient consent before the item can be published. */
  consentConfirmed: boolean;
  consentNote?: string;
  /** Demo items use abstract illustrations, never real people. */
  illustrative?: boolean;
  published: boolean;
  order: number;
  createdAt: string;
}

export type GalleryInput = Omit<GalleryItem, "id" | "createdAt"> & { id?: string };

/* -------------------------------- Blog -------------------------------- */

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover?: ImageRef;
  coverAlt?: string;
  /** Markdown (headings, lists, bold, italic, links). */
  content: string;
  tags: string[];
  status: "draft" | "published";
  author: string;
  publishedAt?: string;
  updatedAt: string;
}

export type PostInput = Omit<Post, "id" | "updatedAt"> & { id?: string };

/* ---------------------------- Site content ---------------------------- */

export type SectionId =
  | "intro"
  | "conditions"
  | "procedures"
  | "doctor"
  | "why"
  | "beforeAfter"
  | "pricing"
  | "blog"
  | "cta"
  | "faq"
  | "contact";

export interface SectionConfig {
  visible: boolean;
  order: number;
  eyebrow: string;
  title: string;
  intro: string;
}

/** A section the clinic adds itself (e.g. "Our promise", "New: laser suite"). */
export interface CustomSection {
  id: string;
  visible: boolean;
  order: number;
  eyebrow: string;
  title: string;
  body: string;
  image?: ImageRef;
  imageSide: "left" | "right";
  ctaLabel: string;
  ctaHref: string;
  tone: "light" | "cream" | "dark";
}

export interface ThemeConfig {
  preset: string;
  background: string;
  surface: string;
  cream: string;
  accent: string;
  accentText: string;
  ink: string;
  headingFont: "cormorant" | "playfair" | "bodoni";
  bodyFont: "manrope" | "inter" | "dmsans";
}

export interface SiteContent {
  brand: { clinicName: string; shortName: string; tagline: string; logo?: ImageRef; logoAlt: string };
  doctor: {
    name: string;
    designation: string;
    photo?: ImageRef;
    shortIntro: string;
    bio: string;
    qualifications: string[];
    specialization: string;
    experience: string;
    certifications: string[];
    achievements: string[];
    expertise: string[];
    registration: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    highlight: string;
    intro: string;
    primaryCta: string;
    secondaryCta: string;
    badges: { title: string; text: string }[];
    backgroundImage?: ImageRef;
  };
  announcement: { enabled: boolean; text: string; linkLabel: string; href: string };
  sections: Record<SectionId, SectionConfig>;
  customSections: CustomSection[];
  why: { title: string; text: string }[];
  faqs: FAQ[];
  contact: {
    address: string;
    city: string;
    mapsQuery: string;
    phone: string;
    email: string;
    /** International digits only, e.g. 923001234567. */
    whatsapp: string;
    /** Where new-booking alerts go (email). Falls back to `email`. */
    bookingAlertEmail: string;
  };
  social: { instagram: string; facebook: string; youtube: string; tiktok: string };
  theme: ThemeConfig;
  seo: { title: string; description: string };
  footer: { about: string; disclaimer: string };
  previewBanner: { enabled: boolean; text: string };
  currency: string;
}

/* ------------------------------ Settings ------------------------------ */

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export interface BreakTime {
  id: string;
  label: string;
  start: HHmm;
  end: HHmm;
  days: Weekday[];
}

export interface Holiday {
  id: string;
  date: ISODate;
  label: string;
}

/** A specific time range on a date that cannot be booked (e.g. doctor away). */
export interface BlockedSlot {
  id: string;
  date: ISODate;
  start: HHmm;
  end: HHmm;
  reason: string;
}

export interface ClinicSettings {
  workingDays: Weekday[];
  openTime: HHmm;
  closeTime: HHmm;
  slotMinutes: number;
  breaks: BreakTime[];
  holidays: Holiday[];
  blocked: BlockedSlot[];
  maxPerDay: number;
  bookingWindowDays: number;
  minNoticeMinutes: number;
  requireEmail: boolean;
}

/* ------------------------------ Bookings ------------------------------ */

export type ContactMethod = "whatsapp" | "email" | "both";

export type BookingStatus = "pending" | "confirmed" | "rejected" | "arrived" | "completed" | "cancelled";

export interface BookingEvent {
  at: string;
  action: "created" | "confirmed" | "rejected" | "cancelled" | "rescheduled" | "arrived" | "completed";
  note?: string;
}

export interface NotificationLog {
  at: string;
  channel: "email" | "whatsapp";
  audience: "patient" | "clinic";
  kind: string;
  status: "sent" | "failed" | "skipped";
  detail?: string;
}

export interface Booking {
  id: string;
  reference: string;
  treatmentId: string;
  treatmentName: string;
  doctorId: string;
  date: ISODate;
  time: HHmm;
  patientName: string;
  phone: string;
  email?: string;
  contactMethod: ContactMethod;
  consent: { given: true; at: string; text: string };
  notes?: string;
  status: BookingStatus;
  createdAt: string;
  history: BookingEvent[];
  notifications?: NotificationLog[];
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

/** Result of a booking write: the booking plus what happened to notifications. */
export interface BookingResult {
  booking: Booking;
  notifications: NotificationLog[];
}

export interface Doctor {
  id: string;
  name: string;
  role: string;
  bio: string | null;
}

/* ------------------------------ Journeys ------------------------------ */

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

/* ------------------------------- Slots -------------------------------- */

export type SlotState = "available" | "booked" | "past" | "full" | "blocked";

export interface Slot {
  time: HHmm;
  state: SlotState;
}

export type DayAvailability =
  | { date: ISODate; open: true; slots: Slot[]; availableCount: number }
  | { date: ISODate; open: false; reason: string };

/* ------------------------------- Search ------------------------------- */

export interface SearchHit {
  type: "procedure" | "condition" | "article" | "page";
  title: string;
  href: string;
  snippet: string;
  image?: ImageRef;
  score: number;
}
