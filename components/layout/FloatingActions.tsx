"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../ui/Icon";
import { WhatsAppLink } from "./WhatsAppLink";

export function FloatingActions() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  const onBook = pathname.startsWith("/book");
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex items-end justify-between gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-end">
      {!onBook && (
        <Link href="/book" className="btn btn-primary pointer-events-auto shadow-[var(--shadow-lift)] sm:order-1">
          <Icon name="calendar" size={18} /> Book
        </Link>
      )}
      <WhatsAppLink
        ariaLabel="Chat on WhatsApp"
        className="pointer-events-auto ml-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-[var(--shadow-lift)] transition-transform hover:scale-105 sm:order-2 sm:ml-0"
      >
        <Icon name="whatsapp" size={28} />
      </WhatsAppLink>
    </div>
  );
}
