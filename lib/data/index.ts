/**
 * Public data API — the ONLY module the UI imports for data.
 *
 * Every function is async so the UI already behaves as if it were talking to
 * a server. Phase 2 swaps `source` for a Supabase-backed implementation of
 * the same `DataSource` interface; no component changes are needed.
 */
import { localSource, subscribe as subscribeLocal, allowedNextStatuses } from "./local-source";
import type { DataSource } from "./source";

const source: DataSource = localSource;

export const getTreatments = source.getTreatments;
export const getTreatmentBySlug = source.getTreatmentBySlug;
export const saveTreatment = source.saveTreatment;
export const deleteTreatment = source.deleteTreatment;
export const updatePrice = source.updatePrice;

export const getDoctors = source.getDoctors;

export const getSettings = source.getSettings;
export const updateSettings = source.updateSettings;

export const getBookings = source.getBookings;
export const createBooking = source.createBooking;
export const setBookingStatus = source.setBookingStatus;
export const rescheduleBooking = source.rescheduleBooking;

export const getJourneys = source.getJourneys;
export const createJourney = source.createJourney;
export const updateJourneyStep = source.updateJourneyStep;
export const deleteJourney = source.deleteJourney;

export const resetDemoData = source.resetDemoData;

/** Change notifications (localStorage today, Supabase Realtime in Phase 2). */
export const subscribe = subscribeLocal;

export { allowedNextStatuses };
export { DataError } from "./source";
export * from "./types";
