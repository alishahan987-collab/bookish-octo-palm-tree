import { repo } from "@/lib/repo";
import { firstIssue, RESERVED_SLUGS, SCHEMAS } from "@/lib/schemas";
import { refreshSite, withAdmin } from "@/lib/server/admin";
import { ApiError, ok, readJson } from "@/lib/server/http";
import type { CollectionName, Collections, Page } from "@/lib/types";

const COLLECTIONS: CollectionName[] = ["pages", "treatments", "testimonials", "gallery"];

/** Create or update one item. */
export const POST = withAdmin<{ collection: string }>(async (req, _admin, { collection }) => {
  if (!COLLECTIONS.includes(collection as CollectionName)) throw new ApiError(404, "Unknown collection.");
  const c = collection as CollectionName;
  const body = await readJson<Record<string, unknown>>(req);
  const parsed = SCHEMAS[c].safeParse({ ...body, updatedAt: new Date().toISOString(), order: Number(body.order ?? 0) });
  if (!parsed.success) throw new ApiError(400, firstIssue(parsed.error));
  const item = parsed.data as unknown as Collections[typeof c];

  if (c === "pages") {
    const page = item as Page;
    const existing = await repo.get("pages", page.id);
    if (existing?.system) {
      // System pages keep their role; the homepage keeps its address and stays published.
      page.system = existing.system;
      if (existing.system === "home") {
        page.slug = "";
        page.published = true;
      }
    } else {
      delete page.system;
      if (!page.slug) throw new ApiError(400, "Only the homepage can have an empty web address. Add a slug, e.g. our-story.");
    }
    if (page.slug && RESERVED_SLUGS.includes(page.slug)) throw new ApiError(400, `"${page.slug}" is reserved. Please choose another web address.`);
  }

  const saved = await repo.put(c, item);
  refreshSite();
  return ok({ item: saved });
});
