import type { Metadata } from "next";
import { GalleryView } from "@/components/site/Lists";
import { PageHeader } from "@/components/site/PageHeader";
import { getProcedures, getPublicGallery } from "@/lib/server/data";

export const revalidate = 60;
export const metadata: Metadata = { title: "Before & after", description: "Client results, published only with written consent." };

export default async function BeforeAfterPage() {
  const [gallery, procedures] = await Promise.all([getPublicGallery(), getProcedures()]);
  return (
    <>
      <PageHeader eyebrow="Results" title="Before & after" intro="Real client results, published only with each client's written consent. Individual results vary." crumbs={[{ href: "/before-after", label: "Before & after" }]} />
      <GalleryView initial={gallery} treatments={procedures} />
    </>
  );
}
