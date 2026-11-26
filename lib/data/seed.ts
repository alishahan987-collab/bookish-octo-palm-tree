import type { ClinicSettings, Doctor, GalleryItem, SiteContent } from "./types";
import { THEME_PRESETS } from "../theme";
export { SEED_TREATMENTS } from "./seed-procedures";
export { SEED_CONDITIONS } from "./seed-conditions";
export { SEED_POSTS } from "./seed-posts";

/**
 * Default site content for VVIP Beauty & Skin Care, Chino, California.
 *
 * Every business fact below comes from the clinic's verified Google Business
 * Profile (captured 25 November 2026): name, address, phone, opening hours,
 * the "About" description, accessibility / inclusivity / payment attributes,
 * the 5.0 rating from 193 reviews, and the two published prices. Nothing about
 * the team, clients or results is invented: those sections stay empty until
 * the clinic adds verified content in the admin dashboard.
 */

const MAPS_QUERY = "VVIP Beauty & Skin Care, 13788 Roswell Ave #118, Chino, CA 91710";

export const SEED_CONTENT: SiteContent = {
  brand: { clinicName: "VVIP Beauty & Skin Care", shortName: "VVIP", tagline: "Beauty & Skin Care", logoAlt: "VVIP Beauty & Skin Care" },
  announcement: { enabled: false, text: "Open seven days a week.", linkLabel: "Book online", href: "/book" },
  homeSections: [
    {
      id: "hero",
      type: "hero",
      visible: true,
      eyebrow: "Skin care clinic · Chino, California",
      title: "Personalized skin care,",
      highlight: "beautifully done.",
      intro: "Facials, injectables, laser and wellness treatments, tailored to you in a calm, luxurious clinic.",
      image: "/images/hero-skin.jpg",
      imageAlt: "Woman with smooth, radiant skin applying a moisturizing cream",
      ctaLabel: "Book an Appointment",
      ctaHref: "/book",
      secondaryLabel: "Explore Treatments",
      secondaryHref: "/treatments",
    },
    {
      id: "popular",
      type: "treatments",
      visible: true,
      eyebrow: "The treatment menu",
      title: "Popular treatments",
      intro: "From a restorative HydraFacial to laser hair removal and IV wellness therapy, each treatment is personalized to you.",
      category: "featured",
      limit: 6,
      ctaLabel: "View all treatments",
      ctaHref: "/treatments",
    },
    {
      id: "about",
      type: "about",
      visible: true,
      eyebrow: "About the clinic",
      title: "Enhancing your natural beauty, inside and out.",
      intro:
        "We offer customizable skincare and wellness treatments designed to enhance your natural beauty and overall well-being. Every treatment is personalized to help you achieve healthy, radiant, long-lasting results in a luxurious and professional environment.",
      image: "/images/about-serum.jpg",
      imageAlt: "Hands presenting a glass bottle of facial oil against a warm beige background",
      imageSide: "left",
      ctaLabel: "About us",
      ctaHref: "/about",
    },
    { id: "why", type: "why", visible: true, eyebrow: "Why VVIP", title: "Care you can feel confident in.", intro: "" },
    {
      id: "results",
      type: "beforeAfter",
      visible: true,
      eyebrow: "Results",
      title: "Before & after",
      intro: "Real client results, published only with each client's written consent. Individual results vary.",
      ctaLabel: "View the gallery",
      ctaHref: "/before-after",
    },
    { id: "reviews", type: "testimonials", visible: true, eyebrow: "Client reviews", title: "Loved by our clients", intro: "", limit: 6 },
    {
      id: "team",
      type: "team",
      visible: true,
      eyebrow: "Meet the team",
      title: "The people behind your care",
      intro: "Licensed professionals who take the time to understand your goals.",
    },
    {
      id: "book",
      type: "booking",
      visible: true,
      eyebrow: "Appointments",
      title: "Your skin deserves our full attention.",
      intro: "Choose a treatment and a time online in under a minute, or call us. We are open seven days a week.",
      ctaLabel: "Book an Appointment",
      ctaHref: "/book",
      image: "/images/s-serum.jpg",
      imageAlt: "",
    },
    { id: "visit", type: "location", visible: true, eyebrow: "Visit us", title: "Find us in Chino", intro: "" },
  ],
  about: {
    eyebrow: "About us",
    title: "Beauty, thoughtfully personalized.",
    body:
      "VVIP Beauty & Skin Care is a skin care clinic in Chino, California, offering customizable skincare and wellness treatments designed to enhance your natural beauty and overall well-being.\n\n" +
      "Our menu brings together facial care and HydraFacial, acne and anti-aging treatments, microneedling, PRP skin rejuvenation, Sculptra, Botox, dermal fillers and advanced laser treatments for skin concerns and hair removal. We also provide skin tag, mole and wart removal, as well as wellness services including IV wellness shots, NAD+ therapy, vitamin therapy and body detox programs.\n\n" +
      "Every treatment is personalized to help you achieve healthy, radiant, youthful and long-lasting results, in a luxurious and professional environment.",
    image: "/images/about-serum.jpg",
    imageAlt: "Hands presenting a glass bottle of facial oil against a warm beige background",
    values: [
      { title: "Personalized", text: "Every treatment is tailored to your skin, your goals and your schedule." },
      { title: "Comprehensive", text: "Facials, injectables, laser and wellness, all under one roof." },
      { title: "Welcoming", text: "An accessible, inclusive clinic, open seven days a week." },
    ],
  },
  team: [],
  testimonials: [],
  reviews: {
    enabled: true,
    rating: 5,
    count: 193,
    source: "Google",
    url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAPS_QUERY)}`,
    asOf: "2026-11-25",
  },
  why: [
    { icon: "star", title: "Five-star rated", text: "Our clients rate us five stars on our verified Google Business Profile." },
    { icon: "sparkle", title: "Personalized to you", text: "Every treatment is tailored to your skin, your goals and your schedule." },
    { icon: "clock", title: "Open seven days", text: "Weekday and weekend appointments, Monday through Sunday." },
    { icon: "accessible", title: "Accessible & inclusive", text: "Wheelchair-accessible entrance, parking, restroom and seating. LGBTQ+ friendly and a transgender safe space." },
  ],
  faqs: [
    { q: "Which treatment is right for me?", a: "If you are not sure, book a consultation. We will talk through your goals and health history and recommend options that suit your skin." },
    { q: "How do I book, change or cancel an appointment?", a: "Book online at any time, or call us at (909) 516-7066. To change or cancel, call us or reply to your confirmation email." },
    { q: "What forms of payment do you accept?", a: "We accept Visa, MasterCard, American Express, Discover, debit cards and contactless mobile payments." },
    { q: "Is the clinic wheelchair accessible?", a: "Yes. We have a wheelchair-accessible entrance, parking lot, restroom and seating." },
    { q: "Will I see results after one session?", a: "It depends on the treatment and on your skin. Some treatments show results right away, others work best as a series. Results vary from person to person, and your provider will explain what to expect." },
  ],
  contact: {
    address: "13788 Roswell Ave, #118",
    city: "Chino, CA 91710",
    mapsQuery: MAPS_QUERY,
    phone: "(909) 516-7066",
    email: "",
    whatsapp: "",
    bookingAlertEmail: "",
  },
  visitInfo: [
    { title: "Accessibility", text: "Wheelchair-accessible entrance, parking lot, restroom and seating." },
    { title: "Payment", text: "Visa, MasterCard, American Express, Discover, debit cards and contactless mobile payments." },
    { title: "Everyone is welcome", text: "LGBTQ+ friendly and a transgender safe space." },
  ],
  social: { instagram: "", facebook: "", youtube: "", tiktok: "", yelp: "" },
  theme: { preset: "vvip", ...THEME_PRESETS.vvip, headingFont: "cormorant", bodyFont: "dmsans" },
  seo: {
    title: "VVIP Beauty & Skin Care | Skin Care Clinic in Chino, CA",
    description: "Facials, HydraFacial, Botox, fillers, Sculptra, laser hair removal and IV wellness therapy in Chino, California. Open 7 days. Book online.",
  },
  footer: {
    about: "Personalized skincare and wellness treatments in a luxurious, professional setting in Chino, California.",
    disclaimer: "Information on this website is general and is not a substitute for personal medical advice. Individual results vary.",
  },
  previewBanner: { enabled: true, text: "Design preview for VVIP Beauty & Skin Care. Not yet the official website." },
  currency: "USD",
};

export const SEED_SETTINGS: ClinicSettings = {
  workingDays: [0, 1, 2, 3, 4, 5, 6],
  // Monday–Friday 9:30 AM – 6:30 PM; Saturday–Sunday 10:00 AM – 7:00 PM (Google Business Profile).
  openTime: "09:30",
  closeTime: "18:30",
  dayHours: { "0": { open: "10:00", close: "19:00" }, "6": { open: "10:00", close: "19:00" } },
  slotMinutes: 30,
  breaks: [],
  holidays: [],
  blocked: [],
  maxPerDay: 16,
  bookingWindowDays: 45,
  minNoticeMinutes: 120,
  requireEmail: true,
};

/** Bookings are kept on one clinic calendar. */
export const MAIN_DOCTOR_ID = "main";

export function doctorFromContent(c: SiteContent): Doctor {
  return { id: MAIN_DOCTOR_ID, name: c.brand.clinicName, role: "Clinic calendar", bio: null };
}

/** No results are shown until the clinic uploads real, consented photographs. */
export const SEED_GALLERY: GalleryItem[] = [];

/** Fictional names for seeded demo appointments (demo mode only). Not real clients. */
export const DEMO_PATIENT_NAMES = [
  "Emily Chen", "Sofia Martinez", "Jessica Nguyen", "Daniel Park", "Ashley Johnson", "Grace Liu",
  "Maria Hernandez", "Olivia Wang", "Sarah Kim", "Isabella Garcia", "Hannah Lee", "Vanessa Lopez",
];
