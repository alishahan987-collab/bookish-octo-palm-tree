"use client";

import Link from "next/link";
import { useState } from "react";
import { WEEKDAYS, formatTime } from "@/lib/dates";
import { formatPKR, packageSaving, promoSavingPercent } from "@/lib/pricing";
import type { Treatment } from "@/lib/data/types";
import { WhatsAppLink } from "../layout/WhatsAppLink";
import { useSettings } from "../layout/useSettings";
import { TreatmentCard } from "../treatments/TreatmentCard";
import { useTreatments } from "../treatments/useTreatments";
import { TreatmentArt } from "../ui/Art";
import { Icon } from "../ui/Icon";
import { Reveal } from "../ui/Motion";
import { Placeholder, SectionHeading } from "../ui/SectionHeading";

/* --------------------------- Featured treatments --------------------------- */

export function FeaturedTreatments({ initial }: { initial: Treatment[] }) {
  const { data } = useTreatments(initial);
  const featured = data.filter((t) => t.featured).slice(0, 6);
  return (
    <section className="container-lux py-16 sm:py-24" aria-labelledby="featured-title">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHeading id="featured-title" eyebrow="Featured treatments" title="Most requested" />
        <Link href="/treatments" className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold-deep">
          All treatments <Icon name="arrow" size={16} />
        </Link>
      </div>
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((t, i) => (
          <li key={t.id}>
            <Reveal delay={(i % 3) * 0.06} className="h-full">
              <TreatmentCard t={t} />
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------ Special offers ------------------------------ */

export function SpecialOffers({ initial }: { initial: Treatment[] }) {
  const { data, ready } = useTreatments(initial);
  const promos = data.filter((t) => t.price.type === "promo");
  const packages = data.filter((t) => t.price.type === "package");

  return (
    <section id="offers" className="bg-cream py-16 sm:py-24" aria-labelledby="offers-title">
      <div className="container-lux">
        <SectionHeading id="offers-title" eyebrow="Special offers" title="Current offers & packages">
          Offers are managed by the clinic and update here automatically.
        </SectionHeading>
        {promos.length + packages.length === 0 ? (
          <Placeholder className="mt-10">There are no offers running at the moment. Please check back soon.</Placeholder>
        ) : (
          <ul className={`mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3 transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`} aria-busy={!ready}>
            {promos.map((t) => t.price.type === "promo" && (
              <li key={t.id} className="card relative flex flex-col overflow-hidden" data-testid={`offer-${t.slug}`}>
                <TreatmentArt palette={t.palette} variant={2} className="aspect-[16/8] w-full" />
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex flex-wrap gap-2">
                    {t.price.label && <span className="chip bg-charcoal text-ivory">{t.price.label}</span>}
                    <span className="chip bg-champagne-soft text-gold-deep">Save {promoSavingPercent(t.price.regular, t.price.promo)}%</span>
                  </div>
                  <h3 className="mt-4 text-[1.7rem]">{t.name}</h3>
                  <p className="mt-3 flex items-baseline gap-3">
                    <span className="font-serif text-3xl text-charcoal" data-testid="offer-price">{formatPKR(t.price.promo)}</span>
                    <s className="text-muted">{formatPKR(t.price.regular)}</s>
                  </p>
                  {t.price.unit && <p className="text-sm text-muted">{t.price.unit}</p>}
                  <div className="mt-auto flex gap-3 pt-6">
                    <Link href={`/book?treatment=${t.slug}`} className="btn btn-primary btn-sm">Book offer</Link>
                    <Link href={`/treatments/${t.slug}`} className="btn btn-ghost btn-sm">Details<span className="sr-only"> about {t.name}</span></Link>
                  </div>
                </div>
              </li>
            ))}
            {packages.map((t) => t.price.type === "package" && (
              <li key={t.id} className="card relative flex flex-col overflow-hidden" data-testid={`offer-${t.slug}`}>
                <TreatmentArt palette={t.palette} variant={2} className="aspect-[16/8] w-full" />
                <div className="flex flex-1 flex-col p-6">
                  <span className="chip w-fit bg-charcoal text-ivory">Package</span>
                  <h3 className="mt-4 text-[1.7rem]">{t.name}</h3>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {t.price.packages.map((p) => (
                      <li key={p.sessions} className="flex justify-between gap-3">
                        <span className="text-charcoal">{p.sessions} sessions · <span className="font-semibold">{formatPKR(p.price)}</span></span>
                        {packageSaving(t.price.type === "package" ? t.price.perSession : 0, p) > 0 && (
                          <span className="text-success">save {formatPKR(packageSaving(t.price.type === "package" ? t.price.perSession : 0, p))}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto flex gap-3 pt-6">
                    <Link href={`/book?treatment=${t.slug}`} className="btn btn-primary btn-sm">Book</Link>
                    <Link href={`/treatments/${t.slug}`} className="btn btn-ghost btn-sm">Details<span className="sr-only"> about {t.name}</span></Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-6 text-xs text-muted">Demo prices for this preview.</p>
      </div>
    </section>
  );
}

/* ---------------------------- Before / after demo ---------------------------- */

export function BeforeAfter() {
  const [pos, setPos] = useState(50);
  return (
    <section className="container-lux py-16 sm:py-24" aria-labelledby="ba-title">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading id="ba-title" eyebrow="Before & after" title="Results gallery">
            The gallery will show consented patient photos only, each approved by the clinic and the patient. Results vary between individuals.
          </SectionHeading>
          <Placeholder className="mt-6">
            <p className="font-semibold text-charcoal">Before/after gallery: consented patient photos only.</p>
            <p className="mt-1">The slider on this page is a working demo using two abstract images. It does not show a real treatment result.</p>
          </Placeholder>
        </div>
        <Reveal>
          <figure>
            <div className="relative aspect-[4/3] select-none overflow-hidden rounded-3xl border border-line shadow-[var(--shadow-soft)]">
              {/* "Before": flat, muted abstract */}
              <svg viewBox="0 0 400 300" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
                <defs>
                  <linearGradient id="ba-before" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#d6cdc0" />
                    <stop offset="1" stopColor="#a99b88" />
                  </linearGradient>
                </defs>
                <rect width="400" height="300" fill="url(#ba-before)" />
                {Array.from({ length: 28 }, (_, i) => (
                  <circle key={i} cx={(i * 73) % 400} cy={(i * 131) % 300} r={6 + ((i * 7) % 14)} fill="#8f7f6b" opacity="0.28" />
                ))}
              </svg>
              {/* "After": luminous abstract, clipped by slider */}
              <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
                <TreatmentArt palette={7} className="h-full w-full" />
              </div>
              <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }} aria-hidden="true">
                <div className="absolute inset-y-0 -ml-px w-0.5 bg-ivory shadow" />
                <div className="absolute top-1/2 -ml-5 -mt-5 flex h-10 w-10 items-center justify-center rounded-full bg-ivory text-gold shadow-[var(--shadow-lift)]">
                  <Icon name="chevronLeft" size={16} />
                  <Icon name="chevronRight" size={16} />
                </div>
              </div>
              <span className="chip absolute left-3 top-3 bg-charcoal/80 text-ivory">Before (demo)</span>
              <span className="chip absolute right-3 top-3 bg-ivory/90 text-charcoal">After (demo)</span>
              <input
                type="range"
                min={0}
                max={100}
                value={pos}
                onChange={(e) => setPos(Number(e.target.value))}
                aria-label="Before and after comparison position"
                className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
              />
            </div>
            <figcaption className="mt-3 text-center text-xs text-muted">Abstract demo images, not patient photos. Drag to compare.</figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------- Location & contact --------------------------- */

export function LocationContact() {
  const { data: s } = useSettings();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.mapsQuery)}`;
  const openDays = WEEKDAYS.filter((d) => s.workingDays.includes(d.id));
  const closedDays = WEEKDAYS.filter((d) => !s.workingDays.includes(d.id));

  return (
    <section id="contact" className="container-lux py-16 sm:py-24" aria-labelledby="contact-title">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <SectionHeading id="contact-title" eyebrow="Location & contact" title="Visit the clinic" />
          <ul className="mt-8 space-y-5">
            <li className="flex gap-4">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-cream text-gold"><Icon name="pin" /></span>
              <div>
                <p className="font-semibold text-charcoal">{s.clinicName}</p>
                <p className="text-muted">{s.addressLine}, {s.city}</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-cream text-gold"><Icon name="clock" /></span>
              <div>
                <p className="font-semibold text-charcoal">Opening hours</p>
                <p className="text-muted">
                  {openDays.length === 7 ? "Every day" : openDays.map((d) => d.short).join(", ")}: {formatTime(s.openTime)} – {formatTime(s.closeTime)}
                </p>
                {closedDays.length > 0 && <p className="text-muted">Closed: {closedDays.map((d) => d.long).join(", ")}</p>}
                <p className="mt-1 text-xs text-muted">Demo hours. To be confirmed by the clinic.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-cream text-gold"><Icon name="phone" /></span>
              <div>
                <p className="font-semibold text-charcoal">Phone</p>
                <p className="text-muted">{s.phoneDisplay || "Clinic number to be provided"}</p>
              </div>
            </li>
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <Icon name="pin" size={18} /> Open in Google Maps
            </a>
            <WhatsAppLink className="btn btn-ghost">
              <Icon name="whatsapp" size={18} className="text-whatsapp" /> Message on WhatsApp
            </WhatsAppLink>
          </div>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block min-h-72 overflow-hidden rounded-3xl border border-line"
          aria-label="Open the clinic location in Google Maps"
        >
          {/* Stylised map illustration (no third-party embed, keeps the page fast and private) */}
          <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <rect width="400" height="300" fill="#f1e9dc" />
            <g stroke="#e2d4bd" strokeWidth="14" fill="none" strokeLinecap="round">
              <path d="M-10 210 C 90 190, 170 230, 410 150" />
              <path d="M120 -10 C 140 90, 110 200, 160 310" />
            </g>
            <g stroke="#e9dfcf" strokeWidth="6" fill="none">
              <path d="M-10 90 L 410 60" />
              <path d="M260 -10 L 300 310" />
              <path d="M-10 270 L 410 250" />
            </g>
            <path d="M-10 210 C 90 190, 170 230, 410 150" stroke="#c9aa6c" strokeWidth="2.5" fill="none" strokeDasharray="1 7" strokeLinecap="round" />
          </svg>
          <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-full text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-charcoal text-champagne shadow-[var(--shadow-lift)] transition-transform group-hover:-translate-y-1">
              <Icon name="pin" />
            </span>
          </div>
          <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-ivory/95 p-4 shadow-[var(--shadow-soft)]">
            <p className="font-semibold text-charcoal">Jadoon Plaza, Phase 2 Road</p>
            <p className="text-sm text-muted">Abbottabad · Tap for directions</p>
          </div>
        </a>
      </div>
    </section>
  );
}
