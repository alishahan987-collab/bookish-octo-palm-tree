"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { uploadImage } from "@/lib/data";
import type { BookingStatus, ImageRef } from "@/lib/data/types";
import { prepareImage } from "@/lib/media/compress";
import { Icon } from "../ui/Icon";
import { SmartImage } from "../ui/SmartImage";

export const STATUS_STYLES: Record<BookingStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-[#fbefd5] text-[#7a5410]" },
  confirmed: { label: "Accepted", cls: "bg-[#e3efe6] text-success" },
  rejected: { label: "Rejected", cls: "bg-[#f3e6e4] text-[#8a2f2f]" },
  arrived: { label: "Arrived", cls: "bg-[#e3ebf4] text-[#2a4f7a]" },
  completed: { label: "Completed", cls: "bg-[#ece8e2] text-ink" },
  cancelled: { label: "Cancelled", cls: "bg-[#f6e3e1] text-danger" },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const s = STATUS_STYLES[status];
  return <span className={`chip ${s.cls}`} data-status={status}>{s.label}</span>;
}

/* ---------------------------------- Toast ---------------------------------- */

type Toast = { id: number; text: string; tone: "ok" | "error" };
const ToastCtx = createContext<(text: string, tone?: Toast["tone"]) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4">
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
export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

/* ------------------------------ Form helpers ------------------------------ */

export function F({ id, label, hint, children, className = "" }: { id: string; label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function TextInput({ id, label, value, onChange, hint, placeholder, type = "text", className, maxLength }: {
  id: string; label: string; value: string; onChange: (v: string) => void; hint?: string; placeholder?: string; type?: string; className?: string; maxLength?: number;
}) {
  return (
    <F id={id} label={label} hint={hint} className={className}>
      <input id={id} type={type} className="field" value={value} placeholder={placeholder} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
    </F>
  );
}

export function TextArea({ id, label, value, onChange, hint, rows = 4, className }: { id: string; label: string; value: string; onChange: (v: string) => void; hint?: string; rows?: number; className?: string }) {
  return (
    <F id={id} label={label} hint={hint} className={className}>
      <textarea id={id} className="field" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </F>
  );
}

/** One item per line. */
export function LinesInput({ id, label, value, onChange, hint, rows = 4 }: { id: string; label: string; value: string[]; onChange: (v: string[]) => void; hint?: string; rows?: number }) {
  const [text, setText] = useState(value.join("\n"));
  const last = useRef(value);
  useEffect(() => {
    if (value !== last.current && value.join("\n") !== text.split("\n").map((l) => l.trim()).filter(Boolean).join("\n")) setText(value.join("\n"));
    last.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <F id={id} label={label} hint={hint ?? "One item per line."}>
      <textarea id={id} className="field" rows={rows} value={text}
        onChange={(e) => { setText(e.target.value); onChange(e.target.value.split("\n").map((l) => l.trim()).filter(Boolean)); }} />
    </F>
  );
}

export function Switch({ label, checked, onChange, testId }: { label: string; checked: boolean; onChange: (v: boolean) => void; testId?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} data-testid={testId}
      className="inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium text-ink hover:bg-cream">
      <span className={`relative h-5 w-9 flex-none rounded-full transition-colors ${checked ? "bg-gold" : "bg-sand"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? "left-[1.1rem]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

export function Card({ title, children, actions, description }: { title: string; children: ReactNode; actions?: ReactNode; description?: string }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function SaveBar({ dirty, saving, error, onSave, onDiscard, testId }: { dirty: boolean; saving?: boolean; error?: string | null; onSave: () => void; onDiscard: () => void; testId?: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ivory/95 backdrop-blur lg:left-64">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-muted" role={error ? "alert" : undefined}>
          {error ? <span className="text-danger">{error}</span> : dirty ? "You have unsaved changes." : "All changes saved."}
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost btn-sm" disabled={!dirty || saving} onClick={onDiscard}>Discard</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={!dirty || saving} onClick={onSave} data-testid={testId}>{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Image upload ------------------------------ */

export function ImageUpload({
  label,
  value,
  onChange,
  folder,
  aspect = "aspect-[4/3]",
  testId,
  hint,
}: {
  label: string;
  value?: ImageRef;
  onChange: (v: ImageRef | undefined) => void;
  folder: string;
  aspect?: string;
  testId?: string;
  hint?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = `upload-${testId ?? folder}-${label.replace(/\W+/g, "-").toLowerCase()}`;

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await prepareImage(file);
      onChange(await uploadImage(blob, folder));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      <p className="label" id={`${id}-label`}>{label}</p>
      <div className="flex items-start gap-4">
        <div className={`relative w-32 flex-none overflow-hidden rounded-xl border border-line bg-cream sm:w-40 ${aspect}`}>
          {value ? <SmartImage src={value} alt="" className="absolute inset-0 h-full w-full" sizes="160px" /> : (
            <span className="absolute inset-0 flex items-center justify-center text-muted"><Icon name="image" size={28} /></span>
          )}
          {busy && <span className="absolute inset-0 flex items-center justify-center bg-ivory/70 text-xs font-semibold">Uploading…</span>}
        </div>
        <div className="flex flex-col gap-2">
          <input ref={input} id={id} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic" className="sr-only" aria-labelledby={`${id}-label`}
            onChange={(e) => onFile(e.target.files?.[0])} data-testid={testId} />
          <label htmlFor={id} className="btn btn-ghost btn-sm cursor-pointer"><Icon name="upload" size={16} /> {value ? "Replace" : "Upload"}</label>
          {value && <button type="button" className="btn btn-ghost btn-sm !text-danger" onClick={() => onChange(undefined)}>Remove</button>}
          <p className="hint !mt-0 max-w-[14rem]">{hint ?? "JPG, PNG or WebP. Resized and compressed automatically."}</p>
        </div>
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}
    </div>
  );
}

/** Draft editing with dirty detection. */
export function useDraft<T>(saved: T, ready = true) {
  const [draft, setDraft] = useState<T>(saved);
  const baseline = useRef(JSON.stringify(saved));
  useEffect(() => {
    if (!ready) return;
    const next = JSON.stringify(saved);
    if (next !== baseline.current) {
      baseline.current = next;
      setDraft(saved);
    }
  }, [saved, ready]);
  const dirty = JSON.stringify(draft) !== baseline.current;
  return { draft, setDraft, dirty, reset: () => setDraft(JSON.parse(baseline.current)) };
}

export function MoveButtons({ onUp, onDown, label }: { onUp?: () => void; onDown?: () => void; label: string }) {
  return (
    <span className="inline-flex">
      <button type="button" disabled={!onUp} onClick={onUp} className="rounded-full p-1.5 text-muted hover:bg-cream disabled:opacity-30" aria-label={`Move ${label} up`}><Icon name="arrowUp" size={16} /></button>
      <button type="button" disabled={!onDown} onClick={onDown} className="rounded-full p-1.5 text-muted hover:bg-cream disabled:opacity-30" aria-label={`Move ${label} down`}><Icon name="arrowDown" size={16} /></button>
    </span>
  );
}
