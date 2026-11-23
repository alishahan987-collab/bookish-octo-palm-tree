"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { getContent, getSettings } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import type { ClinicSettings, SiteContent } from "@/lib/data/types";
import { themeToCss } from "@/lib/theme";


interface SiteCtx {
  content: SiteContent;
  settings: ClinicSettings;
}

const Ctx = createContext<SiteCtx | null>(null);

export function SiteProvider({ content, settings, children }: SiteCtx & { children: ReactNode }) {
  const c = useData(getContent, content);
  const s = useData(getSettings, settings);

  // Apply theme changes live (server already rendered the saved theme).
  useEffect(() => {
    const vars = themeToCss(c.data.theme);
    for (const [k, v] of Object.entries(vars)) document.documentElement.style.setProperty(k, v);
  }, [c.data.theme]);

  return <Ctx.Provider value={{ content: c.data, settings: s.data }}>{children}</Ctx.Provider>;
}

export function useSite(): SiteCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSite must be used inside SiteProvider");
  return v;
}
