import { SEED_CONTENT, SEED_SETTINGS } from "./seed";
import type { ClinicSettings, HomeSection, SiteContent } from "./types";

/**
 * Stored content can come from an older version of the site (or be edited
 * by hand in the database). Merge it over the defaults so every field the
 * current code expects exists, without overwriting anything the clinic set.
 */
export function normalizeContent(stored: Partial<SiteContent> | null | undefined): SiteContent {
  const s = (stored ?? {}) as Partial<SiteContent> & Record<string, unknown>;
  const d = SEED_CONTENT;
  const obj = <K extends keyof SiteContent>(k: K) => ({ ...(d[k] as object), ...((s[k] as object) ?? {}) }) as SiteContent[K];
  const list = <K extends keyof SiteContent>(k: K) => (Array.isArray(s[k]) ? s[k] : d[k]) as SiteContent[K];
  const homeSections = (Array.isArray(s.homeSections) && s.homeSections.length ? s.homeSections : d.homeSections) as HomeSection[];
  const theme = { ...d.theme, ...((s.theme as object) ?? {}) } as SiteContent["theme"];
  // Older themes used a text-gold accent and other font keys; fall back to the brand defaults.
  if (!theme.taupe) Object.assign(theme, { ...d.theme });
  if (!["dmsans", "inter", "manrope"].includes(theme.bodyFont)) theme.bodyFont = d.theme.bodyFont;
  return {
    brand: obj("brand"),
    announcement: obj("announcement"),
    homeSections: homeSections.map((x) => ({ ...x, visible: x.visible !== false })),
    about: obj("about"),
    team: list("team"),
    testimonials: list("testimonials"),
    reviews: obj("reviews"),
    why: list("why"),
    faqs: list("faqs"),
    contact: obj("contact"),
    visitInfo: list("visitInfo"),
    social: obj("social"),
    theme,
    seo: obj("seo"),
    footer: obj("footer"),
    previewBanner: obj("previewBanner"),
    currency: typeof s.currency === "string" && s.currency ? s.currency : d.currency,
  };
}

export function normalizeSettings(stored: Partial<ClinicSettings> | null | undefined): ClinicSettings {
  return { ...SEED_SETTINGS, ...(stored ?? {}) };
}
