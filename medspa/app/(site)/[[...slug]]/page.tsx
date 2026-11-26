import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RenderBlocks } from "@/components/blocks/Blocks";
import { getPageBySlug, getSite } from "@/lib/server/content";

export const revalidate = 300;
export const dynamicParams = true;
export const generateStaticParams = async () => [];

type Props = { params: Promise<{ slug?: string[] }> };
const slugOf = (s?: string[]) => (s ?? []).join("/");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = slugOf((await params).slug);
  const [page, { settings }] = await Promise.all([getPageBySlug(slug), getSite()]);
  if (!page) return {};
  const title = page.seoTitle || page.title;
  return {
    title: slug === "" ? { absolute: title } : title,
    description: page.seoDescription || settings.seo.defaultDescription,
    alternates: { canonical: slug ? `/${slug}` : "/" },
    openGraph: { title, description: page.seoDescription || settings.seo.defaultDescription, url: slug ? `/${slug}` : "/", images: page.ogImage ? [page.ogImage] : settings.seo.ogImage ? [settings.seo.ogImage] : [] },
    ...(page.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CmsPage({ params }: Props) {
  const slug = slugOf((await params).slug);
  if (slug.includes("/")) notFound();
  const [page, { settings }] = await Promise.all([getPageBySlug(slug), getSite()]);
  if (!page) notFound();
  return <RenderBlocks blocks={page.blocks} settings={settings} />;
}
