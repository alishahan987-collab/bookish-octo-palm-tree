import { adminUpdate, type AdminAction } from "@/lib/server/appointments";
import { withAdmin } from "@/lib/server/admin";
import { ok, readJson } from "@/lib/server/http";

export const PATCH = withAdmin<{ id: string }>(async (req, admin, { id }) => {
  const body = await readJson<AdminAction>(req, 20_000);
  return ok({ appointment: await adminUpdate(id, body, admin.email) });
});
