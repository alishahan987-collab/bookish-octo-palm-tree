import type { BusyAppointment } from "../slots";
import type {
  Appointment,
  AppointmentStatus,
  CollectionName,
  Collections,
  ContactMessage,
  DocKey,
  Docs,
  ISODate,
  MediaFile,
} from "../types";

/** Storage contract. Implemented by the local file store (development) and Supabase (production). */
export interface Repo {
  readonly mode: "file" | "supabase" | "readonly";

  getDoc<K extends DocKey>(key: K): Promise<Docs[K]>;
  putDoc<K extends DocKey>(key: K, data: Docs[K]): Promise<void>;

  list<C extends CollectionName>(c: C): Promise<Collections[C][]>;
  get<C extends CollectionName>(c: C, id: string): Promise<Collections[C] | null>;
  put<C extends CollectionName>(c: C, item: Collections[C]): Promise<Collections[C]>;
  remove(c: CollectionName, id: string): Promise<void>;
  reorder(c: CollectionName, ids: string[]): Promise<void>;

  listAppointments(q: AppointmentQuery): Promise<Appointment[]>;
  busy(from: ISODate): Promise<BusyAppointment[]>;
  getAppointment(id: string): Promise<Appointment | null>;
  /** Inserts after re-checking capacity atomically. Throws RepoError("SLOT_TAKEN"). */
  insertAppointment(a: Appointment, capacity: number): Promise<Appointment>;
  /** Moves to a new date/time after re-checking capacity atomically. */
  moveAppointment(id: string, date: ISODate, time: string, durationMinutes: number, capacity: number, patch: Partial<Appointment>): Promise<Appointment>;
  /** Updates fields. With expectStatus, fails (RepoError "CONFLICT") if someone else changed the status first. */
  updateAppointment(id: string, patch: Partial<Appointment>, expectStatus?: AppointmentStatus): Promise<Appointment>;

  listMessages(): Promise<ContactMessage[]>;
  insertMessage(m: ContactMessage): Promise<ContactMessage>;
  updateMessage(id: string, patch: Partial<ContactMessage>): Promise<ContactMessage>;
  deleteMessage(id: string): Promise<void>;

  uploadMedia(data: Uint8Array, contentType: string, ext: string): Promise<MediaFile>;
  listMedia(): Promise<MediaFile[]>;
  deleteMedia(path: string): Promise<void>;

  /** Connectivity check for the admin setup checklist. */
  health(): Promise<{ ok: boolean; detail: string }>;
}

export interface AppointmentQuery {
  from?: ISODate;
  to?: ISODate;
  status?: AppointmentStatus[];
  limit?: number;
}

export class RepoError extends Error {
  constructor(
    public code: "SLOT_TAKEN" | "NOT_FOUND" | "CONFLICT" | "DUPLICATE_SLUG" | "READ_ONLY" | "CONSENT_REQUIRED" | "STORAGE",
    message: string,
  ) {
    super(message);
    this.name = "RepoError";
  }
}

/** Fills in fields added in later versions so older stored documents keep working. */
export function withDefaults<T>(defaults: T, stored: unknown): T {
  if (stored === undefined || stored === null) return structuredClone(defaults);
  if (Array.isArray(defaults) || typeof defaults !== "object" || defaults === null) return stored as T;
  if (typeof stored !== "object" || Array.isArray(stored)) return structuredClone(defaults);
  const out: Record<string, unknown> = { ...(stored as Record<string, unknown>) };
  for (const [k, v] of Object.entries(defaults as Record<string, unknown>)) {
    out[k] = withDefaults(v, (stored as Record<string, unknown>)[k]);
  }
  return out as T;
}
