import { NextResponse } from "next/server";
import { DataError } from "@/lib/data/source";
import type { BookingStatus } from "@/lib/data/types";
import { changeStatus, reschedule } from "@/lib/server/bookings";
import { errorResponse, noStore } from "@/lib/server/http";
import { isSupabaseMode } from "@/lib/supabase/config";
import { verifyStaff } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUSES: Exclude<BookingStatus, "pending">[] = ["confirmed", "rejected", "arrived", "completed", "cancelled"];

/** Staff only: change status or reschedule (and notify the patient). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseMode) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not available in demo mode" } }, { status: 404 });
  try {
    if (!(await verifyStaff(req.headers.get("authorization")))) throw new DataError("UNAUTHORIZED", "Please sign in again.");
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as { action?: string; note?: string; date?: string; time?: string };
    if (body.action === "reschedule") {
      if (!body.date || !body.time) throw new DataError("VALIDATION", "Choose a new date and time.");
      return NextResponse.json(await reschedule(id, body.date, body.time), noStore);
    }
    if (!STATUSES.includes(body.action as never)) throw new DataError("VALIDATION", "Unknown action.");
    return NextResponse.json(await changeStatus(id, body.action as Exclude<BookingStatus, "pending">, body.note), noStore);
  } catch (e) {
    return errorResponse(e);
  }
}
