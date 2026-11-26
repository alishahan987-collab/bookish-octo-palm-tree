import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { newId } from "../id";
import { SEED } from "../seed";
import { overlapping } from "../slots";
import { timeToMinutes } from "../dates";
import type { Appointment, CollectionName, Collections, ContactMessage, DocKey, Docs, MediaFile } from "../types";
import { ACTIVE_STATUSES } from "../types";
import { RepoError, withDefaults, type AppointmentQuery, type Repo } from "./types";

/**
 * Local JSON file store for development and self-hosting on a server with a
 * persistent disk. Not for Vercel (read-only, ephemeral file system): use
 * Supabase there. All writes are serialised through one in-process lock.
 */

interface DB {
  docs: Partial<Docs>;
  collections: { [C in CollectionName]: Collections[C][] };
  appointments: Appointment[];
  messages: ContactMessage[];
}

const DATA_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR || ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

function seedDb(): DB {
  return {
    docs: { settings: SEED.settings, design: SEED.design, navigation: SEED.navigation },
    collections: structuredClone({ pages: SEED.pages, treatments: SEED.treatments, testimonials: SEED.testimonials, gallery: SEED.gallery }),
    appointments: [],
    messages: [],
  };
}

let lock: Promise<unknown> = Promise.resolve();
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.catch(() => undefined);
  return run;
}

async function read(): Promise<DB> {
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8")) as DB;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    const db = seedDb();
    await write(db);
    return db;
  }
}

async function write(db: DB) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 1));
  await fs.rename(tmp, DB_FILE);
}

const mutate = <T>(fn: (db: DB) => T | Promise<T>) =>
  exclusive(async () => {
    const db = await read();
    const out = await fn(db);
    await write(db);
    return out;
  });

const sortByOrder = <T extends { order: number }>(items: T[]) => [...items].sort((a, b) => a.order - b.order);
const hasSlug = (c: CollectionName) => c === "pages" || c === "treatments";

function overlapCount(db: DB, a: Pick<Appointment, "date" | "time" | "durationMinutes">, ignoreId?: string) {
  const start = timeToMinutes(a.time);
  return overlapping(db.appointments, a.date, start, start + a.durationMinutes, ignoreId);
}

export const fileRepo: Repo = {
  mode: "file",

  async getDoc<K extends DocKey>(key: K) {
    const db = await exclusive(read);
    return withDefaults(SEED[key] as Docs[K], db.docs[key]);
  },
  async putDoc(key, data) {
    await mutate((db) => {
      (db.docs as Record<string, unknown>)[key] = data;
    });
  },

  async list(c) {
    const db = await exclusive(read);
    return sortByOrder(db.collections[c] ?? []) as never;
  },
  async get(c, id) {
    const db = await exclusive(read);
    return ((db.collections[c] ?? []) as { id: string }[]).find((x) => x.id === id) as never ?? null;
  },
  async put(c, item) {
    return mutate((db) => {
      const list = (db.collections[c] ?? []) as unknown as { id: string; slug?: string; order: number }[];
      const it = item as unknown as { id: string; slug?: string; order: number; published?: boolean; consentConfirmed?: boolean };
      if (hasSlug(c) && list.some((x) => x.id !== it.id && x.slug === it.slug)) {
        throw new RepoError("DUPLICATE_SLUG", "Another item already uses this web address (slug). Please choose a different one.");
      }
      if (c === "gallery" && it.published && !it.consentConfirmed) {
        throw new RepoError("CONSENT_REQUIRED", "Confirm written client consent before publishing this photo.");
      }
      const i = list.findIndex((x) => x.id === it.id);
      if (i >= 0) list[i] = it;
      else list.push({ ...it, order: it.order || Math.max(0, ...list.map((x) => x.order)) + 1 });
      (db.collections as Record<string, unknown>)[c] = list;
      return (i >= 0 ? list[i] : list[list.length - 1]) as never;
    });
  },
  async remove(c, id) {
    await mutate((db) => {
      (db.collections as Record<string, unknown>)[c] = (db.collections[c] as { id: string }[]).filter((x) => x.id !== id);
    });
  },
  async reorder(c, ids) {
    await mutate((db) => {
      const list = db.collections[c] as { id: string; order: number }[];
      ids.forEach((id, i) => {
        const it = list.find((x) => x.id === id);
        if (it) it.order = i + 1;
      });
    });
  },

  async listAppointments(q: AppointmentQuery) {
    const db = await exclusive(read);
    let list = db.appointments;
    if (q.from) list = list.filter((a) => a.date >= q.from!);
    if (q.to) list = list.filter((a) => a.date <= q.to!);
    if (q.status?.length) list = list.filter((a) => q.status!.includes(a.status));
    list = [...list].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    return q.limit ? list.slice(0, q.limit) : list;
  },
  async busy(from) {
    const db = await exclusive(read);
    return db.appointments
      .filter((a) => a.date >= from && ACTIVE_STATUSES.includes(a.status))
      .map(({ id, date, time, durationMinutes, status }) => ({ id, date, time, durationMinutes, status }));
  },
  async getAppointment(id) {
    const db = await exclusive(read);
    return db.appointments.find((a) => a.id === id) ?? null;
  },
  async insertAppointment(a, capacity) {
    return mutate((db) => {
      if (overlapCount(db, a) >= capacity) throw new RepoError("SLOT_TAKEN", "That time has just been taken. Please choose another time.");
      if (db.appointments.some((x) => x.reference === a.reference)) a = { ...a, reference: `${a.reference}${Math.floor(Math.random() * 10)}` };
      db.appointments.push(a);
      return a;
    });
  },
  async moveAppointment(id, date, time, durationMinutes, capacity, patch) {
    return mutate((db) => {
      const i = db.appointments.findIndex((x) => x.id === id);
      if (i < 0) throw new RepoError("NOT_FOUND", "Appointment not found.");
      if (overlapCount(db, { date, time, durationMinutes }, id) >= capacity) throw new RepoError("SLOT_TAKEN", "That time is no longer available.");
      db.appointments[i] = { ...db.appointments[i], ...patch, date, time, durationMinutes, updatedAt: new Date().toISOString() };
      return db.appointments[i];
    });
  },
  async updateAppointment(id, patch, expectStatus) {
    return mutate((db) => {
      const i = db.appointments.findIndex((x) => x.id === id);
      if (i < 0) throw new RepoError("NOT_FOUND", "Appointment not found.");
      if (expectStatus && db.appointments[i].status !== expectStatus) throw new RepoError("CONFLICT", "This appointment was changed by someone else. Please refresh.");
      db.appointments[i] = { ...db.appointments[i], ...patch, updatedAt: new Date().toISOString() };
      return db.appointments[i];
    });
  },

  async listMessages() {
    const db = await exclusive(read);
    return [...db.messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async insertMessage(m) {
    return mutate((db) => {
      db.messages.push(m);
      return m;
    });
  },
  async updateMessage(id, patch) {
    return mutate((db) => {
      const i = db.messages.findIndex((x) => x.id === id);
      if (i < 0) throw new RepoError("NOT_FOUND", "Message not found.");
      db.messages[i] = { ...db.messages[i], ...patch };
      return db.messages[i];
    });
  },
  async deleteMessage(id) {
    await mutate((db) => {
      db.messages = db.messages.filter((m) => m.id !== id);
    });
  },

  async uploadMedia(data, _contentType, ext): Promise<MediaFile> {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${Date.now()}-${newId()}.${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, name), data);
    return { path: name, url: `/media/${name}`, size: data.byteLength, createdAt: new Date().toISOString() };
  },
  async listMedia() {
    try {
      const names = await fs.readdir(UPLOAD_DIR);
      const files = await Promise.all(
        names.map(async (name) => {
          const st = await fs.stat(path.join(UPLOAD_DIR, name));
          return { path: name, url: `/media/${name}`, size: st.size, createdAt: st.mtime.toISOString() };
        }),
      );
      return files.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      return [];
    }
  },
  async deleteMedia(p) {
    const name = path.basename(p);
    await fs.rm(path.join(UPLOAD_DIR, name), { force: true });
  },

  async health() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.access(DATA_DIR, 2);
      return { ok: true, detail: `Local file store at ${DATA_DIR} (development only)` };
    } catch (e) {
      return { ok: false, detail: `Cannot write to ${DATA_DIR}: ${(e as Error).message}` };
    }
  },
};

/** Used by tests to start from a clean store. */
export async function resetFileStore() {
  await exclusive(async () => {
    await write(seedDb());
  });
}
