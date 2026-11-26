import { repo } from "@/lib/repo";
import { withAdmin } from "@/lib/server/admin";
import { ApiError, ok, readJson } from "@/lib/server/http";

export const PATCH = withAdmin<{ id: string }>(async (req, _a, { id }) => {
  const { status } = await readJson<{ status?: string }>(req, 2000);
  if (!["new", "read", "archived"].includes(String(status))) throw new ApiError(400, "Invalid status.");
  return ok({ message: await repo.updateMessage(id, { status: status as "new" | "read" | "archived" }) });
});

export const DELETE = withAdmin<{ id: string }>(async (_req, _a, { id }) => {
  await repo.deleteMessage(id);
  return ok({ ok: true });
});
