import "server-only";
import { cache } from "react";
import { repo } from "../repo";
import type { Page } from "../types";

/** Public, read-only content for server rendering. `cache` de-duplicates calls within one request. */

export const getSite = cache(async () => {
  const [settings, design, navigation, pages] = await Promise.all([repo.getDoc("settings"), repo.getDoc("design"), repo.getDoc("navigation"), repo.list("pages")]);
  const navPages = pages.map(({ id, slug, published, title }) => ({ id, slug, published, title }));
  return { settings, design, navigation, pages: navPages };
});

export const getPageBySlug = cache(async (slug: string): Promise<Page | null> => {
  const pages = await repo.list("pages");
  return pages.find((p) => p.slug === slug && p.published) ?? null;
});

export const getPublicTreatments = cache(async () => (await repo.list("treatments")).filter((t) => t.published));

export const getPublicTestimonials = cache(async () =>
  (await repo.list("testimonials")).filter((t) => t.published && t.permissionConfirmed && t.text.trim()),
);

export const getPublicGallery = cache(async () =>
  (await repo.list("gallery")).filter((g) => g.published && g.consentConfirmed && g.before && g.after),
);
