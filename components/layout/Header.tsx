"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "../ui/Icon";
import { Logo } from "./Logo";
import { NAV_LINKS } from "./nav";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => !href.includes("#") && pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ivory/85 backdrop-blur-md">
      <div className="container-lux flex h-[4.25rem] items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-[0.88rem] font-medium transition-colors hover:text-gold ${isActive(l.href) ? "text-gold" : "text-ink"}`}
              aria-current={isActive(l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/book" className="btn btn-primary btn-sm hidden sm:inline-flex">
            Book appointment
          </Link>
          <button
            type="button"
            className="rounded-full p-2.5 text-charcoal hover:bg-cream lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? "close" : "menu"} size={24} />
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="absolute inset-x-0 top-full z-40 h-[calc(100dvh-4.25rem)] overflow-y-auto border-t border-line bg-ivory pb-24 lg:hidden">
          <nav aria-label="Mobile" className="container-lux flex flex-col py-6">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-b border-line py-4 font-serif text-3xl text-charcoal"
              >
                {l.label}
                <Icon name="chevronRight" className="text-gold" />
              </Link>
            ))}
            <Link href="/book" onClick={() => setOpen(false)} className="btn btn-primary mt-8 w-full">
              Book appointment
            </Link>
            <Link href="/admin" onClick={() => setOpen(false)} className="mt-6 text-center text-sm text-muted underline underline-offset-4">
              Clinic admin (demo)
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
