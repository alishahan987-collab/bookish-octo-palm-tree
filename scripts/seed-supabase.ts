/**
 * Loads the starter content (site text, settings, procedures, conditions,
 * articles, demo gallery) into Supabase. Safe to re-run: existing rows are
 * kept unless you pass --force.
 *
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-supabase.ts [--force]
 */
import { createClient } from "@supabase/supabase-js";
import { SEED_CONDITIONS, SEED_CONTENT, SEED_GALLERY, SEED_POSTS, SEED_SETTINGS, SEED_TREATMENTS } from "../lib/data/seed";
import { conditionToRow, galleryToRow, postToRow, treatmentToRow } from "../lib/supabase/mappers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const force = process.argv.includes("--force");
const db = createClient(url, key, { auth: { persistSession: false } });

async function upsert(table: string, rows: object[], conflict = "id") {
  const { error } = await db.from(table).upsert(rows, { onConflict: conflict, ignoreDuplicates: !force });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`✓ ${table} (${rows.length})`);
}

(async () => {
  await upsert("site_config", [
    { key: "content", data: { ...SEED_CONTENT, previewBanner: { ...SEED_CONTENT.previewBanner, enabled: false } } },
    { key: "settings", data: SEED_SETTINGS },
  ], "key");
  await upsert("procedures", SEED_TREATMENTS.map(treatmentToRow));
  await upsert("conditions", SEED_CONDITIONS.map(conditionToRow));
  await upsert("posts", SEED_POSTS.map(postToRow));
  await upsert("gallery", SEED_GALLERY.map(galleryToRow));
  console.log(force ? "Done (overwrote existing rows)." : "Done (existing rows were kept).");
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
