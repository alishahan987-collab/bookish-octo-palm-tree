import { fullAddress, resolveHref } from "@/lib/links";
import { getPublicGallery, getPublicTestimonials, getPublicTreatments, getSite } from "@/lib/server/content";
import type * as T from "@/lib/types";
import type { Block, Settings } from "@/lib/types";
import { safeHref } from "@/lib/validation";
import { GalleryGrid } from "../site/BeforeAfter";
import { BookingForm } from "../site/BookingForm";
import { ContactForm } from "../site/ContactForm";
import { HoursList, RatingBadge, SocialLinks, Stars } from "../site/Info";
import { TreatmentCard } from "../site/TreatmentCard";
import { TreatmentGrid } from "../site/TreatmentGrid";
import { Icon } from "../ui/Icon";
import { Img } from "../ui/Img";
import { Markdown } from "../ui/Markdown";
import { ButtonLink, Heading, Section, TextLink } from "../ui/Section";

type P<B> = { b: B; settings: Settings; first: boolean };
const link = (l: T.Link, s: Settings): T.Link => ({ label: l.label, href: resolveHref(l.href, s) });
const H = (first: boolean) => (first ? "h1" : "h2");

/* --------------------------------- hero --------------------------------- */

function Hero({ b, settings, first }: P<T.HeroBlock>) {
  const Title = H(first);
  const address = fullAddress(settings.business);
  const actions = (
    <div className="mt-9 flex flex-col gap-3 sm:flex-row">
      <ButtonLink link={link(b.primary, settings)} />
      <ButtonLink link={link(b.secondary, settings)} variant="outline" />
    </div>
  );
  const meta = (
    <div className="mt-9 flex flex-col gap-3 text-sm">
      {b.showRating && <RatingBadge settings={settings} />}
      {b.showAddress && (
        <p className="flex items-center gap-2 text-fg-muted">
          <Icon name="pin" size={16} /> {address}
        </p>
      )}
    </div>
  );

  if (b.layout === "full") {
    return (
      <section data-block={b.id} className="tone-charcoal relative isolate flex min-h-[78svh] items-end overflow-hidden md:min-h-[86vh] md:items-center">
        <Img src={b.image} alt={b.imageAlt} fill priority sizes="100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/40 to-black/20 md:bg-gradient-to-r" aria-hidden="true" />
        <div className="container-x py-16 md:py-24">
          <div className="max-w-2xl">
            {b.eyebrow && <p className="eyebrow mb-5 !text-white/85">{b.eyebrow}</p>}
            <Title className="text-[2.7rem] leading-[1.02] sm:text-6xl lg:text-7xl">{b.title}</Title>
            {b.subtitle && <p className="mt-6 max-w-xl text-lg text-white/85">{b.subtitle}</p>}
            {actions}
            {meta}
          </div>
        </div>
      </section>
    );
  }

  if (b.layout === "centered") {
    return (
      <Section tone={b.tone} spacing={b.spacing} anchor={b.anchor} id={b.id}>
        <div className="container-x text-center">
          {b.eyebrow && <p className="eyebrow mb-5">{b.eyebrow}</p>}
          <Title className="mx-auto max-w-4xl text-[2.7rem] leading-[1.02] sm:text-6xl lg:text-7xl">{b.title}</Title>
          {b.subtitle && <p className="mx-auto mt-6 max-w-2xl text-lg text-fg-muted">{b.subtitle}</p>}
          <div className="flex justify-center">{actions}</div>
          <div className="flex justify-center">{meta}</div>
          {b.image && (
            <div className="img-radius relative mt-14 aspect-[16/10] md:aspect-[21/9]">
              <Img src={b.image} alt={b.imageAlt} fill priority sizes="(max-width: 1240px) 100vw, 1240px" className="object-cover" />
            </div>
          )}
        </div>
      </Section>
    );
  }

  return (
    <Section tone={b.tone} spacing="compact" anchor={b.anchor} id={b.id} className="md:!py-16 lg:!py-20">
      <div className="container-x grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        <div className="order-2 md:order-1">
          {b.eyebrow && <p className="eyebrow mb-5">{b.eyebrow}</p>}
          <Title className="text-[2.6rem] leading-[1.03] sm:text-[3.4rem] lg:text-[4.4rem]">{b.title}</Title>
          {b.subtitle && <p className="mt-6 max-w-xl text-[1.08rem] text-fg-muted">{b.subtitle}</p>}
          {actions}
          {meta}
        </div>
        <div className="order-1 md:order-2">
          <div className="img-radius relative aspect-[4/3] bg-alt sm:aspect-[16/11] md:aspect-[4/5]">
            <Img src={b.image} alt={b.imageAlt} fill priority sizes="(max-width: 768px) 100vw, 45vw" className="object-cover" />
          </div>
        </div>
      </div>
    </Section>
  );
}

function PageHeader({ b, first }: P<T.PageHeaderBlock>) {
  const Title = H(first);
  return (
    <Section tone={b.tone} spacing={b.spacing} anchor={b.anchor} id={b.id}>
      <div className={`container-x ${b.image ? "grid items-center gap-10 md:grid-cols-2" : ""}`}>
        <div className="max-w-3xl">
          {b.eyebrow && <p className="eyebrow mb-4">{b.eyebrow}</p>}
          <Title className="text-[2.6rem] leading-[1.04] sm:text-5xl md:text-[3.75rem]">{b.title}</Title>
          {b.intro && <p className="mt-5 max-w-2xl text-[1.08rem] text-fg-muted">{b.intro}</p>}
        </div>
        {b.image && (
          <div className="img-radius relative aspect-[4/3]">
            <Img src={b.image} alt={b.imageAlt} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
        )}
      </div>
    </Section>
  );
}

function Text({ b, first }: P<T.TextBlock>) {
  return (
    <Section tone={b.tone} spacing={b.spacing} anchor={b.anchor} id={b.id}>
      <div className={`container-x ${b.width === "narrow" ? "max-w-[820px]" : ""} ${b.align === "center" ? "text-center" : ""}`}>
        <Heading eyebrow={b.eyebrow} title={b.title} center={b.align === "center"} as={H(first)} />
        <Markdown source={b.body} className={`text-[1.04rem] leading-[1.8] ${b.align === "center" ? "mx-auto max-w-2xl" : ""}`} />
      </div>
    </Section>
  );
}

function ImageText({ b, settings, first }: P<T.ImageTextBlock>) {
  const Title = H(first);
  return (
    <Section tone={b.tone} spacing={b.spacing} anchor={b.anchor} id={b.id}>
      <div className="container-x grid items-center gap-10 md:grid-cols-2 lg:gap-20">
        <div className={`img-radius relative aspect-[4/5] bg-alt sm:aspect-[4/3] md:aspect-[4/5] ${b.imageSide === "right" ? "md:order-2" : ""}`}>
          <Img src={b.image} alt={b.imageAlt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        </div>
        <div>
          {b.eyebrow && <p className="eyebrow mb-4">{b.eyebrow}</p>}
          {b.title && <Title className="text-[2.1rem] sm:text-4xl md:text-[2.9rem]">{b.title}</Title>}
          <Markdown source={b.body} className="mt-6 text-[1.04rem] leading-[1.8] text-fg-muted" />
          {b.cta.label && <div className="mt-8"><TextLink link={link(b.cta, settings)} /></div>}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------ collections ------------------------------ */

async function Treatments({ b, settings, first }: P<T.TreatmentsBlock>) {
  let list = await getPublicTreatments();
  if (b.source === "featured") list = list.filter((t) => t.featured);
  if (b.limit > 0) list = list.slice(0, b.limit);
  if (!list.length) return null;
  const cols = b.columns === 2 ? "sm:grid-cols-2" : b.columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";
  return (
    <Section tone={b.tone} spacing={b.spacing} anchor={b.anchor} id={b.id}>
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <Heading eyebrow={b.eyebrow} title={b.title} intro={b.intro} as={H(first)} />
          {b.cta.label && <div className="mb-10 md:mb-14"><TextLink link={link(b.cta, settings)} /></div>}
        </div>
        {b.showCategoryFilter ? (
          <TreatmentGrid
            columns={b.columns}
            categories={settings.treatmentCategories}
            items={list.map((t) => ({ key: t.id, category: t.category, node: <TreatmentCard t={t} settings={settings} showPrice={b.showPrices} /> }))}
          />
        ) : (
          <div className={`grid grid-cols-1 gap-x-6 gap-y-12 ${cols}`}>
            {list.map((t) => <TreatmentCard key={t.id} t={t} settings={settings} showPrice={b.showPrices} />)}
          </div>
        )}
      </div>
    </Section>
  );
}

function Features({ b, first }: P<T.FeaturesBlock>) {
  const cols = b.columns === 2 ? "md:grid-cols-2" : b.columns === 3 ? "md:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";
  return (
    <Section tone={b.tone} spacing={b.spacing} anchor={b.anchor} id={b.id}>
      <div className="container-x">
        <Heading eyebrow={b.eyebrow} title={b.title} intro={b.intro} as={H(first)} />
        <ol className={`grid gap-6 ${cols} ${b.style === "minimal" ? "gap-y-10" : ""}`}>
          {b.items.map((it, i) => (
            <li key={it.id} className={b.style === "cards" ? "card border border-line bg-surface/60 p-7 md:p-8" : b.style === "numbered" ? "border-t border-fg/25 pt-6" : ""}>
              {b.style === "numbered" && <p className="font-display text-4xl text-accent-ink">{String(i + 1).padStart(2, "0")}</p>}
              <h3 className={`text-2xl ${b.style === "numbered" ? "mt-4" : ""}`}>{it.title}</h3>
              {it.text && <p className="mt-3 text-fg-muted">{it.text}</p>}
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

async function Reviews({ b, settings, first }: P<T.ReviewsBlock>) {
  let list = await getPublicTestimonials();
  if (b.limit > 0) list = [...list.filter((t) => t.featured), ...list.filter((t) => !t.featured)].slice(0, b.limit);
  const hasRating = b.showRating && settings.reviews.showBadge && settings.reviews.count > 0;
  if (!list.length && !hasRating && !b.emptyText) return null;
  const cta = link(b.cta, settings);
  return (
    <Section tone={b.tone} spacing={b.spacing} anchor={b.anchor} id={b.id}>
      <div className="container-x">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <Heading eyebrow={b.eyebrow} title={b.title} intro={b.intro} as={H(first)} />
          {hasRating && (
            <div className="mb-10 md:mb-14 md:text-right">
              <p className="font-display text-6xl leading-none">{settings.reviews.rating.toFixed(1)}</p>
              <div className="mt-2 md:flex md:justify-end"><Stars rating={settings.reviews.rating} size={18} /></div>
              <p className="mt-2 text-sm text-fg-muted">
                {settings.reviews.count.toLocaleString("en-US")} reviews on Google{settings.reviews.asOf ? ` · as of ${settings.reviews.asOf}` : ""}
              </p>
            </div>
          )}
        </div>
        {list.length > 0 ? (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {list.map((t) => (
              <li key={t.id} className="card flex flex-col border border-line bg-surface p-7 reset-tone md:p-8">
                {t.rating > 0 && <Stars rating={t.rating} />}
                <blockquote className="mt-4 flex-1 font-display text-[1.35rem] leading-snug">&ldquo;{t.text}&rdquo;</blockquote>
                <footer className="mt-6 text-sm">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-fg-muted">
                    {[t.treatment, t.source !== "other" && t.source !== "in-person" ? `via ${t.source[0].toUpperCase()}${t.source.slice(1)}` : "", t.date].filter(Boolean).join(" · ")}
                  </p>
                </footer>
              </li>
            ))}
          </ul>
        ) : (
          b.emptyText && <p className="max-w-xl text-lg text-fg-muted">{b.emptyText}</p>
        )}
        {cta.label && cta.href && (
          <div className="mt-10">
            <ButtonLink link={cta} variant="outline" icon={cta.href.includes("google") ? "google" : undefined} />
          </div>
        )}
      </div>
    </Section>
  );
}

async function Gallery({ b, settings, first }: P<T.GalleryBlock>) {
  let items = await getPublicGallery();
  if (b.limit > 0) items = items.slice(0, b.limit);
  if (!items.length && !b.emptyText) return null;
  return (
    <Section tone={b.tone} spacing={b.spacing} anchor={b.anchor} id={b.id}>
      <div className="container-x">
        <Heading eyebrow={b.eyebrow} title={b.title} intro={b.intro} as={H(first)} />
        {items.length ? (
          <>
            <GalleryGrid items={items} categories={settings.galleryCategories} showFilters={b.showFilters} />
            {b.disclaimer && <p className="mt-10 text-xs text-fg-muted">{b.disclaimer}</p>}
          </>
        ) : (
          <p className="max-w-xl text-lg text-fg-muted">{b.emptyText}</p>
        )}
        {b.cta.label && <div className="mt-10"><ButtonLink link={link(b.cta, settings)} variant="outline" /></div>}
      </div>
    </Section>
  );
}

function Cta({ b, settings, first }: P<T.CtaBlock>) {
  const Title = H(first);
  return (
    <Section tone={b.tone} spacing={b.spacing} anchor={b.anchor} id={b.id}>
      <div className={`container-x ${b.image ? "grid items-center gap-10 md:grid-cols-2 lg:gap-16" : "text-center"}`}>
        <div className={b.image ? "" : "mx-auto max-w-3xl"}>
          {b.eyebrow && <p className="eyebrow mb-4">{b.eyebrow}</p>}
          <Title className="text-[2.2rem] sm:text-4xl md:text-5xl">{b.title}</Title>
          {b.body && <p className={`mt-5 text-[1.05rem] text-fg-muted ${b.image ? "" : "mx-auto max-w-xl"}`}>{b.body}</p>}
          <div className={`mt-9 flex flex-col gap-3 sm:flex-row ${b.image ? "" : "sm:justify-center"}`}>
            <ButtonLink link={link(b.primary, settings)} />
            <ButtonLink link={link(b.secondary, settings)} variant="outline" icon={b.secondary.href.startsWith("tel:") ? "phone" : undefined} />
          </div>
          {settings.booking.financingUrl && settings.booking.financingLabel && (
            <p className={`mt-6 text-sm text-fg-muted ${b.image ? "" : "text-center"}`}>
              <a href={safeHref(settings.booking.financingUrl)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 underline-offset-4 hover:underline">
                <Icon name="card" size={16} /> {settings.booking.financingLabel}
              </a>
            </p>
          )}
        </div>
        {b.image && (
          <div className="img-radius relative aspect-[4/3]">
            <Img src={b.image} alt={b.imageAlt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
        )}
      </div>
    </Section>
  );
}

function Contact({ b, settings, first }: P<T.ContactBlock>) {
  const s = settings.business;
  const mapsHref = safeHref(s.mapsUrl);
  const Sub = b.title ? "h3" : "h2"; // keep heading levels in order when the section has no title
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(s.mapsQuery || fullAddress(s))}&output=embed`;
  return (
    <Section tone={b.tone} spacing={b.spacing} anchor={b.anchor} id={b.id}>
      <div className="container-x">
        <Heading eyebrow={b.eyebrow} title={b.title} intro={b.intro} as={H(first)} />
        <div className={`grid gap-12 ${b.showMap || b.showForm ? "lg:grid-cols-[0.9fr_1.1fr] lg:gap-16" : ""}`}>
          <div className="space-y-9">
            <div>
              <Sub className="eyebrow mb-3">Address</Sub>
              <p className="font-display text-2xl leading-snug">{s.name}</p>
              <p className="mt-1">{fullAddress(s)}</p>
              {mapsHref && (
                <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold">
                  <span className="link-underline pb-0.5">Get directions</span> <Icon name="external" size={14} />
                </a>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              {s.phone && (
                <a href={`tel:${s.phone}`} className="btn btn-primary">
                  <Icon name="phone" size={16} /> Call {s.phoneDisplay}
                </a>
              )}
              {s.email && (
                <a href={`mailto:${s.email}`} className="btn btn-outline">
                  <Icon name="mail" size={16} /> Email us
                </a>
              )}
            </div>
            {b.showHours && (
              <div>
                <Sub className="eyebrow mb-4">Opening hours</Sub>
                <div className="max-w-sm"><HoursList settings={settings} /></div>
                {s.hoursNote && <p className="mt-3 text-sm text-fg-muted">{s.hoursNote}</p>}
              </div>
            )}
            {s.languages && (
              <p className="text-sm text-fg-muted">Languages: {s.languages}</p>
            )}
            {b.showSocial && settings.social.length > 0 && (
              <div>
                <Sub className="eyebrow mb-4">Follow & message us</Sub>
                <SocialLinks links={settings.social} />
              </div>
            )}
          </div>
          <div className="space-y-10">
            {b.showMap && (
              <div className="img-radius relative aspect-[4/3] border border-line bg-alt">
                <iframe title={`Map showing ${s.name}`} src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" allowFullScreen />
              </div>
            )}
            {b.showForm && (
              <div className="card border border-line bg-surface p-6 reset-tone md:p-9">
                <Sub className="text-3xl">{b.formTitle}</Sub>
                <ContactForm />
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

async function Booking({ b, settings, first }: P<T.BookingBlock>) {
  const treatments = (await getPublicTreatments()).filter((t) => t.bookable);
  const { pages } = await getSite();
  const privacy = pages.find((p) => p.id === "p_privacy" && p.published);
  return (
    <Section tone={b.tone} spacing={b.spacing} anchor={b.anchor} id={b.id}>
      <div className="container-x">
        <Heading eyebrow={b.eyebrow} title={b.title} intro={b.intro} as={H(first)} />
        <BookingForm
          mode={settings.booking.mode}
          booksy={{ url: safeHref(settings.booking.booksyUrl), label: settings.booking.booksyLabel }}
          financing={{ url: safeHref(settings.booking.financingUrl), label: settings.booking.financingLabel }}
          treatments={treatments.map((t) => ({ id: t.id, slug: t.slug, name: t.name, category: t.category, duration: t.duration, price: t.price, booksyUrl: safeHref(t.booksyUrl) }))}
          requireEmail={settings.booking.requireEmail}
          note={settings.booking.formNote}
          successTitle={settings.booking.successTitle}
          successMessage={settings.booking.successMessage}
          consentText={settings.booking.consentText}
          privacyHref={privacy ? `/${privacy.slug}` : ""}
          phone={settings.business.phone}
          phoneDisplay={settings.business.phoneDisplay}
        />
      </div>
    </Section>
  );
}

function Faq({ b, first }: P<T.FaqBlock>) {
  if (!b.items.length) return null;
  return (
    <Section tone={b.tone} spacing={b.spacing} anchor={b.anchor} id={b.id}>
      <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Heading eyebrow={b.eyebrow} title={b.title} as={H(first)} />
        <div className="divide-y divide-line border-y border-line">
          {b.items.map((it) => (
            <details key={it.id} className="group">
              <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-display text-[1.35rem] leading-snug [&::-webkit-details-marker]:hidden">
                {it.q}
                <Icon name="chevronDown" size={20} className="flex-none transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="pb-6 pr-8 text-fg-muted"><Markdown source={it.a} /></div>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}

function Team({ b, first }: P<T.TeamBlock>) {
  if (!b.members.length) return null;
  return (
    <Section tone={b.tone} spacing={b.spacing} anchor={b.anchor} id={b.id}>
      <div className="container-x">
        <Heading eyebrow={b.eyebrow} title={b.title} intro={b.intro} as={H(first)} />
        <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {b.members.map((m) => (
            <li key={m.id}>
              <div className="img-radius relative aspect-[4/5] bg-alt">
                {m.photo ? <Img src={m.photo} alt={m.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" /> : <div className="flex h-full items-center justify-center font-display text-5xl text-fg-muted">{m.name.slice(0, 1)}</div>}
              </div>
              <h3 className="mt-5 text-2xl">{m.name}</h3>
              {m.role && <p className="eyebrow mt-2 !text-[0.66rem]">{m.role}</p>}
              {m.bio && <p className="mt-3 text-fg-muted">{m.bio}</p>}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

function ImageBanner({ b }: P<T.ImageBannerBlock>) {
  if (!b.image) return null;
  const h = b.height === "short" ? "h-[38vh] min-h-[240px]" : b.height === "tall" ? "h-[80vh] min-h-[420px]" : "h-[56vh] min-h-[320px]";
  return (
    <section data-block={b.id} id={b.anchor || undefined} className={`relative ${h}`}>
      <Img src={b.image} alt={b.imageAlt} fill sizes="100vw" className="object-cover" />
      {b.caption && <p className="absolute bottom-4 left-4 right-4 text-sm text-white drop-shadow md:left-8">{b.caption}</p>}
    </section>
  );
}

/* -------------------------------- render -------------------------------- */

const REGISTRY: { [K in Block["type"]]: (p: P<Extract<Block, { type: K }>>) => React.ReactNode | Promise<React.ReactNode> } = {
  hero: Hero, pageHeader: PageHeader, text: Text, imageText: ImageText, treatments: Treatments, features: Features,
  reviews: Reviews, gallery: Gallery, cta: Cta, contact: Contact, booking: Booking, faq: Faq, team: Team, imageBanner: ImageBanner,
};

export function RenderBlocks({ blocks, settings }: { blocks: Block[]; settings: Settings }) {
  const visible = blocks.filter((b) => !b.hidden);
  return (
    <>
      {visible.map((b, i) => {
        const C = REGISTRY[b.type] as React.ComponentType<P<Block>> | undefined;
        return C ? <C key={b.id} b={b} settings={settings} first={i === 0} /> : null;
      })}
    </>
  );
}
