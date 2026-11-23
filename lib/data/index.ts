/**
 * Public data API: the ONLY data module UI components import.
 * Picks the backend automatically: Supabase when configured, otherwise the
 * in-browser demo store.
 */
import { isSupabaseMode } from "../supabase/config";
import { localSource, subscribe as subscribeLocal } from "./local-source";
import type { DataSource } from "./source";
import { subscribeSupabase, supabaseSource } from "./supabase-source";

const source: DataSource = isSupabaseMode ? supabaseSource : localSource;

export const dataMode = source.mode;

export const getContent = source.getContent;
export const saveContent = source.saveContent;
export const getSettings = source.getSettings;
export const updateSettings = source.updateSettings;

export const getTreatments = source.getTreatments;
export const getTreatmentBySlug = source.getTreatmentBySlug;
export const saveTreatment = source.saveTreatment;
export const deleteTreatment = source.deleteTreatment;
export const updatePrice = source.updatePrice;

export const getConditions = source.getConditions;
export const getConditionBySlug = source.getConditionBySlug;
export const saveCondition = source.saveCondition;
export const deleteCondition = source.deleteCondition;

export const getPosts = source.getPosts;
export const getPostBySlug = source.getPostBySlug;
export const savePost = source.savePost;
export const deletePost = source.deletePost;

export const getGallery = source.getGallery;
export const saveGalleryItem = source.saveGalleryItem;
export const deleteGalleryItem = source.deleteGalleryItem;

export const uploadImage = source.uploadImage;

export const getAvailability = source.getAvailability;
export const createBooking = source.createBooking;
export const getBookings = source.getBookings;
export const setBookingStatus = source.setBookingStatus;
export const rescheduleBooking = source.rescheduleBooking;

export const getJourneys = source.getJourneys;
export const createJourney = source.createJourney;
export const updateJourneyStep = source.updateJourneyStep;
export const deleteJourney = source.deleteJourney;

export const resetDemoData = source.resetDemoData;

export const subscribe = isSupabaseMode ? subscribeSupabase : subscribeLocal;

export { allowedNextStatuses, canReschedule } from "./rules";
export { DataError } from "./source";
export * from "./types";
