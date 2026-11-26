/**
 * Loads the starter content into Supabase.
 *   npm run db:seed            only fills what is missing (safe to re-run)
 *   npm run db:seed -- --force overwrites pages, treatments and settings with the starter content
 * Needs SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from "@supabase/supabase-js";
import { SEED } from "../lib/seed";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first (see .env.example).");
  process.exit(1);
}
const force = process.argv.includes("--force");
const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  for (const k of ["settings", "design", "navigation"] as const) {
    const { data } = await db.from("site_documents").select("key").eq("key", k).maybeSingle();
    if (data && !force) { console.log(`= ${k} exists, kept`); continue; }
    const { error } = await db.from("site_documents").upsert({ key: k, data: SEED[k] });
    if (error) throw error;
    console.log(`+ ${k}`);
  }
  for (const c of ["pages", "treatments"] as const) {
    for (const item of SEED[c]) {
      const { data } = await db.from("content_items").select("id").eq("collection", c).eq("id", item.id).maybeSingle();
      if (data && !force) continue;
      const { error } = await db.from("content_items").upsert({ collection: c, id: item.id, slug: item.slug, data: item, sort: item.order, published: item.published });
      if (error) throw error;
      console.log(`+ ${c}/${item.slug || "home"}`);
    }
  }
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
