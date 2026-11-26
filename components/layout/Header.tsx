"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { telHref } from "@/lib/phone";
import { directionsUrl, useOpenStatus } from "../site/useClinic";
import { useSite } from "../site/SiteProvider";
import { Icon } from "../ui/Icon";
import { SmartImage } from "../ui/SmartImage";
import { Logo } from "./Logo";
import { NAV_LINKS, TREATMENT_GROUPS } from "./nav";
import { SearchDialog } from "./SearchDialog";

/** Slim bar above the header (tablet and up): where we are, today's status, phone. Scrolls away. */
export function UtilityBar() {
  const { content } = useSite();
  const { contact } = content;
  const status = useOpenStatus();
  return (
    <div className="on-dark hidden bg-charcoal text-[0.74rem] tracking-[0.04em] text-[#e9e4dc] md:block">
      <div className="container-lux flex h-9 items-center justify-between gap-6">
        <a href={directionsUrl(contact.mapsQuery)} target="_blank" rel="noopener noreferrer" className="flex min-h-6 min-w-0 items-center gap-2 hover:text-champagne">
          <Icon name="pin" size={14} className="flex-none text-champagne" />
          <span className="truncate">{contact.address}{contact.city && `, ${contact.city}`}</span>
          <span className="sr-only">(opens directions in Google Maps)</span>
        </a>
        <div className="flex flex-none items-center gap-5">
          <span className="flex items-center gap-2" aria-live="polite">
            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${status?.open ? "bg-[#7fc49a]" : "bg-champagne"}`} />
            <span className="min-w-[11rem]">{status?.label ?? " "}</span>
          </span>
          {contact.phone && (
            <a href={telHref(contact.phone)} className="flex min-h-6 items-center gap-2 hover:text-champagne">
              <Icon name="phone" size={14} className="text-champagne" />
              {contact.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function Header() {
  const { content, treatments } = useSite();
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileTreatments, setMobileTreatments] = useState(false);
  const pathname = usePathname();
  const megaRef = useRef<HTMLDivElement>(null);
  const megaBtn = useRef<HTMLButtonElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<number | undefined>(undefined);

  // Close everything on navigation.
  useEffect(() => {
    setMenuOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock page scroll behind the mobile menu; move focus into it.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    if (menuOpen) closeBtn.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (megaOpen) {
          setMegaOpen(false);
          megaBtn.current?.focus();
        }
        if (menuOpen) {
          setMenuOpen(false);
          menuBtn.current?.focus();
        }
      }
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !/input|textarea|select/i.test((e.target as HTMLElement).tagName))) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (megaOpen && megaRef.current && !megaRef.current.contains(e.target as Node) && !megaBtn.current?.contains(e.target as Node)) setMegaOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [megaOpen, menuOpen]);

  // Hover opens the treatment menu for mouse users; touch and keyboard use the button.
  const hoverOpen = (open: boolean) => (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setMegaOpen(open), open ? 80 : 220);
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const treatmentsActive = ["/treatments", "/skin-care", "/injectables", "/laser", "/wellness", "/conditions"].some((p) => pathname.startsWith(p));
  const navText = "text-[0.72rem] font-medium uppercase tracking-[0.18em]";

  return (
    <header className={`sticky top-0 z-40 border-b bg-ivory transition-[border-color,box-shadow] duration-500 ${scrolled ? "border-line shadow-[0_8px_30px_-22px_rgb(37_37_37/0.45)]" : "border-transparent"}`}>
      <div className="container-lux flex h-[4.25rem] items-center justify-between gap-4 lg:h-[4.75rem]">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex xl:gap-10" onPointerLeave={hoverOpen(false)}>
          <div onPointerEnter={hoverOpen(true)}>
            <button
              ref={megaBtn}
              type="button"
              aria-expanded={megaOpen}
              aria-controls="treatment-menu"
              onClick={() => setMegaOpen((o) => !o)}
              className={`group flex items-center gap-1.5 py-3 ${navText} transition-colors hover:text-gold ${treatmentsActive ? "text-gold" : "text-charcoal"}`}
            >
              Treatments
              <Icon name="chevron" size={14} className={`transition-transform duration-300 ${megaOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              onPointerEnter={hoverOpen(false)}
              className={`relative py-3 ${navText} transition-colors hover:text-gold ${isActive(l.href) ? "text-gold after:absolute after:inset-x-0 after:bottom-1.5 after:h-px after:bg-champagne" : "text-charcoal"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-11 w-11 items-center justify-center text-charcoal transition-colors hover:text-gold"
            aria-label="Search"
            data-testid="open-search"
          >
            <Icon name="search" size={20} />
          </button>
          <Link href="/book" className="btn btn-primary btn-sm hidden md:inline-flex">Book an Appointment</Link>
          <button
            ref={menuBtn}
            type="button"
            className="flex h-11 w-11 items-center justify-center text-charcoal lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" size={24} />
          </button>
        </div>
      </div>

      {/* Desktop treatment menu */}
      <div
        id="treatment-menu"
        ref={megaRef}
        data-open={megaOpen}
        onPointerEnter={hoverOpen(true)}
        onPointerLeave={hoverOpen(false)}
        className="menu-pop absolute inset-x-0 top-full hidden border-y border-line bg-ivory shadow-[0_30px_60px_-40px_rgb(37_37_37/0.5)] lg:block"
      >
        <div className="container-lux grid gap-8 py-10 xl:grid-cols-[1fr_17rem]">
          <div className="grid grid-cols-4 gap-8">
            {TREATMENT_GROUPS.map((g) => (
              <div key={g.id}>
                <Link href={g.href} className="font-serif text-[1.55rem] leading-tight text-charcoal hover:text-gold">{g.label}</Link>
                <span aria-hidden="true" className="mt-3 block h-px w-8 bg-champagne" />
                <ul className="mt-4 space-y-2.5">
                  {treatments.filter((t) => t.category === g.id).slice(0, 7).map((t) => (
                    <li key={t.id}>
                      <Link href={`/treatments/${t.slug}`} className="text-[0.92rem] text-muted transition-colors hover:text-charcoal">{t.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="hidden xl:block">
            <Link href="/book?treatment=consultation" className="group block">
              <SmartImage src="/images/p-consultation.jpg" alt="" className="grade zoom-img aspect-[4/3]" sizes="272px" />
              <p className="mt-4 font-serif text-xl text-charcoal">Not sure where to start?</p>
              <p className="mt-1 text-sm text-muted">Book a consultation and we will build a plan with you.</p>
            </Link>
          </div>
          <div className="col-span-full flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-line pt-6">
            <Link href="/treatments" className="link-lux">All treatments <Icon name="arrow" size={14} /></Link>
            <Link href="/conditions" className="link-lux">Shop by skin concern <Icon name="arrow" size={14} /></Link>
            <Link href="/skin-finder" className="link-lux">Treatment finder <Icon name="arrow" size={14} /></Link>
          </div>
        </div>
      </div>

      {/* Mobile & tablet menu */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        data-open={menuOpen}
        className="menu-pop fixed inset-0 z-50 flex flex-col bg-ivory lg:hidden"
      >
        <div className="container-lux flex h-[4.25rem] flex-none items-center justify-between border-b border-line">
          <Logo />
          <button ref={closeBtn} type="button" className="flex h-11 w-11 items-center justify-center text-charcoal" aria-label="Close menu" onClick={() => { setMenuOpen(false); menuBtn.current?.focus(); }}>
            <Icon name="close" size={24} />
          </button>
        </div>
        <nav aria-label="Mobile" className="container-lux flex-1 overflow-y-auto pb-10 pt-4">
          <div className="border-b border-line">
            <button
              type="button"
              aria-expanded={mobileTreatments}
              aria-controls="mobile-treatments"
              onClick={() => setMobileTreatments((o) => !o)}
              className="flex w-full items-center justify-between py-4 text-left font-serif text-[1.85rem] text-charcoal"
            >
              Treatments
              <Icon name="plus" size={20} className={`text-gold transition-transform duration-300 ${mobileTreatments ? "rotate-45" : ""}`} />
            </button>
            <ul id="mobile-treatments" hidden={!mobileTreatments} className="pb-4">
              {TREATMENT_GROUPS.map((g) => (
                <li key={g.id}>
                  <Link href={g.href} className="flex min-h-12 items-center justify-between py-2 text-[1.05rem] text-charcoal">
                    {g.label}
                    <span className="text-xs text-muted">{treatments.filter((t) => t.category === g.id).length}</span>
                  </Link>
                </li>
              ))}
              <li><Link href="/treatments" className="flex min-h-12 items-center py-2 text-[1.05rem] text-gold">All treatments</Link></li>
              <li><Link href="/conditions" className="flex min-h-12 items-center py-2 text-[1.05rem] text-gold">Shop by skin concern</Link></li>
            </ul>
          </div>
          {[...NAV_LINKS, { href: "/blog", label: "Journal" }].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className="flex items-center justify-between border-b border-line py-4 font-serif text-[1.85rem] text-charcoal"
            >
              {l.label}
              <Icon name="chevronRight" size={20} className="text-champagne" />
            </Link>
          ))}
          <Link href="/book" className="btn btn-primary mt-8 w-full">Book an Appointment</Link>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {content.contact.phone && (
              <a href={telHref(content.contact.phone)} className="btn btn-ghost"><Icon name="phone" size={16} /> Call</a>
            )}
            <a href={directionsUrl(content.contact.mapsQuery)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><Icon name="directions" size={16} /> Directions</a>
          </div>
          <p className="mt-8 text-sm leading-relaxed text-muted">
            {content.contact.address}
            {content.contact.city && <><br />{content.contact.city}</>}
          </p>
        </nav>
      </div>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}

