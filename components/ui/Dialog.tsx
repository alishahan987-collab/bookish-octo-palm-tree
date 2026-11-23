"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";

/** Accessible modal built on the native <dialog> element (focus trap + Esc for free). */
export function Dialog({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
      className={`m-auto w-[calc(100%-2rem)] ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90dvh] overflow-y-auto rounded-3xl border border-line bg-ivory p-0 text-ink shadow-[var(--shadow-lift)] backdrop:bg-charcoal/45 backdrop:backdrop-blur-sm`}
    >
      {open && (
        <div className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl">{title}</h2>
            <button type="button" onClick={onClose} className="-mr-2 -mt-1 rounded-full p-2 text-muted hover:bg-cream hover:text-charcoal" aria-label="Close">
              <Icon name="close" />
            </button>
          </div>
          <div className="mt-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}
