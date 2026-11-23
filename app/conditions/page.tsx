import type { Metadata } from "next";
import { ConditionList } from "@/components/site/Lists";
import { PageHeader } from "@/components/site/PageHeader";
import { getConditionsList, getSite } from "@/lib/server/data";

export const revalidate = 60;
export const metadata: Metadata = { title: "Skin conditions", description: "Common skin and hair conditions: symptoms, causes and treatment options." };

export default async function ConditionsPage() {
  const [{ content }, conditions] = await Promise.all([getSite(), getConditionsList()]);
  const s = content.sections.conditions;
  return (
    <>
      <PageHeader eyebrow={s.eyebrow} title={s.title} intro={s.intro} crumbs={[{ href: "/conditions", label: "Skin conditions" }]} />
      <ConditionList initial={conditions} />
    </>
  );
}
