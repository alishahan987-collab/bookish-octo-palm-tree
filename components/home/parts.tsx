"use client";

import { useState } from "react";
import { Icon } from "../ui/Icon";

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((f) => (
        <details key={f.q} className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-serif text-[1.35rem] leading-snug text-charcoal sm:text-[1.55rem] [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-champagne text-gold transition-transform duration-500 group-open:rotate-45">
              <Icon name="plus" size={16} />
            </span>
          </summary>
          <p className="pb-6 pr-12 leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

/** Five stars, filled to the rating. Announced as text for screen readers. */
export function Stars({ rating, size = 14, className = "" }: { rating: number; size?: number; className?: string }) {
  const full = Math.round(Math.max(0, Math.min(5, rating)));
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="m12 3.8 2.45 5 5.5.8-3.98 3.88.94 5.47L12 16.37l-4.91 2.58.94-5.47L4.05 9.6l5.5-.8L12 3.8Z" fill={i < full ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Google Maps embed. By default shows a lightweight preview and only loads
 * Google's map (about 1 MB, sets cookies) when the visitor asks for it.
 */
export function MapEmbed({ query, autoLoad = false, className = "min-h-80" }: { query: string; autoLoad?: boolean; className?: string }) {
  const [load, setLoad] = useState(autoLoad);
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  return (
    <div className={`relative overflow-hidden border border-line bg-cream ${className}`} data-testid="map">
      {load ? (
        <iframe title="Clinic location on Google Maps" src={src} className="absolute inset-0 h-full w-full border-0 grayscale-[35%]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      ) : (
        <>
          <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <rect width="400" height="300" fill="#ece4d8" />
            <g stroke="#f8f6f1" strokeWidth="16" fill="none" strokeLinecap="round">
              <path d="M-10 205 C 90 190, 170 225, 410 150" />
              <path d="M130 -10 C 150 90, 120 200, 170 310" />
            </g>
            <g stroke="#f3eee6" strokeWidth="6" fill="none">
              <path d="M-10 90 L 410 62" />
              <path d="M262 -10 L 300 310" />
              <path d="M-10 268 L 410 250" />
              <path d="M40 -10 L 70 310" />
            </g>
            <g stroke="#b49a70" strokeOpacity="0.35" strokeWidth="1" fill="none">
              <circle cx="200" cy="140" r="48" />
              <circle cx="200" cy="140" r="86" />
            </g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-charcoal text-champagne shadow-[var(--shadow-lift)]"><Icon name="pin" size={22} /></span>
            <button type="button" onClick={() => setLoad(true)} className="btn btn-primary btn-sm">Show interactive map</button>
            <p className="max-w-xs text-xs text-muted">Loads Google Maps, which may set cookies.</p>
          </div>
        </>
      )}
    </div>
  );
}
