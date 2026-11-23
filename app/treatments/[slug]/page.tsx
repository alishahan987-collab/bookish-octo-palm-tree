import type { Metadata } from "next";
import { TreatmentDetail } from "@/components/treatments/TreatmentDetail";
import { getTreatmentBySlug, getTreatments } from "@/lib/data";
import { SEED_TREATMENTS } from "@/lib/data/seed";

export function generateStaticParams() {
  return SEED_TREATMENTS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTreatmentBySlug(slug);
  return { title: t?.name ?? "Treatment", description: t?.shortDescription };
}

export default async function TreatmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Treatments added in the demo admin exist only in the browser, so an unknown
  // slug is resolved client-side rather than returning a server 404.
  const [initial, all] = await Promise.all([getTreatmentBySlug(slug), getTreatments()]);
  return <TreatmentDetail slug={slug} initial={initial} initialAll={all} />;
}
