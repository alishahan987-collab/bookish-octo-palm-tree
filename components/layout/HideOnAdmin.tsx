"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** The admin dashboard uses its own chrome; the preview banner still shows everywhere. */
export function HideOnAdmin({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return pathname.startsWith("/admin") ? null : <>{children}</>;
}
