import "server-only";
import { cache } from "react";
import { seedSnapshot } from "../data/local-source";
import { SEED_CONTENT, SEED_SETTINGS } from "../data/seed";
import type { ClinicSettings, Condition, GalleryItem, Post, SiteContent, Treatment } from "../data/types";
import { rowToCondition, rowToGallery, rowToPost, rowToTreatment } from "../supabase/mappers";
import { isSupabaseMode } from "../supabase/config";
import { anonServerClient } from "../supabase/server";

/**
 * Server-side reads for rendering (SEO, first paint). In production these are
 * public, RLS-filtered queries; in demo mode they return the seed catalogue
 * and the browser then swaps in the visitor's local copy.
 * `cache` de-duplicates calls within one request.
 */

export const getSite = cache(async (): Promise<{ content: SiteContent; settings: ClinicSettings }> => {
  if (!isSupabaseMode) return { content: SEED_CONTENT, settings: SEED_SETTINGS };
  const { data } = await anonServerClient().from("site_config").select("key,data");
  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.data]));
  return {
    content: { ...SEED_CONTENT, ...(map.content ?? {}) },
    settings: { ...SEED_SETTINGS, ...(map.settings ?? {}) },
  };
});

export const getProcedures = cache(async (): Promise<Treatment[]> => {
  if (!isSupabaseMode) return seedSnapshot().treatments.filter((t) => t.active);
  const { data } = await anonServerClient().from("procedures").select("id,slug,data,active,sort").eq("active", true).order("sort");
  return (data ?? []).map(rowToTreatment);
});

export const getConditionsList = cache(async (): Promise<Condition[]> => {
  if (!isSupabaseMode) return seedSnapshot().conditions.filter((c) => c.active);
  const { data } = await anonServerClient().from("conditions").select("id,slug,data,active,sort").eq("active", true).order("sort");
  return (data ?? []).map(rowToCondition);
});

export const getPublishedPosts = cache(async (): Promise<Post[]> => {
  if (!isSupabaseMode) return seedSnapshot().posts.filter((p) => p.status === "published");
  const { data } = await anonServerClient().from("posts").select("id,slug,data,status").eq("status", "published").order("published_at", { ascending: false });
  return (data ?? []).map(rowToPost);
});

export const getPublicGallery = cache(async (): Promise<GalleryItem[]> => {
  if (!isSupabaseMode) return seedSnapshot().gallery.filter((g) => g.published);
  const { data } = await anonServerClient().from("gallery").select("id,data,published,consent_confirmed,sort").eq("published", true).order("sort");
  return (data ?? []).map(rowToGallery);
});

/** All public data at once (used by the layout/search). */
export const getPublicBundle = cache(async () => {
  const [site, procedures, conditions, posts, gallery] = await Promise.all([getSite(), getProcedures(), getConditionsList(), getPublishedPosts(), getPublicGallery()]);
  return { ...site, procedures, conditions, posts, gallery };
});
