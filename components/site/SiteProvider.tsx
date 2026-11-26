"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { getContent, getSettings, getTreatments } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import type { ClinicSettings, SiteContent, Treatment } from "@/lib/data/types";
import { themeToCss } from "@/lib/theme";


interface SiteCtx {
  content: SiteContent;
  settings: ClinicSettings;
  /** Active treatments, for the navigation menu and footer. */
  treatments: Treatment[];
}

const Ctx = createContext<SiteCtx | null>(null);

export function SiteProvider({ content, settings, treatments, children }: SiteCtx & { children: ReactNode }) {
  const c = useData(getContent, content);
  const s = useData(getSettings, settings);
  const t = useData(getTreatments, treatments);

  // Apply theme changes live (server already rendered the saved theme).
  useEffect(() => {
    const vars = themeToCss(c.data.theme);
    for (const [k, v] of Object.entries(vars)) document.documentElement.style.setProperty(k, v);
  }, [c.data.theme]);

  return <Ctx.Provider value={{ content: c.data, settings: s.data, treatments: t.data }}>{children}</Ctx.Provider>;
}

export function useSite(): SiteCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSite must be used inside SiteProvider");
  return v;
}
