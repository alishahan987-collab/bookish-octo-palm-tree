import { expect, test } from "@playwright/test";

/** Database-level security checks. Run only against a real Supabase (LIVE=1). */
test.skip(process.env.LIVE !== "1", "Supabase only");

const URL = process.env.SUPABASE_URL!;
const ANON = process.env.SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const rest = (path: string, key: string, init: RequestInit = {}) =>
  fetch(`${URL}/rest/v1/${path}`, { ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers ?? {}) } });

test("anonymous visitors cannot read or write customer data", async () => {
  const appts = await rest("appointments?select=*", ANON);
  expect(await appts.json()).toEqual([]);
  const msgs = await rest("contact_messages?select=*", ANON);
  expect(await msgs.json()).toEqual([]);
  const ins = await rest("appointments", ANON, { method: "POST", body: JSON.stringify({ reference: "X", treatment_id: "t", treatment_name: "t", date: "2030-01-01", time: "10:00", duration_minutes: 30, name: "Hack", email: "h@x.com", phone: "1" }) });
  expect(ins.status).toBeGreaterThanOrEqual(400);
  const rpc = await rest("rpc/book_appointment", ANON, { method: "POST", body: JSON.stringify({ p: {}, p_capacity: 1 }) });
  expect(rpc.status).toBeGreaterThanOrEqual(400);
});

test("anonymous visitors can read published content only, never write it", async () => {
  const pages = await (await rest("content_items?collection=eq.pages&select=id,published", ANON)).json();
  expect(pages.length).toBeGreaterThan(5);
  expect(pages.every((p: { published: boolean }) => p.published)).toBe(true);
  const write = await rest("content_items", ANON, { method: "POST", body: JSON.stringify({ collection: "pages", id: "evil", slug: "evil", data: {}, published: true }) });
  expect(write.status).toBeGreaterThanOrEqual(400);
  const upd = await rest("site_documents?key=eq.settings", ANON, { method: "PATCH", body: JSON.stringify({ data: {} }) });
  expect(await upd.json()).toEqual([]);
});

test("anonymous uploads to the media bucket are refused", async () => {
  const r = await fetch(`${URL}/storage/v1/object/media/uploads/evil.png`, { method: "POST", headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "image/png" }, body: new Uint8Array([137, 80, 78, 71]) });
  expect(r.status).toBeGreaterThanOrEqual(400);
});

test("the database itself refuses unconsented gallery photos and bad slugs", async () => {
  const g = await rest("content_items", SERVICE, { method: "POST", body: JSON.stringify({ collection: "gallery", id: "g_x", data: { consentConfirmed: false }, published: true }) });
  expect(g.status).toBe(400);
  expect((await g.json()).message).toContain("gallery_consent_required");
  const s = await rest("content_items", SERVICE, { method: "POST", body: JSON.stringify({ collection: "pages", id: "p_x", slug: "Bad Slug!", data: {}, published: false }) });
  expect(s.status).toBe(400);
});

test("database lock prevents overlapping bookings even when called directly", async () => {
  const row = (ref: string, time: string, dur: number) => ({ reference: ref, treatment_id: "t_laser", treatment_name: "Laser", date: "2030-06-03", time, duration_minutes: dur, name: "Lock Test", email: "l@x.com", phone: "+13055550100" });
  const calls = await Promise.all([0, 1, 2, 3, 4, 5].map((i) => rest("rpc/book_appointment", SERVICE, { method: "POST", body: JSON.stringify({ p: row(`MS-LOCK${i}`, i % 2 ? "10:30" : "10:00", 60), p_capacity: 1 }) })));
  expect(calls.filter((c) => c.status === 200)).toHaveLength(1);
  // a non-overlapping slot is still fine
  const later = await rest("rpc/book_appointment", SERVICE, { method: "POST", body: JSON.stringify({ p: row("MS-LOCK9", "11:00", 30), p_capacity: 1 }) });
  expect(later.status).toBe(200);
});
