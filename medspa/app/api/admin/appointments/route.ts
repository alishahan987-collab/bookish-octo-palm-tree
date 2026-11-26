import { addDays, spaNow, toISODate } from "@/lib/dates";
import { repo } from "@/lib/repo";
import { adminCreate } from "@/lib/server/appointments";
import { withAdmin } from "@/lib/server/admin";
import { ok, readJson } from "@/lib/server/http";
import type { AppointmentStatus } from "@/lib/types";

/** ?view=pending|upcoming|today|past|all */
export const GET = withAdmin(async (req) => {
  const view = req.nextUrl.searchParams.get("view") ?? "upcoming";
  const today = toISODate(spaNow());
  const q: { from?: string; to?: string; status?: AppointmentStatus[] } = {};
  if (view === "pending") q.status = ["pending"];
  if (view === "upcoming") { q.from = today; q.status = ["pending", "approved"]; }
  if (view === "today") { q.from = today; q.to = today; }
  if (view === "past") { q.to = addDays(today, -1); }
  let list = await repo.listAppointments(q);
  if (view === "past" || view === "all") list = list.reverse();
  return ok({ appointments: list.slice(0, 500), today });
});

export const POST = withAdmin(async (req, admin) => {
  const b = await readJson<Record<string, unknown>>(req, 20_000);
  const s = (k: string) => String(b[k] ?? "");
  const a = await adminCreate(
    { treatmentId: s("treatmentId"), date: s("date"), time: s("time"), name: s("name"), email: s("email"), phone: s("phone"), message: s("message"), status: b.status === "pending" ? "pending" : "approved", notify: b.notify === true },
    admin.email,
  );
  return ok({ appointment: a }, 201);
});
