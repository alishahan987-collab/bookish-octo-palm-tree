import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

const opts = { auth: { persistSession: false, autoRefreshToken: false } };

/** Anonymous server client: public reads under RLS (used for SSR/SEO). */
export function anonServerClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);
}

/** Privileged client for booking writes. Never exposed to the browser. */
export function serviceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  return createClient(SUPABASE_URL, key, opts);
}

/** Verifies a bearer token belongs to a staff member. Returns the user id or null. */
export async function verifyStaff(authHeader: string | null): Promise<string | null> {
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  const svc = serviceClient();
  const { data, error } = await svc.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: staff } = await svc.from("staff").select("user_id").eq("user_id", data.user.id).maybeSingle();
  return staff ? data.user.id : null;
}
