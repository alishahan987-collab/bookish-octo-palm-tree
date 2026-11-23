"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { BookingStatus } from "@/lib/data/types";
import { Icon } from "../ui/Icon";

export const STATUS_STYLES: Record<BookingStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-[#fbefd5] text-[#7a5410]" },
  confirmed: { label: "Confirmed", cls: "bg-[#e3efe6] text-success" },
  arrived: { label: "Arrived", cls: "bg-[#e3ebf4] text-[#2a4f7a]" },
  completed: { label: "Completed", cls: "bg-[#ece8e2] text-ink" },
  cancelled: { label: "Cancelled", cls: "bg-[#f6e3e1] text-danger" },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const s = STATUS_STYLES[status];
  return <span className={`chip ${s.cls}`} data-status={status}>{s.label}</span>;
}

export function DemoChip({ children = "Demo price" }: { children?: ReactNode }) {
  return <span className="chip border border-dashed border-champagne bg-ivory text-gold-deep">{children}</span>;
}

/* ---------------------------------- Toast ---------------------------------- */

type Toast = { id: number; text: string; tone: "ok" | "error" };
const ToastCtx = createContext<(text: string, tone?: Toast["tone"]) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`pointer-events-auto flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium shadow-[var(--shadow-lift)] ${t.tone === "ok" ? "bg-charcoal text-ivory" : "bg-danger text-white"}`}>
            <Icon name={t.tone === "ok" ? "check" : "info"} size={16} /> {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

export function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong.";
}
