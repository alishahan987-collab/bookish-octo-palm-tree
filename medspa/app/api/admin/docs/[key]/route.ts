import { repo } from "@/lib/repo";
import { firstIssue, SCHEMAS } from "@/lib/schemas";
import { refreshSite, withAdmin } from "@/lib/server/admin";
import { ApiError, ok, readJson } from "@/lib/server/http";
import type { DocKey, Docs } from "@/lib/types";

const KEYS: DocKey[] = ["settings", "design", "navigation"];

export const PUT = withAdmin<{ key: string }>(async (req, _admin, { key }) => {
  if (!KEYS.includes(key as DocKey)) throw new ApiError(404, "Unknown document.");
  const body = await readJson<unknown>(req);
  const parsed = SCHEMAS[key as DocKey].safeParse(body);
  if (!parsed.success) throw new ApiError(400, firstIssue(parsed.error));
  await repo.putDoc(key as DocKey, parsed.data as unknown as Docs[DocKey]);
  refreshSite();
  return ok({ ok: true, data: await repo.getDoc(key as DocKey) });
});
