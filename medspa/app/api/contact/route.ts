import type { NextRequest } from "next/server";
import { submitContact } from "@/lib/server/contact";
import { assertSameOrigin, clientIp, errorResponse, ok, rateLimit, readJson, siteUrl } from "@/lib/server/http";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    rateLimit(`contact:${clientIp(req)}`, 5, 15 * 60_000);
    const b = await readJson<Record<string, unknown>>(req, 20_000);
    const s = (k: string) => String(b[k] ?? "");
    return ok(await submitContact({ name: s("name"), email: s("email"), phone: s("phone"), subject: s("subject"), message: s("message"), website: s("website") }, `${siteUrl(req)}/admin/messages`), 201);
  } catch (e) {
    return errorResponse(e);
  }
}
