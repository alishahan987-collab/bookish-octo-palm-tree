import { newId } from "@/lib/id";
import type { Block, BlockType } from "@/lib/types";

/** Field descriptions drive the generic section editor. */
export type FieldDef =
  | { key: string; label: string; type: "text" | "area" | "markdown"; hint?: string }
  | { key: string; label: string; type: "image"; altKey?: string; hint?: string }
  | { key: string; label: string; type: "link" }
  | { key: string; label: string; type: "toggle"; hint?: string }
  | { key: string; label: string; type: "number"; min?: number; max?: number; hint?: string }
  | { key: string; label: string; type: "select"; options: { value: string | number; label: string }[]; hint?: string }
  | { key: string; label: string; type: "repeater"; itemLabel: string; fields: FieldDef[]; newItem: () => Record<string, unknown> };

export interface BlockDef {
  type: BlockType;
  label: string;
  description: string;
  fields: FieldDef[];
  make: () => Block;
}

const base = { tone: "ivory" as const, spacing: "normal" as const };
const t = (key: string, label: string, hint?: string): FieldDef => ({ key, label, type: "text", hint });
const area = (key: string, label: string, hint?: string): FieldDef => ({ key, label, type: "area", hint });
const md = (key: string, label: string): FieldDef => ({ key, label, type: "markdown" });
const cols: FieldDef = { key: "columns", label: "Columns on large screens", type: "select", options: [{ value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" }] };

export const BLOCK_DEFS: BlockDef[] = [
  {
    type: "hero", label: "Hero banner", description: "Large opening section with headline, image and two buttons.",
    fields: [
      { key: "layout", label: "Layout", type: "select", options: [{ value: "split", label: "Text + image side by side" }, { value: "full", label: "Full-width image with text on top" }, { value: "centered", label: "Centred text, wide image below" }] },
      t("eyebrow", "Small text above the headline"), t("title", "Headline"), area("subtitle", "Introduction"),
      { key: "image", label: "Image", type: "image", altKey: "imageAlt" },
      { key: "primary", label: "Main button", type: "link" }, { key: "secondary", label: "Second button", type: "link" },
      { key: "showRating", label: "Show Google rating", type: "toggle" }, { key: "showAddress", label: "Show address", type: "toggle" },
    ],
    make: () => ({ ...base, id: newId("b"), type: "hero", layout: "split", eyebrow: "", title: "New headline", subtitle: "", imageAlt: "", primary: { label: "Book an Appointment", href: "/book" }, secondary: { label: "", href: "" }, showRating: false, showAddress: false }),
  },
  {
    type: "pageHeader", label: "Page title", description: "Simple heading for the top of a page.",
    fields: [t("eyebrow", "Small text above the title"), t("title", "Title"), area("intro", "Introduction"), { key: "image", label: "Optional image", type: "image", altKey: "imageAlt" }],
    make: () => ({ ...base, tone: "champagne", id: newId("b"), type: "pageHeader", eyebrow: "", title: "Page title", intro: "", imageAlt: "" }),
  },
  {
    type: "text", label: "Text", description: "Heading and paragraphs (supports lists, bold and links).",
    fields: [t("eyebrow", "Small text above the heading"), t("title", "Heading"), md("body", "Text"),
      { key: "align", label: "Alignment", type: "select", options: [{ value: "left", label: "Left" }, { value: "center", label: "Centred" }] },
      { key: "width", label: "Width", type: "select", options: [{ value: "narrow", label: "Narrow (easier reading)" }, { value: "wide", label: "Wide" }] }],
    make: () => ({ ...base, id: newId("b"), type: "text", eyebrow: "", title: "Heading", body: "Write your text here.", align: "left", width: "narrow" }),
  },
  {
    type: "imageText", label: "Image + text", description: "Photo beside a heading, text and a link.",
    fields: [t("eyebrow", "Small text above the heading"), t("title", "Heading"), md("body", "Text"), { key: "image", label: "Image", type: "image", altKey: "imageAlt" },
      { key: "imageSide", label: "Image position", type: "select", options: [{ value: "left", label: "Left" }, { value: "right", label: "Right" }] }, { key: "cta", label: "Link", type: "link" }],
    make: () => ({ ...base, id: newId("b"), type: "imageText", eyebrow: "", title: "Heading", body: "", imageAlt: "", imageSide: "left", cta: { label: "", href: "" } }),
  },
  {
    type: "treatments", label: "Treatments grid", description: "Cards for your treatments (managed under Treatments & prices).",
    fields: [t("eyebrow", "Small text above the heading"), t("title", "Heading"), area("intro", "Introduction"),
      { key: "source", label: "Which treatments", type: "select", options: [{ value: "featured", label: "Only those marked 'featured'" }, { value: "all", label: "All published treatments" }] },
      { key: "limit", label: "Maximum number (0 = no limit)", type: "number", min: 0, max: 50 }, cols,
      { key: "showPrices", label: "Show prices on cards", type: "toggle" }, { key: "showCategoryFilter", label: "Show category filter buttons", type: "toggle" },
      { key: "cta", label: "Link next to heading", type: "link" }],
    make: () => ({ ...base, id: newId("b"), type: "treatments", eyebrow: "Treatments", title: "Our treatments", intro: "", source: "featured", limit: 8, columns: 4, showPrices: false, showCategoryFilter: false, cta: { label: "View all treatments", href: "/treatments" } }),
  },
  {
    type: "features", label: "Highlights / steps", description: "Two to four short points, as cards or numbered steps.",
    fields: [t("eyebrow", "Small text above the heading"), t("title", "Heading"), area("intro", "Introduction"),
      { key: "style", label: "Style", type: "select", options: [{ value: "cards", label: "Cards" }, { value: "numbered", label: "Numbered steps" }, { value: "minimal", label: "Minimal" }] }, cols,
      { key: "items", label: "Points", type: "repeater", itemLabel: "Point", fields: [t("title", "Title"), area("text", "Text")], newItem: () => ({ id: newId("f"), title: "New point", text: "" }) }],
    make: () => ({ ...base, id: newId("b"), type: "features", eyebrow: "", title: "Heading", intro: "", style: "cards", columns: 3, items: [{ id: newId("f"), title: "Point one", text: "" }] }),
  },
  {
    type: "reviews", label: "Reviews", description: "Google rating and published testimonials.",
    fields: [t("eyebrow", "Small text above the heading"), t("title", "Heading"), area("intro", "Introduction"),
      { key: "showRating", label: "Show Google rating summary", type: "toggle" }, { key: "limit", label: "Maximum testimonials (0 = all; featured first)", type: "number", min: 0, max: 50 },
      area("emptyText", "Text shown when no testimonials are published"), { key: "cta", label: "Button", type: "link" }],
    make: () => ({ ...base, id: newId("b"), type: "reviews", eyebrow: "Reviews", title: "What our clients say", intro: "", showRating: true, limit: 3, emptyText: "", cta: { label: "Read our Google reviews", href: "" } }),
  },
  {
    type: "gallery", label: "Before & after gallery", description: "Consented before/after photos (managed under Before & after).",
    fields: [t("eyebrow", "Small text above the heading"), t("title", "Heading"), area("intro", "Introduction"),
      { key: "limit", label: "Maximum number (0 = all)", type: "number", min: 0, max: 60 }, { key: "showFilters", label: "Show category filter", type: "toggle" },
      area("emptyText", "Text when no photos are published (empty = hide the section)"), area("disclaimer", "Small print under the photos"), { key: "cta", label: "Button", type: "link" }],
    make: () => ({ ...base, id: newId("b"), type: "gallery", eyebrow: "Results", title: "Before & after", intro: "", limit: 4, showFilters: false, emptyText: "", disclaimer: "Individual results vary.", cta: { label: "", href: "" } }),
  },
  {
    type: "cta", label: "Call to action", description: "Short invitation with buttons, e.g. to book or call.",
    fields: [t("eyebrow", "Small text above the heading"), t("title", "Heading"), area("body", "Text"), { key: "primary", label: "Main button", type: "link" }, { key: "secondary", label: "Second button", type: "link" }, { key: "image", label: "Optional image", type: "image", altKey: "imageAlt" }],
    make: () => ({ ...base, tone: "charcoal", id: newId("b"), type: "cta", eyebrow: "", title: "Ready to book?", body: "", primary: { label: "Book an Appointment", href: "/book" }, secondary: { label: "", href: "" }, imageAlt: "" }),
  },
  {
    type: "contact", label: "Contact & map", description: "Address, phone, hours, map, social links and contact form.",
    fields: [t("eyebrow", "Small text above the heading"), t("title", "Heading"), area("intro", "Introduction"),
      { key: "showHours", label: "Show opening hours", type: "toggle" }, { key: "showMap", label: "Show Google map", type: "toggle" }, { key: "showSocial", label: "Show social links", type: "toggle" }, { key: "showForm", label: "Show contact form", type: "toggle" }, t("formTitle", "Form heading")],
    make: () => ({ ...base, id: newId("b"), type: "contact", eyebrow: "", title: "Visit us", intro: "", showHours: true, showMap: true, showSocial: true, showForm: false, formTitle: "Send us a message" }),
  },
  {
    type: "booking", label: "Appointment request form", description: "The booking form (settings under Booking & emails).",
    fields: [t("eyebrow", "Small text above the heading"), t("title", "Heading"), area("intro", "Introduction")],
    make: () => ({ ...base, id: newId("b"), type: "booking", eyebrow: "", title: "", intro: "" }),
  },
  {
    type: "faq", label: "Questions (FAQ)", description: "Expandable questions and answers.",
    fields: [t("eyebrow", "Small text above the heading"), t("title", "Heading"),
      { key: "items", label: "Questions", type: "repeater", itemLabel: "Question", fields: [t("q", "Question"), md("a", "Answer")], newItem: () => ({ id: newId("q"), q: "New question", a: "" }) }],
    make: () => ({ ...base, id: newId("b"), type: "faq", eyebrow: "", title: "Questions", items: [] }),
  },
  {
    type: "team", label: "Team", description: "Team members with photo, role and short bio. Only publish verified details.",
    fields: [t("eyebrow", "Small text above the heading"), t("title", "Heading"), area("intro", "Introduction"),
      { key: "members", label: "Team members", type: "repeater", itemLabel: "Member", fields: [t("name", "Name"), t("role", "Role / licence (as provided)"), area("bio", "Short bio"), { key: "photo", label: "Photo", type: "image" }], newItem: () => ({ id: newId("m"), name: "", role: "", bio: "" }) }],
    make: () => ({ ...base, id: newId("b"), type: "team", eyebrow: "", title: "Meet the team", intro: "", members: [] }),
  },
  {
    type: "imageBanner", label: "Image banner", description: "A full-width photo.",
    fields: [{ key: "image", label: "Image", type: "image", altKey: "imageAlt" }, t("caption", "Caption (optional)"),
      { key: "height", label: "Height", type: "select", options: [{ value: "short", label: "Short" }, { value: "medium", label: "Medium" }, { value: "tall", label: "Tall" }] }],
    make: () => ({ ...base, id: newId("b"), type: "imageBanner", imageAlt: "", caption: "", height: "medium" }),
  },
];

export const blockDef = (type: BlockType) => BLOCK_DEFS.find((d) => d.type === type)!;

/** Deep copy with fresh ids (for duplicating sections and pages). */
export function cloneBlock<T extends Block>(b: T): T {
  const copy = structuredClone(b) as T & { items?: { id: string }[]; members?: { id: string }[] };
  copy.id = newId("b");
  copy.items = copy.items?.map((i) => ({ ...i, id: newId("i") }));
  copy.members = copy.members?.map((m) => ({ ...m, id: newId("m") }));
  if (!copy.items) delete copy.items;
  if (!copy.members) delete copy.members;
  return copy;
}

export function blockSummary(b: Block): string {
  const r = b as unknown as Record<string, unknown>;
  return String(r.title || r.eyebrow || r.caption || "").slice(0, 70);
}
