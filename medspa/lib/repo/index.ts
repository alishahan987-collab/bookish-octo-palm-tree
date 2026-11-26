import "server-only";
import { SEED } from "../seed";
import type { CollectionName, DocKey, Docs } from "../types";
import { fileRepo } from "./file";
import { isSupabaseConfigured, supabaseRepo } from "./supabase";
import { RepoError, type Repo } from "./types";

/**
 * Storage selection:
 *   - Supabase when SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are set.
 *   - Otherwise the local file store, except on Vercel, where the file system is
 *     not persistent: there the site shows the starter content read-only and the
 *     admin explains that the database must be connected.
 */
const readOnly: Repo = new Proxy({} as Repo, {
  get(_t, prop) {
    if (prop === "mode") return "readonly";
    if (prop === "getDoc") return async (k: DocKey) => structuredClone(SEED[k] as Docs[DocKey]);
    if (prop === "list") return async (c: CollectionName) => structuredClone(SEED[c]);
    if (prop === "get") return async (c: CollectionName, id: string) => (SEED[c] as { id: string }[]).find((x) => x.id === id) ?? null;
    if (prop === "busy" || prop === "listAppointments" || prop === "listMessages" || prop === "listMedia") return async () => [];
    if (prop === "getAppointment") return async () => null;
    if (prop === "health") return async () => ({ ok: false, detail: "No database connected. Add the Supabase environment variables in Vercel." });
    return async () => {
      throw new RepoError("READ_ONLY", "The database is not connected yet, so changes cannot be saved. Add the Supabase settings (see README).");
    };
  },
});

export const repo: Repo = isSupabaseConfigured ? supabaseRepo : process.env.VERCEL ? readOnly : fileRepo;
export { RepoError } from "./types";
