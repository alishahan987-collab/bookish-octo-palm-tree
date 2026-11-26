"use client";

import Link from "next/link";
import { useSite } from "../site/SiteProvider";
import { SmartImage } from "../ui/SmartImage";

/** Wordmark: the short name in widely spaced serif capitals over a fine sans-serif tagline. */
export function Logo({ light = false, size = "md" }: { light?: boolean; size?: "md" | "lg" }) {
  const { content } = useSite();
  const { brand } = content;
  return (
    <Link href="/" className="inline-flex items-center leading-none" aria-label={`${brand.clinicName}, home`}>
      {brand.logo ? (
        <SmartImage src={brand.logo} alt={brand.logoAlt || brand.clinicName} className="h-11 w-36" sizes="144px" fill style={{ objectFit: "contain" }} />
      ) : (
        <span className="flex flex-col items-center" aria-hidden="true">
          <span className={`font-serif font-medium leading-none tracking-[0.24em] [margin-right:-0.24em] ${size === "lg" ? "text-[2.6rem]" : "text-[1.7rem] sm:text-[1.85rem]"} ${light ? "text-ivory" : "text-charcoal"}`}>
            {brand.shortName}
          </span>
          {brand.tagline && (
            <span className={`mt-1.5 flex items-center gap-2 whitespace-nowrap font-sans font-medium uppercase leading-none tracking-[0.3em] [margin-right:-0.3em] ${size === "lg" ? "text-[0.62rem]" : "text-[0.5rem] sm:text-[0.52rem]"} ${light ? "text-champagne" : "text-gold"}`}>
              {brand.tagline}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}
