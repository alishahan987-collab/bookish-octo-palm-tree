import type { Metadata } from "next";
import { ProcedureList } from "@/components/site/Lists";
import { PageHeader } from "@/components/site/PageHeader";
import { getProcedures } from "@/lib/server/data";

export const revalidate = 60;
export const metadata: Metadata = { title: "Treatments", description: "Facials, HydraFacial, Botox, fillers, Sculptra, laser hair removal and IV wellness therapy in Chino, California." };

export default async function TreatmentsPage() {
  const procedures = await getProcedures();
  return (
    <>
      <PageHeader eyebrow="The treatment menu" title="Treatments" intro="Facials, injectables, laser and wellness treatments, each personalized to you. Search or filter to find what you are looking for." crumbs={[{ href: "/treatments", label: "Treatments" }]} />
      <ProcedureList initial={procedures} />
    </>
  );
}
