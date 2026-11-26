"use client";

import { useEffect, useState } from "react";
import { openStatus } from "@/lib/hours";
import { clinicNow } from "@/lib/tz";
import { useSite } from "./SiteProvider";

export const mapsUrl = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
export const directionsUrl = (query: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;

/**
 * "Open now · until 6:30 PM", in the clinic's time zone. Returns null until
 * mounted, so server and browser render the same HTML.
 */
export function useOpenStatus() {
  const { settings } = useSite();
  const [status, setStatus] = useState<ReturnType<typeof openStatus> | null>(null);
  useEffect(() => {
    const tick = () => setStatus(openStatus(settings, clinicNow()));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [settings]);
  return status;
}
