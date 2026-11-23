"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { search } from "@/lib/search";
import { Icon } from "../ui/Icon";
import { SmartImage } from "../ui/SmartImage";
import { useSearchIndex } from "./useSearchIndex";

const TYPE_LABEL = { procedure: "Treatment", condition: "Condition", article: "Article", page: "Page" } as const;
const SUGGESTIONS = ["Acne", "Hair fall", "Melasma", "Botox", "HydraFacial", "Pigmentation"];

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const index = useSearchIndex(open);
  const results = useMemo(() => (index ? search(index, q, 8) : []), [index, q]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      setTimeout(() => inputRef.current?.focus(), 10);
    }
    if (!open && d.open) d.close();
  }, [open]);
  useEffect(() => setActive(0), [q]);

  const go = (href: string) => {
    onClose();
    setQ("");
    router.push(href);
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label="Search the website"
      className="mx-auto mt-[8vh] w-[calc(100%-2rem)] max-w-2xl rounded-3xl border border-line bg-ivory p-0 text-ink shadow-[var(--shadow-lift)] backdrop:bg-charcoal/40 backdrop:backdrop-blur-sm"
    >
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (results[active] && q) go(results[active].href);
          else if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
        className="flex items-center gap-3 border-b border-line px-5 py-4"
      >
        <Icon name="search" size={20} className="flex-none text-gold" />
        <label htmlFor="site-search" className="sr-only">Search treatments, conditions and articles</label>
        <input
          ref={inputRef}
          id="site-search"
          type="search"
          autoComplete="off"
          placeholder="Search treatments, conditions, articles…"
          className="w-full bg-transparent text-lg text-charcoal placeholder:text-muted focus:outline-none"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          }}
          aria-controls="search-results"
          aria-activedescendant={results[active] ? `sr-${active}` : undefined}
        />
        <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-cream" aria-label="Close search">
          <Icon name="close" size={20} />
        </button>
      </form>
      <div className="max-h-[60vh] overflow-y-auto p-3">
        {q.trim().length < 2 ? (
          <div className="p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Popular searches</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setQ(s)} className="rounded-full border border-sand px-3.5 py-1.5 text-sm hover:bg-cream">{s}</button>
              ))}
            </div>
          </div>
        ) : !index ? (
          <p className="p-4 text-sm text-muted">Loading…</p>
        ) : results.length === 0 ? (
          <p className="p-4 text-sm text-muted">No results for &ldquo;{q}&rdquo;. Try another word, or <Link href="/contact" onClick={onClose} className="font-semibold text-gold underline">ask the clinic</Link>.</p>
        ) : (
          <ul id="search-results" role="listbox" aria-label="Search results" data-testid="search-results">
            {results.map((r, i) => (
              <li key={r.href} id={`sr-${i}`} role="option" aria-selected={i === active}>
                <Link
                  href={r.href}
                  onClick={(e) => { e.preventDefault(); go(r.href); }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex items-center gap-4 rounded-2xl p-3 ${i === active ? "bg-cream" : ""}`}
                >
                  <SmartImage src={r.image} alt="" palette={i} className="h-12 w-12 flex-none rounded-xl" sizes="48px" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-charcoal">{r.title}</span>
                    {r.snippet && <span className="line-clamp-1 text-sm text-muted">{r.snippet}</span>}
                  </span>
                  <span className="chip flex-none bg-cream text-muted">{TYPE_LABEL[r.type]}</span>
                </Link>
              </li>
            ))}
            <li className="px-3 pb-1 pt-3">
              <Link href={`/search?q=${encodeURIComponent(q)}`} onClick={(e) => { e.preventDefault(); go(`/search?q=${encodeURIComponent(q)}`); }} className="text-sm font-semibold text-gold underline-offset-4 hover:underline">
                See all results for &ldquo;{q}&rdquo;
              </Link>
            </li>
          </ul>
        )}
      </div>
    </dialog>
  );
}
