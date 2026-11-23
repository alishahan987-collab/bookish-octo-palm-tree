"use client";

import { getTreatments } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import type { Treatment } from "@/lib/data/types";

export function useTreatments(initial: Treatment[]) {
  return useData(() => getTreatments(), initial);
}
