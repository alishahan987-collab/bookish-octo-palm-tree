"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getConditions, getGallery, getPosts, getTreatments } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import type { CategoryId, Condition, GalleryItem, Post, Treatment } from "@/lib/data/types";
import { buildIndex, search } from "@/lib/search";
import { Icon } from "../ui/Icon";
import { PriceTag } from "../ui/Price";
import { SmartImage } from "../ui/SmartImage";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { ALL_CATEGORIES, CATEGORIES, MENU_CATEGORIES } from "@/lib/categories";
import { CATEGORY_LABEL, ConditionCard, PostCard, ProcedureCard } from "./Cards";
import { useSite } from "./SiteProvider";

/* ---------------------------- Treatment directory ---------------------------- */

const matches = (t: Treatment, q: string) => {
  const hay = `${t.name} ${t.tagline} ${t.shortDescription} ${t.concerns.join(" ")} ${CATEGORY_LABEL[t.category]}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
};

export function ProcedureList({ initial, category }: { initial: Treatment[]; category?: CategoryId }) {
  const { content } = useSite();
  const { data } = useData(() => getTreatments(), initial);
  const [filter, setFilter] = useState<CategoryId | "all">(category ?? "all");
  const [q, setQ] = useState("");
  const list = data.filter((t) => (filter === "all" ? true : t.category === filter) && (!q.trim() || matches(t, q)));
  return (
    <section className="container-lux py-12 lg:py-16">
      {!category && (
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Filter by category" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {(["all", ...ALL_CATEGORIES] as const).map((c) => (
              <button key={c} type="button" aria-pressed={filter === c} onClick={() => setFilter(c)}
                className={`min-h-11 flex-none border px-4 text-[0.72rem] font-medium uppercase tracking-[0.14em] transition-colors ${filter === c ? "border-charcoal bg-charcoal text-ivory" : "border-sand text-charcoal hover:border-charcoal"}`}>
                {c === "all" ? "All" : CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
          <div className="relative lg:w-80">
            <label htmlFor="treatment-filter" className="sr-only">Search treatments</label>
            <Icon name="search" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input id="treatment-filter" type="search" className="field pl-11" placeholder="Search treatments, e.g. laser" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      )}
      <p className="sr-only" aria-live="polite">{list.length} treatment{list.length === 1 ? "" : "s"} shown</p>
      <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3" data-testid="procedure-list">
        {list.map((t, i) => <li key={t.id}><ProcedureCard t={t} currency={content.currency} headingLevel={2} priority={i < 3} /></li>)}
      </ul>
      {list.length === 0 && (
        <p className="border border-dashed border-sand p-8 text-center text-muted">
          No treatments match{q ? ` \u201c${q}\u201d` : " this category yet"}. Try another word or <Link href="/book?treatment=consultation" className="text-gold underline underline-offset-4">book a consultation</Link>.
        </p>
      )}
      <ConsultBanner />
    </section>
  );
}

function ConsultBanner() {
  return (
    <div className="mt-20 grid items-center gap-6 bg-cream p-8 sm:p-10 md:grid-cols-[1fr_auto]">
      <div>
        <p className="eyebrow">Not sure where to start?</p>
        <p className="mt-3 font-serif text-[2rem] leading-tight text-charcoal">Book a consultation and we will build a plan with you.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/skin-finder" className="btn btn-ghost">Treatment finder</Link>
        <Link href="/book?treatment=consultation" className="btn btn-primary">Book a consultation</Link>
      </div>
    </div>
  );
}

/* --------------------------------- Conditions --------------------------------- */

export function ConditionList({ initial }: { initial: Condition[] }) {
  const { data } = useData(() => getConditions(), initial);
  return (
    <section className="container-lux py-12 lg:py-16">
      <ul className="grid grid-cols-1 gap-x-6 gap-y-12 min-[480px]:grid-cols-2 lg:grid-cols-4" data-testid="condition-list">
        {data.map((c) => <li key={c.id}><ConditionCard c={c} headingLevel={2} /></li>)}
      </ul>
      <ConsultBanner />
    </section>
  );
}

/* ------------------------------------ Blog ------------------------------------ */

export function BlogList({ initial }: { initial: Post[] }) {
  const { data } = useData(() => getPosts(), initial);
  const tags = [...new Set(data.flatMap((p) => p.tags))];
  const [tag, setTag] = useState<string | null>(null);
  const list = tag ? data.filter((p) => p.tags.includes(tag)) : data;
  const [first, ...rest] = list;
  return (
    <section className="container-lux py-12">
      {tags.length > 1 && (
        <div role="group" aria-label="Filter by topic" className="no-scrollbar -mx-4 mb-10 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {[null, ...tags].map((t) => (
            <button key={t ?? "all"} type="button" aria-pressed={tag === t} onClick={() => setTag(t)}
              className={`min-h-11 flex-none border px-4 text-[0.72rem] font-medium uppercase tracking-[0.14em] ${tag === t ? "border-charcoal bg-charcoal text-ivory" : "border-sand hover:border-charcoal"}`}>
              {t ?? "All topics"}
            </button>
          ))}
        </div>
      )}
      {first && (
        <article className="group relative grid items-center gap-8 lg:grid-cols-2">
          <SmartImage src={first.cover} alt={first.coverAlt ?? ""} priority className="aspect-[16/10]" sizes="(max-width: 1024px) 100vw, 50vw" />
          <div>
            <p className="eyebrow">{first.tags[0] ?? "Article"}</p>
            <h2 className="mt-3 text-4xl sm:text-5xl"><Link href={`/blog/${first.slug}`} className="after:absolute after:inset-0 group-hover:text-gold">{first.title}</Link></h2>
            <p className="mt-4 text-muted">{first.excerpt}</p>
            <span className="link-lux mt-6">Read article <Icon name="arrow" size={14} /></span>
          </div>
        </article>
      )}
      <ul className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-3" data-testid="post-list">
        {rest.map((p) => <li key={p.id}><PostCard p={p} headingLevel={2} /></li>)}
      </ul>
      {list.length === 0 && <p className="text-muted">No articles published yet.</p>}
    </section>
  );
}

/* ---------------------------------- Gallery ---------------------------------- */

export function GalleryView({ initial, treatments: initialTreatments }: { initial: GalleryItem[]; treatments: Treatment[] }) {
  const { data } = useData(() => getGallery(), initial);
  const { data: treatments } = useData(() => getTreatments(), initialTreatments);
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const [tid, setTid] = useState("");
  const usedTreatments = treatments.filter((t) => data.some((g) => g.treatmentId === t.id));
  const list = data.filter((g) => (cat === "all" || g.category === cat) && (!tid || g.treatmentId === tid));
  return (
    <section className="container-lux py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Filter by category" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {(["all", ...MENU_CATEGORIES] as const).map((c) => (
            <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}
              className={`min-h-11 flex-none border px-4 text-[0.72rem] font-medium uppercase tracking-[0.14em] ${cat === c ? "border-charcoal bg-charcoal text-ivory" : "border-sand hover:border-charcoal"}`}>
              {c === "all" ? "All" : CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <div className="sm:w-72">
          <label htmlFor="g-treatment" className="sr-only">Filter by treatment</label>
          <select id="g-treatment" className="field" value={tid} onChange={(e) => setTid(e.target.value)}>
            <option value="">All treatments</option>
            {usedTreatments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>
      <ul className="mt-10 grid gap-10 md:grid-cols-2" data-testid="gallery-list">
        {list.map((g, i) => <li key={g.id}><BeforeAfterSlider item={g} priority={i < 2} /></li>)}
      </ul>
      {list.length === 0 && (
        <div className="mt-10 border border-dashed border-sand px-6 py-16 text-center">
          <p className="font-serif text-3xl text-charcoal">{data.length === 0 ? "Our results gallery is being curated." : "No results in this category yet."}</p>
          <p className="mx-auto mt-3 max-w-md text-muted">We publish only genuine client photographs, with written consent. Ask to see results for your treatment at your consultation.</p>
          <Link href="/book?treatment=consultation" className="btn btn-primary mt-8">Book a consultation</Link>
        </div>
      )}
      <p className="mt-12 flex gap-3 border-t border-line pt-6 text-sm leading-relaxed text-muted">
        <Icon name="shield" size={18} className="mt-0.5 flex-none text-gold" />
        Photographs are published only with each client&apos;s written consent. Results vary between individuals and are not a guarantee of your outcome.
      </p>
    </section>
  );
}

/* ---------------------------------- Pricing ---------------------------------- */

export function PricingView({ initial }: { initial: Treatment[] }) {
  const { content } = useSite();
  const { data } = useData(() => getTreatments(), initial);
  const groups: CategoryId[] = ALL_CATEGORIES;
  return (
    <section className="container-lux py-12">
      {groups.map((g) => {
        const list = data.filter((t) => t.category === g);
        if (!list.length) return null;
        return (
          <div key={g} className="mb-16" aria-labelledby={`price-${g}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-charcoal pb-4">
              <h2 id={`price-${g}`} className="text-4xl sm:text-5xl">{g === "consultation" ? "Consultations" : CATEGORIES[g].label}</h2>
              {g !== "consultation" && <Link href={CATEGORIES[g].href} className="link-lux">View treatments <Icon name="arrow" size={14} /></Link>}
            </div>
            <ul className="divide-y divide-line" data-testid={`pricing-${g}`}>
              {list.map((t) => (
                <li key={t.id} className="flex gap-4 py-5 sm:gap-6" data-price-item={t.slug}>
                  <SmartImage src={t.image} alt={t.imageAlt ?? ""} palette={t.palette} className="h-24 w-20 flex-none sm:h-28 sm:w-24" sizes="96px" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[1.6rem] leading-tight"><Link href={`/treatments/${t.slug}`} className="hover:text-gold">{t.name}</Link></h3>
                      {t.price.type === "promo" && <span className="chip bg-charcoal text-ivory">{t.price.label || "Offer"}</span>}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{t.shortDescription}</p>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
                      <PriceTag price={t.price} currency={content.currency} />
                      <Link href={`/book?treatment=${t.slug}`} className="btn btn-primary btn-sm">Book now<span className="sr-only"> {t.name}</span></Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <p className="text-sm text-muted">Prices are a guide. Your final price is confirmed before treatment, based on your personalized plan.</p>
    </section>
  );
}

/* ---------------------------------- Search ---------------------------------- */

export function SearchView({ initial }: { initial: { treatments: Treatment[]; conditions: Condition[]; posts: Post[] } }) {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") ?? "";
  const [input, setInput] = useState(q);
  const t = useData(() => getTreatments(), initial.treatments).data;
  const c = useData(() => getConditions(), initial.conditions).data;
  const p = useData(() => getPosts(), initial.posts).data;
  const index = useMemo(() => buildIndex({ treatments: t, conditions: c, posts: p }), [t, c, p]);
  const results = useMemo(() => search(index, q, 50), [index, q]);
  const TYPE = { procedure: "Treatment", condition: "Skin concern", article: "Article", page: "Page" } as const;

  return (
    <section className="container-lux py-10">
      <form role="search" className="flex max-w-2xl gap-2" onSubmit={(e) => { e.preventDefault(); router.replace(`/search?q=${encodeURIComponent(input.trim())}`); }}>
        <label htmlFor="search-page-input" className="sr-only">Search</label>
        <input id="search-page-input" type="search" className="field" value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. botox, laser hair removal, acne" />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>
      <p className="mt-6 text-sm text-muted" aria-live="polite">{q ? `${results.length} result${results.length === 1 ? "" : "s"} for “${q}”` : "Type a treatment, condition or topic."}</p>
      <ul className="mt-6 divide-y divide-line" data-testid="search-page-results">
        {results.map((r, i) => (
          <li key={r.href}>
            <Link href={r.href} className="flex items-center gap-4 py-4 hover:bg-cream/50">
              <SmartImage src={r.image} alt="" palette={i} className="h-16 w-16 flex-none" sizes="64px" />
              <span className="min-w-0 flex-1">
                <span className="chip mb-1 bg-cream text-charcoal">{TYPE[r.type]}</span>
                <span className="block font-serif text-2xl text-charcoal">{r.title}</span>
                {r.snippet && <span className="line-clamp-2 text-sm text-muted">{r.snippet}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {q && results.length === 0 && (
        <p className="mt-6 text-muted">Nothing found. Try a different word, or <Link href="/contact" className="font-medium text-gold underline underline-offset-4">contact the clinic</Link>.</p>
      )}
    </section>
  );
}
