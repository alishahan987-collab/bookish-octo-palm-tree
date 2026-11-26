"use client";

import type { ReactNode } from "react";
import { useSite } from "../site/SiteProvider";

/**
 * Opens WhatsApp with the clinic number from Admin → Contact.
 * Renders nothing until a number is set (WhatsApp is optional for this clinic).
 */
export function WhatsAppLink({
  className,
  children,
  message = "Hello, I would like to ask about a treatment.",
  ariaLabel,
}: {
  className?: string;
  children: ReactNode;
  message?: string;
  ariaLabel?: string;
}) {
  const { content } = useSite();
  const number = content.contact.whatsapp.replace(/\D/g, "");
  if (!number) return null;
  return (
    <a href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={className} aria-label={ariaLabel}>
      {children}
    </a>
  );
}
