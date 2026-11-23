"use client";

import Link from "next/link";
import { useSite } from "../site/SiteProvider";
import { SmartImage } from "../ui/SmartImage";

export function Logo({ light = false }: { light?: boolean }) {
  const { content } = useSite();
  const { brand } = content;
  return (
    <Link href="/" className="inline-flex items-center gap-3 leading-none" aria-label={`${brand.clinicName}, home`}>
      {brand.logo ? (
        <SmartImage src={brand.logo} alt={brand.logoAlt || brand.clinicName} className="h-11 w-36" sizes="144px" fill style={{ objectFit: "contain" }} />
      ) : (
        <span className="flex flex-col">
          <span className={`font-serif text-[1.6rem] tracking-[0.02em] ${light ? "text-ivory" : "text-charcoal"}`}>{brand.shortName}</span>
          <span className={`mt-1 whitespace-nowrap text-[0.5rem] font-semibold uppercase tracking-[0.15em] sm:max-w-none sm:text-[0.6rem] sm:tracking-[0.28em] ${light ? "text-champagne" : "text-gold"}`}>{brand.tagline}</span>
        </span>
      )}
    </Link>
  );
}
