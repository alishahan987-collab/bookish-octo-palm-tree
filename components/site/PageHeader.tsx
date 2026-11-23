import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  intro,
  crumbs = [],
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  crumbs?: { href: string; label: string }[];
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_80%_at_90%_0%,color-mix(in_srgb,var(--color-champagne)_28%,transparent)_0%,transparent_65%)]" />
      <div className="container-lux relative pb-12 pt-8 sm:pb-16 sm:pt-12">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><Link href="/" className="hover:text-gold">Home</Link></li>
              {crumbs.map((c, i) => (
                <li key={c.href} className="flex items-center gap-1.5">
                  <span aria-hidden="true">/</span>
                  {i === crumbs.length - 1 ? <span aria-current="page" className="text-charcoal">{c.label}</span> : <Link href={c.href} className="hover:text-gold">{c.label}</Link>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <p className="eyebrow mt-8">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl text-[2.7rem] leading-[1.03] sm:text-6xl">{title}</h1>
        {intro && <div className="mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-muted">{intro}</div>}
        {children}
      </div>
    </section>
  );
}
