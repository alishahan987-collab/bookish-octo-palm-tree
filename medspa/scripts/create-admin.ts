/**
 * Creates an admin login (or resets its password) and grants staff access.
 *   npm run create-admin -- owner@example.com 'a-long-password' [owner|admin|staff]
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [email, password, role = "owner"] = process.argv.slice(2);
if (!url || !key) { console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first."); process.exit(1); }
if (!email || !password || password.length < 10) { console.error("Usage: npm run create-admin -- email 'password-of-10+-characters' [owner|admin|staff]"); process.exit(1); }

const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  let userId: string | undefined;
  const { data: created, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (created?.user) userId = created.user.id;
  else if (error && /already/i.test(error.message)) {
    for (let page = 1; !userId && page < 50; page++) {
      const { data } = await db.auth.admin.listUsers({ page, perPage: 200 });
      const u = data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
      if (u) userId = u.id;
      if (!data.users.length) break;
    }
    if (userId) await db.auth.admin.updateUserById(userId, { password });
  } else if (error) throw error;
  if (!userId) throw new Error("Could not create or find the user.");
  const { error: sErr } = await db.from("staff").upsert({ user_id: userId, role });
  if (sErr) throw sErr;
  console.log(`Admin ready: ${email} (${role})`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
