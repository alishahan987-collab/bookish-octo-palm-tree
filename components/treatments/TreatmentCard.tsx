import Link from "next/link";
import { categoryLabel } from "@/lib/data/catalog";
import type { Treatment } from "@/lib/data/types";
import { TreatmentArt } from "../ui/Art";
import { Icon } from "../ui/Icon";
import { PriceTag } from "../ui/Price";

export function TreatmentCard({ t, showPrice = true, headingLevel = 3 }: { t: Treatment; showPrice?: boolean; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="card group relative flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <TreatmentArt palette={t.palette} className="h-full w-full transition-transform duration-700 group-hover:scale-[1.04]" />
        <span className="chip absolute left-4 top-4 bg-ivory/90 text-charcoal backdrop-blur">{categoryLabel(t.category)}</span>
        {t.price.type === "promo" && <span className="chip absolute right-4 top-4 bg-charcoal text-ivory">Offer</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <H className="text-[1.65rem]">
          <Link href={`/treatments/${t.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {t.name}
          </Link>
        </H>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{t.shortDescription}</p>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
          {showPrice ? <PriceTag price={t.price} /> : <span />}
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-gold">
            Details <Icon name="arrow" size={16} className="transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </article>
  );
}
