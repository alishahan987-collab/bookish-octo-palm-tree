import type { Booking, Condition, GalleryItem, Journey, Post, Treatment } from "../data/types";

/* Content documents: the full object is stored in `data`; key fields are mirrored in columns for querying and RLS. */

export const treatmentToRow = (t: Treatment) => ({ id: t.id, slug: t.slug, data: t, active: t.active, sort: t.order, updated_at: t.updatedAt });
export const rowToTreatment = (r: { id: string; slug: string; data: Treatment; active: boolean; sort: number }): Treatment => ({
  ...r.data, id: r.id, slug: r.slug, active: r.active, order: r.sort,
});

export const conditionToRow = (c: Condition) => ({ id: c.id, slug: c.slug, data: c, active: c.active, sort: c.order, updated_at: c.updatedAt });
export const rowToCondition = (r: { id: string; slug: string; data: Condition; active: boolean; sort: number }): Condition => ({
  ...r.data, id: r.id, slug: r.slug, active: r.active, order: r.sort,
});

export const postToRow = (p: Post) => ({ id: p.id, slug: p.slug, data: p, status: p.status, published_at: p.publishedAt ?? null, updated_at: p.updatedAt });
export const rowToPost = (r: { id: string; slug: string; data: Post; status: Post["status"] }): Post => ({ ...r.data, id: r.id, slug: r.slug, status: r.status });

export const galleryToRow = (g: GalleryItem) => ({
  id: g.id, data: g, published: g.published, consent_confirmed: g.consentConfirmed, illustrative: !!g.illustrative, sort: g.order, created_at: g.createdAt,
});
export const rowToGallery = (r: { id: string; data: GalleryItem; published: boolean; consent_confirmed: boolean; sort: number }): GalleryItem => ({
  ...r.data, id: r.id, published: r.published, consentConfirmed: r.consent_confirmed, order: r.sort,
});

export const journeyToRow = (j: Journey) => ({ id: j.id, data: j, created_at: j.createdAt });
export const rowToJourney = (r: { id: string; data: Journey }): Journey => ({ ...r.data, id: r.id });

export interface BookingRow {
  id: string;
  reference: string;
  treatment_id: string;
  treatment_name: string;
  doctor_id: string;
  date: string;
  time: string;
  patient_name: string;
  phone: string;
  email: string | null;
  contact_method: Booking["contactMethod"];
  consent: Booking["consent"];
  notes: string | null;
  status: Booking["status"];
  history: Booking["history"];
  notifications: NonNullable<Booking["notifications"]>;
  created_at: string;
}

export const rowToBooking = (r: BookingRow): Booking => ({
  id: r.id,
  reference: r.reference,
  treatmentId: r.treatment_id,
  treatmentName: r.treatment_name,
  doctorId: r.doctor_id,
  date: r.date,
  time: r.time,
  patientName: r.patient_name,
  phone: r.phone,
  email: r.email ?? undefined,
  contactMethod: r.contact_method,
  consent: r.consent,
  notes: r.notes ?? undefined,
  status: r.status,
  history: r.history ?? [],
  notifications: r.notifications ?? [],
  createdAt: r.created_at,
});

export const bookingToRow = (b: Booking) => ({
  reference: b.reference,
  treatment_id: b.treatmentId,
  treatment_name: b.treatmentName,
  doctor_id: b.doctorId,
  date: b.date,
  time: b.time,
  patient_name: b.patientName,
  phone: b.phone,
  email: b.email ?? null,
  contact_method: b.contactMethod,
  consent: b.consent,
  notes: b.notes ?? null,
  status: b.status,
  history: b.history,
  notifications: b.notifications ?? [],
});
