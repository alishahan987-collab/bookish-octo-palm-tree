"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FINDER_CONCERNS, concernLabel } from "@/lib/data/catalog";
import type { ConcernId, Treatment } from "@/lib/data/types";
import { Icon } from "../ui/Icon";
import { m } from "../ui/FramerMotion";
import { TreatmentCard } from "./TreatmentCard";
import { useTreatments } from "./useTreatments";

export function SkinFinder({ initial }: { initial: Treatment[] }) {
  const { data } = useTreatments(initial);
  const [selected, setSelected] = useState<ConcernId[]>([]);
  const [showResults, setShowResults] = useState(false);

  const toggle = (id: ConcernId) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    setShowResults(false);
  };

  const results = useMemo(() => {
    return data
      .filter((t) => t.category !== "consultation")
      .map((t) => ({ t, matches: t.concerns.filter((c) => selected.includes(c)) }))
      .filter((r) => r.matches.length > 0)
      .sort((a, b) => b.matches.length - a.matches.length || Number(b.t.featured) - Number(a.t.featured));
  }, [data, selected]);

  const consultation = data.find((t) => t.category === "consultation");

  return (
    <section className="container-lux pb-16 pt-10 sm:pt-14">
      <div className="max-w-2xl">
        <p className="eyebrow">Skin Concern Finder</p>
        <h1 className="mt-3 text-5xl sm:text-6xl">What would you like help with?</h1>
        <p className="mt-4 text-muted">Select one or more concerns to see treatments that may be relevant. Your doctor will confirm what is suitable for you.</p>
      </div>

      <div className="mt-6 flex max-w-2xl gap-3 rounded-2xl border border-champagne/60 bg-cream p-4 text-sm leading-relaxed" role="note">
        <Icon name="info" size={20} className="mt-0.5 flex-none text-gold" />
        <p><strong className="text-charcoal">This is not a diagnosis.</strong> <span className="text-muted">It is a simple guide to help you explore options. Only a consultation with a doctor can assess your skin and recommend treatment.</span></p>
      </div>

      <fieldset className="mt-10">
        <legend className="label !text-base">Select your concerns</legend>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FINDER_CONCERNS.map((c) => {
            const on = selected.includes(c.id);
            return (
              <label key={c.id} className={`relative flex cursor-pointer flex-col rounded-2xl border p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold ${on ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-[#fffdf9] hover:border-champagne"}`}>
                <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(c.id)} data-concern={c.id} />
                <span className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border ${on ? "border-champagne bg-champagne text-charcoal" : "border-sand"}`} aria-hidden="true">
                  {on && <Icon name="check" size={12} strokeWidth={2.6} />}
                </span>
                <span className="pr-6 font-serif text-2xl leading-tight">{c.label}</span>
                <span className={`mt-1 text-xs ${on ? "text-champagne-soft" : "text-muted"}`}>{c.hint}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary" disabled={selected.length === 0} onClick={() => setShowResults(true)} data-testid="show-results">
          Show suggestions{selected.length > 0 && ` (${selected.length})`}
        </button>
        {selected.length > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => { setSelected([]); setShowResults(false); }}>Clear</button>
        )}
      </div>

      <div aria-live="polite">
        {showResults && (
          <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-12" data-testid="finder-results">
            <h2 className="text-4xl">Treatments that may be relevant</h2>
            <p className="mt-2 text-sm text-muted">For: {selected.map(concernLabel).join(", ")}</p>
            {results.length > 0 ? (
              <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {results.map(({ t, matches }) => (
                  <li key={t.id} className="flex flex-col">
                    <p className="mb-2 text-xs font-semibold text-gold">May help with: {matches.map(concernLabel).join(", ")}</p>
                    <div className="flex-1"><TreatmentCard t={t} /></div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-muted">No specific treatments are listed for this combination. A consultation is the best place to start.</p>
            )}

            <div className="mt-10 flex flex-col gap-5 rounded-[2rem] bg-charcoal p-6 text-ivory sm:flex-row sm:items-center sm:justify-between sm:p-10">
              <div>
                <h3 className="text-3xl !text-ivory">Not sure which is right for you?</h3>
                <p className="mt-2 max-w-lg text-sm text-[#d9d1c4]">A consultation lets the doctor examine your skin and recommend a plan, including whether treatment is needed at all.</p>
              </div>
              <Link href={consultation ? `/book?treatment=${consultation.slug}` : "/book"} className="btn btn-gold flex-none">
                Book a consultation <Icon name="arrow" size={18} />
              </Link>
            </div>
          </m.div>
        )}
      </div>
    </section>
  );
}
