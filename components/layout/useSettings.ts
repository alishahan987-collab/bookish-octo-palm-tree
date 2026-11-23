"use client";

import { getSettings } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import { SEED_SETTINGS } from "@/lib/data/seed";

export function useSettings() {
  return useData(getSettings, SEED_SETTINGS);
}
