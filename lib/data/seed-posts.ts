import type { Post } from "./types";

/** Starter articles (general education, not personal medical advice). Editable in Admin → Blog. */

const AUTHOR = "The clinic team";

export const SEED_POSTS: Post[] = [
  {
    id: "post-acne",
    slug: "how-to-manage-acne",
    title: "How to manage acne: a dermatologist-led approach",
    excerpt: "Why acne happens, what actually helps, and when it is time to see a dermatologist.",
    cover: "/images/b-acne.jpg",
    coverAlt: "Woman applying skincare to her face",
    tags: ["Acne", "Skincare"],
    status: "published",
    author: AUTHOR,
    publishedAt: "2026-10-02T09:00:00.000Z",
    updatedAt: "2026-10-02T09:00:00.000Z",
    content: `Acne is one of the most common reasons people see a dermatologist, and one of the most treatable. Here is how to approach it calmly and effectively.

## Why acne happens

Four things work together: **excess oil**, **blocked pores**, **acne-related bacteria** and **inflammation**. Hormones, genetics, some medicines and pore-clogging products can all play a part.

## What helps at home

- Wash twice a day with a gentle, non-soap cleanser.
- Use a **non-comedogenic** moisturiser and sunscreen.
- Introduce one active ingredient at a time, such as adapalene, benzoyl peroxide or azelaic acid.
- Give any routine **8–12 weeks** before judging it.
- Avoid picking or squeezing, which increases the risk of marks and scars.

## What does not help

Harsh scrubs, toothpaste, frequent product-switching and using steroid creams on spots can all make acne worse.

## When to see a dermatologist

Book a consultation if spots are deep or painful, leaving marks or scars, not improving after a few months of consistent care, or affecting how you feel. Prescription treatments, and in-clinic options such as peels, can make a real difference, and early treatment helps prevent scarring.

*This article is general information and not a substitute for personal medical advice.*`,
  },
  {
    id: "post-hair-loss",
    slug: "causes-of-hair-loss",
    title: "Causes of hair loss, and why diagnosis comes first",
    excerpt: "Thinning, shedding or patches? Understanding the type of hair loss is the key to treating it.",
    cover: "/images/p-hair-restoration.jpg",
    coverAlt: "Back view of a woman with long dark hair",
    tags: ["Hair loss", "Hair"],
    status: "published",
    author: AUTHOR,
    publishedAt: "2026-10-16T09:00:00.000Z",
    updatedAt: "2026-10-16T09:00:00.000Z",
    content: `Losing 50–100 hairs a day is normal. When shedding increases or hair becomes visibly thinner, it is worth finding out why.

## Common types of hair loss

- **Pattern hair loss**: gradual thinning at the crown or hairline, influenced by genetics and hormones.
- **Telogen effluvium**: sudden diffuse shedding two to three months after illness, high fever, surgery, childbirth, crash dieting or major stress.
- **Alopecia areata**: round, smooth bald patches caused by the immune system.
- **Traction alopecia**: loss from tight hairstyles over time.

## Medical causes worth checking

Iron deficiency, thyroid problems, hormonal conditions such as PCOS, some medicines and scalp conditions can all contribute. Your doctor may suggest blood tests based on your history.

## Treatment options

Treatment depends on the cause and may include topical or oral medicines, correcting deficiencies, PRP or mesotherapy as part of a plan, and gentle hair-care changes. Hair grows slowly, so progress is usually assessed after **3–6 months**.

*Seek advice promptly if hair loss is sudden, patchy, or comes with scalp pain or other symptoms.*`,
  },
  {
    id: "post-sunscreen",
    slug: "how-to-choose-sunscreen",
    title: "Sunscreen: how to choose the right one",
    excerpt: "SPF, broad spectrum, tinted or not? A simple guide to the most important step in any routine.",
    cover: "/images/b-sunscreen.jpg",
    coverAlt: "Woman holding a sunscreen bottle beside her face",
    tags: ["Sunscreen", "Skincare", "Pigmentation"],
    status: "published",
    author: AUTHOR,
    publishedAt: "2026-11-01T09:00:00.000Z",
    updatedAt: "2026-11-01T09:00:00.000Z",
    content: `Daily sunscreen helps prevent sunburn, premature ageing and pigmentation, and is essential if you are treating melasma or having peels or laser.

## What to look for

- **SPF 30 or higher** for daily use; SPF 50 for long outdoor exposure.
- **Broad spectrum**: protects against both UVA and UVB.
- **Tinted (with iron oxides)** if you have melasma or pigmentation, as it also helps against visible light.
- A **texture you enjoy**, because the best sunscreen is the one you will wear every day.

## Skin-type tips

- *Oily or acne-prone*: gel or fluid, labelled non-comedogenic.
- *Dry*: cream formulas with added moisturisers.
- *Sensitive*: mineral (zinc oxide or titanium dioxide) filters are often better tolerated.

## How to apply

Use about two finger-lengths for the face and neck, apply as the last step of your morning routine, and **reapply every two hours** outdoors or after sweating. Do not forget your ears, neck and the backs of your hands.

*Sunscreen works best alongside shade, hats and sunglasses.*`,
  },
  {
    id: "post-melasma",
    slug: "understanding-melasma",
    title: "Understanding melasma",
    excerpt: "Why melasma keeps coming back, and how to manage it safely over the long term.",
    cover: "/images/b-melasma.jpg",
    coverAlt: "Portrait of a woman with freckles",
    tags: ["Melasma", "Pigmentation"],
    status: "published",
    author: AUTHOR,
    publishedAt: "2026-11-10T09:00:00.000Z",
    updatedAt: "2026-11-10T09:00:00.000Z",
    content: `Melasma causes symmetrical brown or grey-brown patches, usually on the cheeks, forehead and upper lip. It is especially common in women and in medium to darker skin tones.

## Why it happens

Sunlight (including visible light), hormones (pregnancy, contraceptive pills), genetics and heat all play a role. That is why melasma often returns, even after successful treatment.

## A safe, long-term plan

1. **Protection every day**: tinted broad-spectrum sunscreen, reapplied, plus a hat outdoors.
2. **Prescription creams**: your doctor may use ingredients such as hydroquinone (in supervised courses), azelaic acid or retinoids.
3. **Tranexamic acid**: topical or oral, after medical assessment.
4. **Gentle procedures**: superficial peels or carefully selected laser settings, when appropriate.
5. **Maintenance**: continuing a simple routine to keep results stable.

## What to avoid

Unregulated "whitening" creams can contain strong steroids or mercury and may cause lasting harm. Aggressive treatments can make melasma darker.

*If you are pregnant or breastfeeding, ask your doctor before starting any treatment.*`,
  },
  {
    id: "post-routine",
    slug: "simple-skincare-routine",
    title: "Building a simple, effective skincare routine",
    excerpt: "Cleanse, treat, moisturise, protect: the four steps that matter most.",
    cover: "/images/b-routine.jpg",
    coverAlt: "Hands holding a glass serum dropper bottle",
    tags: ["Skincare"],
    status: "published",
    author: AUTHOR,
    publishedAt: "2026-11-15T09:00:00.000Z",
    updatedAt: "2026-11-15T09:00:00.000Z",
    content: `A good routine does not need ten steps. Consistency matters far more than the number of products.

## Morning

1. **Cleanse** gently (or simply rinse with water if your skin is dry).
2. **Treat** with an antioxidant serum such as vitamin C, if you like.
3. **Moisturise** with a texture suited to your skin.
4. **Protect** with broad-spectrum sunscreen: the most important step.

## Evening

1. **Cleanse**, double-cleansing if you wore makeup or heavy sunscreen.
2. **Treat** with one active, for example a retinoid, azelaic acid or a prescribed cream.
3. **Moisturise**.

## Tips

- Introduce one new product at a time, two weeks apart.
- Patch-test new products on the jawline first.
- Fewer, well-chosen products usually beat many.

*Your dermatologist can tailor a routine to your skin type and concerns.*`,
  },
  {
    id: "post-anti-ageing",
    slug: "anti-ageing-treatments-explained",
    title: "Anti-ageing treatments explained",
    excerpt: "From sunscreen to skin boosters: what each option does and how to choose.",
    cover: "/images/b-anti-aging.jpg",
    coverAlt: "Hand holding a glass dropper bottle against a beige background",
    tags: ["Anti-ageing", "Aesthetic"],
    status: "published",
    author: AUTHOR,
    publishedAt: "2026-11-20T09:00:00.000Z",
    updatedAt: "2026-11-20T09:00:00.000Z",
    content: `Skin ageing involves changes in skin quality, volume, muscle activity and sun damage. Different treatments address different parts of that picture.

## The foundation

**Daily sunscreen** and a **retinoid** at night are among the best-evidenced ways to protect and improve ageing skin.

## In-clinic options

- **Anti-wrinkle injections** soften expression lines by relaxing specific muscles. Effects last around 3–4 months.
- **Dermal fillers** restore lost volume and support contours; hyaluronic acid fillers are reversible.
- **Skin boosters** improve hydration and fine crepey lines without adding volume.
- **Peels, microneedling and laser** improve texture, tone and fine lines.

## Choosing what is right for you

A good plan starts with your priorities and introduces treatments gradually for a natural result. Be wary of anyone who promises guaranteed outcomes or pressures you into treatment on the day.

*All treatments carry possible side effects, which your doctor should explain before you decide.*`,
  },
];
