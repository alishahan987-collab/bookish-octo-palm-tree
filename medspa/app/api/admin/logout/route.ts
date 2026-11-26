import { logout } from "@/lib/server/auth";
import { ok } from "@/lib/server/http";

export async function POST() {
  await logout();
  return ok({ ok: true });
}
