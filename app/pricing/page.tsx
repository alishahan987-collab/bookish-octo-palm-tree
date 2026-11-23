import type { Metadata } from "next";
import { PricingView } from "@/components/site/Lists";
import { PageHeader } from "@/components/site/PageHeader";
import { getProcedures, getSite } from "@/lib/server/data";

export const revalidate = 60;
export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  const [{ content }, procedures] = await Promise.all([getSite(), getProcedures()]);
  const s = content.sections.pricing;
  return (
    <>
      <PageHeader eyebrow={s.eyebrow} title={s.title} intro={s.intro} crumbs={[{ href: "/pricing", label: "Pricing" }]} />
      <PricingView initial={procedures} />
    </>
  );
}
