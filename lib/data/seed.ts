import type { ClinicSettings, Doctor, Treatment } from "./types";

/**
 * Mock seed data for the design preview.
 *
 * - All prices are DEMO prices.
 * - Clinical copy is general patient information written for the prototype;
 *   it must be reviewed and approved by Dr. Sajjad before going live.
 * - No reviews, results, credentials or patient photos are invented.
 */

const NOW = "2026-01-01T00:00:00.000Z";

export const SEED_DOCTORS: Doctor[] = [
  {
    id: "dr-sajjad",
    name: "Dr. Sajjad Ahmad",
    role: "Clinic founder",
    bio: null,
  },
];

export const SEED_SETTINGS: ClinicSettings = {
  clinicName: "Aesthetica by Dr. Sajjad",
  addressLine: "Jadoon Plaza, Phase 2 Road",
  city: "Abbottabad",
  mapsQuery: "Aesthetica by Dr Sajjad, Jadoon Plaza, Phase 2 Road, Abbottabad",
  whatsappNumber: "",
  phoneDisplay: "",
  email: "",
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
  maxPerDay: 14,
  bookingWindowDays: 30,
  minNoticeMinutes: 60,
};

const base = { doctorIds: ["dr-sajjad"], active: true, updatedAt: NOW };

export const SEED_TREATMENTS: Treatment[] = [
  {
    ...base,
    id: "t-laser-hair",
    slug: "laser-hair-removal",
    name: "Laser Hair Removal",
    category: "laser",
    tagline: "Smoother skin, fewer razors",
    shortDescription: "A course of laser sessions designed to reduce unwanted hair over time.",
    description:
      "Laser hair removal uses concentrated light energy that is absorbed by the pigment in the hair follicle. The heat aims to disable the follicle's ability to regrow hair. Because hair grows in cycles, a course of sessions spaced several weeks apart is usually needed. Settings are adjusted to your skin type and hair colour at each visit.",
    howItWorks: [
      "Consultation and skin-type assessment, including a patch test where appropriate.",
      "The area is cleansed and shaved; protective eyewear is provided.",
      "The laser handpiece is passed over the area with built-in cooling for comfort.",
      "Aftercare advice is given, including sun protection between sessions.",
    ],
    benefits: [
      "Aims for a long-term reduction in hair growth",
      "Can treat face, underarms, arms, legs and body areas",
      "May reduce ingrown hairs and shaving irritation",
      "Quick sessions for smaller areas",
    ],
    suitableFor: [
      "People with dark hair who want to reduce shaving, threading or waxing",
      "Those with ingrown hairs from regular hair removal",
      "Suitability for each skin type is confirmed at consultation",
    ],
    downtime: "Usually none. Mild redness may last a few hours.",
    sessions: "Often 6–8 sessions, 4–6 weeks apart. Your doctor will advise.",
    sessionLength: "15–60 minutes depending on area",
    sideEffects: [
      "Temporary redness, warmth or swelling around follicles",
      "Mild discomfort during treatment",
      "Uncommon: temporary lightening or darkening of the skin",
      "Rare: blistering or burns",
    ],
    faqs: [
      { q: "Is it painful?", a: "Most people describe a quick snapping sensation. Cooling is used to keep it comfortable." },
      { q: "Can I go in the sun afterwards?", a: "Avoid direct sun and use a broad-spectrum sunscreen between sessions, as tanned skin can increase the risk of side effects." },
      { q: "Does it work on light or grey hair?", a: "Laser relies on pigment in the hair, so blonde, grey and white hair respond poorly. This is discussed at consultation." },
    ],
    price: { type: "range", min: 4000, max: 18000, unit: "per session, by area" },
    concerns: ["unwanted-hair"],
    featured: true,
    palette: 0,
  },
  {
    ...base,
    id: "t-hydrafacial",
    slug: "hydrafacial",
    name: "HydraFacial",
    category: "facials",
    tagline: "Cleanse, exfoliate, hydrate",
    shortDescription: "A multi-step facial that cleanses, exfoliates and hydrates in one visit.",
    description:
      "HydraFacial is a non-invasive, multi-step facial that combines cleansing, gentle exfoliation, extraction and hydrating serums using a vortex-suction device. It is often chosen before an event or as part of a regular skincare routine. Serums can be selected to suit your skin.",
    howItWorks: [
      "Cleansing and gentle exfoliation to lift dead skin cells.",
      "A mild acid solution helps loosen debris in the pores.",
      "Vortex suction extraction clears congested pores.",
      "Hydrating and antioxidant serums are infused into the skin.",
    ],
    benefits: [
      "Leaves skin feeling clean and hydrated",
      "Suitable for most skin types",
      "No needles and little to no downtime",
      "Can be combined with other treatments",
    ],
    suitableFor: [
      "Dull, dehydrated or congested skin",
      "Anyone wanting a refresh before an event",
      "Those looking for a gentle maintenance facial",
    ],
    downtime: "None. You can usually return to normal activities straight away.",
    sessions: "Single session, or monthly for maintenance.",
    sessionLength: "About 45–60 minutes",
    sideEffects: ["Mild, short-lived redness", "Temporary tightness or sensitivity", "Rare: breakouts in sensitive skin"],
    faqs: [
      { q: "Can I wear makeup afterwards?", a: "It is best to let skin breathe for the rest of the day." },
      { q: "Is it suitable for active acne?", a: "It depends on the severity. Your doctor may recommend another treatment first." },
    ],
    price: { type: "promo", regular: 12000, promo: 9500, label: "Launch offer", unit: "per session" },
    concerns: ["dull-skin", "uneven-tone", "acne"],
    featured: true,
    palette: 1,
  },
  {
    ...base,
    id: "t-carbon-peel",
    slug: "carbon-laser-peel",
    name: "Carbon Laser Peel",
    category: "laser",
    tagline: "The 'Hollywood' laser facial",
    shortDescription: "A thin carbon layer and laser pulses to refresh the look of oily, congested skin.",
    description:
      "A carbon laser peel applies a thin layer of medical-grade carbon lotion to the skin. A Q-switched laser is then passed over the face; the carbon absorbs the light energy and is lifted away with surface debris and oil. It is often chosen for oily skin, enlarged-looking pores and dullness.",
    howItWorks: [
      "Skin is cleansed and a thin carbon layer is applied and left to dry.",
      "A first laser pass gently warms the skin.",
      "A second pass breaks up and removes the carbon layer.",
      "Soothing products and sunscreen are applied.",
    ],
    benefits: [
      "May improve the appearance of oily, congested skin",
      "Can help skin look brighter and pores look smaller",
      "Minimal downtime",
    ],
    suitableFor: ["Oily or congested skin", "Dull skin", "Those wanting a quick, low-downtime refresh"],
    downtime: "Minimal. Mild redness may last a few hours.",
    sessions: "Often 3–6 sessions, 2–4 weeks apart.",
    sessionLength: "About 30–45 minutes",
    sideEffects: ["Temporary redness or warmth", "Mild dryness for a few days", "Uncommon: pigment changes in some skin types"],
    faqs: [
      { q: "Does it hurt?", a: "Most people feel a mild warmth or light snapping sensation." },
      { q: "When can I return to work?", a: "Usually the same day." },
    ],
    price: { type: "promo", regular: 9000, promo: 7000, label: "Winter offer", unit: "per session" },
    concerns: ["acne", "dull-skin", "uneven-tone"],
    featured: true,
    palette: 2,
  },
  {
    ...base,
    id: "t-chemical-peel",
    slug: "chemical-peels",
    name: "Chemical Peels",
    category: "peels",
    tagline: "Renewal, layer by layer",
    shortDescription: "Medical-grade peels chosen for your skin to encourage gentle renewal.",
    description:
      "A chemical peel applies a controlled exfoliating solution to the skin to remove damaged outer layers and encourage renewal. Peels range from superficial to medium depth. Your doctor selects the peel type and strength based on your skin, concerns and skin tone, which is particularly important in South Asian skin to reduce the risk of pigmentation.",
    howItWorks: [
      "Skin assessment and, where needed, a pre-peel skincare routine.",
      "The skin is cleansed and the peel solution is applied for a set time.",
      "The peel is neutralised or removed, and soothing products applied.",
      "Strict sun protection and aftercare instructions follow.",
    ],
    benefits: [
      "May improve the look of uneven tone and texture",
      "Can be tailored to different concerns",
      "Superficial peels usually involve little downtime",
    ],
    suitableFor: ["Uneven tone or texture", "Mild pigmentation or acne marks", "Fine lines (superficial peels)"],
    downtime: "From none to around a week of light peeling, depending on the peel.",
    sessions: "Usually a series of 3–6 peels, 2–4 weeks apart.",
    sessionLength: "About 30 minutes",
    sideEffects: [
      "Redness, tightness and peeling",
      "Temporary sensitivity to the sun",
      "Risk of post-inflammatory pigmentation, especially without sun protection",
    ],
    faqs: [
      { q: "Will my skin peel a lot?", a: "Superficial peels may cause only light flaking. Deeper peels peel more; your doctor will explain what to expect." },
      { q: "Do I need to prepare my skin?", a: "Sometimes. A short pre-peel routine may be advised to reduce the risk of side effects." },
    ],
    price: { type: "from", amount: 5000, unit: "per session" },
    concerns: ["pigmentation", "uneven-tone", "acne", "acne-scars", "wrinkles", "dull-skin", "ageing"],
    featured: false,
    palette: 3,
  },
  {
    ...base,
    id: "t-acne",
    slug: "acne-and-acne-scars",
    name: "Acne & Acne Scars",
    category: "skin-concerns",
    tagline: "A plan for clearer-looking skin",
    shortDescription: "A doctor-led plan for active acne and the marks and scars it can leave.",
    description:
      "Acne and acne scarring are different problems and often need different approaches. After examining your skin, the doctor may suggest a combined plan, which can include medical skincare, chemical peels, laser treatments or microneedling. Active acne is usually brought under control before scar treatments begin.",
    howItWorks: [
      "Consultation to assess acne type, scars and skin history.",
      "A personalised plan is discussed, with expected number of visits.",
      "Treatments are carried out in stages with progress reviews.",
      "Home-care and sun protection advice throughout.",
    ],
    benefits: [
      "Personalised plan rather than a one-size-fits-all treatment",
      "Addresses active acne and scarring in the right order",
      "Regular reviews to adjust the plan",
    ],
    suitableFor: ["Teenagers and adults with active acne", "People with acne marks or scars", "Anyone unsure which treatment is right"],
    downtime: "Depends on the treatments chosen. Explained at consultation.",
    sessions: "Usually several visits over a few months.",
    sessionLength: "Varies by treatment",
    sideEffects: ["Depend on the treatment chosen; your doctor will explain each one before you start"],
    faqs: [
      { q: "Why is a consultation needed first?", a: "Acne and scars vary a lot. The doctor needs to examine your skin before recommending a treatment and a price." },
      { q: "Can scars be removed completely?", a: "Treatments aim to improve their appearance; results vary between individuals and no outcome can be guaranteed." },
    ],
    price: { type: "consultation", note: "Plan and price confirmed after examination." },
    concerns: ["acne", "acne-scars"],
    featured: true,
    palette: 4,
  },
  {
    ...base,
    id: "t-pigmentation",
    slug: "pigmentation-and-melasma",
    name: "Pigmentation & Melasma",
    category: "skin-concerns",
    tagline: "Patient, careful, long-term care",
    shortDescription: "Careful, step-by-step treatment plans for uneven pigmentation and melasma.",
    description:
      "Pigmentation has many causes, including sun exposure, hormones and inflammation. Melasma in particular is a long-term condition that can return, so treatment focuses on gentle, steady improvement and maintenance rather than quick fixes. Plans may combine sun protection, topical treatments, peels and selected laser settings.",
    howItWorks: [
      "Examination to identify the type of pigmentation.",
      "A plan is created, starting with sun protection and skincare.",
      "In-clinic treatments are added gradually and reviewed.",
      "A maintenance plan helps keep results stable.",
    ],
    benefits: [
      "Plan tailored to the type of pigmentation",
      "Gentle approach suited to South Asian skin",
      "Ongoing reviews and maintenance advice",
    ],
    suitableFor: ["Melasma", "Sun spots and uneven tone", "Marks left after acne or inflammation"],
    downtime: "Usually minimal. Depends on the treatments chosen.",
    sessions: "Typically a course over several months, then maintenance.",
    sessionLength: "30–45 minutes",
    sideEffects: ["Temporary redness or sensitivity", "Pigmentation can return, especially with sun exposure", "Rare: treatment-related darkening or lightening"],
    faqs: [
      { q: "Can melasma be cured?", a: "Melasma is a long-term condition. Treatment aims to improve and control it, and maintenance is usually needed." },
      { q: "Is sunscreen really that important?", a: "Yes. Daily broad-spectrum sunscreen is one of the most important parts of any pigmentation plan." },
    ],
    price: { type: "range", min: 6000, max: 15000, unit: "per session" },
    concerns: ["pigmentation", "melasma", "uneven-tone"],
    featured: false,
    palette: 5,
  },
  {
    ...base,
    id: "t-prp-hair",
    slug: "prp-hair-treatment",
    name: "PRP Hair Treatment",
    category: "hair",
    tagline: "Support for thinning hair",
    shortDescription: "Platelet-rich plasma from your own blood, used to support thinning hair.",
    description:
      "Platelet-rich plasma (PRP) is prepared from a small sample of your own blood, which is spun to concentrate the platelets. The plasma is then injected into areas of the scalp affected by thinning. PRP is commonly used for certain types of hair thinning; your doctor will first assess the cause of hair loss to check whether PRP is appropriate.",
    howItWorks: [
      "Assessment of hair loss pattern and medical history.",
      "A small blood sample is taken and processed in a centrifuge.",
      "The scalp is cleaned and the plasma is injected into target areas.",
      "Sessions are repeated at intervals, followed by maintenance if suitable.",
    ],
    benefits: [
      "Uses your own blood, with no synthetic fillers",
      "Can be combined with other hair-loss treatments",
      "Short sessions with little downtime",
    ],
    suitableFor: [
      "Men and women with certain types of hair thinning",
      "Those who have been assessed for the cause of hair loss",
    ],
    downtime: "Little to none. The scalp may feel tender for a day or two.",
    sessions: "Often 3–4 sessions about 4 weeks apart, then maintenance.",
    sessionLength: "About 45–60 minutes",
    sideEffects: ["Tenderness or mild pain at injection sites", "Minor bruising or swelling", "Headache", "Rare: infection"],
    faqs: [
      { q: "Does PRP work for everyone?", a: "Response varies from person to person and depends on the cause of hair loss. No result can be guaranteed." },
      { q: "Is it safe?", a: "Because PRP uses your own blood, allergic reactions are unlikely. Your doctor will review your medical history first." },
    ],
    price: {
      type: "package",
      perSession: 12000,
      packages: [
        { sessions: 3, price: 32000 },
        { sessions: 6, price: 60000 },
      ],
    },
    concerns: ["hair-loss", "ageing"],
    featured: true,
    palette: 6,
  },
  {
    ...base,
    id: "t-consultation",
    slug: "skin-consultation",
    name: "Skin Consultation",
    category: "consultation",
    tagline: "Start with an honest conversation",
    shortDescription: "A one-to-one consultation with the doctor to understand your skin and options.",
    description:
      "A consultation is the best place to start if you are unsure what you need. The doctor will listen to your concerns, examine your skin, discuss your medical history and talk through suitable options, including realistic expectations, costs and aftercare. There is no obligation to book a treatment.",
    howItWorks: [
      "Discussion of your concerns, goals and medical history.",
      "Examination of the skin, hair or area of concern.",
      "Explanation of suitable options, timelines and costs.",
      "A written plan if you choose to go ahead.",
    ],
    benefits: ["Clear, personalised advice", "Realistic expectations before any treatment", "No obligation to proceed"],
    suitableFor: ["Anyone with a skin, hair or ageing concern", "First-time patients", "Anyone unsure which treatment is right"],
    downtime: "None",
    sessions: "One visit",
    sessionLength: "About 20–30 minutes",
    sideEffects: ["None"],
    faqs: [
      { q: "Will I be treated on the same day?", a: "Sometimes, if suitable and time allows. Otherwise a follow-up appointment is booked." },
    ],
    price: { type: "fixed", amount: 2000 },
    concerns: ["acne", "acne-scars", "pigmentation", "melasma", "wrinkles", "hair-loss", "uneven-tone", "ageing", "unwanted-hair", "dull-skin"],
    featured: false,
    palette: 7,
  },
];

/** Fictional names for seeded demo appointments. Not real patients. */
export const DEMO_PATIENT_NAMES = [
  "Ayesha Khan",
  "Hamza Ali",
  "Mahnoor Abbasi",
  "Usman Jadoon",
  "Fatima Qureshi",
  "Bilal Awan",
  "Zainab Tanoli",
  "Saad Malik",
  "Hira Shah",
  "Imran Swati",
  "Sana Mir",
  "Omer Farooq",
];
