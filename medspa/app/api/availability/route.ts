import type { NextRequest } from "next/server";
import { publicAvailability } from "@/lib/server/appointments";
import { clientIp, errorResponse, ok, rateLimit } from "@/lib/server/http";

export async function GET(req: NextRequest) {
  try {
    rateLimit(`avail:${clientIp(req)}`, 120, 60_000);
    const id = req.nextUrl.searchParams.get("treatment") ?? "";
    return ok(await publicAvailability(id));
  } catch (e) {
    return errorResponse(e);
  }
}
