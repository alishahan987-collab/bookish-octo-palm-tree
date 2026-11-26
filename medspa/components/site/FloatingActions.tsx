"use client";

import { usePathname } from "next/navigation";
import { Icon } from "../ui/Icon";

/** Phone-only bottom bar: Call, Book and WhatsApp within thumb reach. */
export function FloatingActions({ phone, book, whatsapp }: { phone?: string; book?: { label: string; href: string } | null; whatsapp?: string }) {
  const pathname = usePathname();
  const showBook = book && !pathname.startsWith("/book");
  const items = [phone && "call", showBook && "book", whatsapp && "wa"].filter(Boolean);
  if (!items.length) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur md:hidden">
      <div className="flex gap-2">
        {phone && (
          <a href={`tel:${phone}`} className="btn btn-outline !min-h-[46px] flex-1 !px-3" aria-label="Call us">
            <Icon name="phone" size={16} /> Call
          </a>
        )}
        {showBook && (
          <a href={book!.href} className="btn btn-primary !min-h-[46px] flex-[1.6] !px-3" {...(book!.href.startsWith("/") ? {} : { target: "_blank", rel: "noopener noreferrer" })}>
            <Icon name="calendar" size={16} /> {book!.label}
          </a>
        )}
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-outline !min-h-[46px] !w-[52px] !px-0" aria-label="Message us on WhatsApp">
            <Icon name="whatsapp" size={20} />
          </a>
        )}
      </div>
    </div>
  );
}
