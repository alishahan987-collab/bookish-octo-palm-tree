import { repo } from "@/lib/repo";
import { refreshSite, withAdmin } from "@/lib/server/admin";
import { ApiError, ok, readJson } from "@/lib/server/http";
import type { CollectionName } from "@/lib/types";

const COLLECTIONS: CollectionName[] = ["pages", "treatments", "testimonials", "gallery"];

export const POST = withAdmin<{ collection: string }>(async (req, _admin, { collection }) => {
  if (!COLLECTIONS.includes(collection as CollectionName)) throw new ApiError(404, "Unknown collection.");
  const { ids } = await readJson<{ ids?: unknown }>(req);
  if (!Array.isArray(ids) || ids.length > 500 || !ids.every((x) => typeof x === "string")) throw new ApiError(400, "Invalid order.");
  await repo.reorder(collection as CollectionName, ids as string[]);
  refreshSite();
  return ok({ ok: true });
});
