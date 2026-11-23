"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/data/catalog";
import type { CategoryId, Treatment } from "@/lib/data/types";
import { TreatmentCard } from "./TreatmentCard";
import { useTreatments } from "./useTreatments";

export function Catalogue({ initial }: { initial: Treatment[] }) {
  const { data } = useTreatments(initial);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get("category");
  const active = CATEGORIES.some((c) => c.id === raw) ? (raw as CategoryId) : null;

  const setCategory = (id: CategoryId | null) => {
    router.replace(id ? `${pathname}?category=${id}` : pathname, { scroll: false });
  };

  const used = CATEGORIES.filter((c) => data.some((t) => t.category === c.id));
  const list = active ? data.filter((t) => t.category === active) : data;

  return (
    <>
      <div role="group" aria-label="Filter by category" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        {[{ id: null, label: "All" }, ...used].map((c) => {
          const selected = active === c.id;
          return (
            <button
              key={c.id ?? "all"}
              type="button"
              aria-pressed={selected}
              onClick={() => setCategory(c.id as CategoryId | null)}
              className={`flex-none rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selected ? "border-charcoal bg-charcoal text-ivory" : "border-sand bg-transparent text-ink hover:border-champagne hover:bg-cream"
              }`}
            >
              {c.label}
              <span className={`ml-1.5 text-xs ${selected ? "text-champagne-soft" : "text-muted"}`}>
                {c.id ? data.filter((t) => t.category === c.id).length : data.length}
              </span>
            </button>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">{list.length} treatments shown</p>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <li key={t.id}>
            <TreatmentCard t={t} headingLevel={2} />
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="mt-10 text-muted">No treatments in this category yet.</p>}
    </>
  );
}
