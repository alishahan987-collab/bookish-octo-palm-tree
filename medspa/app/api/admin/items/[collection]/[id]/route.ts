import { repo } from "@/lib/repo";
import { refreshSite, withAdmin } from "@/lib/server/admin";
import { ApiError, ok } from "@/lib/server/http";
import type { CollectionName } from "@/lib/types";

const COLLECTIONS: CollectionName[] = ["pages", "treatments", "testimonials", "gallery"];

export const DELETE = withAdmin<{ collection: string; id: string }>(async (_req, _admin, { collection, id }) => {
  if (!COLLECTIONS.includes(collection as CollectionName)) throw new ApiError(404, "Unknown collection.");
  if (collection === "pages") {
    const page = await repo.get("pages", id);
    if (page?.system) throw new ApiError(400, `"${page.title}" is a required page. You can hide it, but not delete it.`);
    // Remove menu links that pointed to this page.
    const nav = await repo.getDoc("navigation");
    const keep = <T extends { pageId?: string; kind: string }>(items: T[]) => items.filter((i) => !(i.kind === "page" && i.pageId === id));
    await repo.putDoc("navigation", { header: keep(nav.header), footer: nav.footer.map((c) => ({ ...c, items: keep(c.items) })), legal: keep(nav.legal) });
  }
  await repo.remove(collection as CollectionName, id);
  refreshSite();
  return ok({ ok: true });
});
