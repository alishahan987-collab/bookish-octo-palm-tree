import { z } from "zod";

/**
 * Server-side validation of everything the admin saves. Objects are "loose"
 * (unknown extra fields are kept) so the content model can grow without
 * breaking older data, but every field the site relies on is checked.
 */

const str = (max = 5000) => z.string().max(max);
const id = z.string().min(1).max(80).regex(/^[\w-]+$/, "Invalid id");
const slug = z.string().max(80).regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/, "Use lowercase letters, numbers and hyphens only (e.g. laser-hair-removal).");
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24-hour) time");
const hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a colour like #B49A70");
const image = z.string().max(2000).optional();
const link = z.looseObject({ label: str(120), href: str(2000) });
const tone = z.enum(["ivory", "white", "champagne", "charcoal"]);
const spacing = z.enum(["compact", "normal", "airy"]);

export const BLOCK_TYPES = ["hero", "pageHeader", "text", "imageText", "treatments", "features", "reviews", "gallery", "cta", "contact", "booking", "faq", "team", "imageBanner"] as const;

const block = z.looseObject({
  id,
  type: z.enum(BLOCK_TYPES),
  hidden: z.boolean().optional(),
  tone,
  spacing,
  anchor: z.string().max(60).regex(/^[a-z0-9-]*$/, "Anchors use lowercase letters, numbers and hyphens").optional(),
  title: str(300).optional(),
  eyebrow: str(120).optional(),
  body: str(20000).optional(),
  image,
  limit: z.number().int().min(0).max(100).optional(),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
  items: z.array(z.looseObject({ id })).max(60).optional(),
  members: z.array(z.looseObject({ id, photo: image })).max(40).optional(),
  primary: link.optional(),
  secondary: link.optional(),
  cta: link.optional(),
});

export const pageSchema = z.looseObject({
  id,
  slug,
  title: str(150).min(1, "Give the page a title"),
  seoTitle: str(200),
  seoDescription: str(400),
  ogImage: image,
  published: z.boolean(),
  system: z.enum(["home", "treatments", "book", "contact", "privacy", "terms"]).optional(),
  noindex: z.boolean().optional(),
  blocks: z.array(block).max(60),
  order: z.number().int().min(0),
  updatedAt: z.string(),
});

const faq = z.looseObject({ id, q: str(300), a: str(3000) });

export const treatmentSchema = z.looseObject({
  id,
  slug: slug.min(1, "Add a web address (slug)"),
  name: str(120).min(1, "Add a treatment name"),
  category: str(80),
  shortDescription: str(400),
  description: str(20000),
  image,
  imageAlt: str(300),
  benefits: z.array(str(300)).max(30),
  benefitsVerified: z.boolean(),
  duration: str(80),
  price: str(120),
  priceNote: str(300),
  sections: z.array(z.looseObject({ id, title: str(200), body: str(10000) })).max(20),
  faqs: z.array(faq).max(30),
  bookingMinutes: z.number().int().min(5, "At least 5 minutes").max(480, "At most 8 hours"),
  bookable: z.boolean(),
  booksyUrl: str(2000),
  verified: z.boolean(),
  featured: z.boolean(),
  published: z.boolean(),
  seoTitle: str(200),
  seoDescription: str(400),
  order: z.number().int().min(0),
  updatedAt: z.string(),
});

export const testimonialSchema = z.looseObject({
  id,
  name: str(100).min(1, "Add the client's name as they agreed to be shown"),
  text: str(2000).min(1, "Add the review text"),
  rating: z.number().min(0).max(5),
  source: z.enum(["google", "instagram", "facebook", "booksy", "in-person", "other"]),
  sourceUrl: str(2000),
  date: str(40),
  treatment: str(120),
  permissionConfirmed: z.boolean(),
  featured: z.boolean(),
  published: z.boolean(),
  order: z.number().int().min(0),
  updatedAt: z.string(),
}).refine((t) => !t.published || t.permissionConfirmed, { message: "Confirm the review is genuine and you may publish it before showing it on the website.", path: ["permissionConfirmed"] });

export const gallerySchema = z.looseObject({
  id,
  title: str(150).min(1, "Add a title"),
  category: str(80),
  treatmentId: str(80),
  before: image,
  after: image,
  beforeAlt: str(300),
  afterAlt: str(300),
  caption: str(500),
  display: z.enum(["slider", "side"]),
  consentConfirmed: z.boolean(),
  consentNote: str(500),
  published: z.boolean(),
  order: z.number().int().min(0),
  updatedAt: z.string(),
})
  .refine((g) => !g.published || g.consentConfirmed, { message: "Written client consent must be confirmed before publishing.", path: ["consentConfirmed"] })
  .refine((g) => !g.published || (g.before && g.after), { message: "Add both a before and an after photo before publishing.", path: ["after"] });

const navItem = z.looseObject({
  id,
  label: str(80).min(1, "Every menu link needs a label"),
  kind: z.enum(["page", "url"]),
  pageId: z.string().max(80).optional(),
  href: z.string().max(2000).optional(),
  newTab: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

export const navigationSchema = z.looseObject({
  header: z.array(navItem).max(20),
  footer: z.array(z.looseObject({ id, title: str(80), items: z.array(navItem).max(20) })).max(6),
  legal: z.array(navItem).max(10),
});

const template = z.looseObject({ subject: str(200).min(1), body: str(5000).min(1) });

export const settingsSchema = z.looseObject({
  business: z.looseObject({
    name: str(120).min(1, "Business name is required"),
    tagline: str(200),
    phone: z.string().max(20).regex(/^(\+\d{8,15})?$/, "Phone for call links must look like +13053367129"),
    phoneDisplay: str(40),
    email: z.union([z.literal(""), z.email("Enter a valid email")]),
    notificationEmail: z.union([z.literal(""), z.email("Enter a valid email")]),
    street: str(150), suite: str(60), city: str(80), state: str(40), zip: str(20), country: str(40),
    mapsUrl: str(2000), mapsQuery: str(300),
    latitude: z.string().max(20).regex(/^(-?\d{1,3}(\.\d+)?)?$/, "Latitude like 26.0112"),
    longitude: z.string().max(20).regex(/^(-?\d{1,3}(\.\d+)?)?$/, "Longitude like -80.1495"),
    hours: z.array(z.looseObject({ day: z.number().int().min(0).max(6), closed: z.boolean(), open: hhmm, close: hhmm })).length(7),
    hoursNote: str(200), languages: str(120), priceRange: str(20),
  }),
  social: z.array(z.looseObject({ id, platform: z.enum(["instagram", "facebook", "tiktok", "whatsapp", "youtube", "booksy", "google", "other"]), label: str(60), url: str(2000) })).max(12),
  reviews: z.looseObject({ showBadge: z.boolean(), rating: z.number().min(0).max(5), count: z.number().int().min(0).max(1_000_000), asOf: str(60), googleUrl: str(2000) }),
  booking: z.looseObject({
    mode: z.enum(["request", "booksy", "both"]),
    booksyUrl: str(2000), booksyLabel: str(80), financingUrl: str(2000), financingLabel: str(120),
    slotInterval: z.number().int().min(5).max(240),
    capacity: z.number().int().min(1).max(20),
    defaultMinutes: z.number().int().min(5).max(480),
    minNoticeHours: z.number().min(0).max(240),
    windowDays: z.number().int().min(1).max(120),
    blocked: z.array(z.looseObject({ id, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), start: z.union([z.literal(""), hhmm]), end: z.union([z.literal(""), hhmm]), reason: str(120) })).max(500),
    requireEmail: z.boolean(),
    formNote: str(600), successTitle: str(120), successMessage: str(800), consentText: str(600),
  }),
  emails: z.looseObject({ received: template, approved: template, rejected: template, rescheduled: template, cancelled: template, contactReply: template, signature: str(600) }),
  seo: z.looseObject({ titleSuffix: str(120), defaultDescription: str(400), ogImage: image, indexable: z.boolean() }),
  announcement: z.looseObject({ enabled: z.boolean(), text: str(200), href: str(2000) }),
  treatmentCategories: z.array(str(80)).max(30),
  galleryCategories: z.array(str(80)).max(30),
  treatmentText: z.looseObject({ priceFallback: str(80), unverifiedNotice: str(500), bookLabel: str(40), detailsLabel: str(40) }),
  floating: z.looseObject({ showCall: z.boolean(), showBook: z.boolean(), showWhatsApp: z.boolean(), whatsappUrl: str(2000) }),
});

export const designSchema = z.looseObject({
  colors: z.looseObject({ background: hex, surface: hex, alt: hex, accent: hex, muted: hex, ink: hex }),
  fonts: z.looseObject({
    heading: z.enum(["cormorant", "playfair", "bodoni", "marcellus"]),
    body: z.enum(["dmsans", "inter", "jost", "manrope"]),
    baseSize: z.union([z.literal(15), z.literal(16), z.literal(17), z.literal(18)]),
    headingCase: z.enum(["normal", "uppercase"]),
  }),
  buttons: z.looseObject({ shape: z.enum(["square", "soft", "pill"]), style: z.enum(["solid", "outline"]), uppercase: z.boolean() }),
  corners: z.enum(["square", "soft", "round"]),
  spacing,
  header: z.looseObject({ logo: image, logoText: str(40), logoSubtext: str(60), transparentOnHero: z.boolean(), showPhone: z.boolean(), showBookButton: z.boolean(), bookLabel: str(40) }),
  footer: z.looseObject({ tone: z.enum(["charcoal", "champagne", "ivory"]), about: str(500), showHours: z.boolean(), showSocial: z.boolean(), showNewsletterNote: z.boolean(), disclaimer: str(1000), copyright: str(200) }),
});

export const SCHEMAS = {
  pages: pageSchema,
  treatments: treatmentSchema,
  testimonials: testimonialSchema,
  gallery: gallerySchema,
  settings: settingsSchema,
  design: designSchema,
  navigation: navigationSchema,
} as const;

/** Readable first error, e.g. "business.email: Enter a valid email". */
export function firstIssue(err: z.ZodError): string {
  const i = err.issues[0];
  if (!i) return "Invalid data.";
  const where = i.path.filter((p) => typeof p === "string").join(" › ");
  return where ? `${i.message} (${where})` : i.message;
}

/** Reserved first URL segments that pages cannot use. */
export const RESERVED_SLUGS = ["admin", "api", "media", "images", "_next", "treatments", "sitemap.xml", "robots.txt"];
