import Link from "next/link";
import { Footer } from "@/components/site/Footer";
import { FloatingActions } from "@/components/site/FloatingActions";
import { Header } from "@/components/site/Header";
import { bookHref, resolveHref, resolveNav } from "@/lib/links";
import { getSite } from "@/lib/server/content";
import { siteUrl } from "@/lib/server/http";
import { safeHref } from "@/lib/validation";
import { localBusinessJsonLd, JsonLd } from "@/components/site/JsonLd";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { settings, design, navigation, pages } = await getSite();
  const header = resolveNav(navigation.header, pages, settings);
  const columns = navigation.footer.map((c) => ({ id: c.id, title: c.title, links: resolveNav(c.items, pages, settings) })).filter((c) => c.links.length);
  const legal = resolveNav(navigation.legal, pages, settings);
  const book = design.header.showBookButton ? { label: design.header.bookLabel, href: bookHref(settings) } : null;
  const a = settings.announcement;
  const announcementHref = resolveHref(a.href, settings);

  return (
    <>
      <a href="#main" className="sr-only z-50 bg-ink px-4 py-3 text-bg focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to content</a>
      {a.enabled && a.text && (
        <div className="tone-charcoal px-4 py-2.5 text-center text-[0.8rem] tracking-wide">
          {announcementHref ? (
            announcementHref.startsWith("/") ? <Link href={announcementHref} className="underline-offset-4 hover:underline">{a.text}</Link> : <a href={announcementHref} className="underline-offset-4 hover:underline" target="_blank" rel="noopener noreferrer">{a.text}</a>
          ) : a.text}
        </div>
      )}
      <Header
        links={header}
        logo={design.header.logo}
        logoText={design.header.logoText}
        logoSubtext={design.header.logoSubtext}
        businessName={settings.business.name}
        phone={settings.business.phone}
        phoneDisplay={settings.business.phoneDisplay}
        showPhone={design.header.showPhone}
        book={book}
      />
      <main id="main">{children}</main>
      <Footer settings={settings} design={design} columns={columns} legal={legal} />
      <FloatingActions
        phone={settings.floating.showCall ? settings.business.phone : undefined}
        book={settings.floating.showBook ? { label: "Book", href: bookHref(settings) } : null}
        whatsapp={settings.floating.showWhatsApp ? safeHref(settings.floating.whatsappUrl) || undefined : undefined}
      />
      <JsonLd data={localBusinessJsonLd(settings, siteUrl())} />
    </>
  );
}
