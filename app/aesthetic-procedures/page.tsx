import type { Metadata } from "next";
import { ProcedureList } from "@/components/site/Lists";
import { PageHeader } from "@/components/site/PageHeader";
import { getProcedures } from "@/lib/server/data";

export const revalidate = 60;
export const metadata: Metadata = { title: "Aesthetic procedures", description: "Natural-looking aesthetic treatments, planned carefully and performed by a doctor." };

export default async function Page() {
  const procedures = await getProcedures();
  return (
    <>
      <PageHeader eyebrow="Procedures" title="Aesthetic procedures" intro="Natural-looking aesthetic treatments, planned carefully and performed by a doctor." crumbs={[{ href: "/aesthetic-procedures", label: "Aesthetic procedures" }]} />
      <ProcedureList initial={procedures} category="aesthetic" />
    </>
  );
}
