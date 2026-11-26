import { uid } from "../id";
import { getBrowserSupabase } from "../supabase/browser";
import { MEDIA_BUCKET } from "../supabase/config";
import {
  conditionToRow,
  galleryToRow,
  journeyToRow,
  postToRow,
  rowToBooking,
  rowToCondition,
  rowToGallery,
  rowToJourney,
  rowToPost,
  rowToTreatment,
  treatmentToRow,
  type BookingRow,
} from "../supabase/mappers";
import { todayISO } from "../dates";
import { clinicNow } from "../tz";
import { assertSettings, assertTreatment, uniqueSlug } from "./rules";
import { SEED_CONTENT, SEED_SETTINGS } from "./seed";
import { DataError, type DataErrorCode, type DataSource } from "./source";
import { normalizeContent } from "./content";
import type { BookingResult, ClinicSettings, Condition, GalleryItem, Journey, Post, SiteContent, Treatment } from "./types";

/**
 * Production DataSource (browser side).
 *   - Public content: read directly under RLS with the anon key.
 *   - Admin content edits: written with the signed-in staff session (RLS enforces staff-only).
 *   - Availability and all booking writes: through the server API (service role + notifications).
 */

type Listener = () => void;
const listeners = new Set<Listener>();
export const subscribeSupabase = (l: Listener) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const changed = () => {
  listeners.forEach((l) => l());
  void revalidateSite();
};

const sb = () => getBrowserSupabase();
const nowIso = () => new Date().toISOString();

function fail(error: { message: string; code?: string } | null, fallback = "Something went wrong."): never {
  const msg = error?.message ?? fallback;
  if (error?.code === "42501" || /row-level security/i.test(msg)) throw new DataError("UNAUTHORIZED", "Your account does not have permission to do this.");
  if (error?.code === "23505") throw new DataError("VALIDATION", "That web address (slug) is already used. Choose another.");
  throw new DataError("SERVER", msg);
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await sb().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new DataError("UNAUTHORIZED", "Please sign in again.");
  return { Authorization: `Bearer ${token}` };
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init.headers ?? {}) } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new DataError((json?.error?.code ?? "SERVER") as DataErrorCode, json?.error?.message ?? "Request failed.");
  return json as T;
}

async function revalidateSite() {
  try {
    await fetch("/api/revalidate", { method: "POST", headers: await authHeader() });
  } catch {
    /* not signed in or offline: pages refresh on their normal schedule */
  }
}

async function readConfig<T>(key: "content" | "settings", fallback: T): Promise<T> {
  const { data, error } = await sb().from("site_config").select("data").eq("key", key).maybeSingle();
  if (error) fail(error);
  return { ...fallback, ...((data?.data as T) ?? {}) };
}

async function writeConfig(key: "content" | "settings", value: unknown) {
  const { error } = await sb().from("site_config").upsert({ key, data: value, updated_at: nowIso() });
  if (error) fail(error);
  changed();
}

async function takenSlug(table: string, slug: string, id?: string) {
  const { data } = await sb().from(table).select("id").eq("slug", slug).maybeSingle();
  return !!data && data.id !== id;
}

async function freeSlug(table: string, base: string, id?: string) {
  const { data } = await sb().from(table).select("id,slug");
  const rows = (data ?? []) as { id: string; slug: string }[];
  return uniqueSlug(base, (s) => rows.some((r) => r.slug === s && r.id !== id));
}

export const supabaseSource: DataSource = {
  mode: "supabase",

  getContent: async () => normalizeContent(await readConfig<Partial<SiteContent>>("content", {})),
  async saveContent(next) {
    await writeConfig("content", next);
    return next;
  },
  getSettings: () => readConfig<ClinicSettings>("settings", SEED_SETTINGS),
  async updateSettings(patch) {
    const current = await readConfig<ClinicSettings>("settings", SEED_SETTINGS);
    const next = { ...current, ...patch };
    assertSettings(next);
    await writeConfig("settings", next);
    return next;
  },

  /* procedures */
  async getTreatments(opts) {
    let q = sb().from("procedures").select("id,slug,data,active,sort").order("sort");
    if (!opts?.includeInactive) q = q.eq("active", true);
    const { data, error } = await q;
    if (error) fail(error);
    return (data ?? []).map(rowToTreatment);
  },
  async getTreatmentBySlug(slug) {
    const { data, error } = await sb().from("procedures").select("id,slug,data,active,sort").eq("slug", slug).eq("active", true).maybeSingle();
    if (error) fail(error);
    return data ? rowToTreatment(data) : null;
  },
  async saveTreatment(input) {
    assertTreatment(input);
    const slug = await freeSlug("procedures", input.slug || input.name, input.id);
    const record: Treatment = { ...input, name: input.name.trim(), slug, id: input.id ?? uid("t"), updatedAt: nowIso() };
    const { error } = await sb().from("procedures").upsert(treatmentToRow(record));
    if (error) fail(error);
    changed();
    return record;
  },
  async deleteTreatment(id) {
    const { error } = await sb().from("procedures").delete().eq("id", id);
    if (error) fail(error);
    changed();
  },
  async updatePrice(treatmentId, price) {
    const { data, error } = await sb().from("procedures").select("id,slug,data,active,sort").eq("id", treatmentId).maybeSingle();
    if (error || !data) fail(error, "Procedure not found.");
    const t = { ...rowToTreatment(data), price, updatedAt: nowIso() };
    assertTreatment(t);
    const { error: e2 } = await sb().from("procedures").update(treatmentToRow(t)).eq("id", treatmentId);
    if (e2) fail(e2);
    changed();
    return t;
  },

  /* conditions */
  async getConditions(opts) {
    let q = sb().from("conditions").select("id,slug,data,active,sort").order("sort");
    if (!opts?.includeInactive) q = q.eq("active", true);
    const { data, error } = await q;
    if (error) fail(error);
    return (data ?? []).map(rowToCondition);
  },
  async getConditionBySlug(slug) {
    const { data, error } = await sb().from("conditions").select("id,slug,data,active,sort").eq("slug", slug).eq("active", true).maybeSingle();
    if (error) fail(error);
    return data ? rowToCondition(data) : null;
  },
  async saveCondition(input) {
    if (!input.name.trim()) throw new DataError("VALIDATION", "Condition name is required.");
    const slug = await freeSlug("conditions", input.slug || input.name, input.id);
    const record: Condition = { ...input, name: input.name.trim(), slug, id: input.id ?? uid("c"), updatedAt: nowIso() };
    const { error } = await sb().from("conditions").upsert(conditionToRow(record));
    if (error) fail(error);
    changed();
    return record;
  },
  async deleteCondition(id) {
    const { error } = await sb().from("conditions").delete().eq("id", id);
    if (error) fail(error);
    changed();
  },

  /* blog */
  async getPosts(opts) {
    let q = sb().from("posts").select("id,slug,data,status").order("published_at", { ascending: false, nullsFirst: true });
    if (!opts?.includeDrafts) q = q.eq("status", "published");
    const { data, error } = await q;
    if (error) fail(error);
    return (data ?? []).map(rowToPost);
  },
  async getPostBySlug(slug, opts) {
    let q = sb().from("posts").select("id,slug,data,status").eq("slug", slug);
    if (!opts?.includeDrafts) q = q.eq("status", "published");
    const { data, error } = await q.maybeSingle();
    if (error) fail(error);
    return data ? rowToPost(data) : null;
  },
  async savePost(input) {
    if (!input.title.trim()) throw new DataError("VALIDATION", "Article title is required.");
    const slug = await freeSlug("posts", input.slug || input.title, input.id);
    if (await takenSlug("posts", slug, input.id)) throw new DataError("VALIDATION", "That web address is already used.");
    const publishedAt = input.status === "published" ? input.publishedAt ?? nowIso() : input.publishedAt;
    const record: Post = { ...input, title: input.title.trim(), slug, publishedAt, id: input.id ?? uid("post"), updatedAt: nowIso() };
    const { error } = await sb().from("posts").upsert(postToRow(record));
    if (error) fail(error);
    changed();
    return record;
  },
  async deletePost(id) {
    const { error } = await sb().from("posts").delete().eq("id", id);
    if (error) fail(error);
    changed();
  },

  /* gallery */
  async getGallery(opts) {
    let q = sb().from("gallery").select("id,data,published,consent_confirmed,sort").order("sort");
    if (!opts?.includeUnpublished) q = q.eq("published", true);
    const { data, error } = await q;
    if (error) fail(error);
    return (data ?? []).map(rowToGallery);
  },
  async saveGalleryItem(input) {
    if (!input.before || !input.after) throw new DataError("VALIDATION", "Upload both a before and an after photo.");
    if (input.published && !input.consentConfirmed && !input.illustrative)
      throw new DataError("VALIDATION", "Confirm the patient's written consent before publishing.");
    const record: GalleryItem = { ...input, id: input.id ?? uid("g"), createdAt: nowIso() };
    const { error } = await sb().from("gallery").upsert(galleryToRow(record));
    if (error) fail(error);
    changed();
    return record;
  },
  async deleteGalleryItem(id) {
    const { error } = await sb().from("gallery").delete().eq("id", id);
    if (error) fail(error);
    changed();
  },

  /* media */
  async uploadImage(file, folder) {
    const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
    const path = `${folder.replace(/[^a-z0-9-]/gi, "")}/${uid("img")}.${ext}`;
    const { error } = await sb().storage.from(MEDIA_BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
    if (error) fail(error);
    return sb().storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
  },

  /* availability & bookings */
  async getAvailability(doctorId, opts = {}) {
    const p = new URLSearchParams({ doctor: doctorId });
    if (opts.days) p.set("days", String(opts.days));
    if (opts.ignoreBookingId) {
      // Staff-only view used when rescheduling: computed locally from the staff-readable bookings.
      const [{ getAvailabilityRange }, settings, bookings] = await Promise.all([
        import("./slots"),
        readConfig<ClinicSettings>("settings", SEED_SETTINGS),
        supabaseSource.getBookings({}),
      ]);
      return getAvailabilityRange(settings, bookings, doctorId, { ...opts, now: clinicNow() });
    }
    const { days } = await api<{ days: Awaited<ReturnType<DataSource["getAvailability"]>> }>(`/api/availability?${p}`, { cache: "no-store" });
    return days;
  },
  async createBooking(input) {
    const result = await api<BookingResult>("/api/bookings", { method: "POST", body: JSON.stringify(input) });
    listeners.forEach((l) => l());
    return result;
  },
  async getBookings(filters = {}) {
    let q = sb().from("bookings").select("*");
    const today = todayISO(clinicNow());
    if (filters.scope === "today") q = q.eq("date", today);
    if (filters.scope === "upcoming") q = q.gt("date", today);
    if (filters.treatmentId) q = q.eq("treatment_id", filters.treatmentId);
    if (filters.doctorId) q = q.eq("doctor_id", filters.doctorId);
    if (filters.status) q = q.eq("status", filters.status);
    const { data, error } = await q.order("date").order("time").limit(1000);
    if (error) fail(error);
    let list = ((data ?? []) as BookingRow[]).map(rowToBooking);
    const s = filters.search?.trim().toLowerCase();
    if (s) {
      const digits = s.replace(/\D/g, "").replace(/^0/, "");
      list = list.filter(
        (b) =>
          b.patientName.toLowerCase().includes(s) ||
          b.reference.toLowerCase().includes(s) ||
          b.treatmentName.toLowerCase().includes(s) ||
          (b.email ?? "").toLowerCase().includes(s) ||
          (digits.length >= 3 && b.phone.replace(/\D/g, "").includes(digits)),
      );
    }
    return filters.scope === "all" || !filters.scope ? list.reverse() : list;
  },
  async setBookingStatus(id, status, note) {
    const r = await api<BookingResult>(`/api/admin/bookings/${id}`, { method: "PATCH", headers: await authHeader(), body: JSON.stringify({ action: status, note }) });
    listeners.forEach((l) => l());
    return r;
  },
  async rescheduleBooking(id, date, time) {
    const r = await api<BookingResult & { previous: { date: string; time: string } }>(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: await authHeader(),
      body: JSON.stringify({ action: "reschedule", date, time }),
    });
    listeners.forEach((l) => l());
    return r;
  },

  /* journeys */
  async getJourneys() {
    const { data, error } = await sb().from("journeys").select("id,data").order("created_at", { ascending: false });
    if (error) fail(error);
    return (data ?? []).map(rowToJourney);
  },
  async createJourney(input) {
    const { data: t } = await sb().from("procedures").select("data").eq("id", input.treatmentId).maybeSingle();
    if (!t) throw new DataError("NOT_FOUND", "Procedure not found.");
    if (!input.patientName.trim()) throw new DataError("VALIDATION", "Patient name is required.");
    const j: Journey = {
      ...input,
      patientName: input.patientName.trim(),
      id: uid("jr"),
      treatmentName: (t.data as Treatment).name,
      steps: [...input.steps].sort((a, b) => a.week - b.week),
      createdAt: nowIso(),
    };
    const { error } = await sb().from("journeys").insert(journeyToRow(j));
    if (error) fail(error);
    listeners.forEach((l) => l());
    return j;
  },
  async updateJourneyStep(journeyId, stepId, patch) {
    const { data, error } = await sb().from("journeys").select("id,data").eq("id", journeyId).maybeSingle();
    if (error || !data) fail(error, "Journey not found.");
    const j = rowToJourney(data);
    j.steps = j.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s));
    const { error: e2 } = await sb().from("journeys").update({ data: j }).eq("id", journeyId);
    if (e2) fail(e2);
    listeners.forEach((l) => l());
    return j;
  },
  async deleteJourney(id) {
    const { error } = await sb().from("journeys").delete().eq("id", id);
    if (error) fail(error);
    listeners.forEach((l) => l());
  },

  async resetDemoData() {
    throw new DataError("VALIDATION", "Reset is only available in demo mode.");
  },
};
