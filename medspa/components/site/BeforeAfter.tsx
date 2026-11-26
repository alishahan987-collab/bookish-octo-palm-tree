"use client";

import { useState } from "react";
import type { GalleryItem } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { Img } from "../ui/Img";

/** Before/after comparison: draggable slider (keyboard accessible) or side by side. */
export function BeforeAfter({ item }: { item: GalleryItem }) {
  const [pos, setPos] = useState(50);
  const label = (text: string, side: "left" | "right") => (
    <span className={`absolute top-3 ${side === "left" ? "left-3" : "right-3"} rounded-full bg-ink/75 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white`}>{text}</span>
  );
  return (
    <figure data-gallery-item={item.id}>
      {item.display === "side" ? (
        <div className="grid grid-cols-2 gap-2">
          {[["Before", item.before, item.beforeAlt], ["After", item.after, item.afterAlt]].map(([t, src, alt]) => (
            <div key={t} className="img-radius relative aspect-[4/5] bg-alt">
              <Img src={src} alt={alt || `${t}: ${item.title}`} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
              {label(t!, "left")}
            </div>
          ))}
        </div>
      ) : (
        <div className="img-radius relative aspect-[4/5] select-none bg-alt sm:aspect-[4/3]">
          <Img src={item.before} alt={item.beforeAlt || `Before: ${item.title}`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
            <Img src={item.after} alt={item.afterAlt || `After: ${item.title}`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
          <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }} aria-hidden="true">
            <div className="absolute inset-y-0 -ml-px w-0.5 bg-white/90" />
            <div className="absolute top-1/2 -ml-5 -mt-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-lg">
              <Icon name="chevronLeft" size={14} />
              <Icon name="chevronRight" size={14} />
            </div>
          </div>
          {label("Before", "left")}
          {label("After", "right")}
          <input
            type="range" min={0} max={100} value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            aria-label={`Compare before and after: ${item.title}`}
            className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
          />
        </div>
      )}
      <figcaption className="mt-4">
        <p className="font-display text-xl">{item.title}</p>
        {item.caption && <p className="mt-1 text-sm text-fg-muted">{item.caption}</p>}
      </figcaption>
    </figure>
  );
}

export function GalleryGrid({ items, categories, showFilters }: { items: GalleryItem[]; categories: string[]; showFilters: boolean }) {
  const [cat, setCat] = useState("All");
  const cats = ["All", ...categories.filter((c) => items.some((i) => i.category === c))];
  const shown = cat === "All" ? items : items.filter((i) => i.category === cat);
  return (
    <>
      {showFilters && cats.length > 2 && (
        <div className="no-scrollbar -mx-5 mb-10 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Filter by treatment">
          {cats.map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)} aria-pressed={cat === c} className={`min-h-[44px] whitespace-nowrap rounded-full border px-5 text-sm ${cat === c ? "border-ink bg-ink text-bg" : "border-line hover:border-fg"}`}>
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
        {shown.map((i) => <BeforeAfter key={i.id} item={i} />)}
      </div>
    </>
  );
}
