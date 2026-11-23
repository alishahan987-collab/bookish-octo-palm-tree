"use client";

import { useState } from "react";
import type { GalleryItem } from "@/lib/data/types";
import { Icon } from "../ui/Icon";
import { SmartImage } from "../ui/SmartImage";

/** Accessible comparison slider (keyboard: arrow keys via native range input). */
export function BeforeAfterSlider({ item, priority }: { item: GalleryItem; priority?: boolean }) {
  const [pos, setPos] = useState(50);
  return (
    <figure data-gallery-item={item.id}>
      <div className="relative aspect-[4/3] select-none overflow-hidden rounded-3xl border border-line bg-cream shadow-[var(--shadow-soft)]">
        <SmartImage src={item.before} alt={`Before: ${item.title}`} className="absolute inset-0 h-full w-full" priority={priority} sizes="(max-width: 768px) 100vw, 50vw" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
          <SmartImage src={item.after} alt={`After: ${item.title}`} className="absolute inset-0 h-full w-full" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
        <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }} aria-hidden="true">
          <div className="absolute inset-y-0 -ml-px w-0.5 bg-ivory shadow" />
          <div className="absolute top-1/2 -ml-5 -mt-5 flex h-10 w-10 items-center justify-center rounded-full bg-ivory text-gold shadow-[var(--shadow-lift)]">
            <Icon name="chevronLeft" size={16} />
            <Icon name="chevronRight" size={16} />
          </div>
        </div>
        <span className="chip absolute left-3 top-3 bg-charcoal/80 text-ivory">Before</span>
        <span className="chip absolute right-3 top-3 bg-ivory/90 text-charcoal">After</span>
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`Compare before and after: ${item.title}`}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      <figcaption className="mt-3">
        <p className="font-semibold text-charcoal">{item.title}</p>
        {item.caption && <p className="text-sm text-muted">{item.caption}</p>}
        {item.illustrative && <p className="mt-1 text-xs text-muted">Illustrative demo images, not patient photographs.</p>}
      </figcaption>
    </figure>
  );
}
