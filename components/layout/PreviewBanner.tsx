"use client";

import Link from "next/link";
import { useSite } from "../site/SiteProvider";

/** Preview notice (while the site is in review) and the admin-managed announcement bar. */
export function PreviewBanner() {
  const { content } = useSite();
  const { previewBanner: p, announcement: a } = content;
  return (
    <>
      {p.enabled && (
        <div role="note" className="bg-charcoal px-4 py-1.5 text-center text-[0.72rem] leading-snug tracking-wide text-champagne-soft">
          {p.text}
        </div>
      )}
      {a.enabled && a.text && (
        <div className="bg-cream px-4 py-2 text-center text-[0.8rem] text-ink">
          {a.text}{" "}
          {a.href && (
            <Link href={a.href} className="font-semibold text-gold underline underline-offset-4">
              {a.linkLabel || "Learn more"}
            </Link>
          )}
        </div>
      )}
    </>
  );
}
