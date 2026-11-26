import type { Block, Design, Navigation, Page, Settings, Treatment } from "./types";

/**
 * Starter content for MEDSPA Skincare & Body.
 *
 * Content rules followed here (keep them when editing):
 *   - No invented prices, durations, benefits, credentials, testimonials or results.
 *   - Every treatment starts as "not yet verified"; the business confirms each
 *     one in the admin (Treatments → Verified) before advertising details.
 *   - Stock photos are illustrative and are never presented as clients or results.
 * Facts used: business name, address, phone, hours, Google rating as reported
 * (Nov 2026), and the links published on the business's Linktree.
 */

const now = "2026-11-25T00:00:00.000Z";
const B = <T extends Block>(b: T) => b;

const ADDRESS = "2632 Hollywood Blvd, Suite 307, Hollywood, FL 33020";
const BOOKSY = "https://booksy.com/en-us/instant-experiences/widget/629078?instant_experiences_enabled=true&ig_ix=true";
const GOOGLE_MAPS =
  "https://www.google.com/maps/search/?api=1&query=MEDSPA+Skincare+%26+Body%2C+2632+Hollywood+Blvd+Ste+307%2C+Hollywood%2C+FL+33020";

export const SEED_SETTINGS: Settings = {
  business: {
    name: "MEDSPA Skincare & Body",
    tagline: "Med spa · Skincare & body treatments · Hollywood, Florida",
    phone: "+13053367129",
    phoneDisplay: "(305) 336-7129",
    email: "",
    notificationEmail: "",
    street: "2632 Hollywood Blvd",
    suite: "Suite 307",
    city: "Hollywood",
    state: "FL",
    zip: "33020",
    country: "US",
    mapsUrl: GOOGLE_MAPS,
    mapsQuery: `MEDSPA Skincare & Body, ${ADDRESS}`,
    latitude: "",
    longitude: "",
    hours: [
      { day: 1, closed: false, open: "09:30", close: "18:00" },
      { day: 2, closed: false, open: "09:30", close: "18:00" },
      { day: 3, closed: false, open: "09:30", close: "17:30" },
      { day: 4, closed: false, open: "09:30", close: "17:30" },
      { day: 5, closed: false, open: "09:30", close: "17:30" },
      { day: 6, closed: false, open: "10:00", close: "16:00" },
      { day: 0, closed: true, open: "10:00", close: "16:00" },
    ],
    hoursNote: "Appointments recommended.",
    languages: "English, Español",
    priceRange: "",
  },
  social: [
    { id: "s_instagram", platform: "instagram", label: "Instagram", url: "https://www.instagram.com/medspabykeity/" },
    { id: "s_whatsapp", platform: "whatsapp", label: "WhatsApp", url: "https://wa.me/message/GREYJAJFFJUND1" },
    { id: "s_booksy", platform: "booksy", label: "Booksy", url: BOOKSY },
    { id: "s_linktree", platform: "other", label: "All links", url: "https://linktr.ee/MEDSPABYKEITY" },
  ],
  reviews: {
    showBadge: true,
    rating: 5,
    count: 286,
    asOf: "November 2026",
    googleUrl: GOOGLE_MAPS,
  },
  booking: {
    mode: "both",
    booksyUrl: BOOKSY,
    booksyLabel: "Book instantly on Booksy",
    financingUrl: "https://pay.withcherry.com/skin-care-miami?utm_source=practice&m=24052",
    financingLabel: "Payment plans available with Cherry",
    slotInterval: 30,
    capacity: 1,
    defaultMinutes: 60,
    minNoticeHours: 12,
    windowDays: 60,
    blocked: [],
    requireEmail: true,
    formNote:
      "This is an appointment request. Your appointment is confirmed only after our team approves it; we will contact you by email or phone.",
    successTitle: "Request received",
    successMessage:
      "Thank you. We have received your appointment request and sent a copy to your email. It is not confirmed yet: our team will review it and contact you shortly to confirm.",
    consentText:
      "I agree that MEDSPA Skincare & Body may contact me by email or phone about this request, and I have read the Privacy Policy.",
  },
  emails: {
    received: {
      subject: "We received your appointment request – {{business}}",
      body:
        "Hi {{name}},\n\nThank you for your request. Here are the details:\n\nTreatment: {{treatment}}\nRequested time: {{date}} at {{time}}\nReference: {{reference}}\n\nPlease note: this appointment is not confirmed yet. Our team will review your request and contact you shortly.\n\nIf you need to change anything, call us at {{phone}}.",
    },
    approved: {
      subject: "Your appointment is confirmed – {{date}} at {{time}}",
      body:
        "Hi {{name}},\n\nGood news: your appointment is confirmed.\n\nTreatment: {{treatment}}\nDate and time: {{date}} at {{time}}\nReference: {{reference}}\nAddress: {{address}}\n\nIf you need to reschedule, please call us at {{phone}}.",
    },
    rejected: {
      subject: "About your appointment request – {{business}}",
      body:
        "Hi {{name}},\n\nThank you for your request for {{treatment}} on {{date}} at {{time}}. Unfortunately we are not able to offer this time.\n\n{{reason}}\n\nPlease call us at {{phone}} or send a new request and we will be happy to find another time.",
    },
    rescheduled: {
      subject: "Your appointment time has changed – {{date}} at {{time}}",
      body:
        "Hi {{name}},\n\nYour appointment for {{treatment}} is now scheduled for {{date}} at {{time}}.\nReference: {{reference}}\n\nIf this time does not suit you, please call us at {{phone}}.",
    },
    cancelled: {
      subject: "Your appointment has been cancelled – {{business}}",
      body:
        "Hi {{name}},\n\nYour appointment for {{treatment}} on {{date}} at {{time}} (reference {{reference}}) has been cancelled.\n\n{{reason}}\n\nTo book a new time, call us at {{phone}} or visit our website.",
    },
    contactReply: {
      subject: "Thank you for contacting {{business}}",
      body: "Hi {{name}},\n\nThank you for your message. We have received it and will get back to you as soon as possible.\n\nFor urgent questions, please call us at {{phone}}.",
    },
    signature: "MEDSPA Skincare & Body\n2632 Hollywood Blvd, Suite 307, Hollywood, FL 33020\n(305) 336-7129",
  },
  seo: {
    titleSuffix: "MEDSPA Skincare & Body · Hollywood, FL",
    defaultDescription:
      "MEDSPA Skincare & Body is a med spa at 2632 Hollywood Blvd, Suite 307, Hollywood, Florida, offering laser hair removal, facials, skincare, body treatments, lash and brow services.",
    ogImage: "/images/hero-skincare.jpg",
    indexable: false,
  },
  announcement: { enabled: false, text: "Now accepting appointment requests online.", href: "/book" },
  treatmentCategories: ["Laser", "Face", "Body", "Lashes & Brows"],
  galleryCategories: ["Laser Hair Removal", "Facials & Skin", "Body", "Lashes & Brows"],
  treatmentText: {
    priceFallback: "Pricing on request",
    unverifiedNotice:
      "Service details are being updated. Please contact us to confirm availability, pricing and whether this treatment is right for you.",
    bookLabel: "Book now",
    detailsLabel: "Learn more",
  },
  floating: { showCall: true, showBook: true, showWhatsApp: true, whatsappUrl: "https://wa.me/message/GREYJAJFFJUND1" },
};

export const SEED_DESIGN: Design = {
  colors: {
    background: "#F8F6F1",
    surface: "#FFFFFF",
    alt: "#E8DDCE",
    accent: "#B49A70",
    muted: "#A99B8C",
    ink: "#252525",
  },
  fonts: { heading: "cormorant", body: "dmsans", baseSize: 16, headingCase: "normal" },
  buttons: { shape: "soft", style: "solid", uppercase: true },
  corners: "soft",
  spacing: "normal",
  header: {
    logoText: "MEDSPA",
    logoSubtext: "Skincare & Body",
    transparentOnHero: false,
    showPhone: true,
    showBookButton: true,
    bookLabel: "Book Appointment",
  },
  footer: {
    tone: "charcoal",
    about: "A med spa on Hollywood Boulevard offering skincare, facial, laser, body, lash and brow services.",
    showHours: true,
    showSocial: true,
    showNewsletterNote: false,
    disclaimer:
      "Information on this website is general and is not medical advice. Individual results vary. A consultation is required to determine whether a treatment is appropriate for you.",
    copyright: "© {{year}} MEDSPA Skincare & Body. All rights reserved.",
  },
};

/* ------------------------------ Treatments ------------------------------ */

type T = Omit<Treatment, "updatedAt" | "order" | "sections" | "faqs" | "benefits" | "benefitsVerified" | "duration" | "price" | "priceNote" | "booksyUrl" | "seoTitle" | "seoDescription" | "bookable" | "verified" | "published"> &
  Partial<Treatment>;

const treatment = (t: T, order: number): Treatment => ({
  benefits: [],
  benefitsVerified: false,
  duration: "",
  price: "",
  priceNote: "",
  sections: [],
  faqs: [],
  booksyUrl: "",
  bookable: true,
  verified: false,
  published: true,
  seoTitle: "",
  seoDescription: "",
  ...t,
  order,
  updatedAt: now,
});

export const SEED_TREATMENTS: Treatment[] = [
  treatment({
    id: "t_laser", slug: "laser-hair-removal", name: "Laser Hair Removal", category: "Laser",
    shortDescription: "Laser hair reduction for the face and body, with a consultation to plan the areas and sessions that suit you.",
    description:
      "Laser hair removal uses targeted light energy aimed at the hair follicle to reduce unwanted hair over a course of sessions.\n\nAt your first visit we will talk about the areas you would like treated, your skin and hair type, and how to prepare. Your provider will explain how many sessions may be recommended for you and how far apart they are usually scheduled.\n\n## Before your appointment\nPlease contact us for preparation instructions, including guidance on sun exposure and shaving before treatment.",
    image: "/images/laser-hair-removal.jpg", imageAlt: "Laser hair removal device being used on a client's leg",
    bookingMinutes: 30, featured: true,
    seoTitle: "Laser Hair Removal in Hollywood, FL",
    seoDescription: "Laser hair removal at MEDSPA Skincare & Body, 2632 Hollywood Blvd, Hollywood, FL. Request an appointment or call (305) 336-7129.",
  }, 1),
  treatment({
    id: "t_facial", slug: "facial-treatments", name: "Facial Treatments", category: "Face",
    shortDescription: "Professional facials tailored to your skin, performed in a calm, private treatment room.",
    description:
      "Our facial treatments are personalised to your skin on the day of your visit. Your esthetician will look at your skin, talk with you about your goals and routine, and choose the steps that suit you.\n\nPlease tell us about any skin conditions, medications or recent treatments before your appointment.",
    image: "/images/facial-treatments.jpg", imageAlt: "Client receiving a facial massage from an esthetician",
    bookingMinutes: 60, featured: true,
    seoTitle: "Facial Treatments in Hollywood, FL",
    seoDescription: "Professional facial treatments at MEDSPA Skincare & Body in Hollywood, Florida. Request your appointment online.",
  }, 2),
  treatment({
    id: "t_vip", slug: "vip-facials", name: "VIP Facials", category: "Face",
    shortDescription: "An elevated facial experience. Ask us what is included in the current VIP service.",
    description:
      "The VIP facial is our elevated facial experience, with extra time and attention for your skin.\n\nThe steps included in the VIP service may change over time. Contact us and we will be happy to explain what the current VIP facial includes.",
    image: "/images/vip-facials.jpg", imageAlt: "Relaxed client during a facial treatment",
    bookingMinutes: 90, featured: true,
    seoTitle: "VIP Facials in Hollywood, FL",
    seoDescription: "VIP facial experience at MEDSPA Skincare & Body, Hollywood, Florida. Contact us for what is included and to book.",
  }, 3),
  treatment({
    id: "t_skincare", slug: "skincare-treatments", name: "Skincare Treatments", category: "Face",
    shortDescription: "In-spa skincare treatments with guidance for your at-home routine.",
    description:
      "Skincare treatments at the spa focus on the look and feel of your skin. We will discuss your concerns and current routine, recommend an in-spa treatment plan, and suggest simple steps for caring for your skin at home.",
    image: "/images/skincare-treatments.jpg", imageAlt: "Esthetician applying a skincare treatment to a client's face",
    bookingMinutes: 60, featured: true,
    seoTitle: "Skincare Treatments in Hollywood, FL",
    seoDescription: "Skincare treatments at MEDSPA Skincare & Body, 2632 Hollywood Blvd, Hollywood, FL. Request an appointment.",
  }, 4),
  treatment({
    id: "t_body", slug: "body-treatments", name: "Body Treatments", category: "Body",
    shortDescription: "Non-surgical body treatments offered at the spa. Contact us for the current menu.",
    description:
      "We offer a selection of non-surgical body treatments. Because options can change, please contact us or request a consultation and we will explain which body treatments are currently available and which may suit your goals.",
    image: "/images/body-treatments.jpg", imageAlt: "Spa body treatment with a client resting under a towel",
    bookingMinutes: 60, featured: true,
    seoTitle: "Body Treatments in Hollywood, FL",
    seoDescription: "Non-surgical body treatments at MEDSPA Skincare & Body in Hollywood, Florida. Contact us for the current menu.",
  }, 5),
  treatment({
    id: "t_venus", slug: "venus-legacy", name: "Venus Legacy", category: "Body",
    shortDescription: "A non-invasive device-based body and skin treatment. We will explain how sessions work at your consultation.",
    description:
      "Venus Legacy is a non-invasive, device-based treatment used for body and skin treatments. During your consultation we will explain how a session works, what it feels like, and whether it is suitable for you.\n\n*Venus Legacy is a trademark of its respective owner.*",
    image: "/images/venus-legacy.jpg", imageAlt: "Client resting during a body treatment",
    bookingMinutes: 60, featured: true,
    seoTitle: "Venus Legacy in Hollywood, FL",
    seoDescription: "Venus Legacy treatments at MEDSPA Skincare & Body, Hollywood, FL. Request a consultation online or call (305) 336-7129.",
  }, 6),
  treatment({
    id: "t_lashes", slug: "eyelash-services", name: "Eyelash Services", category: "Lashes & Brows",
    shortDescription: "Lash services to enhance your natural lashes. Ask about the current options.",
    description:
      "Our lash services are designed to complement your natural lashes. Please contact us for the current options and how to prepare for your appointment, and let us know about any sensitivities or allergies before your visit.",
    image: "/images/eyelash-services.jpg", imageAlt: "Lash artist applying eyelash extensions",
    bookingMinutes: 90, featured: true,
    seoTitle: "Eyelash Services in Hollywood, FL",
    seoDescription: "Eyelash services at MEDSPA Skincare & Body in Hollywood, Florida. Request your appointment online.",
  }, 7),
  treatment({
    id: "t_brows", slug: "eyebrow-design", name: "Eyebrow Design", category: "Lashes & Brows",
    shortDescription: "Brow shaping and design to suit your features.",
    description:
      "Eyebrow design starts with a conversation about the look you want. Your artist will shape your brows to suit your features. Please let us know about any sensitivities or recent skin treatments before your visit.",
    image: "/images/eyebrow-design.jpg", imageAlt: "Beautician shaping a client's eyebrows with a brush and tweezers",
    bookingMinutes: 30, featured: true,
    seoTitle: "Eyebrow Design in Hollywood, FL",
    seoDescription: "Eyebrow design at MEDSPA Skincare & Body, 2632 Hollywood Blvd, Hollywood, FL. Request an appointment.",
  }, 8),
];

/* -------------------------------- Pages -------------------------------- */

const page = (p: Omit<Page, "updatedAt" | "published"> & { published?: boolean }): Page => ({ published: true, ...p, updatedAt: now });

const ctaBlock = (id: string, tone: "charcoal" | "champagne" = "charcoal") =>
  B({
    id, type: "cta", tone, spacing: "normal",
    eyebrow: "Appointments",
    title: "Your visit, on your schedule",
    body: "Request a time online and our team will confirm it with you. Prefer to talk? Call us and we will help you choose.",
    primary: { label: "Book an Appointment", href: "/book" },
    secondary: { label: "Call (305) 336-7129", href: "tel:+13053367129" },
    imageAlt: "",
  });

export const SEED_PAGES: Page[] = [
  page({
    id: "p_home", slug: "", title: "Home", system: "home", order: 1,
    seoTitle: "Med Spa in Hollywood, FL | Laser Hair Removal, Facials & Body Treatments",
    seoDescription:
      "MEDSPA Skincare & Body: med spa at 2632 Hollywood Blvd, Suite 307, Hollywood, FL. Laser hair removal, facials, VIP facials, skincare, body treatments, lashes and brows. Request an appointment online.",
    blocks: [
      B({
        id: "b_hero", type: "hero", tone: "ivory", spacing: "normal", layout: "split",
        eyebrow: "Med Spa · Hollywood, Florida",
        title: "Skincare & body treatments, thoughtfully done.",
        subtitle:
          "MEDSPA Skincare & Body is a med spa on Hollywood Boulevard offering laser hair removal, facials, skincare, body treatments, lashes and brows in a calm, private setting.",
        image: "/images/hero-skincare.jpg", imageAlt: "Woman applying a skincare cream to her cheek",
        primary: { label: "Explore Treatments", href: "/treatments" },
        secondary: { label: "Book an Appointment", href: "/book" },
        showRating: true, showAddress: true,
      }),
      B({
        id: "b_home_treatments", type: "treatments", tone: "white", spacing: "normal",
        eyebrow: "Treatments", title: "Explore our treatments",
        intro: "From laser hair removal to facials, lashes and brows. Choose a treatment to learn more or request a time.",
        source: "featured", limit: 8, columns: 4, showPrices: false, showCategoryFilter: false,
        cta: { label: "View all treatments", href: "/treatments" },
      }),
      B({
        id: "b_home_about", type: "imageText", tone: "ivory", spacing: "normal",
        eyebrow: "About us", title: "A calm space on Hollywood Boulevard",
        body:
          "Our spa is on the third floor at 2632 Hollywood Boulevard, Suite 307. Every visit begins with a conversation about what you would like to achieve, so your treatment is planned around you.\n\nWe welcome clients in English and Spanish.",
        image: "/images/spa-room.jpg", imageAlt: "Bright treatment room with a treatment bed", imageSide: "left",
        cta: { label: "About us", href: "/about" },
      }),
      B({
        id: "b_home_steps", type: "features", tone: "champagne", spacing: "normal",
        eyebrow: "How it works", title: "Booking is simple", intro: "",
        style: "numbered", columns: 3,
        items: [
          { id: "f1", title: "Choose your treatment", text: "Browse our treatments or call us if you are not sure which one is right for you." },
          { id: "f2", title: "Request a time", text: "Pick a preferred date and time online. It takes about a minute." },
          { id: "f3", title: "We confirm with you", text: "Our team reviews your request and confirms your appointment by email or phone." },
        ],
      }),
      B({
        id: "b_home_reviews", type: "reviews", tone: "white", spacing: "normal",
        eyebrow: "Reviews", title: "What our clients say",
        intro: "We are grateful for every review our clients have shared on Google.",
        showRating: true, limit: 3,
        emptyText: "Read our clients' reviews on Google.",
        cta: { label: "Read our Google reviews", href: GOOGLE_MAPS },
      }),
      B({
        id: "b_home_gallery", type: "gallery", tone: "ivory", spacing: "normal",
        eyebrow: "Results", title: "Before & after",
        intro: "Genuine results from clients who gave us written permission to share their photos.",
        limit: 4, showFilters: false, emptyText: "",
        disclaimer: "Individual results vary.",
        cta: { label: "View the gallery", href: "/gallery" },
      }),
      ctaBlock("b_home_cta"),
      B({
        id: "b_home_contact", type: "contact", tone: "ivory", spacing: "normal",
        eyebrow: "Visit us", title: "Find the spa",
        intro: "We are at 2632 Hollywood Boulevard, Suite 307, in Hollywood, Florida.",
        showHours: true, showMap: true, showSocial: true, showForm: false, formTitle: "Send us a message",
      }),
    ],
  }),
  page({
    id: "p_about", slug: "about", title: "About Us", order: 2,
    seoTitle: "About Us | Med Spa in Hollywood, FL",
    seoDescription: "Learn about MEDSPA Skincare & Body, a med spa at 2632 Hollywood Blvd, Suite 307, Hollywood, Florida.",
    blocks: [
      B({ id: "b_about_header", type: "pageHeader", tone: "champagne", spacing: "normal", eyebrow: "About us", title: "Welcome to MEDSPA Skincare & Body", intro: "A med spa in Hollywood, Florida, offering skincare, facial, laser, body, lash and brow services.", imageAlt: "" }),
      B({
        id: "b_about_intro", type: "text", tone: "ivory", spacing: "normal", eyebrow: "Our story", title: "Skincare and body care, centred on you",
        body:
          "MEDSPA Skincare & Body is located at 2632 Hollywood Boulevard, Suite 307, in Hollywood, Florida. We offer laser hair removal, facials, skincare, body treatments, and lash and brow services.\n\nWe believe good skincare starts with listening. Every visit begins with a conversation about your goals, your routine and any questions you have, so you can make informed choices about your care.",
        align: "left", width: "narrow",
      }),
      B({
        id: "b_about_space", type: "imageText", tone: "white", spacing: "normal", eyebrow: "The space", title: "Calm, clean and private",
        body: "Our treatment rooms are designed to help you relax. We keep our space clean and organised, and we take the time to make you comfortable before every treatment.",
        image: "/images/spa-interior.jpg", imageAlt: "Modern treatment room with a treatment chair", imageSide: "right",
        cta: { label: "Explore treatments", href: "/treatments" },
      }),
      B({
        id: "b_about_values", type: "features", tone: "ivory", spacing: "normal", eyebrow: "Our approach", title: "What you can expect", intro: "",
        style: "cards", columns: 3,
        items: [
          { id: "v1", title: "A personal consultation", text: "We talk through your goals and history before recommending a treatment." },
          { id: "v2", title: "Clear information", text: "We explain what a treatment involves, how to prepare and what aftercare to follow." },
          { id: "v3", title: "Comfort and privacy", text: "Private treatment rooms and a calm atmosphere, from arrival to aftercare." },
        ],
      }),
      B({
        id: "b_about_team", type: "team", tone: "white", spacing: "normal", hidden: true,
        eyebrow: "Our team", title: "Meet the team",
        intro: "Hidden until the business adds real team details. Do not publish credentials that have not been provided and verified.",
        members: [
          { id: "m1", name: "[Name]", role: "[Role and licence, as provided by the business]", bio: "[Short introduction provided by the team member]" },
          { id: "m2", name: "[Name]", role: "[Role and licence, as provided by the business]", bio: "[Short introduction provided by the team member]" },
        ],
      }),
      ctaBlock("b_about_cta", "champagne"),
    ],
  }),
  page({
    id: "p_treatments", slug: "treatments", title: "Treatments", system: "treatments", order: 3,
    seoTitle: "Treatments | Laser Hair Removal, Facials, Body, Lashes & Brows in Hollywood, FL",
    seoDescription: "Explore treatments at MEDSPA Skincare & Body in Hollywood, FL: laser hair removal, facials, VIP facials, skincare, body treatments, Venus Legacy, eyelash services and eyebrow design.",
    blocks: [
      B({ id: "b_tr_header", type: "pageHeader", tone: "champagne", spacing: "normal", eyebrow: "Treatments", title: "Our treatments", intro: "Choose a treatment to learn more, or request an appointment and we will help you plan your visit.", imageAlt: "" }),
      B({
        id: "b_tr_all", type: "treatments", tone: "ivory", spacing: "normal", eyebrow: "", title: "", intro: "",
        source: "all", limit: 0, columns: 3, showPrices: true, showCategoryFilter: true, cta: { label: "", href: "" },
      }),
      B({
        id: "b_tr_faq", type: "faq", tone: "white", spacing: "normal", eyebrow: "Questions", title: "Before you book",
        items: [
          { id: "q1", q: "Not sure which treatment is right for you?", a: "Call us at (305) 336-7129 or send a request with a short note. We will help you choose." },
          { id: "q2", q: "Is my appointment confirmed when I submit the form?", a: "No. Online bookings are requests. Your appointment is confirmed once our team approves it and contacts you." },
          { id: "q3", q: "Do you offer payment plans?", a: "Payment plans may be available through Cherry. Ask us for details, or check your options using the link on our booking page." },
        ],
      }),
      ctaBlock("b_tr_cta"),
    ],
  }),
  page({
    id: "p_gallery", slug: "gallery", title: "Gallery", order: 4,
    seoTitle: "Before & After Gallery | Med Spa Hollywood, FL",
    seoDescription: "Before-and-after photos shared with written client permission at MEDSPA Skincare & Body in Hollywood, Florida.",
    blocks: [
      B({ id: "b_ga_header", type: "pageHeader", tone: "champagne", spacing: "normal", eyebrow: "Gallery", title: "Before & after", intro: "Genuine results, shared only with our clients' written permission.", imageAlt: "" }),
      B({
        id: "b_ga_gallery", type: "gallery", tone: "ivory", spacing: "normal", eyebrow: "", title: "", intro: "",
        limit: 0, showFilters: true,
        emptyText: "We share genuine before-and-after photos only with our clients' written permission. Follow us on Instagram to see our latest work.",
        disclaimer: "Individual results vary. Photos are of real clients who consented to sharing them and have not been altered beyond cropping and lighting.",
        cta: { label: "See our Instagram", href: "https://www.instagram.com/medspabykeity/" },
      }),
      ctaBlock("b_ga_cta"),
    ],
  }),
  page({
    id: "p_reviews", slug: "reviews", title: "Reviews", order: 5,
    seoTitle: "Client Reviews | MEDSPA Skincare & Body, Hollywood, FL",
    seoDescription: "Read reviews of MEDSPA Skincare & Body, a med spa in Hollywood, Florida.",
    blocks: [
      B({ id: "b_rv_header", type: "pageHeader", tone: "champagne", spacing: "normal", eyebrow: "Reviews", title: "Client reviews", intro: "Thank you to every client who has taken the time to share their experience.", imageAlt: "" }),
      B({
        id: "b_rv_list", type: "reviews", tone: "ivory", spacing: "normal", eyebrow: "", title: "", intro: "",
        showRating: true, limit: 0,
        emptyText: "Our clients' reviews are published on Google. Tap below to read them.",
        cta: { label: "Read all Google reviews", href: GOOGLE_MAPS },
      }),
      ctaBlock("b_rv_cta"),
    ],
  }),
  page({
    id: "p_contact", slug: "contact", title: "Contact", system: "contact", order: 6,
    seoTitle: "Contact & Location | Med Spa at 2632 Hollywood Blvd, Hollywood, FL",
    seoDescription: "Contact MEDSPA Skincare & Body: 2632 Hollywood Blvd, Suite 307, Hollywood, FL 33020. Call (305) 336-7129. Hours, map and directions.",
    blocks: [
      B({ id: "b_ct_header", type: "pageHeader", tone: "champagne", spacing: "normal", eyebrow: "Contact", title: "Visit or contact us", intro: "Call, send a message or request an appointment online.", imageAlt: "" }),
      B({
        id: "b_ct_contact", type: "contact", tone: "ivory", spacing: "normal", eyebrow: "", title: "", intro: "",
        showHours: true, showMap: true, showSocial: true, showForm: true, formTitle: "Send us a message",
      }),
    ],
  }),
  page({
    id: "p_book", slug: "book", title: "Book Appointment", system: "book", order: 7,
    seoTitle: "Book an Appointment | MEDSPA Skincare & Body, Hollywood, FL",
    seoDescription: "Request an appointment at MEDSPA Skincare & Body in Hollywood, FL. Choose a treatment, date and time; our team will confirm.",
    blocks: [
      B({ id: "b_bk_header", type: "pageHeader", tone: "champagne", spacing: "compact", eyebrow: "Appointments", title: "Book an appointment", intro: "Choose a treatment and a preferred time. Our team will review your request and confirm it with you.", imageAlt: "" }),
      B({ id: "b_bk_form", type: "booking", tone: "ivory", spacing: "normal", eyebrow: "", title: "", intro: "" }),
    ],
  }),
  page({
    id: "p_privacy", slug: "privacy-policy", title: "Privacy Policy", system: "privacy", order: 8,
    seoTitle: "Privacy Policy", seoDescription: "How MEDSPA Skincare & Body collects and uses personal information submitted through this website.",
    blocks: [
      B({ id: "b_pp_header", type: "pageHeader", tone: "champagne", spacing: "compact", eyebrow: "Legal", title: "Privacy Policy", intro: "Last updated: November 2026", imageAlt: "" }),
      B({
        id: "b_pp_body", type: "text", tone: "ivory", spacing: "normal", eyebrow: "", title: "", align: "left", width: "narrow",
        body:
          "This policy explains how MEDSPA Skincare & Body (\"we\", \"us\") collects and uses information submitted through this website.\n\n## Information we collect\n- Contact details you provide: name, email address and phone number.\n- Appointment details: the treatment, date and time you request and any message you include.\n- Messages you send through our contact form.\n- Basic technical information needed to operate the website securely.\n\nPlease do not include detailed medical information in website forms. We will discuss your health history in person or by phone.\n\n## How we use it\n- To respond to your request and schedule, confirm, change or cancel appointments.\n- To contact you about your request by email or phone.\n- To operate and protect our website.\n\nWe do not sell your personal information.\n\n## Service providers\nWe use trusted providers to host this website, store data and send email. They process information only on our behalf. If you book through Booksy or apply for financing through Cherry, their own privacy policies apply.\n\n## Retention and security\nWe keep information only as long as needed for these purposes or as required by law, and we use reasonable safeguards to protect it.\n\n## Your choices\nYou may ask us to access, correct or delete your information by calling (305) 336-7129 or visiting us at 2632 Hollywood Blvd, Suite 307, Hollywood, FL 33020.\n\n*This template must be reviewed by the business and its legal adviser before publication.*",
      }),
    ],
  }),
  page({
    id: "p_terms", slug: "terms", title: "Terms & Conditions", system: "terms", order: 9,
    seoTitle: "Terms & Conditions", seoDescription: "Terms for using the MEDSPA Skincare & Body website and requesting appointments.",
    blocks: [
      B({ id: "b_tc_header", type: "pageHeader", tone: "champagne", spacing: "compact", eyebrow: "Legal", title: "Terms & Conditions", intro: "Last updated: November 2026", imageAlt: "" }),
      B({
        id: "b_tc_body", type: "text", tone: "ivory", spacing: "normal", eyebrow: "", title: "", align: "left", width: "narrow",
        body:
          "By using this website you agree to these terms.\n\n## Appointment requests\nAppointments requested online are not confirmed until our team approves them and contacts you. Requested times may be changed or declined. Treatment availability, pricing and duration may change and will be confirmed with you.\n\n## Cancellations\nIf you need to cancel or change an appointment, please call us at (305) 336-7129 as early as possible. [The business should add its cancellation and late-arrival policy here.]\n\n## No medical advice\nInformation on this website is general and is not medical advice. Whether a treatment is appropriate for you is decided after a consultation. Individual results vary and no particular result is guaranteed.\n\n## Third-party services\nLinks to third-party services such as Booksy, Cherry, Google, Instagram and WhatsApp are provided for convenience. Their own terms apply.\n\n## Contact\nMEDSPA Skincare & Body, 2632 Hollywood Blvd, Suite 307, Hollywood, FL 33020. Phone (305) 336-7129.\n\n*This template must be reviewed by the business and its legal adviser before publication.*",
      }),
    ],
  }),
];

export const SEED_NAVIGATION: Navigation = {
  header: [
    { id: "n_home", label: "Home", kind: "page", pageId: "p_home" },
    { id: "n_about", label: "About Us", kind: "page", pageId: "p_about" },
    { id: "n_treat", label: "Treatments", kind: "page", pageId: "p_treatments" },
    { id: "n_gallery", label: "Gallery", kind: "page", pageId: "p_gallery" },
    { id: "n_reviews", label: "Reviews", kind: "page", pageId: "p_reviews" },
    { id: "n_contact", label: "Contact", kind: "page", pageId: "p_contact" },
  ],
  footer: [
    {
      id: "fc_explore", title: "Explore",
      items: [
        { id: "nf_treat", label: "Treatments", kind: "page", pageId: "p_treatments" },
        { id: "nf_gallery", label: "Gallery", kind: "page", pageId: "p_gallery" },
        { id: "nf_reviews", label: "Reviews", kind: "page", pageId: "p_reviews" },
        { id: "nf_about", label: "About Us", kind: "page", pageId: "p_about" },
      ],
    },
    {
      id: "fc_visit", title: "Visit",
      items: [
        { id: "nf_book", label: "Book Appointment", kind: "page", pageId: "p_book" },
        { id: "nf_contact", label: "Contact & Directions", kind: "page", pageId: "p_contact" },
        { id: "nf_finance", label: "Financing (Cherry)", kind: "url", href: "https://pay.withcherry.com/skin-care-miami?utm_source=practice&m=24052", newTab: true },
      ],
    },
  ],
  legal: [
    { id: "nl_privacy", label: "Privacy Policy", kind: "page", pageId: "p_privacy" },
    { id: "nl_terms", label: "Terms & Conditions", kind: "page", pageId: "p_terms" },
  ],
};

export const SEED = {
  settings: SEED_SETTINGS,
  design: SEED_DESIGN,
  navigation: SEED_NAVIGATION,
  pages: SEED_PAGES,
  treatments: SEED_TREATMENTS,
  testimonials: [],
  gallery: [],
};
