import { NextResponse } from "next/server";
import { MAIN_DOCTOR_ID } from "@/lib/data/seed";
import { availability } from "@/lib/server/bookings";
import { errorResponse, noStore } from "@/lib/server/http";
import { isSupabaseMode } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/** Public: returns slot states only (never any patient information). */
export async function GET(req: Request) {
  if (!isSupabaseMode) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not available in demo mode" } }, { status: 404 });
  try {
    const url = new URL(req.url);
    const days = Number(url.searchParams.get("days")) || undefined;
    return NextResponse.json({ days: await availability(url.searchParams.get("doctor") || MAIN_DOCTOR_ID, { days }) }, noStore);
  } catch (e) {
    return errorResponse(e);
  }
}
