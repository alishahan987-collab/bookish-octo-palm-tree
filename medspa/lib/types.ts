/**
 * Domain model: the contract between the website, the admin dashboard and
 * every storage backend (local file store for development, Supabase in
 * production). Content is stored as JSON documents so the business can add
 * pages, sections and fields without database migrations. Appointments are
 * strict relational rows.
 */

export type ISODate = string; // "2026-12-01" (spa-local calendar date)
export type HHmm = string; // "14:30" (24h, spa-local)
/** "/images/x.jpg", "/media/…" (local uploads) or an https URL (Supabase Storage). */
export type ImageRef = string;

export interface Link {
  label: string;
  href: string;
}

/* ================================ Blocks ================================ */
/* A page is an ordered list of blocks (sections). Every block can be hidden,
 * duplicated, reordered and restyled from the admin. */

export type Tone = "ivory" | "white" | "champagne" | "charcoal";
export type Spacing = "compact" | "normal" | "airy";

interface BlockBase {
  id: string;
  hidden?: boolean;
  tone: Tone;
  spacing: Spacing;
  /** Optional in-page anchor, e.g. "faq" → /page#faq */
  anchor?: string;
}

export interface HeroBlock extends BlockBase {
  type: "hero";
  layout: "split" | "full" | "centered";
  eyebrow: string;
  title: string;
  subtitle: string;
  image?: ImageRef;
  imageAlt: string;
  primary: Link;
  secondary: Link;
  showRating: boolean;
  showAddress: boolean;
}

export interface PageHeaderBlock extends BlockBase {
  type: "pageHeader";
  eyebrow: string;
  title: string;
  intro: string;
  image?: ImageRef;
  imageAlt: string;
}

export interface TextBlock extends BlockBase {
  type: "text";
  eyebrow: string;
  title: string;
  /** Simple formatting: **bold**, *italic*, [link](/url), "- " lists, "## " subheadings. */
  body: string;
  align: "left" | "center";
  width: "narrow" | "wide";
}

export interface ImageTextBlock extends BlockBase {
  type: "imageText";
  eyebrow: string;
  title: string;
  body: string;
  image?: ImageRef;
  imageAlt: string;
  imageSide: "left" | "right";
  cta: Link;
}

export interface TreatmentsBlock extends BlockBase {
  type: "treatments";
  eyebrow: string;
  title: string;
  intro: string;
  source: "featured" | "all";
  limit: number;
  columns: 2 | 3 | 4;
  showPrices: boolean;
  showCategoryFilter: boolean;
  cta: Link;
}

export interface FeaturesBlock extends BlockBase {
  type: "features";
  eyebrow: string;
  title: string;
  intro: string;
  style: "cards" | "numbered" | "minimal";
  columns: 2 | 3 | 4;
  items: { id: string; title: string; text: string }[];
}

export interface ReviewsBlock extends BlockBase {
  type: "reviews";
  eyebrow: string;
  title: string;
  intro: string;
  showRating: boolean;
  limit: number;
  /** Shown when no testimonials are published yet. */
  emptyText: string;
  cta: Link;
}

export interface GalleryBlock extends BlockBase {
  type: "gallery";
  eyebrow: string;
  title: string;
  intro: string;
  limit: number;
  showFilters: boolean;
  /** Shown when no consented before/after photos are published yet. */
  emptyText: string;
  disclaimer: string;
  cta: Link;
}

export interface CtaBlock extends BlockBase {
  type: "cta";
  eyebrow: string;
  title: string;
  body: string;
  primary: Link;
  secondary: Link;
  image?: ImageRef;
  imageAlt: string;
}

export interface ContactBlock extends BlockBase {
  type: "contact";
  eyebrow: string;
  title: string;
  intro: string;
  showHours: boolean;
  showMap: boolean;
  showSocial: boolean;
  showForm: boolean;
  formTitle: string;
}

export interface BookingBlock extends BlockBase {
  type: "booking";
  eyebrow: string;
  title: string;
  intro: string;
}

export interface FaqBlock extends BlockBase {
  type: "faq";
  eyebrow: string;
  title: string;
  items: { id: string; q: string; a: string }[];
}

export interface TeamBlock extends BlockBase {
  type: "team";
  eyebrow: string;
  title: string;
  intro: string;
  members: { id: string; name: string; role: string; bio: string; photo?: ImageRef }[];
}

export interface ImageBannerBlock extends BlockBase {
  type: "imageBanner";
  image?: ImageRef;
  imageAlt: string;
  caption: string;
  height: "short" | "medium" | "tall";
}

export type Block =
  | HeroBlock
  | PageHeaderBlock
  | TextBlock
  | ImageTextBlock
  | TreatmentsBlock
  | FeaturesBlock
  | ReviewsBlock
  | GalleryBlock
  | CtaBlock
  | ContactBlock
  | BookingBlock
  | FaqBlock
  | TeamBlock
  | ImageBannerBlock;

export type BlockType = Block["type"];

/* ================================ Pages ================================= */

/** System pages can be edited and hidden, but not deleted (other features link to them). */
export type SystemPage = "home" | "treatments" | "book" | "contact" | "privacy" | "terms";

export interface Page {
  id: string;
  /** "" for the homepage, otherwise lowercase-with-hyphens. */
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  ogImage?: ImageRef;
  published: boolean;
  system?: SystemPage;
  /** Hide from search engines (e.g. thank-you pages). */
  noindex?: boolean;
  blocks: Block[];
  order: number;
  updatedAt: string;
}

/* ============================== Treatments ============================== */

export interface Treatment {
  id: string;
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  /** Simple formatting, like TextBlock.body. */
  description: string;
  image?: ImageRef;
  imageAlt: string;
  /** Shown only when the business has verified them (benefitsVerified). */
  benefits: string[];
  benefitsVerified: boolean;
  /** Free text, e.g. "60 minutes". Hidden when empty. */
  duration: string;
  /** Free text, e.g. "$120", "From $89", "Packages available". Empty = priceFallback. */
  price: string;
  priceNote: string;
  /** Extra editable sections (e.g. "What to expect", "Aftercare"). */
  sections: { id: string; title: string; body: string }[];
  faqs: { id: string; q: string; a: string }[];
  /** Minutes this treatment occupies in the calendar (availability). */
  bookingMinutes: number;
  bookable: boolean;
  /** Optional Booksy deep link for this service; falls back to the main Booksy link. */
  booksyUrl: string;
  /** The business has confirmed this service and its details are current. */
  verified: boolean;
  featured: boolean;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  order: number;
  updatedAt: string;
}

/* ============================= Testimonials ============================= */

export type ReviewSource = "google" | "instagram" | "facebook" | "booksy" | "in-person" | "other";

export interface Testimonial {
  id: string;
  /** As the customer agreed to be named, e.g. "Maria G." */
  name: string;
  text: string;
  rating: number; // 0 = not shown
  source: ReviewSource;
  sourceUrl: string;
  date: string;
  treatment: string;
  /** Genuine review, and the customer agreed / it is a public review the business may quote. */
  permissionConfirmed: boolean;
  featured: boolean;
  published: boolean;
  order: number;
  updatedAt: string;
}

/* =============================== Gallery ================================ */

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  treatmentId: string;
  before?: ImageRef;
  after?: ImageRef;
  beforeAlt: string;
  afterAlt: string;
  caption: string;
  /** "slider" = drag to compare; "side" = side by side. */
  display: "slider" | "side";
  /** Written client consent on file. Required before publishing (enforced in DB too). */
  consentConfirmed: boolean;
  consentNote: string;
  published: boolean;
  order: number;
  updatedAt: string;
}

/* ============================ Site settings ============================= */

export interface DayHours {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  closed: boolean;
  open: HHmm;
  close: HHmm;
}

export interface SocialLink {
  id: string;
  platform: "instagram" | "facebook" | "tiktok" | "whatsapp" | "youtube" | "booksy" | "google" | "other";
  label: string;
  url: string;
}

export interface BlockedTime {
  id: string;
  date: ISODate;
  /** Empty start/end = the whole day is closed. */
  start: HHmm | "";
  end: HHmm | "";
  reason: string;
}

export interface EmailTemplate {
  subject: string;
  /** Plain text with placeholders: {{name}} {{treatment}} {{date}} {{time}} {{reference}} {{business}} {{phone}} {{address}} {{reason}} */
  body: string;
}

export type EmailKind = "received" | "approved" | "rejected" | "rescheduled" | "cancelled" | "contactReply";

export interface Settings {
  business: {
    name: string;
    tagline: string;
    phone: string; // E.164-ish, used for tel: links
    phoneDisplay: string;
    email: string;
    /** Where new appointment requests and contact messages are sent. */
    notificationEmail: string;
    street: string;
    suite: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    mapsUrl: string;
    /** Text used for the embedded map (usually the full address). */
    mapsQuery: string;
    latitude: string;
    longitude: string;
    hours: DayHours[];
    hoursNote: string;
    languages: string;
    priceRange: string;
  };
  social: SocialLink[];
  reviews: {
    showBadge: boolean;
    rating: number;
    count: number;
    /** When the rating/count were last checked, e.g. "November 2026". */
    asOf: string;
    googleUrl: string;
  };
  booking: {
    /** request = website form only; booksy = all Book buttons go to Booksy; both = form + Booksy option. */
    mode: "request" | "booksy" | "both";
    booksyUrl: string;
    booksyLabel: string;
    financingUrl: string;
    financingLabel: string;
    slotInterval: number;
    /** Appointments that can run at the same time (rooms / providers). */
    capacity: number;
    defaultMinutes: number;
    minNoticeHours: number;
    windowDays: number;
    blocked: BlockedTime[];
    requireEmail: boolean;
    formNote: string;
    successTitle: string;
    successMessage: string;
    consentText: string;
  };
  emails: Record<EmailKind, EmailTemplate> & { signature: string };
  seo: {
    titleSuffix: string;
    defaultDescription: string;
    ogImage?: ImageRef;
    /** Off until launch: adds noindex to every page. */
    indexable: boolean;
  };
  announcement: { enabled: boolean; text: string; href: string };
  treatmentCategories: string[];
  galleryCategories: string[];
  /** Copy used on treatment pages and cards. */
  treatmentText: {
    priceFallback: string;
    unverifiedNotice: string;
    bookLabel: string;
    detailsLabel: string;
  };
  /** Floating buttons on phones. */
  floating: { showCall: boolean; showBook: boolean; showWhatsApp: boolean; whatsappUrl: string };
}

/* ================================ Design ================================ */

export type HeadingFont = "cormorant" | "playfair" | "bodoni" | "marcellus";
export type BodyFont = "dmsans" | "inter" | "jost" | "manrope";

export interface Design {
  colors: {
    background: string; // ivory
    surface: string; // white
    alt: string; // champagne
    accent: string; // muted gold
    muted: string; // taupe
    ink: string; // charcoal
  };
  fonts: { heading: HeadingFont; body: BodyFont; baseSize: 15 | 16 | 17 | 18; headingCase: "normal" | "uppercase" };
  buttons: { shape: "square" | "soft" | "pill"; style: "solid" | "outline"; uppercase: boolean };
  corners: "square" | "soft" | "round";
  spacing: Spacing;
  header: {
    logo?: ImageRef;
    logoText: string;
    logoSubtext: string;
    transparentOnHero: boolean;
    showPhone: boolean;
    showBookButton: boolean;
    bookLabel: string;
  };
  footer: {
    tone: "charcoal" | "champagne" | "ivory";
    about: string;
    showHours: boolean;
    showSocial: boolean;
    showNewsletterNote: boolean;
    disclaimer: string;
    copyright: string;
  };
}

/* ============================== Navigation ============================== */

export interface NavItem {
  id: string;
  label: string;
  /** "page" links follow the page if its address changes; "url" is any link. */
  kind: "page" | "url";
  pageId?: string;
  href?: string;
  newTab?: boolean;
  hidden?: boolean;
}

export interface Navigation {
  header: NavItem[];
  footer: { id: string; title: string; items: NavItem[] }[];
  legal: NavItem[];
}

/* ============================= Appointments ============================= */

export type AppointmentStatus = "pending" | "approved" | "rejected" | "cancelled" | "completed" | "no_show";

/** Statuses that hold a place in the calendar. */
export const ACTIVE_STATUSES: AppointmentStatus[] = ["pending", "approved"];

export interface NotificationLog {
  at: string;
  to: "customer" | "clinic";
  kind: string;
  status: "sent" | "failed" | "skipped";
  detail?: string;
}

export interface AppointmentEvent {
  at: string;
  action: "created" | "approved" | "rejected" | "cancelled" | "completed" | "no_show" | "rescheduled" | "note";
  note?: string;
  by?: string;
}

export interface Appointment {
  id: string;
  reference: string;
  treatmentId: string;
  treatmentName: string;
  date: ISODate;
  time: HHmm;
  durationMinutes: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: AppointmentStatus;
  source: "website" | "admin";
  internalNotes: string;
  history: AppointmentEvent[];
  notifications: NotificationLog[];
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentRequest {
  treatmentId: string;
  date: ISODate;
  time: HHmm;
  name: string;
  email: string;
  phone: string;
  message?: string;
  consent: boolean;
  /** Honeypot: must stay empty. */
  website?: string;
}

/* =============================== Messages =============================== */

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: "new" | "read" | "archived";
  notifications: NotificationLog[];
  createdAt: string;
}

/* ================================ Media ================================= */

export interface MediaFile {
  path: string;
  url: string;
  size: number;
  createdAt: string;
}

/* ================================ Slots ================================= */

export type SlotState = "available" | "full" | "past" | "blocked";

export interface Slot {
  time: HHmm;
  state: SlotState;
}

export type DayAvailability =
  | { date: ISODate; open: true; slots: Slot[]; available: number }
  | { date: ISODate; open: false; reason: string };

/* ============================== Collections ============================= */

export interface Collections {
  pages: Page;
  treatments: Treatment;
  testimonials: Testimonial;
  gallery: GalleryItem;
}
export type CollectionName = keyof Collections;

export interface Docs {
  settings: Settings;
  design: Design;
  navigation: Navigation;
}
export type DocKey = keyof Docs;
