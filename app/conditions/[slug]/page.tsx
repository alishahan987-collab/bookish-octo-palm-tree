import type { Metadata } from "next";
import { ConditionDetail } from "@/components/site/Details";
import { getConditionsList, getProcedures } from "@/lib/server/data";

export const revalidate = 60;
export async function generateStaticParams() {
  return (await getConditionsList()).map((c) => ({ slug: c.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = (await getConditionsList()).find((x) => x.slug === slug);
  return { title: c ? `${c.name}: symptoms, causes & treatment` : "Skin condition", description: c?.summary, openGraph: c?.image ? { images: [c.image] } : undefined };
}
export default async function ConditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [conditions, treatments] = await Promise.all([getConditionsList(), getProcedures()]);
  return <ConditionDetail slug={slug} initial={conditions.find((c) => c.slug === slug) ?? null} initialTreatments={treatments} initialConditions={conditions} />;
}
