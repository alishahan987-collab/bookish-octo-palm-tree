import { adminAvailability } from "@/lib/server/appointments";
import { withAdmin } from "@/lib/server/admin";
import { ok } from "@/lib/server/http";

export const GET = withAdmin(async (req) => {
  const p = req.nextUrl.searchParams;
  return ok({
    days: await adminAvailability({
      treatmentId: p.get("treatment") ?? undefined,
      from: p.get("from") ?? undefined,
      days: Math.min(Number(p.get("days") ?? 31), 92),
      ignoreId: p.get("ignore") ?? undefined,
      durationMinutes: Number(p.get("duration") ?? 0) || undefined,
    }),
  });
});
