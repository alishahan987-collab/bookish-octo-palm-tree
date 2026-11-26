import type { MetadataRoute } from "next";
import { repo } from "@/lib/repo";
import { siteUrl } from "@/lib/server/http";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = siteUrl();
  const [pages, treatments] = await Promise.all([repo.list("pages"), repo.list("treatments")]);
  return [
    ...pages.filter((p) => p.published && !p.noindex).map((p) => ({ url: p.slug ? `${url}/${p.slug}` : url, lastModified: p.updatedAt, priority: p.slug ? 0.7 : 1 })),
    ...treatments.filter((t) => t.published).map((t) => ({ url: `${url}/treatments/${t.slug}`, lastModified: t.updatedAt, priority: 0.8 })),
  ];
}
