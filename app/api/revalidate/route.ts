import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isSupabaseMode } from "@/lib/supabase/config";
import { verifyStaff } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Staff only: refresh server-rendered pages after content changes. */
export async function POST(req: Request) {
  if (!isSupabaseMode) return NextResponse.json({ ok: false }, { status: 404 });
  if (!(await verifyStaff(req.headers.get("authorization")))) return NextResponse.json({ ok: false }, { status: 401 });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
