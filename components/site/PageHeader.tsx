import Link from "next/link";
import type { ReactNode } from "react";

/** Inner-page heading: breadcrumb, eyebrow, serif title, intro. Optional image on the right from tablet up. */
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
    <section className="border-b border-line bg-ivory">
      <div className="container-lux pb-12 pt-8 sm:pb-16 sm:pt-10 lg:pb-20 lg:pt-14">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="text-[0.7rem] uppercase tracking-[0.18em] text-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-gold">Home</Link></li>
              {crumbs.map((c, i) => (
                <li key={c.href} className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-champagne">/</span>
                  {i === crumbs.length - 1 ? <span aria-current="page" className="text-charcoal">{c.label}</span> : <Link href={c.href} className="hover:text-gold">{c.label}</Link>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <p className="eyebrow mt-10 animate-rise">{eyebrow}</p>}
        <h1 className="display mt-4 max-w-4xl animate-rise text-[2.75rem] sm:text-6xl lg:text-[4.5rem]">{title}</h1>
        {intro && <div className="lead mt-6 max-w-2xl animate-rise">{intro}</div>}
        {children}
      </div>
    </section>
  );
}
