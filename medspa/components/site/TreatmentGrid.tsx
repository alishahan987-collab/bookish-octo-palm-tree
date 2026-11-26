"use client";

import { useState, type ReactNode } from "react";

/** Category filter chips for the treatment grid (cards are rendered on the server). */
export function TreatmentGrid({ categories, items, columns }: { categories: string[]; items: { category: string; node: ReactNode; key: string }[]; columns: 2 | 3 | 4 }) {
  const [cat, setCat] = useState<string>("All");
  const shown = cat === "All" ? items : items.filter((i) => i.category === cat);
  const cols = columns === 2 ? "sm:grid-cols-2" : columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";
  const cats = ["All", ...categories.filter((c) => items.some((i) => i.category === c))];
  return (
    <>
      {cats.length > 2 && (
        <div className="no-scrollbar -mx-5 mb-10 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Filter treatments by category">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
              className={`min-h-[44px] whitespace-nowrap rounded-full border px-5 text-sm transition-colors ${cat === c ? "border-ink bg-ink text-bg" : "border-line hover:border-fg"}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div className={`grid grid-cols-1 gap-x-6 gap-y-12 ${cols}`}>
        {shown.map((i) => <div key={i.key}>{i.node}</div>)}
      </div>
    </>
  );
}
