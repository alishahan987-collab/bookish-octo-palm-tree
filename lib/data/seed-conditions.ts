import type { Condition } from "./types";

/**
 * Starter "skin concerns" library: general information, not a diagnosis.
 * Limited to concerns that match the clinic's published services.
 * Editable in Admin → Skin concerns.
 */

const T0 = "2026-11-25T00:00:00.000Z";
type Seed = Omit<Condition, "id" | "updatedAt" | "active" | "order" | "inFinder"> & { inFinder?: boolean };

const SEED: Seed[] = [
  {
    slug: "acne",
    name: "Acne & Breakouts",
    summary: "Blackheads, whiteheads and breakouts caused by blocked, inflamed pores.",
    image: "/images/c-acne.jpg",
    imageAlt: "Close-up of a cheek with a few small breakouts",
    overview:
      "Acne is one of the most common skin concerns. It happens when pores become blocked with oil and dead skin cells and then inflamed. It often starts in the teenage years but can continue into, or begin in, adulthood, most often on the face, chest and back.",
    symptoms: ["Blackheads and whiteheads", "Red, tender bumps", "Oily, congested skin", "Dark marks or scars as spots heal"],
    causes: ["Excess oil production", "Blocked pores", "Bacteria and inflammation", "Hormonal changes", "Heavy or pore-clogging products"],
    treatments: ["Deep-cleansing facials and HydraFacial", "Targeted acne treatments with a home-care plan", "Microneedling for the look of acne scars once breakouts are calm"],
    whenToConsult: ["Spots are deep, painful or leaving scars", "Over-the-counter products have not helped after 2–3 months", "Acne started suddenly in adulthood", "These may need prescription treatment from a physician or dermatologist"],
  },
  {
    slug: "fine-lines-wrinkles",
    name: "Fine Lines & Wrinkles",
    summary: "Expression lines and creases that deepen over time with movement, sun and age.",
    image: "/images/c-hyperpigmentation.jpg",
    imageAlt: "Close-up of the skin around a woman's eye",
    overview:
      "Fine lines and wrinkles are a natural part of aging. Some, such as frown lines and crow's feet, are caused by repeated muscle movement. Others come from gradual loss of collagen, elasticity and volume, accelerated by sun exposure and smoking.",
    symptoms: ["Forehead lines and frown lines", "Crow's feet around the eyes", "Fine, crepey lines", "Lines that remain when the face is at rest"],
    causes: ["Repeated facial expressions", "Natural loss of collagen and elastin", "Sun exposure", "Smoking and dehydration"],
    treatments: ["Botox for expression lines", "Dermal fillers or Sculptra where lines come from volume loss", "Microneedling and PRP for fine lines and texture", "Daily broad-spectrum sunscreen to protect your results"],
    whenToConsult: ["You would like a personalized plan", "You are unsure which treatment suits which line", "You are pregnant or breastfeeding: most injectables are postponed"],
  },
  {
    slug: "volume-loss",
    name: "Volume Loss",
    summary: "Hollowing of the cheeks, temples or under-eyes, and thinner lips, as natural volume changes with age.",
    image: "/images/p-dermal-fillers.jpg",
    imageAlt: "Mature client during a facial injection treatment",
    overview:
      "With age, the face gradually loses fat, collagen and bone support. This can show as flatter cheeks, hollow temples or under-eyes, deeper smile lines and thinner lips. Restoring volume subtly can refresh the face without changing who you are.",
    symptoms: ["Flatter cheeks", "Hollow under-eyes or temples", "Deeper smile lines", "Thinner lips", "Less defined jawline"],
    causes: ["Natural aging", "Weight loss", "Genetics", "Sun damage"],
    treatments: ["Hyaluronic acid dermal fillers for immediate volume", "Sculptra for gradual, collagen-stimulating volume", "A combined anti-aging plan"],
    whenToConsult: ["You want a natural-looking, balanced result", "You have had fillers elsewhere and want them reviewed"],
  },
  {
    slug: "dull-dehydrated-skin",
    name: "Dull, Dehydrated Skin",
    summary: "Skin that looks tired, lacks radiance or feels tight and rough.",
    image: "/images/b-melasma.jpg",
    imageAlt: "Woman with natural, freckled skin looking to the side",
    overview:
      "Dullness usually comes from a build-up of dead skin cells, dehydration and an uneven surface that reflects light poorly. Dehydrated skin lacks water rather than oil, so it can affect any skin type, including oily skin.",
    symptoms: ["Lack of glow", "Tightness after cleansing", "Rough or flaky patches", "Makeup that sits unevenly"],
    causes: ["Build-up of dead skin cells", "Harsh cleansers or over-exfoliation", "Dry air, heating and air conditioning", "Sun exposure, stress and lack of sleep"],
    treatments: ["HydraFacial", "Customized facials", "PRP skin rejuvenation", "A gentle, hydrating home routine with daily sunscreen"],
    whenToConsult: ["Your skin is persistently red, itchy or scaly, which may be a skin condition best checked by a physician"],
  },
  {
    slug: "texture-pores",
    name: "Uneven Texture & Pores",
    summary: "Rough texture, enlarged-looking pores and an uneven skin surface.",
    image: "/images/c-melasma.jpg",
    imageAlt: "Close-up of skin texture on the cheek and eyelid",
    overview:
      "Pore size is largely genetic, but pores can look larger when they are congested or when skin loses firmness. Uneven texture can also come from past breakouts, sun damage and slower cell turnover.",
    symptoms: ["Visible, enlarged-looking pores", "Rough or bumpy texture", "Shallow scars or marks", "Uneven light reflection"],
    causes: ["Genetics and oily skin", "Congestion", "Loss of firmness with age", "Past acne and sun damage"],
    treatments: ["Microneedling", "HydraFacial", "Laser skin treatments", "PRP skin rejuvenation"],
    whenToConsult: ["You would like a plan combining treatments for the best result"],
  },
  {
    slug: "unwanted-hair",
    name: "Unwanted Hair",
    summary: "Hair on the face or body that you would prefer to reduce long-term.",
    image: "/images/c-skin-tags.jpg",
    imageAlt: "Woman's hand touching the smooth skin of her forearm",
    overview:
      "Shaving, waxing and plucking only remove hair temporarily and can cause irritation and ingrown hairs. Laser hair removal targets the follicle to reduce regrowth over a course of sessions.",
    symptoms: ["Frequent shaving or waxing", "Ingrown hairs and razor bumps", "Irritation after hair removal"],
    causes: ["Genetics", "Hormonal changes", "Some medical conditions and medicines"],
    treatments: ["Laser hair removal (diode 808)"],
    whenToConsult: ["Sudden or excessive new hair growth, which can have a hormonal cause worth checking with a physician"],
  },
  {
    slug: "skin-tags-moles-warts",
    name: "Skin Tags, Moles & Warts",
    summary: "Small skin growths that can catch, irritate or simply bother you.",
    image: "/images/c-warts.jpg",
    imageAlt: "Magnifying glass held over a small mole on the arm",
    overview:
      "Skin tags are soft, harmless growths, common on the neck, underarms and eyelids. Most moles are benign. Warts are caused by a common virus. Many can be removed in a short visit once they have been assessed.",
    symptoms: ["Soft skin tags that catch on clothing or jewelry", "Raised moles", "Rough, firm warts on hands or feet"],
    causes: ["Skin friction (skin tags)", "Genetics and sun exposure (moles)", "The human papillomavirus, HPV (warts)"],
    treatments: ["In-clinic skin tag, mole and wart removal"],
    whenToConsult: [
      "A mole is new, changing in size, shape or color, or has an irregular border",
      "A spot bleeds, itches or does not heal",
      "These signs need a physician or dermatologist's assessment before any removal",
    ],
  },
  {
    slug: "hydration-wellness",
    name: "Hydration & Wellness",
    summary: "Support for hydration, energy and recovery as part of your wellness routine.",
    image: "/images/s-serum-2.jpg",
    imageAlt: "Hands holding a small glass vial against a soft peach background",
    overview:
      "Busy schedules, travel, exercise and warm weather can all leave you feeling depleted. Wellness treatments such as IV therapy and vitamin shots are chosen by many clients to support hydration and recovery alongside good sleep, nutrition and fluids.",
    symptoms: ["Feeling run-down after travel or a busy period", "Recovery after exercise", "Wanting to support your routine"],
    causes: ["Not drinking enough fluids", "Heat, exercise and travel", "Stress and lack of sleep"],
    treatments: ["IV wellness therapy", "Vitamin therapy", "NAD+ therapy", "Body detox programs"],
    whenToConsult: ["Persistent tiredness, dizziness or unexplained symptoms, which should be checked by your physician", "You have heart or kidney disease, are pregnant, or take regular medication"],
  },
];

export const SEED_CONDITIONS: Condition[] = SEED.map((c, i) => ({
  ...c,
  id: `c-${c.slug}`,
  inFinder: c.inFinder ?? true,
  active: true,
  order: i,
  updatedAt: T0,
}));
