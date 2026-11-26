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

/** Treatment menu groups. Labels and page addresses live in lib/categories.ts. */
export type CategoryId = "skin" | "injectables" | "laser" | "wellness" | "consultation";

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

/**
 * Homepage building blocks. The homepage is an ordered list of section
 * instances: each can be edited, moved, hidden, duplicated or removed in
 * Admin → Homepage, and any type can be added again from the library.
 */
export type HomeSectionType =
  | "hero"
  | "treatments"
  | "about"
  | "why"
  | "beforeAfter"
  | "testimonials"
  | "team"
  | "booking"
  | "location"
  | "faq"
  | "concerns"
  | "pricing"
  | "journal"
  | "custom";

export interface HomeSection {
  id: string;
  type: HomeSectionType;
  visible: boolean;
  eyebrow: string;
  title: string;
  /** Hero only: words shown in italic after the title. */
  highlight?: string;
  intro: string;
  image?: ImageRef;
  imageAlt?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  tone?: "light" | "cream" | "dark";
  imageSide?: "left" | "right";
  /** Treatments section: which group to show. */
  category?: CategoryId | "featured" | "all";
  /** Treatments / journal / testimonials: how many items. */
  limit?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  /** e.g. "RN, BSN · California Board of Registered Nursing" — publish only after verification. */
  credentials: string;
  bio: string;
  photo?: ImageRef;
  photoAlt?: string;
  visible: boolean;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  /** Where the review was originally posted, e.g. "Google". */
  source: string;
  date?: ISODate;
  rating?: number;
  /** Must be true before the testimonial can be shown publicly. */
  permission: boolean;
  visible: boolean;
}

export interface ThemeConfig {
  preset: string;
  /** Page background (warm ivory). */
  background: string;
  /** Cards and forms (white). */
  surface: string;
  /** Alternate section background (champagne beige). */
  cream: string;
  /** Decorative accent (muted gold): rules, icons, buttons. Text-safe shades are derived automatically. */
  accent: string;
  /** Soft neutral (taupe) for hairlines. */
  taupe: string;
  /** Headings and body text (deep charcoal). */
  ink: string;
  headingFont: "cormorant" | "playfair" | "bodoni";
  bodyFont: "dmsans" | "inter" | "manrope";
}

export interface SiteContent {
  brand: { clinicName: string; shortName: string; tagline: string; logo?: ImageRef; logoAlt: string };
  announcement: { enabled: boolean; text: string; linkLabel: string; href: string };
  homeSections: HomeSection[];
  about: { eyebrow: string; title: string; body: string; image?: ImageRef; imageAlt?: string; values: { title: string; text: string }[] };
  team: TeamMember[];
  testimonials: Testimonial[];
  /** Public rating summary, shown only when enabled. Update `asOf` whenever the numbers change. */
  reviews: { enabled: boolean; rating: number; count: number; source: string; url: string; asOf: ISODate };
  why: { title: string; text: string; icon?: string }[];
  faqs: FAQ[];
  contact: {
    address: string;
    city: string;
    mapsQuery: string;
    phone: string;
    email: string;
    /** International digits only, e.g. 19095167066. Leave empty to hide WhatsApp buttons. */
    whatsapp: string;
    /** Where new-booking alerts go (email). Falls back to `email`. */
    bookingAlertEmail: string;
  };
  /** "Good to know" notes on the contact page and homepage (accessibility, parking, payments...). */
  visitInfo: { title: string; text: string }[];
  social: { instagram: string; facebook: string; youtube: string; tiktok: string; yelp: string };
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
  /** Default hours. */
  openTime: HHmm;
  closeTime: HHmm;
  /** Hours that differ by weekday, keyed "0" (Sunday) to "6" (Saturday). */
  dayHours?: Partial<Record<string, { open: HHmm; close: HHmm }>>;
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

/** phone = the clinic calls or texts; both = WhatsApp and email (only offered when WhatsApp is set up). */
export type ContactMethod = "phone" | "email" | "whatsapp" | "both";

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
