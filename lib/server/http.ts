import "server-only";
import { NextResponse } from "next/server";
import { DataError } from "../data/source";

const STATUS: Record<string, number> = {
  VALIDATION: 400, DAY_CLOSED: 409, SLOT_UNAVAILABLE: 409, INVALID_TRANSITION: 409, NOT_FOUND: 404, UNAUTHORIZED: 401, RATE_LIMITED: 429, SERVER: 500,
};

export function errorResponse(e: unknown) {
  if (e instanceof DataError) return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: STATUS[e.code] ?? 400 });
  console.error(e);
  return NextResponse.json({ error: { code: "SERVER", message: "Something went wrong. Please try again." } }, { status: 500 });
}

export const noStore = { headers: { "Cache-Control": "no-store" } };
