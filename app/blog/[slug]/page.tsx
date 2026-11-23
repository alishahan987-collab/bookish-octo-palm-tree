import type { Metadata } from "next";
import { PostDetail } from "@/components/site/Details";
import { getPublishedPosts } from "@/lib/server/data";

export const revalidate = 60;
export async function generateStaticParams() {
  return (await getPublishedPosts()).map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = (await getPublishedPosts()).find((x) => x.slug === slug);
  return { title: p?.title ?? "Article", description: p?.excerpt, openGraph: p ? { type: "article", images: p.cover ? [p.cover] : undefined } : undefined };
}
export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const posts = await getPublishedPosts();
  return <PostDetail slug={slug} initial={posts.find((p) => p.slug === slug) ?? null} related={posts} />;
}
