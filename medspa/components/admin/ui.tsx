"use client";

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { api, uploadImage } from "@/lib/client/api";
import { prepareImage } from "@/lib/client/compress";
import { STARTER_IMAGES } from "@/lib/starter-images";
import type { MediaFile } from "@/lib/types";
import { Icon } from "../ui/Icon";

/* ================================ basics ================================ */

export const btn = {
  primary: "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md bg-stone-900 px-4 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50",
  secondary: "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-4 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50",
  ghost: "inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-md px-2.5 text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-40",
  danger: "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50",
  success: "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50",
};

export const inputCls = "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-[0.95rem] text-stone-900 shadow-sm outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200 disabled:bg-stone-100";

export function Card({ title, description, children, actions, id }: { title?: string; description?: ReactNode; children: ReactNode; actions?: ReactNode; id?: string }) {
  return (
    <section id={id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
      {(title || actions) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-lg font-semibold text-stone-900">{title}</h2>}
            {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function PageTitle({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-stone-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Field({ label, hint, children, error }: { label: string; hint?: ReactNode; children: (id: string) => ReactNode; error?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-stone-800">{label}</label>
      {children(id)}
      {hint && <p className="mt-1.5 text-xs text-stone-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

export function Text({ label, value, onChange, hint, placeholder, type = "text", maxLength, required }: { label: string; value: string; onChange: (v: string) => void; hint?: ReactNode; placeholder?: string; type?: string; maxLength?: number; required?: boolean }) {
  return <Field label={label} hint={hint}>{(id) => <input id={id} type={type} className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} required={required} />}</Field>;
}

export function Area({ label, value, onChange, hint, rows = 4, placeholder, formatting }: { label: string; value: string; onChange: (v: string) => void; hint?: ReactNode; rows?: number; placeholder?: string; formatting?: boolean }) {
  return (
    <Field label={label} hint={hint ?? (formatting ? <>Formatting: blank line = new paragraph · <code>## Heading</code> · <code>- list item</code> · <code>**bold**</code> · <code>*italic*</code> · <code>[link text](/page)</code></> : undefined)}>
      {(id) => <textarea id={id} rows={rows} className={`${inputCls} leading-relaxed`} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />}
    </Field>
  );
}

export function Num({ label, value, onChange, hint, min, max, step }: { label: string; value: number; onChange: (v: number) => void; hint?: ReactNode; min?: number; max?: number; step?: number }) {
  return <Field label={label} hint={hint}>{(id) => <input id={id} type="number" className={inputCls} value={Number.isFinite(value) ? value : 0} min={min} max={max} step={step} onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} />}</Field>;
}

export function Select<T extends string | number>({ label, value, onChange, options, hint }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; hint?: ReactNode }) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <select id={id} className={inputCls} value={String(value)} onChange={(e) => onChange((typeof value === "number" ? Number(e.target.value) : e.target.value) as T)}>
          {options.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
        </select>
      )}
    </Field>
  );
}

export function Toggle({ label, checked, onChange, hint, disabled }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; hint?: ReactNode; disabled?: boolean }) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <span className="relative mt-0.5 inline-flex flex-none">
        <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-stone-300 transition-colors peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-stone-400" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
      <span>
        <span className="block text-sm font-medium text-stone-800">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-stone-500">{hint}</span>}
      </span>
    </label>
  );
}

export function Badge({ children, tone = "stone" }: { children: ReactNode; tone?: "stone" | "green" | "amber" | "red" | "blue" }) {
  const t = { stone: "bg-stone-100 text-stone-700", green: "bg-emerald-50 text-emerald-800", amber: "bg-amber-50 text-amber-800", red: "bg-red-50 text-red-700", blue: "bg-sky-50 text-sky-800" }[tone];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${t}`}>{children}</span>;
}

export function Grid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
  return <div className={`grid gap-5 ${cols === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>{children}</div>;
}

export function Notice({ children, tone = "amber" }: { children: ReactNode; tone?: "amber" | "blue" | "red" | "green" }) {
  const t = { amber: "border-amber-200 bg-amber-50 text-amber-900", blue: "border-sky-200 bg-sky-50 text-sky-900", red: "border-red-200 bg-red-50 text-red-800", green: "border-emerald-200 bg-emerald-50 text-emerald-900" }[tone];
  return <div className={`flex gap-2.5 rounded-lg border p-3.5 text-sm leading-relaxed ${t}`}><Icon name="info" size={17} className="mt-0.5 flex-none" /><div>{children}</div></div>;
}

/* ================================ toasts ================================ */

type Toast = { id: number; text: string; tone: "ok" | "error" };
const ToastCtx = createContext<(text: string, tone?: Toast["tone"]) => void>(() => undefined);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "error" ? 7000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role={t.tone === "error" ? "alert" : "status"} className={`pointer-events-auto rounded-lg px-4 py-3 text-sm shadow-lg ${t.tone === "error" ? "bg-red-700 text-white" : "bg-stone-900 text-white"}`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ================================ modal ================================ */

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-stone-900/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-2xl ${wide ? "sm:max-w-4xl" : "sm:max-w-xl"}`}>
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className={btn.ghost} onClick={onClose} aria-label="Close"><Icon name="close" size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-stone-200 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/* ============================= image picker ============================= */

export function MediaLibrary({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (url: string) => void }) {
  const [files, setFiles] = useState<MediaFile[] | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useEffect(() => {
    if (!open) return;
    api<{ files: MediaFile[] }>("/api/admin/media").then((r) => setFiles(r.files)).catch((e) => toast(e.message, "error"));
  }, [open, toast]);
  async function upload(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(list)) {
        const blob = await prepareImage(f);
        const up = await uploadImage(blob);
        setFiles((x) => [{ path: up.path, url: up.url, size: blob.size, createdAt: new Date().toISOString() }, ...(x ?? [])]);
      }
      toast("Uploaded");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }
  const tile = (url: string, label?: string) => (
    <button key={url} type="button" onClick={() => { onPick(url); onClose(); }} className="group relative aspect-square overflow-hidden rounded-lg border border-stone-200 bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-500">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
      {label && <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1.5 py-0.5 text-[10px] text-white">{label}</span>}
    </button>
  );
  return (
    <Modal open={open} onClose={onClose} title="Choose an image" wide>
      <label className={`${btn.primary} cursor-pointer`}>
        <Icon name="arrow" size={16} className="-rotate-90" /> {busy ? "Uploading…" : "Upload new images"}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" disabled={busy} onChange={(e) => upload(e.target.files)} />
      </label>
      <h3 className="mb-2 mt-6 text-sm font-semibold">Your uploads</h3>
      {files === null ? <p className="text-sm text-stone-500">Loading…</p> : files.length === 0 ? <p className="text-sm text-stone-500">No uploads yet.</p> : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{files.map((f) => tile(f.url))}</div>
      )}
      <h3 className="mb-2 mt-6 text-sm font-semibold">Starter photos <span className="font-normal text-stone-500">(stock, illustrative only)</span></h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{STARTER_IMAGES.map((u) => tile(u, "stock"))}</div>
    </Modal>
  );
}

export function ImagePicker({ label, value, onChange, alt, onAltChange, hint, aspect = "aspect-[4/3]" }: { label: string; value?: string; onChange: (v: string | undefined) => void; alt?: string; onAltChange?: (v: string) => void; hint?: ReactNode; aspect?: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const inputId = useId();
  async function quickUpload(f?: File) {
    if (!f) return;
    setBusy(true);
    try {
      const up = await uploadImage(await prepareImage(f));
      onChange(up.url);
      toast("Image uploaded. Remember to save.");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-stone-800">{label}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className={`relative w-full overflow-hidden rounded-lg border border-dashed border-stone-300 bg-stone-50 sm:w-44 ${aspect}`}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center p-3 text-center text-xs text-stone-500">No image</span>
          )}
          {value?.startsWith("/images/") && <span className="absolute left-1.5 top-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">Stock photo</span>}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <label htmlFor={inputId} className={`${btn.secondary} cursor-pointer`}>{busy ? "Uploading…" : value ? "Replace (upload)" : "Upload"}</label>
            <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={busy} onChange={(e) => quickUpload(e.target.files?.[0])} />
            <button type="button" className={btn.secondary} onClick={() => setOpen(true)}>Library</button>
            {value && <button type="button" className={btn.ghost} onClick={() => onChange(undefined)}>Remove</button>}
          </div>
          {onAltChange && (
            <input className={inputCls} placeholder="Describe the image (for accessibility and Google)" value={alt ?? ""} onChange={(e) => onAltChange(e.target.value)} aria-label={`${label}: description`} />
          )}
          {hint && <p className="text-xs text-stone-500">{hint}</p>}
        </div>
      </div>
      <MediaLibrary open={open} onClose={() => setOpen(false)} onPick={(u) => onChange(u)} />
    </div>
  );
}

/* ============================ link editor ============================ */

export function LinkEditor({ label, value, onChange, pages }: { label: string; value: { label: string; href: string }; onChange: (v: { label: string; href: string }) => void; pages?: { slug: string; title: string }[] }) {
  const listId = useId();
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-stone-800">{label}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input className={inputCls} placeholder="Button text (empty = hidden)" value={value?.label ?? ""} onChange={(e) => onChange({ ...value, label: e.target.value })} aria-label={`${label} text`} />
        <input className={inputCls} placeholder="/book, /treatments, tel:+1305…, https://…" list={listId} value={value?.href ?? ""} onChange={(e) => onChange({ ...value, href: e.target.value })} aria-label={`${label} link`} />
        <datalist id={listId}>
          {pages?.map((p) => <option key={p.slug} value={p.slug ? `/${p.slug}` : "/"}>{p.title}</option>)}
        </datalist>
      </div>
    </div>
  );
}

/* ============================ string list ============================ */

export function StringList({ label, values, onChange, placeholder, hint }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string; hint?: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-stone-800">{label}</p>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input className={inputCls} value={v} placeholder={placeholder} onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`${label} ${i + 1}`} />
            <button type="button" className={btn.ghost} onClick={() => onChange(values.filter((_, j) => j !== i))} aria-label="Remove"><Icon name="close" size={16} /></button>
          </div>
        ))}
        <button type="button" className={btn.secondary} onClick={() => onChange([...values, ""])}>+ Add</button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

/* ============================ drag & drop ============================ */

export function useDnd() {
  return useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
}

/** Vertical list reorderable by drag handle (mouse, touch and keyboard). */
export function SortableList<T extends { id: string }>({ items, onReorder, render }: { items: T[]; onReorder: (next: T[]) => void; render: (item: T, handle: ReactNode, index: number) => ReactNode }) {
  const sensors = useDnd();
  const onEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = items.findIndex((i) => i.id === e.active.id);
    const to = items.findIndex((i) => i.id === e.over!.id);
    onReorder(arrayMove(items, from, to));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map((it, i) => <SortableRow key={it.id} id={it.id}>{(handle) => render(it, handle, i)}</SortableRow>)}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, children }: { id: string; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button type="button" className="flex h-10 w-8 flex-none cursor-grab touch-none items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700 active:cursor-grabbing" aria-label="Drag to reorder" {...attributes} {...listeners}>
      <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor" aria-hidden="true"><circle cx="4" cy="4" r="1.6" /><circle cx="10" cy="4" r="1.6" /><circle cx="4" cy="10" r="1.6" /><circle cx="10" cy="10" r="1.6" /><circle cx="4" cy="16" r="1.6" /><circle cx="10" cy="16" r="1.6" /></svg>
    </button>
  );
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined, position: "relative" }} className={isDragging ? "opacity-80 shadow-lg" : ""}>
      {children(handle)}
    </li>
  );
}

export function moveItem<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const to = index + dir;
  if (to < 0 || to >= list.length) return list;
  return arrayMove(list, index, to);
}

/* ============================== save bar ============================== */

export function SaveBar({ dirty, saving, onSave, onReset, extra }: { dirty: boolean; saving: boolean; onSave: () => void; onReset?: () => void; extra?: ReactNode }) {
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600" aria-live="polite">{saving ? "Saving…" : dirty ? "You have unsaved changes." : "All changes saved."}</p>
        <div className="flex flex-wrap gap-2">
          {extra}
          {onReset && dirty && <button type="button" className={btn.secondary} onClick={onReset} disabled={saving}>Discard</button>}
          <button type="button" className={btn.primary} onClick={onSave} disabled={!dirty || saving} data-testid="save">{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </div>
    </div>
  );
}

/** Local editable copy of a value with dirty tracking. */
export function useDraft<T>(source: T) {
  const [draft, setDraft] = useState<T>(source);
  const [base, setBase] = useState(source);
  useEffect(() => {
    setDraft(source);
    setBase(source);
  }, [source]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(base);
  return { draft, setDraft, dirty, reset: () => setDraft(base) };
}
