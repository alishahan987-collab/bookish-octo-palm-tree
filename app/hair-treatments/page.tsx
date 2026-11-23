import type { Metadata } from "next";
import { ProcedureList } from "@/components/site/Lists";
import { PageHeader } from "@/components/site/PageHeader";
import { getProcedures } from "@/lib/server/data";

export const revalidate = 60;
export const metadata: Metadata = { title: "Hair treatments", description: "Diagnosis-led care for thinning hair, hair fall and scalp conditions." };

export default async function Page() {
  const procedures = await getProcedures();
  return (
    <>
      <PageHeader eyebrow="Procedures" title="Hair treatments" intro="Diagnosis-led care for thinning hair, hair fall and scalp conditions." crumbs={[{ href: "/hair-treatments", label: "Hair treatments" }]} />
      <ProcedureList initial={procedures} category="hair" />
    </>
  );
}
