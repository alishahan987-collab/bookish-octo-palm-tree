import type { NextRequest } from "next/server";
import { createRequest } from "@/lib/server/appointments";
import { assertSameOrigin, clientIp, errorResponse, ok, rateLimit, readJson, siteUrl } from "@/lib/server/http";
import type { AppointmentRequest } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    rateLimit(`appt:${clientIp(req)}`, Number(process.env.BOOKING_RATE_LIMIT ?? 5), 15 * 60_000);
    const body = await readJson<AppointmentRequest>(req, 20_000);
    const result = await createRequest(
      {
        treatmentId: String(body.treatmentId ?? ""), date: String(body.date ?? ""), time: String(body.time ?? ""),
        name: String(body.name ?? ""), email: String(body.email ?? ""), phone: String(body.phone ?? ""),
        message: String(body.message ?? ""), consent: body.consent === true, website: String(body.website ?? ""),
      },
      `${siteUrl(req)}/admin/appointments`,
    );
    return ok(result, 201);
  } catch (e) {
    return errorResponse(e);
  }
}
