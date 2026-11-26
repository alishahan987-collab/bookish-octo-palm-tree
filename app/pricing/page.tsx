import type { Metadata } from "next";
import { PricingView } from "@/components/site/Lists";
import { PageHeader } from "@/components/site/PageHeader";
import { getProcedures } from "@/lib/server/data";

export const revalidate = 60;
export const metadata: Metadata = { title: "Pricing", description: "Treatment pricing at VVIP Beauty & Skin Care, Chino, California." };

export default async function PricingPage() {
  const procedures = await getProcedures();
  return (
    <>
      <PageHeader eyebrow="Pricing" title="Clear, upfront pricing" intro="Where a price depends on your personalized plan, it is confirmed at your consultation, before any treatment begins." crumbs={[{ href: "/pricing", label: "Pricing" }]} />
      <PricingView initial={procedures} />
    </>
  );
}
