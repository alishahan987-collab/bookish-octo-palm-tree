import "server-only";
import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { currentAdmin, type AdminUser } from "./auth";
import { ApiError, assertSameOrigin, errorResponse } from "./http";

type Ctx<P> = { params: Promise<P> };

/** Wraps an admin route: same-origin check for writes, signed-in staff required. */
export function withAdmin<P = Record<string, never>>(fn: (req: NextRequest, admin: AdminUser, params: P) => Promise<Response>) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      if (req.method !== "GET") assertSameOrigin(req);
      const admin = await currentAdmin();
      if (!admin) throw new ApiError(401, "Your session has ended. Please sign in again.");
      return await fn(req, admin, (await ctx.params) ?? ({} as P));
    } catch (e) {
      return errorResponse(e);
    }
  };
}

/** Public pages are cached; refresh them after any content change. */
export function refreshSite() {
  revalidatePath("/", "layout");
}
