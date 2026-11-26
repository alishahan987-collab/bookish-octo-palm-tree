import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { RepoError } from "../repo/types";

export class ApiError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

const REPO_STATUS: Record<RepoError["code"], number> = {
  SLOT_TAKEN: 409, NOT_FOUND: 404, CONFLICT: 409, DUPLICATE_SLUG: 409, READ_ONLY: 503, CONSENT_REQUIRED: 400, STORAGE: 500,
};

export function errorResponse(e: unknown) {
  if (e instanceof ApiError) return NextResponse.json({ error: e.message, fields: e.fields }, { status: e.status, headers: noStore });
  if (e instanceof RepoError) return NextResponse.json({ error: e.message, code: e.code }, { status: REPO_STATUS[e.code], headers: noStore });
  console.error(e);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500, headers: noStore });
}

export const noStore = { "Cache-Control": "no-store" };
export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: noStore });

export function clientIp(req: NextRequest): string {
  return req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

/** Rejects cross-site form posts (defence in depth on top of SameSite cookies). */
export function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  try {
    if (new URL(origin).host !== host) throw new ApiError(403, "Cross-site request blocked.");
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(403, "Cross-site request blocked.");
  }
}

export async function readJson<T>(req: NextRequest, maxBytes = 2_000_000): Promise<T> {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > maxBytes) throw new ApiError(413, "Request is too large.");
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "Invalid request.");
  }
}

/* Simple per-instance rate limiter. For high traffic add Vercel Firewall rules. */
const hits = new Map<string, number[]>();
export function rateLimit(key: string, limit: number, windowMs: number) {
  if (process.env.DISABLE_RATE_LIMIT === "1") return;
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 10_000) hits.clear();
  if (list.length > limit) throw new ApiError(429, "Too many attempts. Please wait a few minutes or call us.");
}

export function siteUrl(req?: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  if (env) return env.replace(/\/$/, "");
  if (req) return req.nextUrl.origin;
  return "http://localhost:3000";
}
