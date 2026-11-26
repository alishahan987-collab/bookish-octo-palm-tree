import { CATEGORIES, MENU_CATEGORIES } from "@/lib/categories";

/** Main navigation. "Treatments" opens the treatment menu; everything else is a plain link. */
export const NAV_LINKS = [
  { href: "/before-after", label: "Results" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export const TREATMENT_GROUPS = MENU_CATEGORIES.map((id) => ({ id, label: CATEGORIES[id].label, href: CATEGORIES[id].href }));

export const FOOTER_CLINIC_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/before-after", label: "Results" },
  { href: "/pricing", label: "Pricing" },
  { href: "/conditions", label: "Skin concerns" },
  { href: "/skin-finder", label: "Treatment finder" },
  { href: "/blog", label: "Journal" },
  { href: "/contact", label: "Contact" },
];

export const EXTRA_LINKS = [
  { href: "/treatments", label: "All treatments" },
  { href: "/book", label: "Book an appointment" },
  { href: "/privacy", label: "Privacy notice" },
  { href: "/accessibility", label: "Accessibility" },
];
