import type { Metadata } from "next";
import { ProcedureList } from "@/components/site/Lists";
import { PageHeader } from "@/components/site/PageHeader";
import { getProcedures } from "@/lib/server/data";

export const revalidate = 60;
export const metadata: Metadata = { title: "Skin treatments", description: "Medical and cosmetic treatments for healthy, clear, even-toned skin." };

export default async function Page() {
  const procedures = await getProcedures();
  return (
    <>
      <PageHeader eyebrow="Procedures" title="Skin treatments" intro="Medical and cosmetic treatments for healthy, clear, even-toned skin." crumbs={[{ href: "/skin-treatments", label: "Skin treatments" }]} />
      <ProcedureList initial={procedures} category="skin" />
    </>
  );
}
