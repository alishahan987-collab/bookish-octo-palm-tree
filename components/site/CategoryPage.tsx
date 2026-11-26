import type { Metadata } from "next";
import { CATEGORIES } from "@/lib/categories";
import type { CategoryId } from "@/lib/data/types";
import { getProcedures } from "@/lib/server/data";
import { ProcedureList } from "./Lists";
import { PageHeader } from "./PageHeader";

/** Shared server page for the four treatment groups (/skin-care, /injectables, /laser, /wellness). */
export function categoryMetadata(id: CategoryId): Metadata {
  return { title: CATEGORIES[id].label, description: CATEGORIES[id].intro };
}

export async function CategoryPage({ id }: { id: CategoryId }) {
  const procedures = await getProcedures();
  const c = CATEGORIES[id];
  return (
    <>
      <PageHeader eyebrow="Treatments" title={c.label} intro={c.intro} crumbs={[{ href: "/treatments", label: "Treatments" }, { href: c.href, label: c.label }]} />
      <ProcedureList initial={procedures} category={id} />
    </>
  );
}
