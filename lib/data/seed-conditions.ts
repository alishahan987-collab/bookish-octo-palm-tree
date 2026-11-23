import type { Condition } from "./types";

/**
 * Starter condition library: general patient information, not a diagnosis.
 * Editable in Admin → Conditions.
 */

const T0 = "2026-01-01T00:00:00.000Z";
type Seed = Omit<Condition, "id" | "updatedAt" | "active" | "order" | "inFinder"> & { inFinder?: boolean };

const SEED: Seed[] = [
  {
    slug: "acne",
    name: "Acne",
    summary: "Blackheads, whiteheads, spots and deeper cysts caused by blocked, inflamed hair follicles.",
    image: "/images/c-acne.jpg",
    imageAlt: "Close-up of a woman's cheek with acne spots",
    overview:
      "Acne is a very common condition affecting the hair follicles and oil glands of the skin. It usually starts in the teenage years but can continue into, or begin in, adulthood. It most often affects the face, chest and back.",
    symptoms: ["Blackheads and whiteheads (comedones)", "Red, tender bumps and pus-filled spots", "Deeper, painful nodules or cysts", "Oily skin", "Dark marks or scars as spots heal"],
    causes: ["Excess oil (sebum) production", "Blocked hair follicles", "Acne-related bacteria and inflammation", "Hormonal changes, including around periods or PCOS", "Family history, some medicines, and heavy or pore-clogging cosmetics"],
    treatments: ["Topical retinoids, benzoyl peroxide or azelaic acid", "Topical or oral antibiotics for limited periods", "Hormonal treatments for some women", "Isotretinoin for severe or resistant acne, under close medical supervision", "In-clinic procedures such as chemical peels"],
    whenToConsult: ["Spots are painful, deep or leaving marks or scars", "Over-the-counter products have not helped after 2–3 months", "Acne is affecting your confidence or wellbeing", "Acne started suddenly in adulthood"],
  },
  {
    slug: "acne-scars",
    name: "Acne Scars",
    summary: "Permanent changes in skin texture left after inflamed acne heals.",
    image: "/images/p-acne-scar-treatment.jpg",
    imageAlt: "Close-up of facial skin texture",
    overview:
      "Acne scars form when inflammation damages the deeper layers of the skin during healing. They are different from the flat brown or red marks acne can leave, which often fade with time. Scars may be depressed (atrophic) or, less commonly, raised.",
    symptoms: ["Narrow, deep 'ice-pick' scars", "Broad, box-shaped depressions", "Wave-like 'rolling' scars", "Raised (hypertrophic or keloid) scars, especially on the chest and back"],
    causes: ["Inflamed or cystic acne", "Delay in treating active acne", "Picking or squeezing spots", "Genetic tendency to scarring"],
    treatments: ["Controlling active acne first", "Microneedling and subcision", "Chemical reconstruction techniques such as TCA CROSS", "Fractional laser resurfacing", "Combination plans tailored to scar type"],
    whenToConsult: ["You have scars you would like to improve", "You still have active acne and want to prevent further scarring", "Raised or itchy scars are forming"],
  },
  {
    slug: "melasma",
    name: "Melasma",
    summary: "Patchy brown or grey-brown pigmentation, usually on the cheeks, forehead and upper lip.",
    image: "/images/c-melasma.jpg",
    imageAlt: "Close-up of facial skin with pigmentation",
    overview:
      "Melasma is a common, long-term pigmentation condition, particularly in women and in people with medium to darker skin tones. It can improve with treatment but often returns, so care focuses on control and maintenance.",
    symptoms: ["Symmetrical brown or grey-brown patches", "Usually on the cheeks, forehead, nose bridge or upper lip", "Darkens with sun exposure or heat", "No itching or pain"],
    causes: ["Sunlight, including visible light", "Hormones: pregnancy, contraceptive pills or hormone therapy", "Genetic tendency", "Heat and some cosmetics or medicines"],
    treatments: ["Daily broad-spectrum, tinted sunscreen (protects against visible light)", "Prescription creams such as hydroquinone (short courses), azelaic acid or tretinoin combinations", "Tranexamic acid, topical or oral after medical assessment", "Gentle chemical peels", "Carefully selected laser settings in some cases"],
    whenToConsult: ["You are unsure whether a patch is melasma or another condition", "Pigmentation is spreading or not improving", "You have used lightening creams without medical advice", "Melasma started during or after pregnancy"],
  },
  {
    slug: "hyperpigmentation",
    name: "Hyperpigmentation",
    summary: "Areas of skin darker than surrounding skin, including sun spots and post-acne marks.",
    image: "/images/c-hyperpigmentation.jpg",
    imageAlt: "Close-up of an eye area with freckles and pigmentation",
    overview:
      "Hyperpigmentation is a general term for patches of skin that become darker because of extra melanin. Common types include post-inflammatory hyperpigmentation (marks after acne, eczema or injury), sun spots and freckles.",
    symptoms: ["Flat brown, grey or dark patches or spots", "Marks where spots or rashes have healed", "Spots that darken with sun exposure"],
    causes: ["Inflammation from acne, eczema or injury", "Sun exposure", "Hormonal changes", "Some medicines", "Harsh skincare or unsupervised bleaching products"],
    treatments: ["Strict daily sun protection", "Topical agents such as azelaic acid, retinoids, niacinamide or hydroquinone (medically supervised)", "Chemical peels", "Selected laser treatments", "Treating the underlying cause, such as acne"],
    whenToConsult: ["A dark spot is changing in size, shape or colour, or bleeds", "Pigmentation is not fading after several months", "You want a safe plan rather than trial-and-error products"],
  },
  {
    slug: "rosacea",
    name: "Rosacea",
    summary: "Long-term facial redness, flushing and sometimes acne-like bumps.",
    image: "/images/c-rosacea.jpg",
    imageAlt: "Portrait of a woman with fair, flushed skin",
    overview:
      "Rosacea is a chronic inflammatory skin condition that mainly affects the central face. It tends to come and go in flare-ups. It cannot be cured, but symptoms can usually be well controlled.",
    symptoms: ["Flushing and persistent redness of the cheeks, nose, chin or forehead", "Visible small blood vessels", "Red bumps and pus-filled spots", "Burning, stinging or sensitive skin", "Sore, gritty or red eyes in some people"],
    causes: ["Exact cause not fully understood", "Triggers such as sun, heat, spicy food, hot drinks, alcohol and stress", "Abnormal blood-vessel and immune responses", "Family history"],
    treatments: ["Identifying and avoiding triggers", "Gentle skincare and daily sunscreen", "Prescription creams such as ivermectin, metronidazole or azelaic acid", "Oral medicines for flare-ups", "Vascular laser or light treatment for redness and visible vessels"],
    whenToConsult: ["Redness or flushing persists", "Spots do not respond to acne products", "You have eye symptoms", "Skin is becoming thickened, particularly on the nose"],
  },
  {
    slug: "eczema",
    name: "Eczema",
    summary: "Dry, itchy, inflamed skin that tends to flare and settle.",
    image: "/images/c-eczema.jpg",
    imageAlt: "Woman applying moisturiser to her hands",
    overview:
      "Eczema (atopic dermatitis) is a common condition in which the skin barrier is weakened, making the skin dry, itchy and easily irritated. It often starts in childhood but can affect people at any age, and frequently occurs alongside asthma or hay fever.",
    symptoms: ["Dry, rough or scaly skin", "Intense itching, often worse at night", "Red or darker patches, depending on skin tone", "Cracked, weeping or crusted skin during flares", "Thickened skin from long-term scratching"],
    causes: ["Genetic changes affecting the skin barrier", "Immune system over-reaction", "Triggers such as soaps, heat, sweat, dust, stress and some fabrics", "Family history of eczema, asthma or allergies"],
    treatments: ["Regular emollients (moisturisers) and soap substitutes", "Topical corticosteroids used correctly", "Steroid-free creams such as calcineurin inhibitors", "Treating infection if present", "Phototherapy, systemic or biologic medicines for severe eczema"],
    whenToConsult: ["Itching is disturbing sleep", "Skin is weeping, crusted or painful (possible infection)", "Eczema is not controlled with moisturisers", "You are unsure how to use steroid creams safely"],
  },
  {
    slug: "psoriasis",
    name: "Psoriasis",
    summary: "An immune-related condition causing red, scaly, well-defined patches.",
    image: "/images/c-psoriasis.jpg",
    imageAlt: "Close-up of dry, scaly skin on the arm",
    overview:
      "Psoriasis is a long-term, immune-related condition in which skin cells are produced too quickly, forming raised, scaly plaques. It is not contagious. It can also affect the scalp, nails and joints, and is linked with other health conditions.",
    symptoms: ["Raised, well-defined red or darker patches with silvery scale", "Commonly on elbows, knees, scalp and lower back", "Itching or soreness", "Nail pitting or thickening", "Joint pain or stiffness (psoriatic arthritis) in some people"],
    causes: ["Immune system activity", "Genetic tendency", "Triggers such as stress, infections, skin injury, some medicines, smoking and alcohol"],
    treatments: ["Topical corticosteroids and vitamin D analogues", "Medicated scalp treatments", "Phototherapy (narrowband UVB)", "Systemic medicines", "Biologic treatments for moderate to severe disease"],
    whenToConsult: ["You think you may have psoriasis", "Creams are not controlling it", "You have joint pain or swelling", "Psoriasis is affecting your quality of life"],
  },
  {
    slug: "vitiligo",
    name: "Vitiligo",
    summary: "Patches of skin that lose their colour because pigment cells stop working.",
    image: "/images/c-vitiligo.jpg",
    imageAlt: "Arms of a person with vitiligo",
    overview:
      "Vitiligo causes white patches where melanocytes, the pigment-producing cells, are lost. It is thought to be autoimmune. It is not contagious and not caused by diet. The course is unpredictable, and treatment aims to stop spread and encourage repigmentation.",
    symptoms: ["Milky-white patches of skin", "Often on the face, hands, around the mouth or genitals", "Whitening of hair in affected areas", "Patches may spread over time"],
    causes: ["Autoimmune attack on pigment cells", "Genetic tendency", "Possible triggers such as stress, skin injury or sunburn"],
    treatments: ["Topical corticosteroids or calcineurin inhibitors", "Newer topical treatments where available", "Narrowband UVB phototherapy", "Oral treatment for rapidly spreading disease", "Camouflage and sun protection for affected skin"],
    whenToConsult: ["You notice new white patches", "Patches are spreading quickly", "You would like to discuss treatment or camouflage options", "Vitiligo is affecting your wellbeing"],
  },
  {
    slug: "skin-allergies",
    name: "Skin Allergies",
    summary: "Itchy rashes or hives triggered by contact with, or reaction to, a substance.",
    image: "/images/c-skin-allergies.jpg",
    imageAlt: "Person scratching an itchy arm",
    overview:
      "Skin allergies include hives (urticaria), which are raised, itchy welts, and allergic contact dermatitis, a rash caused by direct contact with a substance such as a fragrance, preservative, nickel or hair dye. Identifying the trigger is key.",
    symptoms: ["Itchy, raised welts that come and go (hives)", "Red, itchy, sometimes blistering rash where a substance touched the skin", "Swelling of the skin", "Dry, irritated patches with repeated exposure"],
    causes: ["Cosmetics, fragrances, hair dye and preservatives", "Metals such as nickel", "Foods and medicines (for hives)", "Infections, heat, pressure or stress (for hives)"],
    treatments: ["Identifying and avoiding the trigger", "Patch testing for contact allergy", "Antihistamines", "Topical corticosteroids for rashes", "Specialist treatment for chronic hives"],
    whenToConsult: ["Rashes keep coming back", "Hives last more than six weeks", "You react to cosmetics or hair dye", "Seek emergency care immediately for swelling of the lips, tongue or throat, or difficulty breathing"],
  },
  {
    slug: "warts",
    name: "Warts",
    summary: "Small, rough growths caused by the human papillomavirus (HPV).",
    image: "/images/c-warts.jpg",
    imageAlt: "Close examination of skin with a magnifying glass",
    overview:
      "Warts are harmless, non-cancerous growths caused by HPV infection of the top layer of skin. They can spread by direct contact or from shared surfaces. Many disappear on their own over months to years, but they can be persistent, painful or spread.",
    symptoms: ["Rough, raised bumps, often on hands and fingers", "Flat, smooth warts on the face or legs", "Painful warts on the soles of the feet (plantar warts)", "Tiny black dots within the wart"],
    causes: ["Human papillomavirus (HPV)", "Breaks in the skin", "Walking barefoot in shared, damp areas", "Weakened immunity"],
    treatments: ["Salicylic acid preparations", "Cryotherapy (freezing)", "Electrocautery or other in-clinic removal", "Immune-stimulating treatments for stubborn warts"],
    whenToConsult: ["A growth is painful, bleeding or changing", "Warts are spreading or on the face or genitals", "Home treatments have not worked", "You have diabetes or weakened immunity"],
  },
  {
    slug: "skin-tags",
    name: "Skin Tags",
    summary: "Soft, harmless flaps of skin, often on the neck, underarms or eyelids.",
    image: "/images/c-skin-tags.jpg",
    imageAlt: "Person applying cream to the arm",
    overview:
      "Skin tags (acrochordons) are small, soft, skin-coloured or darker growths that hang from the skin. They are harmless and very common, especially in skin folds. Removal is usually cosmetic or for comfort.",
    symptoms: ["Small, soft growths on a narrow stalk", "Common on the neck, armpits, eyelids and under the breasts", "May catch on clothing or jewellery"],
    causes: ["Friction in skin folds", "Increasing age", "Weight gain and insulin resistance", "Pregnancy", "Family history"],
    treatments: ["Snip removal under local anaesthetic", "Cryotherapy (freezing)", "Electrocautery", "Ruling out other growths that can look similar"],
    whenToConsult: ["A growth bleeds, changes or grows quickly", "Tags are irritated or catching", "You are unsure whether a growth is a skin tag", "You would like them removed safely"],
  },
  {
    slug: "fungal-infections",
    name: "Fungal Infections",
    summary: "Itchy, spreading rashes such as ringworm, athlete's foot and yeast infections.",
    image: "/images/c-fungal.jpg",
    imageAlt: "Person applying cream to the back of the hand",
    overview:
      "Fungal skin infections are very common in warm, humid climates. They include ringworm (tinea) of the body, groin and feet, yeast infections in skin folds and pityriasis versicolor. Using steroid creams without a diagnosis can make fungal infections spread and become harder to treat.",
    symptoms: ["Itchy, ring-shaped rash with a raised edge", "Red, scaly rash in the groin, between toes or in skin folds", "Lighter or darker scaly patches on the chest and back", "Thickened, discoloured nails"],
    causes: ["Heat, humidity and sweating", "Tight clothing and shared towels", "Contact with infected people, animals or surfaces", "Diabetes or weakened immunity", "Misuse of steroid creams"],
    treatments: ["Topical antifungal creams", "Oral antifungal medicines for widespread or resistant infection", "Keeping skin cool and dry", "Treating household contacts when needed", "Stopping inappropriate steroid creams under medical advice"],
    whenToConsult: ["The rash is spreading or keeps returning", "Over-the-counter creams have not worked", "You have used a steroid or combination cream", "Nails, scalp or large areas are affected"],
  },
  {
    slug: "hair-loss",
    name: "Hair Loss",
    summary: "Thinning, shedding or patchy loss of scalp hair, with many possible causes.",
    image: "/images/p-hair-loss-management.jpg",
    imageAlt: "Hand holding a comb with shed hair",
    overview:
      "Hair loss can be gradual thinning, sudden shedding or patchy bald areas. Common types include pattern hair loss, telogen effluvium (shedding after stress, illness or childbirth), alopecia areata and traction alopecia. Correct diagnosis guides treatment.",
    symptoms: ["Gradual thinning at the crown or hairline", "Widening parting", "Increased shedding when washing or brushing", "Round, smooth bald patches", "Broken hairs or scalp redness or scaling"],
    causes: ["Genetics and hormones (pattern hair loss)", "Stress, illness, surgery or childbirth", "Iron deficiency or thyroid problems", "Autoimmune conditions", "Tight hairstyles, harsh treatments and some medicines"],
    treatments: ["Treating any underlying cause or deficiency", "Topical or oral medicines where appropriate", "PRP and mesotherapy as part of a plan", "Steroid treatments for alopecia areata", "Advice on hair care and, where suitable, surgical options"],
    whenToConsult: ["Hair loss is sudden, patchy or rapid", "You have scalp pain, redness or scaling", "Thinning is affecting your confidence", "You have other symptoms such as fatigue or irregular periods"],
  },
  {
    slug: "dandruff",
    name: "Dandruff",
    summary: "Flaking and itching of the scalp, sometimes with redness (seborrhoeic dermatitis).",
    image: "/images/c-dandruff.jpg",
    imageAlt: "Serum being applied to the scalp with a dropper",
    overview:
      "Dandruff is common flaking of the scalp. When there is also redness and greasy scale, often extending to the eyebrows or sides of the nose, it is called seborrhoeic dermatitis. It is linked to a normal skin yeast and tends to come and go.",
    symptoms: ["White or yellowish flakes", "Itchy scalp", "Redness and greasy scale", "Flaking of eyebrows, beard or sides of the nose"],
    causes: ["Overgrowth of a normal skin yeast (Malassezia)", "Oily skin", "Stress, cold weather and infrequent washing", "Some medical conditions"],
    treatments: ["Medicated shampoos such as ketoconazole, zinc pyrithione, selenium sulfide or salicylic acid", "Regular, consistent washing", "Short courses of anti-inflammatory lotions for flares", "Treating the face and beard area if affected"],
    whenToConsult: ["Medicated shampoos have not helped after a few weeks", "The scalp is very red, sore or weeping", "You have hair loss along with flaking", "You are unsure whether it could be psoriasis"],
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
