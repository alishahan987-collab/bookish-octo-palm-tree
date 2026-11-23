import type { CategoryId, ConcernId } from "./types";

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "laser", label: "Laser" },
  { id: "facials", label: "Facials" },
  { id: "peels", label: "Peels" },
  { id: "skin-concerns", label: "Skin concerns" },
  { id: "hair", label: "Hair" },
  { id: "consultation", label: "Consultation" },
];

export const categoryLabel = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

/** Concerns offered in the Skin Concern Finder (in display order). */
export const FINDER_CONCERNS: { id: ConcernId; label: string; hint: string }[] = [
  { id: "acne", label: "Acne", hint: "Breakouts, spots, congestion" },
  { id: "acne-scars", label: "Acne scars", hint: "Marks or texture left by acne" },
  { id: "pigmentation", label: "Pigmentation", hint: "Dark spots, sun spots" },
  { id: "melasma", label: "Melasma", hint: "Patchy brown areas on the face" },
  { id: "wrinkles", label: "Wrinkles", hint: "Fine lines" },
  { id: "hair-loss", label: "Hair loss", hint: "Thinning hair" },
  { id: "uneven-tone", label: "Uneven tone", hint: "Blotchy or dull complexion" },
  { id: "ageing", label: "Ageing", hint: "General signs of skin ageing" },
];

export const ALL_CONCERNS: { id: ConcernId; label: string }[] = [
  ...FINDER_CONCERNS.map(({ id, label }) => ({ id, label })),
  { id: "unwanted-hair", label: "Unwanted hair" },
  { id: "dull-skin", label: "Dull skin" },
];

export const concernLabel = (id: ConcernId) => ALL_CONCERNS.find((c) => c.id === id)?.label ?? id;
