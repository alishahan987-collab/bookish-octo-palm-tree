import { safeHref } from "./validation";
import type { NavItem, Page, Settings, Treatment } from "./types";

export const pageHref = (p: Pick<Page, "slug">) => (p.slug ? `/${p.slug}` : "/");

/** Booking links follow the booking mode chosen in the admin (website form or Booksy). */
export function resolveHref(href: string, settings: Settings): string {
  const safe = safeHref(href);
  if ((safe === "/book" || safe.startsWith("/book?")) && settings.booking.mode === "booksy" && settings.booking.booksyUrl) {
    return settings.booking.booksyUrl;
  }
  return safe;
}

export function bookHref(settings: Settings, t?: Pick<Treatment, "slug" | "booksyUrl">): string {
  if (settings.booking.mode === "booksy") return t?.booksyUrl || settings.booking.booksyUrl || "/book";
  return t ? `/book?treatment=${encodeURIComponent(t.slug)}` : "/book";
}

export interface ResolvedLink {
  id: string;
  label: string;
  href: string;
  newTab: boolean;
}

export function resolveNav(items: NavItem[], pages: Pick<Page, "id" | "slug" | "published">[], settings: Settings): ResolvedLink[] {
  const out: ResolvedLink[] = [];
  for (const it of items) {
    if (it.hidden) continue;
    let href = "";
    if (it.kind === "page") {
      const p = pages.find((x) => x.id === it.pageId);
      if (!p || !p.published) continue;
      href = resolveHref(pageHref(p), settings);
    } else href = resolveHref(it.href ?? "", settings);
    if (!href) continue;
    out.push({ id: it.id, label: it.label, href, newTab: Boolean(it.newTab) || /^https?:/i.test(href) });
  }
  return out;
}

export function fillTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (k in vars ? vars[k] : m));
}

export function fullAddress(s: Settings["business"]): string {
  return [`${s.street}${s.suite ? `, ${s.suite}` : ""}`, `${s.city}, ${s.state} ${s.zip}`].filter(Boolean).join(", ");
}
