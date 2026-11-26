import type { Metadata } from "next";
import { ConditionList } from "@/components/site/Lists";
import { PageHeader } from "@/components/site/PageHeader";
import { getConditionsList } from "@/lib/server/data";

export const revalidate = 60;
export const metadata: Metadata = { title: "Skin concerns", description: "Common skin concerns, what causes them and the treatments that may help." };

export default async function ConditionsPage() {
  const conditions = await getConditionsList();
  return (
    <>
      <PageHeader eyebrow="Shop by concern" title="Skin concerns" intro="Start with what you would like to change. Each page explains the concern, its common causes and the treatments that may help." crumbs={[{ href: "/conditions", label: "Skin concerns" }]} />
      <ConditionList initial={conditions} />
    </>
  );
}
