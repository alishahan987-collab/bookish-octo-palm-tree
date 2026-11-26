import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { newId } from "../id";
import { SEED } from "../seed";
import type { Appointment, CollectionName, Collections, ContactMessage, DocKey, Docs, MediaFile } from "../types";
import { ACTIVE_STATUSES } from "../types";
import { RepoError, withDefaults, type Repo } from "./types";

export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SERVICE_KEY);
const BUCKET = "media";

let client: SupabaseClient | null = null;
/** Service-role client. Server only; never sent to the browser. */
export function svc(): SupabaseClient {
  client ??= createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

function fail(error: { message: string; code?: string } | null, what: string): never {
  console.error(`[supabase] ${what}:`, error);
  throw new RepoError("STORAGE", `Could not ${what}. Please try again.`);
}

/* ------------------------------ row mappers ------------------------------ */

interface ApptRow {
  id: string; reference: string; treatment_id: string; treatment_name: string; date: string; time: string;
  duration_minutes: number; name: string; email: string; phone: string; message: string; status: Appointment["status"];
  source: Appointment["source"]; internal_notes: string; history: Appointment["history"]; notifications: Appointment["notifications"];
  created_at: string; updated_at: string;
}

const toAppt = (r: ApptRow): Appointment => ({
  id: r.id, reference: r.reference, treatmentId: r.treatment_id, treatmentName: r.treatment_name, date: r.date, time: r.time,
  durationMinutes: r.duration_minutes, name: r.name, email: r.email, phone: r.phone, message: r.message, status: r.status,
  source: r.source, internalNotes: r.internal_notes, history: r.history ?? [], notifications: r.notifications ?? [],
  createdAt: r.created_at, updatedAt: r.updated_at,
});

function apptPatch(p: Partial<Appointment>) {
  const m: Record<string, unknown> = {};
  const map: Partial<Record<keyof Appointment, string>> = {
    status: "status", internalNotes: "internal_notes", history: "history", notifications: "notifications",
    name: "name", email: "email", phone: "phone", message: "message",
  };
  for (const [k, col] of Object.entries(map)) if (k in p) m[col!] = p[k as keyof Appointment];
  m.updated_at = new Date().toISOString();
  return m;
}

interface MsgRow { id: string; name: string; email: string; phone: string; subject: string; message: string; status: ContactMessage["status"]; notifications: ContactMessage["notifications"]; created_at: string }
const toMsg = (r: MsgRow): ContactMessage => ({ id: r.id, name: r.name, email: r.email, phone: r.phone, subject: r.subject, message: r.message, status: r.status, notifications: r.notifications ?? [], createdAt: r.created_at });

const hasSlug = (c: CollectionName) => c === "pages" || c === "treatments";

export const supabaseRepo: Repo = {
  mode: "supabase",

  async getDoc<K extends DocKey>(key: K) {
    const { data, error } = await svc().from("site_documents").select("data").eq("key", key).maybeSingle();
    if (error) fail(error, `load ${key}`);
    return withDefaults(SEED[key] as Docs[K], data?.data);
  },
  async putDoc(key, data) {
    const { error } = await svc().from("site_documents").upsert({ key, data, updated_at: new Date().toISOString() });
    if (error) fail(error, `save ${key}`);
  },

  async list(c) {
    const { data, error } = await svc().from("content_items").select("data,sort").eq("collection", c).order("sort");
    if (error) fail(error, `load ${c}`);
    return (data ?? []).map((r) => ({ ...r.data, order: r.sort })) as never;
  },
  async get(c, id) {
    const { data, error } = await svc().from("content_items").select("data,sort").eq("collection", c).eq("id", id).maybeSingle();
    if (error) fail(error, `load ${c}`);
    return data ? ({ ...data.data, order: data.sort } as never) : null;
  },
  async put<C extends CollectionName>(c: C, item: Collections[C]) {
    const it = item as unknown as { id: string; slug?: string; order: number; published?: boolean };
    let order = it.order;
    if (!order) {
      const { data } = await svc().from("content_items").select("sort").eq("collection", c).order("sort", { ascending: false }).limit(1);
      order = (data?.[0]?.sort ?? 0) + 1;
    }
    const value = { ...it, order };
    const { error } = await svc().from("content_items").upsert({
      collection: c, id: it.id, slug: hasSlug(c) ? it.slug ?? "" : null, data: value, sort: order,
      published: Boolean(it.published), updated_at: new Date().toISOString(),
    });
    if (error) {
      if (error.code === "23505") throw new RepoError("DUPLICATE_SLUG", "Another item already uses this web address (slug). Please choose a different one.");
      if (error.code === "23514" && error.message.includes("gallery_consent")) throw new RepoError("CONSENT_REQUIRED", "Confirm written client consent before publishing this photo.");
      if (error.code === "23514" && error.message.includes("slug_format")) throw new RepoError("STORAGE", "The web address may only contain lowercase letters, numbers and hyphens.");
      fail(error, `save ${c}`);
    }
    return value as unknown as Collections[C];
  },
  async remove(c, id) {
    const { error } = await svc().from("content_items").delete().eq("collection", c).eq("id", id);
    if (error) fail(error, `delete from ${c}`);
  },
  async reorder(c, ids) {
    const { error } = await svc().rpc("reorder_content", { p_collection: c, p_ids: ids });
    if (error) fail(error, `reorder ${c}`);
  },

  async listAppointments(q) {
    let query = svc().from("appointments").select("*").order("date").order("time");
    if (q.from) query = query.gte("date", q.from);
    if (q.to) query = query.lte("date", q.to);
    if (q.status?.length) query = query.in("status", q.status);
    if (q.limit) query = query.limit(q.limit);
    const { data, error } = await query;
    if (error) fail(error, "load appointments");
    return (data as ApptRow[]).map(toAppt);
  },
  async busy(from) {
    const { data, error } = await svc().from("appointments").select("id,date,time,duration_minutes,status").gte("date", from).in("status", ACTIVE_STATUSES);
    if (error) fail(error, "load availability");
    return (data ?? []).map((r) => ({ id: r.id, date: r.date, time: r.time, durationMinutes: r.duration_minutes, status: r.status }));
  },
  async getAppointment(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const { data, error } = await svc().from("appointments").select("*").eq("id", id).maybeSingle();
    if (error) fail(error, "load the appointment");
    return data ? toAppt(data as ApptRow) : null;
  },
  async insertAppointment(a, capacity) {
    const row = {
      reference: a.reference, treatment_id: a.treatmentId, treatment_name: a.treatmentName, date: a.date, time: a.time,
      duration_minutes: a.durationMinutes, name: a.name, email: a.email, phone: a.phone, message: a.message, status: a.status,
      source: a.source, internal_notes: a.internalNotes, history: a.history, notifications: a.notifications,
    };
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await svc().rpc("book_appointment", { p: row, p_capacity: capacity }).single();
      if (!error) return toAppt(data as ApptRow);
      if (error.message?.includes("SLOT_TAKEN")) throw new RepoError("SLOT_TAKEN", "That time has just been taken. Please choose another time.");
      if (error.code === "23505" && error.message.includes("reference")) {
        row.reference = `${a.reference}${attempt}`;
        continue;
      }
      fail(error, "save your request");
    }
    throw new RepoError("STORAGE", "Could not save your request. Please try again.");
  },
  async moveAppointment(id, date, time, durationMinutes, capacity, patch) {
    const { data, error } = await svc()
      .rpc("move_appointment", { p_id: id, p_date: date, p_time: time, p_duration: durationMinutes, p_capacity: capacity, p_history: patch.history ?? [] })
      .single();
    if (error) {
      if (error.message?.includes("SLOT_TAKEN")) throw new RepoError("SLOT_TAKEN", "That time is no longer available.");
      if (error.message?.includes("NOT_FOUND")) throw new RepoError("NOT_FOUND", "Appointment not found.");
      fail(error, "reschedule the appointment");
    }
    const rest = { ...patch };
    delete rest.history;
    return Object.keys(rest).length ? supabaseRepo.updateAppointment(id, rest) : toAppt(data as ApptRow);
  },
  async updateAppointment(id, patch, expectStatus) {
    let q = svc().from("appointments").update(apptPatch(patch)).eq("id", id);
    if (expectStatus) q = q.eq("status", expectStatus);
    const { data, error } = await q.select("*").maybeSingle();
    if (error) fail(error, "update the appointment");
    if (!data) {
      if (expectStatus) throw new RepoError("CONFLICT", "This appointment was changed by someone else. Please refresh.");
      throw new RepoError("NOT_FOUND", "Appointment not found.");
    }
    return toAppt(data as ApptRow);
  },

  async listMessages() {
    const { data, error } = await svc().from("contact_messages").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) fail(error, "load messages");
    return (data as MsgRow[]).map(toMsg);
  },
  async insertMessage(m) {
    const { data, error } = await svc()
      .from("contact_messages")
      .insert({ name: m.name, email: m.email, phone: m.phone, subject: m.subject, message: m.message, status: m.status, notifications: m.notifications })
      .select("*")
      .single();
    if (error) fail(error, "save your message");
    return toMsg(data as MsgRow);
  },
  async updateMessage(id, patch) {
    const row: Record<string, unknown> = {};
    if (patch.status) row.status = patch.status;
    if (patch.notifications) row.notifications = patch.notifications;
    const { data, error } = await svc().from("contact_messages").update(row).eq("id", id).select("*").maybeSingle();
    if (error) fail(error, "update the message");
    if (!data) throw new RepoError("NOT_FOUND", "Message not found.");
    return toMsg(data as MsgRow);
  },
  async deleteMessage(id) {
    const { error } = await svc().from("contact_messages").delete().eq("id", id);
    if (error) fail(error, "delete the message");
  },

  async uploadMedia(data, contentType, ext): Promise<MediaFile> {
    const path = `uploads/${Date.now()}-${newId()}.${ext}`;
    const { error } = await svc().storage.from(BUCKET).upload(path, data, { contentType, cacheControl: "31536000", upsert: false });
    if (error) fail(error, "upload the image");
    const { data: pub } = svc().storage.from(BUCKET).getPublicUrl(path);
    return { path, url: pub.publicUrl, size: data.byteLength, createdAt: new Date().toISOString() };
  },
  async listMedia() {
    const { data, error } = await svc().storage.from(BUCKET).list("uploads", { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
    if (error) fail(error, "load images");
    return (data ?? [])
      .filter((f) => f.id)
      .map((f) => {
        const path = `uploads/${f.name}`;
        return { path, url: svc().storage.from(BUCKET).getPublicUrl(path).data.publicUrl, size: Number(f.metadata?.size ?? 0), createdAt: f.created_at ?? "" };
      });
  },
  async deleteMedia(path) {
    if (!/^uploads\/[\w.-]+$/.test(path)) throw new RepoError("NOT_FOUND", "Invalid image path.");
    const { error } = await svc().storage.from(BUCKET).remove([path]);
    if (error) fail(error, "delete the image");
  },

  async health() {
    const { error } = await svc().from("site_documents").select("key").limit(1);
    if (error) return { ok: false, detail: `Supabase reachable but the schema is missing or the key is wrong: ${error.message}` };
    const { error: bErr } = await svc().storage.getBucket(BUCKET);
    if (bErr) return { ok: false, detail: `Database OK, but the "media" storage bucket is missing: ${bErr.message}` };
    return { ok: true, detail: "Supabase database and storage connected" };
  },
};
