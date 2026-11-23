/**
 * Backend selection. When both public Supabase variables are set, the site
 * runs in production mode (database, auth, storage, real notifications).
 * Otherwise it runs as a self-contained demo in the visitor's browser.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const isSupabaseMode = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const MEDIA_BUCKET = "media";
