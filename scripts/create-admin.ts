/**
 * Creates (or promotes) a staff login for the admin dashboard.
 *
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx tsx scripts/create-admin.ts doctor@clinic.com 'a-strong-password' [owner|admin|reception]
 */
import { createClient } from "@supabase/supabase-js";

const [email, password, role = "owner"] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || !email || !password) {
  console.error("Usage: npx tsx scripts/create-admin.ts <email> <password> [owner|admin|reception]");
  process.exit(1);
}
if (password.length < 10) {
  console.error("Use a password of at least 10 characters.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  let userId: string | undefined;
  const created = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) {
    const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
    userId = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
    if (!userId) throw created.error;
    await db.auth.admin.updateUserById(userId, { password });
    console.log("User existed: password updated.");
  } else {
    userId = created.data.user.id;
  }
  const { error } = await db.from("staff").upsert({ user_id: userId, role });
  if (error) throw error;
  console.log(`✓ ${email} can now sign in at /admin (role: ${role}).`);
})().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
