"use client";

import { useEffect, useState } from "react";
import { getConditions, getPosts, getTreatments } from "@/lib/data";
import { buildIndex, type SearchDoc } from "@/lib/search";

/** Builds the search index lazily (only when search is opened). */
export function useSearchIndex(enabled: boolean) {
  const [index, setIndex] = useState<SearchDoc[] | null>(null);
  useEffect(() => {
    if (!enabled || index) return;
    Promise.all([getTreatments(), getConditions(), getPosts()]).then(([treatments, conditions, posts]) =>
      setIndex(buildIndex({ treatments, conditions, posts })),
    );
  }, [enabled, index]);
  return index;
}
