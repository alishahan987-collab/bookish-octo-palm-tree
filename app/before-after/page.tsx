import type { Metadata } from "next";
import { GalleryView } from "@/components/site/Lists";
import { PageHeader } from "@/components/site/PageHeader";
import { getProcedures, getPublicGallery, getSite } from "@/lib/server/data";

export const revalidate = 60;
export const metadata: Metadata = { title: "Before & after gallery" };

export default async function BeforeAfterPage() {
  const [{ content }, gallery, procedures] = await Promise.all([getSite(), getPublicGallery(), getProcedures()]);
  const s = content.sections.beforeAfter;
  return (
    <>
      <PageHeader eyebrow={s.eyebrow} title={s.title} intro={s.intro} crumbs={[{ href: "/before-after", label: "Before & after" }]} />
      <GalleryView initial={gallery} treatments={procedures} />
    </>
  );
}
