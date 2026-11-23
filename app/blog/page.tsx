import type { Metadata } from "next";
import { BlogList } from "@/components/site/Lists";
import { PageHeader } from "@/components/site/PageHeader";
import { getPublishedPosts, getSite } from "@/lib/server/data";

export const revalidate = 60;
export const metadata: Metadata = { title: "Skincare education & blog" };

export default async function BlogPage() {
  const [{ content }, posts] = await Promise.all([getSite(), getPublishedPosts()]);
  const s = content.sections.blog;
  return (
    <>
      <PageHeader eyebrow={s.eyebrow} title={s.title} intro={s.intro} crumbs={[{ href: "/blog", label: "Journal" }]} />
      <BlogList initial={posts} />
    </>
  );
}
