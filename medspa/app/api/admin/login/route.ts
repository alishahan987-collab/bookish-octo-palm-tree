import type { NextRequest } from "next/server";
import { login } from "@/lib/server/auth";
import { ApiError, assertSameOrigin, clientIp, errorResponse, ok, rateLimit, readJson } from "@/lib/server/http";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    rateLimit(`login:${clientIp(req)}`, 10, 15 * 60_000);
    const { email, password } = await readJson<{ email?: string; password?: string }>(req, 5000);
    if (!email || !password) throw new ApiError(400, "Enter your email and password.");
    const r = await login(String(email), String(password));
    if (!r.ok) throw new ApiError(401, r.error);
    return ok({ user: r.user });
  } catch (e) {
    return errorResponse(e);
  }
}
