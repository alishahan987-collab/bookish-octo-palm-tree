import type { CategoryId } from "./data/types";

/** Treatment menu groups: one place for labels, page addresses and intros. */
export const CATEGORIES: Record<CategoryId, { label: string; short: string; href: string; intro: string }> = {
  skin: {
    label: "Facials & Skin",
    short: "Facials & Skin",
    href: "/skin-care",
    intro: "Facials, HydraFacial, acne care, microneedling, PRP and in-clinic removal of skin tags, moles and warts.",
  },
  injectables: {
    label: "Injectables",
    short: "Injectables",
    href: "/injectables",
    intro: "Botox, dermal fillers and Sculptra, planned for natural-looking, balanced results.",
  },
  laser: {
    label: "Laser",
    short: "Laser",
    href: "/laser",
    intro: "Diode laser hair removal and advanced laser treatments for skin concerns.",
  },
  wellness: {
    label: "Wellness",
    short: "Wellness",
    href: "/wellness",
    intro: "IV wellness therapy, NAD+, vitamin shots and detox programs to support hydration, energy and recovery.",
  },
  consultation: {
    label: "Consultation",
    short: "Consultation",
    href: "/treatments",
    intro: "A one-to-one consultation to plan the right treatments for you.",
  },
};

/** Display order of the four menu groups (consultation is listed separately). */
export const MENU_CATEGORIES: CategoryId[] = ["skin", "injectables", "laser", "wellness"];
export const ALL_CATEGORIES: CategoryId[] = [...MENU_CATEGORIES, "consultation"];
