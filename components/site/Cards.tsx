"use client";

import Link from "next/link";
import type { Condition, Post, Treatment } from "@/lib/data/types";
import { Icon } from "../ui/Icon";
import { PriceTag } from "../ui/Price";
import { SmartImage } from "../ui/SmartImage";

export const CATEGORY_LABEL = { skin: "Skin", aesthetic: "Aesthetic", hair: "Hair", consultation: "Consultation" } as const;
export const CATEGORY_PAGE = { skin: "/skin-treatments", aesthetic: "/aesthetic-procedures", hair: "/hair-treatments", consultation: "/treatments" } as const;

export function ConditionCard({ c, headingLevel = 3 }: { c: Condition; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="card group relative flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]" data-condition={c.slug}>
      <SmartImage src={c.image} alt={c.imageAlt ?? ""} palette={c.order} className="aspect-[4/3] w-full transition-transform duration-700 group-hover:scale-[1.03]" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
      <div className="flex flex-1 flex-col p-5">
        <H className="text-[1.55rem]">{c.name}</H>
        <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{c.summary}</p>
        <Link href={`/conditions/${c.slug}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold after:absolute after:inset-0" >
          Learn more<span className="sr-only"> about {c.name}</span> <Icon name="arrow" size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}

export function ProcedureCard({ t, currency, headingLevel = 3, priority }: { t: Treatment; currency: string; headingLevel?: 2 | 3; priority?: boolean }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="card group relative flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]" data-procedure={t.slug}>
      <div className="relative">
        <SmartImage src={t.image} alt={t.imageAlt ?? ""} palette={t.palette} priority={priority} className="aspect-[4/3] w-full transition-transform duration-700 group-hover:scale-[1.03]" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        <span className="chip absolute left-4 top-4 bg-ivory/90 text-charcoal backdrop-blur">{CATEGORY_LABEL[t.category]}</span>
        {t.price.type === "promo" && <span className="chip absolute right-4 top-4 bg-charcoal text-ivory">Offer</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <H className="text-[1.6rem]">
          <Link href={`/treatments/${t.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">{t.name}</Link>
        </H>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">{t.shortDescription}</p>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
          <PriceTag price={t.price} currency={currency} />
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-gold">
            Details <Icon name="arrow" size={16} className="transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </article>
  );
}

export function PostCard({ p, headingLevel = 3 }: { p: Post; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  const date = p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Draft";
  const minutes = Math.max(2, Math.round(p.content.split(/\s+/).length / 220));
  return (
    <article className="group relative flex h-full flex-col" data-post={p.slug}>
      <SmartImage src={p.cover} alt={p.coverAlt ?? ""} className="aspect-[16/10] w-full rounded-2xl transition-transform duration-700 group-hover:scale-[1.02]" sizes="(max-width: 768px) 100vw, 33vw" />
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted">
        {p.tags[0] && <span className="text-gold">{p.tags[0]} · </span>}{date} · {minutes} min read
      </p>
      <H className="mt-2 text-[1.6rem] leading-tight">
        <Link href={`/blog/${p.slug}`} className="after:absolute after:inset-0 group-hover:text-gold">{p.title}</Link>
      </H>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{p.excerpt}</p>
    </article>
  );
}
