import { NextResponse } from "next/server";
import { DataError } from "@/lib/data/source";
import { createBooking, rateLimited } from "@/lib/server/bookings";
import { errorResponse, noStore } from "@/lib/server/http";
import { isSupabaseMode } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/** Public: create an appointment request. Validated, rate-limited, race-safe (DB unique index). */
export async function POST(req: Request) {
  if (!isSupabaseMode) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not available in demo mode" } }, { status: 404 });
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (rateLimited(`book:${ip}`)) throw new DataError("RATE_LIMITED", "Too many booking attempts. Please try again later or contact the clinic.");
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") throw new DataError("VALIDATION", "Invalid request.");
    const result = await createBooking(body);
    return NextResponse.json(result, { status: 201, ...noStore });
  } catch (e) {
    return errorResponse(e);
  }
}
