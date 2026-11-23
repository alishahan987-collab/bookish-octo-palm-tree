"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "../ui/Icon";
import { Logo } from "./Logo";
import { NAV_LINKS } from "./nav";
import { SearchDialog } from "./SearchDialog";

export function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !/input|textarea|select/i.test((e.target as HTMLElement).tagName))) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ivory/90 backdrop-blur-md">
      <div className="mx-auto flex h-[4.5rem] max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-6 xl:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              title={l.label}
              aria-label={l.label === l.short ? undefined : l.label}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`relative py-2 text-[0.86rem] font-medium transition-colors hover:text-gold ${isActive(l.href) ? "text-gold after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-gold" : "text-ink"}`}
            >
              {l.short}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-full border border-sand px-3 py-2 text-sm text-muted transition-colors hover:border-champagne hover:text-charcoal"
            aria-label="Open search"
            data-testid="open-search"
          >
            <Icon name="search" size={18} />
            <span className="hidden md:inline">Search</span>
          </button>
          <Link href="/book" className="btn btn-primary btn-sm hidden sm:inline-flex">Book appointment</Link>
          <button
            type="button"
            className="rounded-full p-2.5 text-charcoal hover:bg-cream xl:hidden"
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
        <div id="mobile-menu" className="absolute inset-x-0 top-full z-40 h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-line bg-ivory pb-24 xl:hidden">
          <nav aria-label="Mobile" className="container-lux flex flex-col py-4">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(l.href) ? "page" : undefined}
                className="flex items-center justify-between border-b border-line py-3.5 font-serif text-[1.65rem] text-charcoal"
              >
                {l.label}
                <Icon name="chevronRight" className="text-gold" />
              </Link>
            ))}
            <Link href="/conditions" onClick={() => setOpen(false)} className="flex items-center justify-between border-b border-line py-3.5 font-serif text-[1.65rem] text-charcoal">
              Skin Conditions <Icon name="chevronRight" className="text-gold" />
            </Link>
            <Link href="/book" onClick={() => setOpen(false)} className="btn btn-primary mt-8 w-full">Book appointment</Link>
          </nav>
        </div>
      )}
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
