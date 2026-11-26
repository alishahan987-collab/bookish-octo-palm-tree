"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ResolvedLink } from "@/lib/links";
import { Icon } from "../ui/Icon";
import { Img } from "../ui/Img";

export interface HeaderProps {
  links: ResolvedLink[];
  logo?: string;
  logoText: string;
  logoSubtext: string;
  businessName: string;
  phone: string;
  phoneDisplay: string;
  showPhone: boolean;
  book: { label: string; href: string } | null;
}

function NavAnchor({ link, className, onClick }: { link: ResolvedLink; className: string; onClick?: () => void }) {
  if (link.href.startsWith("/")) return <Link href={link.href} className={className} onClick={onClick}>{link.label}</Link>;
  return <a href={link.href} className={className} onClick={onClick} target={link.newTab ? "_blank" : undefined} rel="noopener noreferrer">{link.label}</a>;
}

export function Header(p: HeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const bookIsInternal = p.book?.href.startsWith("/");

  const logo = (
    <Link href="/" className="flex min-w-0 items-center gap-3">
      {p.logo ? (
        <Img src={p.logo} alt={`${p.businessName}, home`} width={180} height={56} className="h-11 w-auto object-contain md:h-12" priority />
      ) : (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.65rem] tracking-[0.18em] md:text-[1.85rem]">{p.logoText}</span>
          {p.logoSubtext && <span className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-fg-muted">{p.logoSubtext}</span>}
          <span className="sr-only">, home</span>
        </span>
      )}
    </Link>
  );

  return (
    <>
    <header className={`sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300 ${scrolled || open ? "border-line bg-bg/95 shadow-[0_6px_24px_-18px_rgba(0,0,0,.35)] backdrop-blur" : "border-transparent bg-bg"}`}>
      <div className="container-x flex h-[72px] items-center justify-between gap-4 md:h-20">
        {logo}
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-7 xl:gap-9">
            {p.links.map((l) => (
              <li key={l.id}>
                <NavAnchor link={l} className={`link-underline py-1 text-[0.82rem] font-medium uppercase tracking-[0.14em] ${isActive(l.href) ? "bg-[length:100%_1px] text-fg" : "text-fg/80 hover:text-fg"}`} />
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2 md:gap-3">
          {p.showPhone && p.phone && (
            <a href={`tel:${p.phone}`} className="hidden items-center gap-2 text-sm font-medium xl:inline-flex">
              <Icon name="phone" size={16} />
              {p.phoneDisplay}
            </a>
          )}
          {p.book && (
            bookIsInternal ? (
              <Link href={p.book.href} className="btn btn-primary hidden !min-h-[44px] !px-5 sm:inline-flex">{p.book.label}</Link>
            ) : (
              <a href={p.book.href} target="_blank" rel="noopener noreferrer" className="btn btn-primary hidden !min-h-[44px] !px-5 sm:inline-flex">{p.book.label}</a>
            )
          )}
          <button
            ref={toggleRef}
            type="button"
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "close" : "menu"} size={24} />
          </button>
        </div>
      </div>

    </header>
      {open && (
        <div id="mobile-menu" ref={panelRef} className="fixed inset-0 z-50 overflow-y-auto bg-bg lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="container-x flex h-[72px] items-center justify-between md:h-20">
            {logo}
            <button type="button" className="-mr-2 inline-flex h-11 w-11 items-center justify-center" aria-label="Close menu" onClick={() => { setOpen(false); toggleRef.current?.focus(); }}>
              <Icon name="close" size={24} />
            </button>
          </div>
          <nav aria-label="Mobile" className="container-x flex flex-col pb-10 pt-4">
            <ul className="divide-y divide-line border-y border-line">
              {p.links.map((l) => (
                <li key={l.id}>
                  <NavAnchor link={l} onClick={() => setOpen(false)} className={`flex min-h-[56px] items-center justify-between font-display text-2xl ${isActive(l.href) ? "text-accent-ink" : ""}`} />
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3">
              {p.book && (bookIsInternal ? <Link href={p.book.href} onClick={() => setOpen(false)} className="btn btn-primary w-full">{p.book.label}</Link> : <a href={p.book.href} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full">{p.book.label}</a>)}
              {p.phone && (
                <a href={`tel:${p.phone}`} className="btn btn-outline w-full">
                  <Icon name="phone" size={16} /> Call {p.phoneDisplay}
                </a>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
