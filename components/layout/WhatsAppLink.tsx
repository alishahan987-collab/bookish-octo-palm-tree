"use client";

import { useState, type ReactNode } from "react";
import { useSite } from "../site/SiteProvider";
import { Dialog } from "../ui/Dialog";

/** Opens WhatsApp with the clinic number from Admin → Contact. If none is set, explains rather than linking nowhere. */
export function WhatsAppLink({
  className,
  children,
  message = "Assalam-o-Alaikum, I would like to ask about a treatment.",
  ariaLabel,
}: {
  className?: string;
  children: ReactNode;
  message?: string;
  ariaLabel?: string;
}) {
  const { content } = useSite();
  const [open, setOpen] = useState(false);
  const number = content.contact.whatsapp.replace(/\D/g, "");

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
      <Dialog open={open} onClose={() => setOpen(false)} title="WhatsApp">
        <p className="leading-relaxed text-muted">The clinic&apos;s WhatsApp number has not been added yet. Once it is set in the admin dashboard, this button opens a chat directly.</p>
        <button type="button" className="btn btn-primary mt-5 w-full" onClick={() => setOpen(false)}>OK</button>
      </Dialog>
    </>
  );
}
