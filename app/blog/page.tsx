import type { Metadata } from "next";
import { BlogList } from "@/components/site/Lists";
import { PageHeader } from "@/components/site/PageHeader";
import { getPublishedPosts } from "@/lib/server/data";

export const revalidate = 60;
export const metadata: Metadata = { title: "Journal", description: "Skincare guidance and treatment explainers." };

export default async function BlogPage() {
  const posts = await getPublishedPosts();
  return (
    <>
      <PageHeader eyebrow="Skincare education" title="The journal" intro="Practical skincare guidance and clear explanations of the treatments we offer." crumbs={[{ href: "/blog", label: "Journal" }]} />
      <BlogList initial={posts} />
    </>
  );
}
