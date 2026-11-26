"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { telHref } from "@/lib/phone";
import { useSite } from "../site/SiteProvider";
import { directionsUrl } from "../site/useClinic";
import { Icon } from "../ui/Icon";

/**
 * Phones only: Call · Directions · Book, always within thumb reach.
 * Hidden on the booking page (the form needs the space) and in the admin.
 */
export function MobileActionBar() {
  const pathname = usePathname();
  const { content } = useSite();
  if (pathname.startsWith("/admin") || pathname.startsWith("/book")) return null;
  const { phone, mapsQuery } = content.contact;
  const item = "flex min-h-[3.5rem] flex-1 flex-col items-center justify-center gap-1 text-[0.62rem] font-medium uppercase tracking-[0.16em]";
  return (
    <nav
      aria-label="Quick actions"
      data-action-bar
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-ivory pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-20px_rgb(37_37_37/0.35)] md:hidden"
    >
      {phone && (
        <a href={telHref(phone)} className={`${item} text-charcoal`}>
          <Icon name="phone" size={19} className="text-gold" /> Call
        </a>
      )}
      <a href={directionsUrl(mapsQuery)} target="_blank" rel="noopener noreferrer" className={`${item} border-l border-line text-charcoal`}>
        <Icon name="directions" size={19} className="text-gold" /> Directions
      </a>
      <Link href="/book" className={`${item} flex-[1.4] bg-charcoal text-ivory`}>
        <Icon name="calendar" size={19} className="text-champagne" /> Book now
      </Link>
    </nav>
  );
}
