import Link from "next/link";
import { fullAddress, type ResolvedLink } from "@/lib/links";
import type { Design, Settings } from "@/lib/types";
import { safeHref } from "@/lib/validation";
import { Icon } from "../ui/Icon";
import { Img } from "../ui/Img";
import { HoursList, SocialLinks } from "./Info";

function FLink({ l }: { l: ResolvedLink }) {
  return l.href.startsWith("/") ? (
    <Link href={l.href} className="link-underline">{l.label}</Link>
  ) : (
    <a href={l.href} className="link-underline" target={l.newTab ? "_blank" : undefined} rel="noopener noreferrer">{l.label}</a>
  );
}

export function Footer({ settings, design, columns, legal }: { settings: Settings; design: Design; columns: { id: string; title: string; links: ResolvedLink[] }[]; legal: ResolvedLink[] }) {
  const b = settings.business;
  const f = design.footer;
  const tone = f.tone === "charcoal" ? "tone-charcoal" : f.tone === "champagne" ? "tone-champagne" : "tone-ivory border-t border-line";
  const mapsHref = safeHref(b.mapsUrl);
  return (
    <footer className={`${tone} pb-28 pt-16 md:pb-12 md:pt-20`}>
      <div className="container-x">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div>
            {design.header.logo ? (
              <Img src={design.header.logo} alt={b.name} width={180} height={56} className="h-12 w-auto object-contain" />
            ) : (
              <p className="flex flex-col leading-none">
                <span className="font-display text-3xl tracking-[0.18em]">{design.header.logoText}</span>
                <span className="mt-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-fg-muted">{design.header.logoSubtext}</span>
              </p>
            )}
            {f.about && <p className="mt-6 max-w-xs text-sm text-fg-muted">{f.about}</p>}
            {f.showSocial && <SocialLinks links={settings.social} className="mt-6" />}
          </div>

          {columns.map((c) => (
            <nav key={c.id} aria-label={c.title}>
              <h2 className="eyebrow mb-5">{c.title}</h2>
              <ul className="space-y-3 text-sm">
                {c.links.map((l) => <li key={l.id}><FLink l={l} /></li>)}
              </ul>
            </nav>
          ))}

          <div>
            <h2 className="eyebrow mb-5">Visit</h2>
            <address className="space-y-3 text-sm not-italic">
              <p className="flex gap-3">
                <Icon name="pin" size={17} className="mt-0.5 flex-none" />
                {mapsHref ? <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="link-underline">{fullAddress(b)}</a> : fullAddress(b)}
              </p>
              {b.phone && (
                <p className="flex gap-3"><Icon name="phone" size={17} className="mt-0.5 flex-none" /><a href={`tel:${b.phone}`} className="link-underline">{b.phoneDisplay}</a></p>
              )}
              {b.email && (
                <p className="flex gap-3"><Icon name="mail" size={17} className="mt-0.5 flex-none" /><a href={`mailto:${b.email}`} className="link-underline break-all">{b.email}</a></p>
              )}
            </address>
            {f.showHours && (
              <div className="mt-6">
                <HoursList settings={settings} compact />
              </div>
            )}
          </div>
        </div>

        <div className="mt-14 border-t border-line pt-8 text-xs text-fg-muted">
          {f.disclaimer && <p className="max-w-3xl leading-relaxed">{f.disclaimer}</p>}
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>{f.copyright.replace("{{year}}", String(new Date().getFullYear()))}</p>
            {legal.length > 0 && (
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {legal.map((l) => <li key={l.id}><FLink l={l} /></li>)}
              </ul>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
