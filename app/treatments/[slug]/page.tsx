import type { Metadata } from "next";
import { TreatmentDetail } from "@/components/site/Details";
import { getProcedures } from "@/lib/server/data";

export const revalidate = 60;
export async function generateStaticParams() {
  return (await getProcedures()).map((t) => ({ slug: t.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = (await getProcedures()).find((x) => x.slug === slug);
  return { title: t?.name ?? "Treatment", description: t?.shortDescription, openGraph: t?.image ? { images: [t.image] } : undefined };
}
// Procedures added in the demo admin exist only in that browser, so unknown slugs resolve client-side.
export default async function TreatmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const all = await getProcedures();
  return <TreatmentDetail slug={slug} initial={all.find((t) => t.slug === slug) ?? null} initialAll={all} />;
}
