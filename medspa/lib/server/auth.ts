import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL, svc } from "../repo/supabase";

/**
 * Admin authentication.
 *   Supabase mode: Supabase Auth (email + password). Only users listed in the
 *     `staff` table can sign in. Tokens live in httpOnly, SameSite=Strict cookies
 *     and are refreshed on the server; they are never readable by page scripts.
 *   File mode (local development): ADMIN_EMAIL / ADMIN_PASSWORD from the
 *     environment, with an HMAC-signed session cookie.
 */

export interface AdminUser {
  id: string;
  email: string;
}

const AT = "ms_at";
const RT = "ms_rt";
const LOCAL = "ms_local";
const secure = process.env.NODE_ENV === "production" && !process.env.INSECURE_COOKIES;
const base = { httpOnly: true, sameSite: "strict" as const, secure, path: "/" };

const authClient = () =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

/* ------------------------------ local (file) mode ------------------------------ */

const devPassword = process.env.NODE_ENV !== "production" ? "medspa-admin" : "";
export const LOCAL_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@medspa.local").toLowerCase();
const LOCAL_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || devPassword;
const SECRET = process.env.ADMIN_SESSION_SECRET || randomBytes(32).toString("hex");
export const usingDevPassword = !isSupabaseConfigured && !process.env.ADMIN_PASSWORD;

const sign = (payload: string) => createHmac("sha256", SECRET).update(payload).digest("base64url");

function makeLocalToken(email: string) {
  const payload = Buffer.from(JSON.stringify({ sub: email, exp: Date.now() + 8 * 3600_000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readLocalToken(token: string | undefined): AdminUser | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { sub, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return exp > Date.now() ? { id: "local-admin", email: sub } : null;
  } catch {
    return null;
  }
}

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/* ------------------------------------ API ------------------------------------ */

export async function login(email: string, password: string): Promise<{ ok: true; user: AdminUser } | { ok: false; error: string }> {
  const jar = await cookies();
  email = email.trim().toLowerCase();
  if (!isSupabaseConfigured) {
    if (!LOCAL_ADMIN_PASSWORD) return { ok: false, error: "Admin login is not configured. Set ADMIN_PASSWORD or connect Supabase." };
    if (email !== LOCAL_ADMIN_EMAIL || !safeEqual(password, LOCAL_ADMIN_PASSWORD)) return { ok: false, error: "Incorrect email or password." };
    jar.set(LOCAL, makeLocalToken(email), { ...base, maxAge: 8 * 3600 });
    return { ok: true, user: { id: "local-admin", email } };
  }
  const { data, error } = await authClient().auth.signInWithPassword({ email, password });
  if (error || !data.session) return { ok: false, error: "Incorrect email or password." };
  const { data: staff } = await svc().from("staff").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!staff) return { ok: false, error: "This account does not have admin access." };
  setSessionCookies(jar, data.session.access_token, data.session.refresh_token, data.session.expires_in);
  return { ok: true, user: { id: data.user.id, email: data.user.email ?? email } };
}

function setSessionCookies(jar: Awaited<ReturnType<typeof cookies>>, at: string, rt: string, expiresIn: number) {
  jar.set(AT, at, { ...base, maxAge: Math.max(60, expiresIn) });
  jar.set(RT, rt, { ...base, maxAge: 30 * 24 * 3600 });
}

export async function logout() {
  const jar = await cookies();
  const at = jar.get(AT)?.value;
  if (isSupabaseConfigured && at) await svc().auth.admin.signOut(at).catch(() => undefined);
  for (const c of [AT, RT, LOCAL]) jar.delete(c);
}

/** Returns the signed-in admin, refreshing an expired Supabase session when possible. Route handlers only. */
export async function currentAdmin(): Promise<AdminUser | null> {
  const jar = await cookies();
  if (!isSupabaseConfigured) return readLocalToken(jar.get(LOCAL)?.value);

  const at = jar.get(AT)?.value;
  const rt = jar.get(RT)?.value;
  let user: { id: string; email?: string } | null = null;
  if (at) {
    const { data } = await svc().auth.getUser(at);
    user = data.user ?? null;
  }
  if (!user && rt) {
    const { data } = await authClient().auth.refreshSession({ refresh_token: rt });
    if (data.session && data.user) {
      setSessionCookies(jar, data.session.access_token, data.session.refresh_token, data.session.expires_in);
      user = data.user;
    }
  }
  if (!user) return null;
  const { data: staff } = await svc().from("staff").select("user_id").eq("user_id", user.id).maybeSingle();
  return staff ? { id: user.id, email: user.email ?? "" } : null;
}

export async function changePassword(current: string, next: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: "In local mode the password is set with ADMIN_PASSWORD in the environment." };
  if (next.length < 10) return { ok: false, error: "Use at least 10 characters." };
  const admin = await currentAdmin();
  if (!admin) return { ok: false, error: "Please sign in again." };
  const check = await authClient().auth.signInWithPassword({ email: admin.email, password: current });
  if (check.error) return { ok: false, error: "Your current password is incorrect." };
  const { error } = await svc().auth.admin.updateUserById(admin.id, { password: next });
  return error ? { ok: false, error: error.message } : { ok: true };
}
