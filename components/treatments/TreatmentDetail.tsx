"use client";

import Link from "next/link";
import { getTreatmentBySlug } from "@/lib/data";
import { categoryLabel } from "@/lib/data/catalog";
import { useData } from "@/lib/data/hooks";
import type { Treatment } from "@/lib/data/types";
import { FaqList } from "../home/StaticSections";
import { WhatsAppLink } from "../layout/WhatsAppLink";
import { TreatmentArt } from "../ui/Art";
import { Icon, type IconName } from "../ui/Icon";
import { PriceBlock } from "../ui/Price";
import { TreatmentCard } from "./TreatmentCard";
import { useTreatments } from "./useTreatments";

export function TreatmentDetail({ slug, initial, initialAll }: { slug: string; initial: Treatment | null; initialAll: Treatment[] }) {
  const { data: t, ready } = useData(() => getTreatmentBySlug(slug), initial, [slug]);
  const { data: all } = useTreatments(initialAll);

  if (!t) {
    if (!ready) return <div className="container-lux min-h-[60vh] py-24" aria-busy="true" />;
    return (
      <section className="container-lux py-28 text-center">
        <p className="eyebrow">Not found</p>
        <h1 className="mt-4 text-5xl">This treatment is not available</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">It may have been removed or renamed.</p>
        <Link href="/treatments" className="btn btn-primary mt-8">See all treatments</Link>
      </section>
    );
  }

  const related = all
    .filter((x) => x.id !== t.id && (x.category === t.category || x.concerns.some((c) => t.concerns.includes(c))))
    .slice(0, 3);

  const facts: { icon: IconName; label: string; value: string }[] = [
    { icon: "clock", label: "Session length", value: t.sessionLength },
    { icon: "calendar", label: "Sessions", value: t.sessions },
    { icon: "leaf", label: "Downtime", value: t.downtime },
  ];

  return (
    <article>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="container-lux grid gap-8 pb-12 pt-8 sm:pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14 lg:pb-16">
          <div>
            <nav aria-label="Breadcrumb" className="text-sm text-muted">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li><Link href="/" className="hover:text-gold">Home</Link></li>
                <li aria-hidden="true">/</li>
                <li><Link href="/treatments" className="hover:text-gold">Treatments</Link></li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-charcoal">{t.name}</li>
              </ol>
            </nav>
            <p className="eyebrow mt-8">{categoryLabel(t.category)}</p>
            <h1 className="mt-3 text-[2.8rem] leading-[1.02] sm:text-6xl">{t.name}</h1>
            <p className="mt-3 font-serif text-2xl italic text-gold">{t.tagline}</p>
            <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-muted">{t.shortDescription}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={`/book?treatment=${t.slug}`} className="btn btn-primary">
                Book {t.name} <Icon name="arrow" size={18} />
              </Link>
              <WhatsAppLink className="btn btn-ghost" message={`Assalam-o-Alaikum, I would like to ask about ${t.name}.`}>
                <Icon name="whatsapp" size={18} className="text-whatsapp" /> Ask a question
              </WhatsAppLink>
            </div>
          </div>
          <div className="overflow-hidden rounded-[2rem] shadow-[var(--shadow-soft)]">
            <TreatmentArt palette={t.palette} className="aspect-[4/3] w-full" />
          </div>
        </div>
      </section>

      <div className="container-lux grid gap-10 py-12 lg:grid-cols-[1fr_22rem] lg:gap-14 lg:py-16">
        {/* Price card (first on mobile, sticky sidebar on desktop) */}
        <aside className="order-first lg:order-last" aria-label="Price and booking">
          <div className="card p-6 lg:sticky lg:top-28" data-testid="price-block">
            <div className={`transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}>
              <PriceBlock price={t.price} />
            </div>
            <Link href={`/book?treatment=${t.slug}`} className="btn btn-primary mt-6 w-full">Book appointment</Link>
            <ul className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
              {facts.map((f) => (
                <li key={f.label} className="flex gap-3">
                  <Icon name={f.icon} size={18} className="mt-0.5 flex-none text-gold" />
                  <span><span className="font-semibold text-charcoal">{f.label}: </span><span className="text-muted">{f.value}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="min-w-0 space-y-12">
          <DetailSection title="About this treatment">
            <p className="leading-relaxed text-muted">{t.description}</p>
          </DetailSection>

          <DetailSection title="How it works">
            <ol className="space-y-4">
              {t.howItWorks.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-cream font-serif text-lg text-gold">{i + 1}</span>
                  <p className="pt-1 leading-relaxed text-muted">{step}</p>
                </li>
              ))}
            </ol>
          </DetailSection>

          <div className="grid gap-10 sm:grid-cols-2">
            <DetailSection title="Benefits">
              <CheckList items={t.benefits} />
            </DetailSection>
            <DetailSection title="Who it may suit">
              <CheckList items={t.suitableFor} />
            </DetailSection>
          </div>

          <DetailSection title="Downtime & sessions">
            <dl className="grid gap-4 sm:grid-cols-3">
              {facts.map((f) => (
                <div key={f.label} className="rounded-2xl bg-cream p-4">
                  <dt className="eyebrow !text-[0.65rem]">{f.label}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-charcoal">{f.value}</dd>
                </div>
              ))}
            </dl>
          </DetailSection>

          <DetailSection title="Possible side effects">
            <ul className="space-y-2">
              {t.sideEffects.map((s) => (
                <li key={s} className="flex gap-3 leading-relaxed text-muted">
                  <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-champagne" aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted">Your doctor will discuss risks, suitability and aftercare with you before treatment.</p>
          </DetailSection>

          {t.faqs.length > 0 && (
            <DetailSection title="Frequently asked questions">
              <FaqList items={t.faqs} />
            </DetailSection>
          )}

          <p className="flex gap-3 rounded-2xl border border-line bg-cream/60 p-4 text-sm leading-relaxed text-muted">
            <Icon name="info" size={18} className="mt-0.5 flex-none text-gold" />
            General information written for this design preview, to be reviewed and approved by Dr. Sajjad. It is not medical advice or a diagnosis; suitability and expected results are discussed at consultation, and results vary between individuals.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="bg-cream py-16" aria-labelledby="related-title">
          <div className="container-lux">
            <h2 id="related-title" className="text-4xl">You may also consider</h2>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.id}><TreatmentCard t={r} /></li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-3xl sm:text-[2.1rem]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((b) => (
        <li key={b} className="flex gap-3 leading-relaxed text-muted">
          <Icon name="check" size={18} className="mt-1 flex-none text-gold" />
          {b}
        </li>
      ))}
    </ul>
  );
}
