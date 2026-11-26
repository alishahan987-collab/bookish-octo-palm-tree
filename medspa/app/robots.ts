import type { MetadataRoute } from "next";
import { repo } from "@/lib/repo";
import { siteUrl } from "@/lib/server/http";

export const revalidate = 300;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await repo.getDoc("settings");
  if (!settings.seo.indexable) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }, sitemap: `${siteUrl()}/sitemap.xml` };
}
