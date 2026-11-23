import type { Metadata } from "next";
import { ProcedureList } from "@/components/site/Lists";
import { PageHeader } from "@/components/site/PageHeader";
import { getProcedures, getSite } from "@/lib/server/data";

export const revalidate = 60;
export const metadata: Metadata = { title: "All treatments & procedures" };

export default async function TreatmentsPage() {
  const [{ content }, procedures] = await Promise.all([getSite(), getProcedures()]);
  const s = content.sections.procedures;
  return (
    <>
      <PageHeader eyebrow={s.eyebrow} title={s.title} intro={s.intro} crumbs={[{ href: "/treatments", label: "Treatments" }]} />
      <ProcedureList initial={procedures} />
    </>
  );
}
