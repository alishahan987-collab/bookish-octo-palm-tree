import { currentAdmin, LOCAL_ADMIN_EMAIL, usingDevPassword } from "@/lib/server/auth";
import { ok } from "@/lib/server/http";
import { repo } from "@/lib/repo";

export async function GET() {
  const user = await currentAdmin();
  return ok({ user, mode: repo.mode, devLogin: usingDevPassword ? { email: LOCAL_ADMIN_EMAIL, password: "medspa-admin" } : null });
}
