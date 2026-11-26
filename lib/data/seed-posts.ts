import type { Post } from "./types";

/** Starter articles (general education, not personal medical advice). Editable in Admin → Blog. */

const AUTHOR = "The clinic team";

export const SEED_POSTS: Post[] = [
  {
    id: "post-acne",
    slug: "how-to-manage-acne",
    title: "How to manage acne: a practical guide",
    excerpt: "Why acne happens, what actually helps, and when to get professional help.",
    cover: "/images/b-acne.jpg",
    coverAlt: "Woman applying skincare to her face",
    tags: ["Acne", "Skincare"],
    status: "published",
    author: AUTHOR,
    publishedAt: "2026-10-02T09:00:00.000Z",
    updatedAt: "2026-10-02T09:00:00.000Z",
    content: `Acne is one of the most common skin concerns, and one of the most treatable. Here is how to approach it calmly and effectively.

## Why acne happens

Four things work together: **excess oil**, **blocked pores**, **acne-related bacteria** and **inflammation**. Hormones, genetics, some medicines and pore-clogging products can all play a part.

## What helps at home

- Wash twice a day with a gentle, non-soap cleanser.
- Use a **non-comedogenic** moisturizer and sunscreen.
- Introduce one active ingredient at a time, such as adapalene, benzoyl peroxide or azelaic acid.
- Give any routine **8–12 weeks** before judging it.
- Avoid picking or squeezing, which increases the risk of marks and scars.

## What does not help

Harsh scrubs, toothpaste, frequent product-switching and using steroid creams on spots can all make acne worse.

## When to get professional help

Book a consultation if breakouts are not improving after a few months of consistent care, or are affecting how you feel. In-clinic treatments such as deep-cleansing facials can support your routine. If spots are deep, painful or leaving scars, see a physician or dermatologist: prescription treatment may be needed, and early treatment helps prevent scarring.

*This article is general information and not a substitute for personal medical advice.*`,
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
    content: `Daily sunscreen helps prevent sunburn, premature aging and dark spots, and is especially important if you are having laser, microneedling or other skin treatments.

## What to look for

- **SPF 30 or higher** for daily use; SPF 50 for long outdoor exposure.
- **Broad spectrum**: protects against both UVA and UVB.
- **Tinted (with iron oxides)** if you are prone to dark spots or uneven tone, as it also helps against visible light.
- A **texture you enjoy**, because the best sunscreen is the one you will wear every day.

## Skin-type tips

- *Oily or acne-prone*: gel or fluid, labeled non-comedogenic.
- *Dry*: cream formulas with added moisturizers.
- *Sensitive*: mineral (zinc oxide or titanium dioxide) filters are often better tolerated.

## How to apply

Use about two finger-lengths for the face and neck, apply as the last step of your morning routine, and **reapply every two hours** outdoors or after sweating. Do not forget your ears, neck and the backs of your hands.

*Sunscreen works best alongside shade, hats and sunglasses.*`,
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
3. **Moisturize** with a texture suited to your skin.
4. **Protect** with broad-spectrum sunscreen: the most important step.

## Evening

1. **Cleanse**, double-cleansing if you wore makeup or heavy sunscreen.
2. **Treat** with one active, for example a retinoid, azelaic acid or a prescribed cream.
3. **Moisturize**.

## Tips

- Introduce one new product at a time, two weeks apart.
- Patch-test new products on the jawline first.
- Fewer, well-chosen products usually beat many.

*We are happy to tailor a routine to your skin type and goals at your next visit.*`,
  },
  {
    id: "post-anti-aging",
    slug: "anti-aging-treatments-explained",
    title: "Anti-aging treatments explained",
    excerpt: "From sunscreen to skin boosters: what each option does and how to choose.",
    cover: "/images/b-anti-aging.jpg",
    coverAlt: "Hand holding a glass dropper bottle against a beige background",
    tags: ["Anti-aging", "Injectables"],
    status: "published",
    author: AUTHOR,
    publishedAt: "2026-11-20T09:00:00.000Z",
    updatedAt: "2026-11-20T09:00:00.000Z",
    content: `Skin aging involves changes in skin quality, volume, muscle activity and sun damage. Different treatments address different parts of that picture.

## The foundation

**Daily sunscreen** and a **retinoid** at night are among the best-evidenced ways to protect and improve aging skin.

## In-clinic options

- **Botox** softens expression lines by relaxing specific muscles. Effects typically last 3–4 months.
- **Dermal fillers** restore lost volume and support contours; hyaluronic acid fillers are reversible.
- **Sculptra** stimulates your own collagen to restore volume gradually.
- **Microneedling, PRP and laser** improve texture, tone and fine lines.

## Choosing what is right for you

A good plan starts with your priorities and introduces treatments gradually for a natural result. Be wary of anyone who promises guaranteed outcomes or pressures you into treatment on the day.

*All treatments carry possible side effects, which your provider should explain before you decide.*`,
  },
];
