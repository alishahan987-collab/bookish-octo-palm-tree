"use client";

import Link from "next/link";
import { getConditions, getGallery, getPosts, getTreatments } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import type { Condition, GalleryItem, HomeSection, Post, Treatment } from "@/lib/data/types";
import { CATEGORIES } from "@/lib/categories";
import { weeklyHours } from "@/lib/hours";
import { telHref } from "@/lib/phone";
import { clinicNow } from "@/lib/tz";
import { useEffect, useState } from "react";
import { BeforeAfterSlider } from "../site/BeforeAfterSlider";
import { ConditionCard, PostCard, TreatmentCard } from "../site/Cards";
import { useSite } from "../site/SiteProvider";
import { directionsUrl, useOpenStatus } from "../site/useClinic";
import { Icon, type IconName } from "../ui/Icon";
import { Reveal } from "../ui/Motion";
import { PriceTag } from "../ui/Price";
import { SmartImage } from "../ui/SmartImage";
import { FaqList, MapEmbed, Stars } from "./parts";

export interface HomeData {
  treatments: Treatment[];
  conditions: Condition[];
  posts: Post[];
  gallery: GalleryItem[];
}

/** Renders the homepage from the ordered, admin-managed list of sections. */
export function Home({ initial }: { initial: HomeData }) {
  const { content } = useSite();
  const treatments = useData(() => getTreatments(), initial.treatments).data;
  const conditions = useData(() => getConditions(), initial.conditions).data;
  const posts = useData(() => getPosts(), initial.posts).data;
  const gallery = useData(() => getGallery(), initial.gallery).data;

  const sections = content.homeSections.filter((s) => s.visible);
  const firstHero = sections.findIndex((s) => s.type === "hero");

  const render = (s: HomeSection, i: number) => {
    switch (s.type) {
      case "hero": return <Hero s={s} primary={i === firstHero} />;
      case "treatments": return <TreatmentsSection s={s} treatments={treatments} />;
      case "about": return <AboutSection s={s} />;
      case "why": return <WhySection s={s} />;
      case "beforeAfter": return <BeforeAfterSection s={s} gallery={gallery} />;
      case "testimonials": return <TestimonialsSection s={s} />;
      case "team": return <TeamSection s={s} />;
      case "booking": return <BookingSection s={s} />;
      case "location": return <LocationSection s={s} />;
      case "faq": return <FaqSection s={s} />;
      case "concerns": return <ConcernsSection s={s} conditions={conditions} />;
      case "pricing": return <PricingSection s={s} treatments={treatments} />;
      case "journal": return <JournalSection s={s} posts={posts} />;
      case "custom": return <CustomSection s={s} />;
    }
  };

  return (
    <>
      {firstHero === -1 && <h1 className="sr-only">{content.brand.clinicName}</h1>}
      {sections.map((s, i) => (
        <div key={s.id} data-section={s.type} data-section-id={s.id}>{render(s, i)}</div>
      ))}
    </>
  );
}

/* --------------------------------- shared --------------------------------- */

const tid = (s: HomeSection) => `${s.id}-title`;
const PAD = "py-20 sm:py-24 lg:py-32";

function Heading({ s, align = "left", light = false, children }: { s: HomeSection; align?: "left" | "center"; light?: boolean; children?: React.ReactNode }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {s.eyebrow && <p className="eyebrow">{s.eyebrow}</p>}
      <h2 id={tid(s)} className={`mt-4 text-[2.4rem] leading-[1.04] sm:text-5xl lg:text-[3.6rem] ${light ? "!text-ivory" : ""}`}>{s.title}</h2>
      {s.intro && <p className={`mt-5 ${light ? "text-[1.05rem] leading-relaxed text-[#ddd6cc]" : "lead"}`}>{s.intro}</p>}
      {children}
    </div>
  );
}

const toneClass = (tone: HomeSection["tone"], fallback: HomeSection["tone"] = "light") =>
  ({ light: "bg-ivory", cream: "bg-cream", dark: "on-dark bg-charcoal" })[tone ?? fallback ?? "light"];

/** Shown only while the site is in preview mode, so the clinic can see where verified content will go. */
function PreviewPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-12 flex flex-col items-center justify-center gap-3 border border-dashed border-sand px-6 py-14 text-center" data-testid="preview-placeholder">
      <Icon name="sparkle" size={22} className="text-champagne" />
      <div className="max-w-md text-sm leading-relaxed text-muted">{children}</div>
    </div>
  );
}

/* ----------------------------------- Hero ----------------------------------- */

function Hero({ s, primary }: { s: HomeSection; primary: boolean }) {
  const { content } = useSite();
  const status = useOpenStatus();
  const H = primary ? "h1" : "h2";
  const { reviews, contact } = content;
  const city = contact.city.replace(/\s*\d{5}(-\d{4})?$/, "") || contact.address;

  /*
   * One markup, two compositions:
   *  - phones: full-height photograph, message over a soft dark gradient;
   *  - tablets and up: editorial split, photograph bleeding to the right edge.
   */
  return (
    <section className="relative overflow-hidden bg-ivory" aria-labelledby={tid(s)} data-testid="hero">
      <div className="relative h-[calc(100svh-4.25rem-3.5rem)] max-h-[46rem] min-h-[36rem] md:absolute md:inset-y-0 md:right-0 md:h-auto md:max-h-none md:min-h-0 md:w-[46%] lg:w-1/2">
        <div className="hero-zoom absolute inset-0 overflow-hidden">
          <SmartImage src={s.image} alt={s.imageAlt ?? ""} priority className="h-full w-full" sizes="(max-width: 767px) 100vw, 50vw" style={{ objectPosition: "38% 28%" }} />
        </div>
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgb(37_37_37/0)_12%,rgb(37_37_37/0.62)_36%,rgb(37_37_37/0.88)_58%,rgb(37_37_37/0.95)_100%)] md:hidden" />
      </div>

      <div className="absolute inset-x-0 bottom-0 md:relative">
        <div className="container-lux md:flex md:min-h-[clamp(36rem,calc(100svh-7.5rem),58rem)] md:items-center">
          <div className="hero-copy pb-8 md:w-[54%] md:py-16 md:pr-10 lg:w-1/2 lg:pr-16">
            <p className="eyebrow animate-rise !text-champagne md:!text-gold">{s.eyebrow}</p>
            <H id={tid(s)} className="display mt-3 animate-rise text-[2.6rem] !text-ivory min-[390px]:text-[2.85rem] md:mt-5 md:text-[3.1rem] md:!text-charcoal lg:text-[4.3rem] xl:text-[5.1rem]">
              {s.title} {s.highlight && <em className="text-champagne md:text-gold">{s.highlight}</em>}
            </H>
            {s.intro && <p className="mt-3 animate-rise text-[0.98rem] leading-relaxed text-[#ece7df] md:mt-6 md:max-w-md md:text-[1.0625rem] md:text-muted lg:text-lg">{s.intro}</p>}
            <div className="mt-6 grid gap-2.5 min-[400px]:grid-cols-2 md:mt-9 md:flex md:flex-wrap md:gap-3">
              {s.ctaLabel && <Link href={s.ctaHref || "/book"} className="btn btn-hero">{s.ctaLabel} <Icon name="arrow" size={16} className="hidden md:block" /></Link>}
              {s.secondaryLabel && <Link href={s.secondaryHref || "/treatments"} className="btn btn-hero-2">{s.secondaryLabel}</Link>}
            </div>
            <ul className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-[0.8rem] text-[#e9e4dc] md:mt-10 md:border-t md:border-line md:pt-6 md:text-muted">
              {reviews.enabled && reviews.count > 0 && (
                <li>
                  <a href={reviews.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                    <Stars rating={reviews.rating} className="text-champagne" />
                    <span><strong className="font-medium text-ivory md:text-charcoal">{reviews.rating.toFixed(1)}</strong> · {reviews.count} {reviews.source} reviews</span>
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              )}
              <li className="hidden items-center gap-2 md:flex"><Icon name="pin" size={15} className="text-champagne" />{city}</li>
              {status && (
                <li className="flex items-center gap-2 md:hidden">
                  <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${status.open ? "bg-[#7fc49a]" : "bg-champagne"}`} />
                  {status.label}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Treatments -------------------------------- */

function pickTreatments(all: Treatment[], s: HomeSection): Treatment[] {
  const cat = s.category ?? "featured";
  let list = all.filter((t) => t.active !== false);
  if (cat === "featured") list = [...list.filter((t) => t.featured), ...list.filter((t) => !t.featured)];
  else if (cat !== "all") list = list.filter((t) => t.category === cat);
  return list.slice(0, s.limit ?? 6);
}

function TreatmentsSection({ s, treatments }: { s: HomeSection; treatments: Treatment[] }) {
  const list = pickTreatments(treatments, s);
  const viewAll = s.ctaHref || (s.category && s.category !== "featured" && s.category !== "all" ? CATEGORIES[s.category].href : "/treatments");
  return (
    <section className={`${toneClass(s.tone)} ${PAD}`} aria-labelledby={tid(s)}>
      <div className="container-lux">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <Heading s={s} />
          <Link href={viewAll} className="link-lux hidden flex-none md:inline-flex">{s.ctaLabel || "View all treatments"} <Icon name="arrow" size={14} /></Link>
        </div>
        <ul className="no-scrollbar -mx-4 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-x-6 md:gap-y-14 md:overflow-visible md:px-0 lg:gap-x-8" data-testid="home-treatments">
          {list.map((t, i) => (
            <li key={t.id} className="w-[78%] flex-none snap-start min-[480px]:w-[60%] sm:w-[46%] md:w-auto">
              <Reveal delay={(i % 3) * 0.08} className="h-full"><TreatmentCard t={t} priority={i < 2} /></Reveal>
            </li>
          ))}
        </ul>
        <div className="mt-10 md:hidden">
          <Link href={viewAll} className="btn btn-ghost w-full">{s.ctaLabel || "View all treatments"}</Link>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------- About ----------------------------------- */

function AboutSection({ s }: { s: HomeSection }) {
  const { content } = useSite();
  const right = s.imageSide === "right";
  return (
    <section className={`${toneClass(s.tone, "cream")} ${PAD}`} aria-labelledby={tid(s)}>
      <div className="container-lux grid items-center gap-12 md:grid-cols-2 md:gap-12 lg:gap-24">
        <Reveal className={`reveal-img ${right ? "md:order-2" : ""}`}>
          <SmartImage src={s.image} alt={s.imageAlt ?? ""} className="aspect-[4/5] w-full" sizes="(max-width: 768px) 100vw, 50vw" />
        </Reveal>
        <div>
          <Heading s={s} />
          {content.about.values.length > 0 && (
            <ol className="mt-10 grid gap-6 border-t border-taupe/60 pt-8 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
              {content.about.values.slice(0, 3).map((v, i) => (
                <li key={v.title}>
                  <span className="font-serif text-lg text-gold">0{i + 1}</span>
                  <p className="mt-1 font-serif text-[1.45rem] leading-tight text-charcoal">{v.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{v.text}</p>
                </li>
              ))}
            </ol>
          )}
          {s.ctaLabel && <Link href={s.ctaHref || "/about"} className="link-lux mt-10">{s.ctaLabel} <Icon name="arrow" size={14} /></Link>}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- Why us ---------------------------------- */

const ICONS: IconName[] = ["star", "sparkle", "clock", "accessible", "shield", "heart", "leaf", "user"];

function WhySection({ s }: { s: HomeSection }) {
  const { content } = useSite();
  if (content.why.length === 0) return null;
  return (
    <section className={`${s.tone ? toneClass(s.tone) : "bg-surface"} ${PAD}`} aria-labelledby={tid(s)}>
      <div className="container-lux">
        <Heading s={s} align="center" />
        <ul className="mt-12 grid gap-px bg-line sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
          {content.why.map((p, i) => {
            const icon = (ICONS as string[]).includes(p.icon ?? "") ? (p.icon as IconName) : ICONS[i % ICONS.length];
            return (
              <li key={`${p.title}-${i}`} className={s.tone ? toneClass(s.tone) : "bg-surface"}>
                <Reveal delay={i * 0.07} className="flex h-full gap-5 px-1 py-7 sm:flex-col sm:items-center sm:px-8 sm:py-10 sm:text-center">
                  <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-champagne text-gold sm:h-14 sm:w-14"><Icon name={icon} size={22} /></span>
                  <div>
                    <h3 className="text-[1.5rem] sm:mt-6 sm:text-[1.6rem]">{p.title}</h3>
                    <p className="mt-1.5 max-w-xs text-[0.92rem] leading-relaxed text-muted sm:mt-2.5">{p.text}</p>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------- Before & after ------------------------------- */

function BeforeAfterSection({ s, gallery }: { s: HomeSection; gallery: GalleryItem[] }) {
  const { content } = useSite();
  const items = gallery.filter((g) => g.published).slice(0, 2);
  if (items.length === 0 && !content.previewBanner.enabled) return null;
  return (
    <section className={`${toneClass(s.tone)} ${PAD}`} aria-labelledby={tid(s)}>
      <div className="container-lux">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <Heading s={s} />
          {items.length > 0 && <Link href={s.ctaHref || "/before-after"} className="link-lux flex-none">{s.ctaLabel || "View the gallery"} <Icon name="arrow" size={14} /></Link>}
        </div>
        {items.length > 0 ? (
          <ul className="mt-12 grid gap-10 md:grid-cols-2 md:gap-8">
            {items.map((g) => <li key={g.id}><Reveal><BeforeAfterSlider item={g} /></Reveal></li>)}
          </ul>
        ) : (
          <PreviewPlaceholder>
            <strong className="font-medium text-charcoal">Your before &amp; after gallery appears here.</strong> Upload genuine client photographs in
            Admin → Before &amp; after. A photo can only be published once written consent is recorded. This note is visible only in preview mode; on the live site an empty gallery is hidden.
          </PreviewPlaceholder>
        )}
      </div>
    </section>
  );
}

/* -------------------------------- Testimonials -------------------------------- */

function TestimonialsSection({ s }: { s: HomeSection }) {
  const { content } = useSite();
  const { reviews } = content;
  const quotes = content.testimonials.filter((t) => t.permission && t.visible).slice(0, s.limit ?? 6);
  const showRating = reviews.enabled && reviews.count > 0;
  if (!showRating && quotes.length === 0 && !content.previewBanner.enabled) return null;
  const asOf = reviews.asOf ? new Date(`${reviews.asOf}T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";
  return (
    <section className={`${toneClass(s.tone, "cream")} ${PAD}`} aria-labelledby={tid(s)}>
      <div className="container-lux grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <Heading s={s} />
          {showRating && (
            <div className="mt-10 border-t border-taupe/60 pt-8" data-testid="rating-summary">
              <p className="flex items-end gap-4">
                <span className="font-serif text-[5.5rem] leading-[0.8] text-charcoal">{reviews.rating.toFixed(1)}</span>
                <span className="pb-1">
                  <Stars rating={reviews.rating} size={18} className="text-gold" />
                  <span className="mt-1.5 block text-sm text-muted">{reviews.count} reviews on {reviews.source}</span>
                </span>
              </p>
              {asOf && <p className="mt-4 text-xs text-muted">Rating and review count as of {asOf}.</p>}
              {reviews.url && (
                <a href={reviews.url} target="_blank" rel="noopener noreferrer" className="link-lux mt-6">Read our reviews <Icon name="arrow" size={14} /><span className="sr-only"> on {reviews.source} (opens in a new tab)</span></a>
              )}
            </div>
          )}
        </div>
        {quotes.length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2" data-testid="testimonials">
            {quotes.map((q, i) => (
              <li key={q.id}>
                <Reveal delay={(i % 2) * 0.08} className="h-full">
                  <figure className="flex h-full flex-col bg-ivory p-7 sm:p-8">
                    <Icon name="quote" size={26} className="text-champagne" />
                    <blockquote className="mt-4 flex-1 font-serif text-[1.35rem] leading-snug text-charcoal">{q.quote}</blockquote>
                    <figcaption className="mt-6 border-t border-line pt-4 text-sm">
                      <span className="font-medium text-charcoal">{q.author}</span>
                      <span className="text-muted"> · {q.source}{q.date ? `, ${new Date(`${q.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : ""}</span>
                    </figcaption>
                  </figure>
                </Reveal>
              </li>
            ))}
          </ul>
        ) : content.previewBanner.enabled ? (
          <PreviewPlaceholder>
            <strong className="font-medium text-charcoal">Client testimonials appear here.</strong> Add real reviews in Admin → Reviews &amp; team, with the
            client&apos;s permission. Reviews are never written for the clinic. This note is visible only in preview mode.
          </PreviewPlaceholder>
        ) : (
          <div className="flex items-center">
            <p className="font-serif text-[2rem] leading-snug text-charcoal sm:text-[2.4rem]">
              &ldquo;Every treatment is personalized to help you achieve healthy, radiant, long-lasting results.&rdquo;
              <span className="mt-4 block font-sans text-sm text-muted">Our promise to every client</span>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ----------------------------------- Team ----------------------------------- */

function TeamSection({ s }: { s: HomeSection }) {
  const { content } = useSite();
  const team = content.team.filter((m) => m.visible);
  if (team.length === 0 && !content.previewBanner.enabled) return null;
  return (
    <section className={`${toneClass(s.tone)} ${PAD}`} aria-labelledby={tid(s)}>
      <div className="container-lux">
        <Heading s={s} align="center" />
        {team.length > 0 ? (
          <ul className={`mx-auto mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 ${team.length >= 3 ? "lg:grid-cols-3" : "max-w-3xl"} ${team.length >= 4 ? "xl:grid-cols-4" : ""}`} data-testid="team">
            {team.map((m, i) => (
              <li key={m.id}>
                <Reveal delay={(i % 4) * 0.07}>
                  <div className="reveal-img is-visible">
                    <SmartImage src={m.photo} alt={m.photoAlt || `Portrait of ${m.name}`} palette={i} className="aspect-[4/5] w-full" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                  </div>
                  <p className="eyebrow mt-5">{m.role}</p>
                  <h3 className="mt-2 text-[1.7rem]">{m.name}</h3>
                  {m.credentials && <p className="mt-1 text-sm text-charcoal">{m.credentials}</p>}
                  {m.bio && <p className="mt-3 text-sm leading-relaxed text-muted">{m.bio}</p>}
                </Reveal>
              </li>
            ))}
          </ul>
        ) : (
          <PreviewPlaceholder>
            <strong className="font-medium text-charcoal">Team portraits, qualifications and biographies appear here.</strong> Add each team member in
            Admin → Reviews &amp; team once their credentials have been verified. This note is visible only in preview mode; on the live site the section stays hidden until it has content.
          </PreviewPlaceholder>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------- Booking ---------------------------------- */

function BookingSection({ s }: { s: HomeSection }) {
  const { content } = useSite();
  return (
    <section className="on-dark relative overflow-hidden bg-charcoal" aria-labelledby={tid(s)}>
      {s.image && <SmartImage src={s.image} alt="" className="!absolute inset-0 h-full w-full opacity-35" sizes="100vw" />}
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgb(37_37_37/0.55),rgb(37_37_37/0.88))]" />
      <Reveal className="container-lux relative py-24 text-center sm:py-32 lg:py-40">
        <p className="eyebrow">{s.eyebrow}</p>
        <h2 id={tid(s)} className="display mx-auto mt-5 max-w-3xl text-[2.6rem] !text-ivory sm:text-6xl lg:text-[4.4rem]">{s.title}</h2>
        {s.intro && <p className="mx-auto mt-6 max-w-xl text-[1.05rem] leading-relaxed text-[#e2dcd3]">{s.intro}</p>}
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={s.ctaHref || "/book"} className="btn btn-gold">{s.ctaLabel || "Book an Appointment"} <Icon name="arrow" size={16} /></Link>
          {content.contact.phone && <a href={telHref(content.contact.phone)} className="btn btn-light"><Icon name="phone" size={16} /> Call {content.contact.phone}</a>}
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------------------------- Location ---------------------------------- */

function LocationSection({ s }: { s: HomeSection }) {
  const { content, settings } = useSite();
  const { contact } = content;
  const week = weeklyHours(settings);
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => setToday(clinicNow().getDay()), []);
  const status = useOpenStatus();
  return (
    <section id="visit" className={`${toneClass(s.tone)} ${PAD}`} aria-labelledby={tid(s)}>
      <div className="container-lux grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <Heading s={s} />
          <address className="mt-10 not-italic">
            <p className="font-serif text-[1.7rem] leading-snug text-charcoal">{contact.address}<br />{contact.city}</p>
          </address>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href={directionsUrl(contact.mapsQuery)} target="_blank" rel="noopener noreferrer" className="btn btn-primary"><Icon name="directions" size={16} /> Get directions</a>
            {contact.phone && <a href={telHref(contact.phone)} className="btn btn-ghost"><Icon name="phone" size={16} /> {contact.phone}</a>}
          </div>
          <div className="mt-10 border-t border-line pt-8">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-2xl">Opening hours</h3>
              {status && <p className={`text-sm ${status.open ? "text-success" : "text-muted"}`}>{status.label}</p>}
            </div>
            <dl className="mt-4 text-[0.95rem]" data-testid="hours">
              {week.map((d) => (
                <div key={d.id} className={`flex justify-between gap-4 border-b border-line py-2.5 ${today === d.id ? "font-medium text-charcoal" : "text-muted"}`}>
                  <dt>{d.day}{today === d.id && <span className="sr-only"> (today)</span>}</dt>
                  <dd>{d.time}</dd>
                </div>
              ))}
            </dl>
          </div>
          {content.visitInfo.length > 0 && (
            <dl className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {content.visitInfo.map((v) => (
                <div key={v.title}>
                  <dt className="eyebrow">{v.title}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-muted">{v.text}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className="lg:pt-4">
          <MapEmbed query={contact.mapsQuery} className="aspect-[4/5] sm:aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[36rem]" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Optional sections ------------------------------ */

function FaqSection({ s }: { s: HomeSection }) {
  const { content } = useSite();
  return (
    <section className={`${toneClass(s.tone)} ${PAD}`} aria-labelledby={tid(s)}>
      <div className="container-lux grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Heading s={s} />
        <FaqList items={content.faqs} />
      </div>
    </section>
  );
}

function ConcernsSection({ s, conditions }: { s: HomeSection; conditions: Condition[] }) {
  return (
    <section className={`${toneClass(s.tone)} ${PAD}`} aria-labelledby={tid(s)}>
      <div className="container-lux">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <Heading s={s} />
          <Link href="/conditions" className="link-lux flex-none">All skin concerns <Icon name="arrow" size={14} /></Link>
        </div>
        <ul className="mt-12 grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {conditions.slice(0, s.limit ?? 8).map((c, i) => (
            <li key={c.id}><Reveal delay={(i % 4) * 0.05} className="h-full"><ConditionCard c={c} /></Reveal></li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PricingSection({ s, treatments }: { s: HomeSection; treatments: Treatment[] }) {
  const { content } = useSite();
  const priced = treatments.filter((t) => t.price.type !== "consultation");
  const list = (priced.length ? priced : treatments).slice(0, s.limit ?? 8);
  return (
    <section className={`${toneClass(s.tone, "cream")} ${PAD}`} aria-labelledby={tid(s)}>
      <div className="container-lux grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <Heading s={s} />
          <Link href="/pricing" className="btn btn-primary mt-8">Full price list</Link>
        </div>
        <ul className="divide-y divide-line border-y border-line" data-testid="home-pricing">
          {list.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-4 py-4">
              <Link href={`/treatments/${t.slug}`} className="min-w-0 font-serif text-xl text-charcoal hover:text-gold">{t.name}</Link>
              <PriceTag price={t.price} currency={content.currency} className="flex-none text-right" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function JournalSection({ s, posts }: { s: HomeSection; posts: Post[] }) {
  if (posts.length === 0) return null;
  return (
    <section className={`${toneClass(s.tone)} ${PAD}`} aria-labelledby={tid(s)}>
      <div className="container-lux">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <Heading s={s} />
          <Link href="/blog" className="link-lux flex-none">All articles <Icon name="arrow" size={14} /></Link>
        </div>
        <ul className="mt-12 grid gap-10 md:grid-cols-3">
          {posts.slice(0, s.limit ?? 3).map((p) => <li key={p.id}><PostCard p={p} /></li>)}
        </ul>
      </div>
    </section>
  );
}

function CustomSection({ s }: { s: HomeSection }) {
  const dark = s.tone === "dark";
  return (
    <section className={`${toneClass(s.tone)} ${PAD}`} aria-labelledby={tid(s)}>
      <div className={`container-lux grid items-center gap-12 ${s.image ? "md:grid-cols-2 lg:gap-24" : ""}`}>
        {s.image && (
          <Reveal className={`reveal-img ${s.imageSide === "right" ? "md:order-2" : ""}`}>
            <SmartImage src={s.image} alt={s.imageAlt ?? ""} className="aspect-[4/5] w-full" sizes="(max-width: 768px) 100vw, 50vw" />
          </Reveal>
        )}
        <Reveal className={s.image ? "" : "mx-auto max-w-3xl text-center"}>
          {s.eyebrow && <p className="eyebrow">{s.eyebrow}</p>}
          <h2 id={tid(s)} className={`mt-4 text-[2.4rem] leading-[1.04] sm:text-5xl lg:text-[3.6rem] ${dark ? "!text-ivory" : ""}`}>{s.title}</h2>
          {s.intro && <p className={`mt-6 whitespace-pre-line ${dark ? "text-[1.05rem] leading-relaxed text-[#ddd6cc]" : "lead"}`}>{s.intro}</p>}
          {s.ctaLabel && s.ctaHref && <Link href={s.ctaHref} className={`btn mt-9 ${dark ? "btn-gold" : "btn-primary"}`}>{s.ctaLabel}</Link>}
        </Reveal>
      </div>
    </section>
  );
}
