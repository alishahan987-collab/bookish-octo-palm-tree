"use client";

import { useState } from "react";
import { Icon } from "../ui/Icon";

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((f) => (
        <details key={f.q} className="group py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-serif text-xl text-charcoal sm:text-2xl [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-sand text-gold transition-transform group-open:rotate-45">
              <Icon name="plus" size={16} />
            </span>
          </summary>
          <p className="pb-5 pr-10 leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

/**
 * Google Maps embed. By default shows a lightweight preview and only loads
 * Google's map (≈1 MB, sets cookies) when the visitor asks for it.
 */
export function MapEmbed({ query, autoLoad = false }: { query: string; autoLoad?: boolean }) {
  const [load, setLoad] = useState(autoLoad);
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  return (
    <div className="relative min-h-80 overflow-hidden rounded-3xl border border-line bg-cream" data-testid="map">
      {load ? (
        <iframe title="Clinic location on Google Maps" src={src} className="absolute inset-0 h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      ) : (
        <>
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
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-charcoal text-champagne shadow-[var(--shadow-lift)]"><Icon name="pin" /></span>
            <button type="button" onClick={() => setLoad(true)} className="btn btn-primary btn-sm">Show interactive map</button>
            <p className="max-w-xs text-xs text-muted">Loads Google Maps, which may set cookies.</p>
          </div>
        </>
      )}
    </div>
  );
}
