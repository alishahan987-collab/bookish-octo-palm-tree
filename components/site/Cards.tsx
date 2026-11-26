"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import type { CategoryId, Condition, Post, Treatment } from "@/lib/data/types";
import { Icon } from "../ui/Icon";
import { PriceTag } from "../ui/Price";
import { SmartImage } from "../ui/SmartImage";

export const CATEGORY_LABEL = Object.fromEntries(Object.entries(CATEGORIES).map(([k, v]) => [k, v.label])) as Record<CategoryId, string>;
export const CATEGORY_PAGE = Object.fromEntries(Object.entries(CATEGORIES).map(([k, v]) => [k, v.href])) as Record<CategoryId, string>;

/** Editorial card for the homepage: portrait image, name, short description, "Learn more". */
export function TreatmentCard({ t, priority, headingLevel = 3 }: { t: Treatment; priority?: boolean; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="group relative flex h-full flex-col" data-procedure={t.slug}>
      <SmartImage src={t.image} alt={t.imageAlt ?? ""} palette={t.palette} priority={priority} className="grade zoom-img aspect-[4/5] w-full" sizes="(max-width: 767px) 78vw, 33vw" />
      <p className="eyebrow mt-5">{CATEGORY_LABEL[t.category]}</p>
      <H className="mt-2 text-[1.75rem] leading-tight">{t.name}</H>
      <p className="mt-2 line-clamp-2 flex-1 text-[0.95rem] leading-relaxed text-muted">{t.shortDescription}</p>
      <Link href={`/treatments/${t.slug}`} className="link-lux mt-4 self-start after:absolute after:inset-0">
        Learn more<span className="sr-only"> about {t.name}</span> <Icon name="arrow" size={14} />
      </Link>
    </article>
  );
}

/** Catalogue card with price, used on treatment lists and "related" rows. */
export function ProcedureCard({ t, currency, headingLevel = 3, priority }: { t: Treatment; currency: string; headingLevel?: 2 | 3; priority?: boolean }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="group relative flex h-full flex-col bg-surface" data-procedure={t.slug}>
      <div className="relative">
        <SmartImage src={t.image} alt={t.imageAlt ?? ""} palette={t.palette} priority={priority} className="grade zoom-img aspect-[4/3] w-full" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        {t.price.type === "promo" && <span className="chip absolute right-3 top-3 bg-charcoal text-ivory">{t.price.label || "Offer"}</span>}
      </div>
      <div className="flex flex-1 flex-col border-x border-b border-line p-5 sm:p-6">
        <p className="eyebrow">{CATEGORY_LABEL[t.category]}</p>
        <H className="mt-2 text-[1.6rem] leading-tight">
          <Link href={`/treatments/${t.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">{t.name}</Link>
        </H>
        <p className="mt-2 line-clamp-2 flex-1 text-[0.92rem] leading-relaxed text-muted">{t.shortDescription}</p>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
          <PriceTag price={t.price} currency={currency} />
          <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-charcoal">
            Details <Icon name="arrow" size={14} />
          </span>
        </div>
      </div>
    </article>
  );
}

export function ConditionCard({ c, headingLevel = 3 }: { c: Condition; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="group relative flex h-full flex-col" data-condition={c.slug}>
      <SmartImage src={c.image} alt={c.imageAlt ?? ""} palette={c.order} className="grade zoom-img aspect-[4/3] w-full" sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 25vw" />
      <H className="mt-4 text-[1.5rem] leading-tight">{c.name}</H>
      <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{c.summary}</p>
      <Link href={`/conditions/${c.slug}`} className="link-lux mt-3 self-start after:absolute after:inset-0">
        Learn more<span className="sr-only"> about {c.name}</span> <Icon name="arrow" size={14} />
      </Link>
    </article>
  );
}

export function PostCard({ p, headingLevel = 3 }: { p: Post; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  const date = p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Draft";
  const minutes = Math.max(2, Math.round(p.content.split(/\s+/).length / 220));
  return (
    <article className="group relative flex h-full flex-col" data-post={p.slug}>
      <SmartImage src={p.cover} alt={p.coverAlt ?? ""} className="grade zoom-img aspect-[4/3] w-full" sizes="(max-width: 768px) 100vw, 33vw" />
      <p className="mt-5 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted">
        {p.tags[0] && <span className="text-gold">{p.tags[0]} · </span>}{date} · {minutes} min read
      </p>
      <H className="mt-2 text-[1.6rem] leading-tight">
        <Link href={`/blog/${p.slug}`} className="after:absolute after:inset-0 group-hover:text-gold">{p.title}</Link>
      </H>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{p.excerpt}</p>
    </article>
  );
}
