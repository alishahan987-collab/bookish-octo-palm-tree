import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "@/components/site/Lists";
import { PageHeader } from "@/components/site/PageHeader";
import { getConditionsList, getProcedures, getPublishedPosts } from "@/lib/server/data";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default async function SearchPage() {
  const [treatments, conditions, posts] = await Promise.all([getProcedures(), getConditionsList(), getPublishedPosts()]);
  return (
    <>
      <PageHeader eyebrow="Search" title="Search the website" crumbs={[{ href: "/search", label: "Search" }]} />
      <Suspense fallback={<div className="h-64" />}>
        <SearchView initial={{ treatments, conditions, posts }} />
      </Suspense>
    </>
  );
}
