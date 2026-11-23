"use client";

import { useState, type ReactNode } from "react";
import { Dialog } from "../ui/Dialog";
import { useSettings } from "./useSettings";

/**
 * Opens WhatsApp with the clinic's number once it has been entered in
 * Admin → Clinic settings. Until then, explains that the number is pending
 * instead of linking to a made-up number.
 */
export function WhatsAppLink({
  className,
  children,
  message = "Assalam-o-Alaikum, I would like to ask about a treatment at Aesthetica.",
  ariaLabel,
}: {
  className?: string;
  children: ReactNode;
  message?: string;
  ariaLabel?: string;
}) {
  const { data: settings } = useSettings();
  const [open, setOpen] = useState(false);
  const number = settings.whatsappNumber.replace(/\D/g, "");

  if (number) {
    return (
      <a href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={className} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} aria-label={ariaLabel} aria-haspopup="dialog">
        {children}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="WhatsApp chat">
        <p className="leading-relaxed text-muted">
          This button will open a WhatsApp chat with the clinic&apos;s official number. The number has not been added to this design preview yet.
        </p>
        <div className="mt-4 rounded-2xl bg-cream p-4 text-sm">
          <p className="font-semibold text-charcoal">Pre-filled message preview</p>
          <p className="mt-1 text-muted">&ldquo;{message}&rdquo;</p>
        </div>
        <p className="mt-4 text-xs text-muted">Demo tip: enter a number under Admin → Clinic settings and this button will open WhatsApp directly.</p>
        <button type="button" className="btn btn-primary mt-5 w-full" onClick={() => setOpen(false)}>
          Got it
        </button>
      </Dialog>
    </>
  );
}
