"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getConditions, getTreatments } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import type { Condition, Treatment } from "@/lib/data/types";
import { ProcedureCard } from "../site/Cards";
import { useSite } from "../site/SiteProvider";
import { Icon } from "../ui/Icon";
import { m } from "../ui/FramerMotion";

export function SkinFinder({ initialTreatments, initialConditions }: { initialTreatments: Treatment[]; initialConditions: Condition[] }) {
  const { content } = useSite();
  const { data: treatments } = useData(() => getTreatments(), initialTreatments);
  const { data: conditions } = useData(() => getConditions(), initialConditions);
  const options = conditions.filter((c) => c.inFinder);
  const [selected, setSelected] = useState<string[]>([]);
  const [show, setShow] = useState(false);
  const name = (slug: string) => conditions.find((c) => c.slug === slug)?.name ?? slug;

  const results = useMemo(
    () =>
      treatments
        .filter((t) => t.category !== "consultation")
        .map((t) => ({ t, matches: t.concerns.filter((c) => selected.includes(c)) }))
        .filter((r) => r.matches.length > 0)
        .sort((a, b) => b.matches.length - a.matches.length || Number(b.t.featured) - Number(a.t.featured)),
    [treatments, selected],
  );

  return (
    <section className="container-lux pb-24 pt-10 sm:pt-16">
      <div className="max-w-2xl">
        <p className="eyebrow">Treatment finder</p>
        <h1 className="display mt-4 text-[2.8rem] sm:text-6xl">What would you like help with?</h1>
        <p className="lead mt-5">Select one or more concerns to see treatments that may be relevant. We will confirm what is suitable for you at your appointment.</p>
      </div>
      <div className="mt-8 flex max-w-2xl gap-3 border-l-2 border-champagne bg-surface p-4 text-sm leading-relaxed" role="note">
        <Icon name="info" size={20} className="mt-0.5 flex-none text-gold" />
        <p><strong className="text-charcoal">This is not a diagnosis.</strong> <span className="text-muted">It is a guide to help you explore options. Your skin is assessed at your consultation.</span></p>
      </div>
      <fieldset className="mt-10">
        <legend className="label !text-base">Select your concerns</legend>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {options.map((c) => {
            const on = selected.includes(c.slug);
            return (
              <label key={c.id} className={`relative flex min-h-28 cursor-pointer flex-col border p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-charcoal ${on ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-surface hover:border-charcoal"}`}>
                <input type="checkbox" className="sr-only" checked={on} onChange={() => { setSelected((s) => (on ? s.filter((x) => x !== c.slug) : [...s, c.slug])); setShow(false); }} data-concern={c.slug} />
                <span className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border ${on ? "border-champagne bg-champagne text-charcoal" : "border-sand"}`} aria-hidden="true">
                  {on && <Icon name="check" size={12} strokeWidth={2.6} />}
                </span>
                <span className="hyphens-auto break-words pr-6 font-serif text-xl leading-tight [overflow-wrap:anywhere] sm:text-2xl" lang="en">{c.name}</span>
                <span className={`mt-1 line-clamp-2 text-xs ${on ? "text-[#e2dcd3]" : "text-muted"}`}>{c.summary}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary" disabled={selected.length === 0} onClick={() => setShow(true)} data-testid="show-results">
          Show suggestions{selected.length > 0 && ` (${selected.length})`}
        </button>
        {selected.length > 0 && <button type="button" className="btn btn-ghost" onClick={() => { setSelected([]); setShow(false); }}>Clear</button>}
      </div>
      <div aria-live="polite">
        {show && (
          <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-12" data-testid="finder-results">
            <h2 className="text-4xl sm:text-5xl">Treatments that may be relevant</h2>
            <p className="mt-2 text-sm text-muted">For: {selected.map(name).join(", ")}</p>
            {results.length > 0 ? (
              <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {results.map(({ t, matches }) => (
                  <li key={t.id} className="flex flex-col">
                    <p className="mb-2 text-xs font-medium text-gold">May help with: {matches.map(name).join(", ")}</p>
                    <div className="flex-1"><ProcedureCard t={t} currency={content.currency} /></div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-muted">A consultation is the best place to start for this combination.</p>
            )}
            <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-2">
              {selected.map((s) => <li key={s}><Link href={`/conditions/${s}`} className="link-lux">About {name(s)} <Icon name="arrow" size={14} /></Link></li>)}
            </ul>
            <div className="on-dark mt-12 flex flex-col gap-5 bg-charcoal p-6 text-ivory sm:flex-row sm:items-center sm:justify-between sm:p-10">
              <div>
                <h3 className="text-3xl !text-ivory">Not sure which is right for you?</h3>
                <p className="mt-2 max-w-lg text-sm text-[#ddd6cc]">A consultation lets us look at your skin and recommend a personalized plan, including whether treatment is needed at all.</p>
              </div>
              <Link href="/book?treatment=consultation" className="btn btn-gold flex-none">Book a consultation <Icon name="arrow" size={18} /></Link>
            </div>
          </m.div>
        )}
      </div>
    </section>
  );
}
