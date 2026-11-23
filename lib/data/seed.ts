import type { ClinicSettings, Doctor, GalleryItem, SiteContent } from "./types";
import { THEME_PRESETS } from "../theme";
export { SEED_TREATMENTS } from "./seed-procedures";
export { SEED_CONDITIONS } from "./seed-conditions";
export { SEED_POSTS } from "./seed-posts";

/**
 * Default site content. Everything here is editable in the admin dashboard.
 * Doctor details are placeholders: nothing about the doctor is invented.
 */
export const SEED_CONTENT: SiteContent = {
  brand: { clinicName: "Aesthetica by Dr. Sajjad", shortName: "Aesthetica", tagline: "Dermatology & Aesthetic Medicine", logoAlt: "Aesthetica logo" },
  doctor: {
    name: "Dr. Sajjad Ahmad",
    designation: "Dermatologist & Aesthetic Physician",
    shortIntro: "Doctor-led care for skin, hair and aesthetic concerns, with honest advice and a plan built around you.",
    bio: "",
    qualifications: [],
    specialization: "",
    experience: "",
    certifications: [],
    achievements: [],
    expertise: ["Medical dermatology", "Acne and acne scars", "Pigmentation and melasma", "Hair loss", "Aesthetic injectables", "Laser and skin procedures"],
    registration: "",
  },
  hero: {
    eyebrow: "Dermatology · Aesthetics · Hair",
    title: "Expert care for skin that",
    highlight: "feels like yours.",
    intro: "Medical and aesthetic dermatology delivered with precision, honesty and calm. Every plan starts with a proper diagnosis.",
    primaryCta: "Book appointment",
    secondaryCta: "Explore treatments",
    badges: [
      { title: "Doctor-led", text: "consultations" },
      { title: "Evidence-based", text: "treatments" },
      { title: "Online", text: "booking 24/7" },
    ],
  },
  announcement: { enabled: false, text: "New: online booking is now open.", linkLabel: "Book now", href: "/book" },
  sections: {
    intro: { visible: true, order: 1, eyebrow: "Welcome", title: "A modern clinic for skin, hair and confidence.", intro: "We combine medical dermatology with carefully chosen aesthetic treatments. You will always know what is being recommended, why, and what it costs before you begin." },
    conditions: { visible: true, order: 2, eyebrow: "Skin conditions", title: "Conditions we treat", intro: "Explore common skin and hair conditions: what they are, why they happen and how they can be treated." },
    procedures: { visible: true, order: 3, eyebrow: "Procedures", title: "Treatments & procedures", intro: "Medical, aesthetic and hair procedures, each explained clearly with recovery time, sessions and pricing." },
    doctor: { visible: true, order: 4, eyebrow: "Meet the doctor", title: "Your doctor", intro: "" },
    why: { visible: true, order: 5, eyebrow: "Why choose us", title: "Care that starts with listening.", intro: "" },
    beforeAfter: { visible: true, order: 6, eyebrow: "Before & after", title: "Results gallery", intro: "Published only with each patient's written consent. Individual results vary." },
    pricing: { visible: true, order: 7, eyebrow: "Pricing", title: "Clear, upfront pricing", intro: "Prices for popular treatments. Your final price is confirmed at consultation." },
    blog: { visible: true, order: 8, eyebrow: "Skincare education", title: "From the journal", intro: "Practical, evidence-based guidance from the clinic." },
    cta: { visible: true, order: 9, eyebrow: "Appointments", title: "Your first step is a conversation.", intro: "Choose a treatment and a time that suits you. The clinic will confirm your appointment." },
    faq: { visible: true, order: 10, eyebrow: "FAQ", title: "Questions, answered", intro: "Anything else? Message us on WhatsApp." },
    contact: { visible: true, order: 11, eyebrow: "Visit us", title: "Location & contact", intro: "" },
  },
  why: [
    { title: "Diagnosis first", text: "Your skin is examined by a doctor before any treatment is recommended." },
    { title: "Honest, personalised plans", text: "Realistic expectations, explained clearly. Sometimes the right advice is to do less." },
    { title: "Transparent pricing", text: "Prices are published and your final cost is confirmed before you begin." },
    { title: "Safety & privacy", text: "Medical-grade protocols, and your information handled with strict confidentiality." },
  ],
  faqs: [
    { q: "Do I need a consultation before treatment?", a: "For most procedures, yes. A consultation lets the doctor assess your skin and medical history, explain options and confirm that a treatment is suitable for you." },
    { q: "How do I book, change or cancel an appointment?", a: "Book online at any time. You will receive a confirmation by email and, where available, WhatsApp. To make changes, reply to that message or contact the clinic." },
    { q: "Are the prices on the website final?", a: "Prices are a guide. Your final price is confirmed by the clinic before treatment, based on the plan agreed with your doctor." },
    { q: "Will I see results after one session?", a: "It depends on the treatment and your skin. Many treatments need a course of sessions, and results vary between individuals." },
    { q: "Is my information kept private?", a: "Yes. Your details are used only to manage your care and appointments and are stored securely. See our privacy notice for details." },
  ],
  contact: {
    address: "Jadoon Plaza, Phase 2 Road",
    city: "Abbottabad",
    mapsQuery: "Aesthetica by Dr Sajjad, Jadoon Plaza, Phase 2 Road, Abbottabad",
    phone: "",
    email: "",
    whatsapp: "",
    bookingAlertEmail: "",
  },
  social: { instagram: "", facebook: "", youtube: "", tiktok: "" },
  theme: { preset: "champagne", ...THEME_PRESETS.champagne, headingFont: "cormorant", bodyFont: "manrope" },
  seo: {
    title: "Aesthetica by Dr. Sajjad | Dermatology & Aesthetic Clinic",
    description: "Dermatology, aesthetic and hair treatments with doctor-led consultations, transparent pricing and online booking.",
  },
  footer: {
    about: "Medical, aesthetic and hair dermatology. Every plan begins with a proper diagnosis.",
    disclaimer: "Information on this website is general and is not a substitute for personal medical advice. Results vary between individuals.",
  },
  previewBanner: { enabled: true, text: "Design preview prepared for Aesthetica by Dr. Sajjad. Not the official website." },
  currency: "PKR",
};

export const SEED_SETTINGS: ClinicSettings = {
  workingDays: [0, 1, 2, 3, 4, 5, 6],
  openTime: "11:00",
  closeTime: "19:00",
  slotMinutes: 30,
  breaks: [
    { id: "brk-lunch", label: "Lunch & prayer", start: "13:30", end: "14:30", days: [1, 2, 3, 4, 6, 0] },
    { id: "brk-jumuah", label: "Jumu'ah", start: "12:30", end: "14:30", days: [5] },
  ],
  holidays: [
    { id: "hol-quaid", date: "2026-12-25", label: "Quaid-e-Azam Day" },
    { id: "hol-kashmir", date: "2027-02-05", label: "Kashmir Solidarity Day" },
    { id: "hol-pakistan", date: "2027-03-23", label: "Pakistan Day" },
  ],
  blocked: [],
  maxPerDay: 14,
  bookingWindowDays: 30,
  minNoticeMinutes: 60,
  requireEmail: true,
};

export const MAIN_DOCTOR_ID = "main";

export function doctorFromContent(c: SiteContent): Doctor {
  return { id: MAIN_DOCTOR_ID, name: c.doctor.name, role: c.doctor.designation, bio: c.doctor.bio || null };
}

/** Demo gallery: abstract illustrations only (no real people), clearly labelled. */
export const SEED_GALLERY: GalleryItem[] = [
  { id: "g-demo-1", title: "Illustration: texture", treatmentId: "t-microneedling", category: "skin", before: "art:before:4", after: "art:after:7", caption: "Abstract demo images to show how the comparison slider works.", consentConfirmed: false, illustrative: true, published: true, order: 0, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "g-demo-2", title: "Illustration: tone", treatmentId: "t-chemical-peels", category: "skin", before: "art:before:5", after: "art:after:0", caption: "Abstract demo images to show how the comparison slider works.", consentConfirmed: false, illustrative: true, published: true, order: 1, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "g-demo-3", title: "Illustration: hair density", treatmentId: "t-prp-hair-treatment", category: "hair", before: "art:before:6", after: "art:after:2", caption: "Abstract demo images to show how the comparison slider works.", consentConfirmed: false, illustrative: true, published: true, order: 2, createdAt: "2026-01-01T00:00:00.000Z" },
];

/** Fictional names for seeded demo appointments. Not real patients. */
export const DEMO_PATIENT_NAMES = [
  "Ayesha Khan", "Hamza Ali", "Mahnoor Abbasi", "Usman Jadoon", "Fatima Qureshi", "Bilal Awan",
  "Zainab Tanoli", "Saad Malik", "Hira Shah", "Imran Swati", "Sana Mir", "Omer Farooq",
];
