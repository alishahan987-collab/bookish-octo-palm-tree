import { changePassword } from "@/lib/server/auth";
import { withAdmin } from "@/lib/server/admin";
import { ApiError, ok, readJson } from "@/lib/server/http";

export const POST = withAdmin(async (req) => {
  const { current, next } = await readJson<{ current?: string; next?: string }>(req, 5000);
  const r = await changePassword(String(current ?? ""), String(next ?? ""));
  if (!r.ok) throw new ApiError(400, r.error ?? "Could not change the password.");
  return ok({ ok: true });
});
