"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getConditions, getGallery, getPosts, getTreatments } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import type { CategoryId, Condition, GalleryItem, Post, SectionId, SiteContent, Treatment } from "@/lib/data/types";
import { formatMoney } from "@/lib/pricing";
import { mapsUrl, useHours } from "../layout/Footer";
import { WhatsAppLink } from "../layout/WhatsAppLink";
import { BeforeAfterSlider } from "../site/BeforeAfterSlider";
import { CATEGORY_PAGE, ConditionCard, PostCard, ProcedureCard } from "../site/Cards";
import { useSite } from "../site/SiteProvider";
import { Icon } from "../ui/Icon";
import { Reveal } from "../ui/Motion";
import { PriceTag } from "../ui/Price";
import { SmartImage } from "../ui/SmartImage";
import { FaqList, MapEmbed } from "./parts";

export interface HomeData {
  treatments: Treatment[];
  conditions: Condition[];
  posts: Post[];
  gallery: GalleryItem[];
}

export function Home({ initial }: { initial: HomeData }) {
  const { content } = useSite();
  const treatments = useData(() => getTreatments(), initial.treatments).data;
  const conditions = useData(() => getConditions(), initial.conditions).data;
  const posts = useData(() => getPosts(), initial.posts).data;
  const gallery = useData(() => getGallery(), initial.gallery).data;

  const order = (Object.entries(content.sections) as [SectionId, SiteContent["sections"][SectionId]][])
    .filter(([, s]) => s.visible)
    .sort((a, b) => a[1].order - b[1].order);

  const render: Record<SectionId, () => React.ReactNode> = {
    intro: () => <Intro />,
    conditions: () => <ConditionsSection conditions={conditions} />,
    procedures: () => <ProceduresSection treatments={treatments} />,
    doctor: () => <DoctorSection />,
    why: () => <WhySection />,
    beforeAfter: () => <BeforeAfterSection gallery={gallery} />,
    pricing: () => <PricingSection treatments={treatments} />,
    blog: () => <BlogSection posts={posts} />,
    cta: () => <CtaSection />,
    faq: () => <FaqSection />,
    contact: () => <ContactSection />,
  };

  return (
    <>
      <Hero />
      {order.map(([id]) => (
        <div key={id} data-section={id}>{render[id]()}</div>
      ))}
    </>
  );
}

function useSection(id: SectionId) {
  return useSite().content.sections[id];
}

function SectionHead({ id, align = "left", children }: { id: SectionId; align?: "left" | "center"; children?: React.ReactNode }) {
  const s = useSection(id);
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {s.eyebrow && <p className="eyebrow">{s.eyebrow}</p>}
      <h2 id={`${id}-title`} className="mt-3 text-[2.15rem] leading-[1.05] sm:text-5xl">{s.title}</h2>
      {s.intro && <p className="mt-4 text-[1.03rem] leading-relaxed text-muted">{s.intro}</p>}
      {children}
    </div>
  );
}

/* ----------------------------------- Hero ----------------------------------- */

function Hero() {
  const { content } = useSite();
  const { hero, doctor } = content;
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-title">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_60%_at_80%_25%,#efdfc0_0%,transparent_62%),radial-gradient(45%_50%_at_5%_95%,#f3e7d4_0%,transparent_60%)]" />
      {hero.backgroundImage && (
        <SmartImage src={hero.backgroundImage} alt="" className="!absolute inset-0 h-full w-full opacity-15" priority sizes="100vw" />
      )}
      <svg aria-hidden="true" className="pointer-events-none absolute -left-72 top-40 hidden h-[34rem] w-[34rem] text-champagne/30 xl:block" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.4">
        <circle cx="100" cy="100" r="98" />
        <circle cx="100" cy="100" r="78" />
      </svg>
      <div className="container-lux relative grid items-center gap-12 pb-16 pt-10 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-16">
        <div>
          <p className="eyebrow animate-rise">{hero.eyebrow}</p>
          <h1 id="hero-title" className="mt-5 text-[2.85rem] leading-[1.02] sm:text-6xl xl:text-[4.6rem]">
            {hero.title} <em className="text-gold">{hero.highlight}</em>
          </h1>
          <p className="mt-6 max-w-xl text-[1.07rem] leading-relaxed text-muted">{hero.intro}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/book" className="btn btn-primary">{hero.primaryCta} <Icon name="arrow" size={18} /></Link>
            <Link href="/treatments" className="btn btn-ghost">{hero.secondaryCta}</Link>
          </div>
          {hero.badges.length > 0 && (
            <ul className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-6 text-[0.8rem] leading-snug text-muted">
              {hero.badges.slice(0, 3).map((b) => (
                <li key={b.title}><span className="block font-serif text-xl text-charcoal">{b.title}</span>{b.text}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative mx-auto w-full max-w-[27rem] lg:max-w-[30rem]">
          <div aria-hidden="true" className="absolute -inset-3 translate-x-4 translate-y-4 rounded-t-[999px] rounded-b-[2.5rem] border border-champagne/70" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[2.5rem] shadow-[var(--shadow-lift)]" data-testid="doctor-portrait">
            {doctor.photo ? (
              <SmartImage src={doctor.photo} alt={`Portrait of ${doctor.name}`} className="absolute inset-0 h-full w-full" priority sizes="(max-width: 1024px) 90vw, 480px" />
            ) : (
              <PortraitPlaceholder name={doctor.name} />
            )}
          </div>
          <div className="absolute -bottom-6 left-0 right-6 rounded-2xl border border-line bg-ivory/95 p-4 shadow-[var(--shadow-soft)] backdrop-blur sm:-left-8 sm:right-auto sm:min-w-[17rem]">
            <p className="font-serif text-2xl leading-tight text-charcoal">{doctor.name}</p>
            <p className="mt-0.5 text-sm text-gold">{doctor.designation}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PortraitPlaceholder({ name }: { name: string }) {
  const initials = name.replace(/^Dr\.?\s*/i, "").split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="absolute inset-0 bg-[linear-gradient(160deg,#f6ecd9_0%,#e9d6b3_55%,#cfae76_100%)]">
      <svg viewBox="0 0 400 500" className="absolute inset-x-0 bottom-0 h-[88%] w-full" aria-hidden="true">
        <defs>
          <linearGradient id="ph-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffaf0" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fffaf0" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <g fill="url(#ph-fill)" stroke="#fffaf0" strokeOpacity="0.85" strokeWidth="1.5">
          <ellipse cx="200" cy="175" rx="74" ry="90" />
          <path d="M60 500c6-92 58-150 140-160 82 10 134 68 140 160Z" />
          <path d="M168 255c6 22 14 36 32 44 18-8 26-22 32-44" fill="none" />
        </g>
      </svg>
      <div className="absolute inset-x-0 top-[11%] text-center">
        <span className="font-serif text-6xl tracking-wide text-ivory/90">{initials}</span>
      </div>
      <span className="absolute bottom-24 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ivory/85 px-3 py-1 text-[0.7rem] font-medium text-muted backdrop-blur">
        Doctor&apos;s portrait · upload in admin
      </span>
    </div>
  );
}

/* --------------------------------- Sections --------------------------------- */

function Intro() {
  const s = useSection("intro");
  return (
    <section className="container-lux py-20 sm:py-28" aria-labelledby="intro-title">
      <Reveal className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <p className="eyebrow">{s.eyebrow}</p>
          <h2 id="intro-title" className="mt-3 text-[2.15rem] sm:text-5xl">{s.title}</h2>
        </div>
        <div>
          <p className="text-[1.08rem] leading-relaxed text-muted">{s.intro}</p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <SmartImage src="/images/s-clinic.jpg" alt="Modern treatment room" className="aspect-[4/3] rounded-2xl" sizes="(max-width: 1024px) 50vw, 30vw" />
            <SmartImage src="/images/s-serum.jpg" alt="Hands holding a skincare serum bottle" className="aspect-[4/3] rounded-2xl" sizes="(max-width: 1024px) 50vw, 30vw" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function ConditionsSection({ conditions }: { conditions: Condition[] }) {
  const [showAll, setShowAll] = useState(false);
  const list = showAll ? conditions : conditions.slice(0, 8);
  return (
    <section className="bg-cream py-20 sm:py-28" aria-labelledby="conditions-title">
      <div className="container-lux">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHead id="conditions" />
          <Link href="/conditions" className="inline-flex flex-none items-center gap-2 text-sm font-semibold text-gold">All conditions <Icon name="arrow" size={16} /></Link>
        </div>
        <ul className="mt-10 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {list.map((c, i) => (
            <li key={c.id}><Reveal delay={(i % 4) * 0.05} className="h-full"><ConditionCard c={c} /></Reveal></li>
          ))}
        </ul>
        {conditions.length > 8 && !showAll && (
          <div className="mt-10 text-center">
            <button type="button" className="btn btn-ghost" onClick={() => setShowAll(true)}>Show all {conditions.length} conditions</button>
          </div>
        )}
      </div>
    </section>
  );
}

const GROUPS: { id: CategoryId; label: string }[] = [
  { id: "skin", label: "Skin procedures" },
  { id: "aesthetic", label: "Aesthetic procedures" },
  { id: "hair", label: "Hair procedures" },
];

function ProceduresSection({ treatments }: { treatments: Treatment[] }) {
  const { content } = useSite();
  const [tab, setTab] = useState<CategoryId>("skin");
  const list = useMemo(
    () => treatments.filter((t) => t.category === tab).sort((a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order).slice(0, 6),
    [treatments, tab],
  );
  return (
    <section className="container-lux py-20 sm:py-28" aria-labelledby="procedures-title">
      <SectionHead id="procedures" />
      <div role="tablist" aria-label="Procedure categories" className="no-scrollbar mt-8 flex gap-2 overflow-x-auto">
        {GROUPS.map((g) => (
          <button key={g.id} role="tab" type="button" aria-selected={tab === g.id} onClick={() => setTab(g.id)}
            className={`flex-none rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${tab === g.id ? "border-charcoal bg-charcoal text-ivory" : "border-sand text-ink hover:bg-cream"}`}>
            {g.label}
          </button>
        ))}
      </div>
      <ul role="tabpanel" className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <li key={t.id}><ProcedureCard t={t} currency={content.currency} /></li>
        ))}
      </ul>
      <div className="mt-10 text-center">
        <Link href={CATEGORY_PAGE[tab]} className="btn btn-ghost">View all {GROUPS.find((g) => g.id === tab)!.label.toLowerCase()}</Link>
      </div>
    </section>
  );
}

function DoctorSection() {
  const { content } = useSite();
  const s = useSection("doctor");
  const d = content.doctor;
  return (
    <section id="doctor" className="bg-cream py-20 sm:py-28" aria-labelledby="doctor-title">
      <div className="container-lux grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2rem] shadow-[var(--shadow-soft)]">
            {d.photo ? <SmartImage src={d.photo} alt={`Portrait of ${d.name}`} className="absolute inset-0 h-full w-full" sizes="400px" /> : <PortraitPlaceholder name={d.name} />}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="eyebrow">{s.eyebrow}</p>
          <h2 id="doctor-title" className="mt-3 text-[2.3rem] sm:text-5xl">{d.name}</h2>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-gold">{d.designation}</p>
          <p className="mt-6 text-[1.05rem] leading-relaxed text-muted">{d.bio || d.shortIntro}</p>
          {d.expertise.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {d.expertise.slice(0, 6).map((e) => <li key={e} className="chip border border-sand bg-ivory text-ink">{e}</li>)}
            </ul>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/about" className="btn btn-primary">About the doctor</Link>
            <Link href="/book" className="btn btn-ghost">Book a consultation</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const WHY_ICONS = ["user", "leaf", "tag", "shield"] as const;

function WhySection() {
  const { content } = useSite();
  const s = useSection("why");
  return (
    <section className="bg-charcoal py-20 text-[#e8e0d3] sm:py-28" aria-labelledby="why-title">
      <div className="container-lux">
        <p className="eyebrow !text-champagne">{s.eyebrow}</p>
        <h2 id="why-title" className="mt-3 max-w-2xl text-[2.15rem] !text-ivory sm:text-5xl">{s.title}</h2>
        {s.intro && <p className="mt-4 max-w-2xl text-[#c9bfb0]">{s.intro}</p>}
        <ul className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {content.why.map((p, i) => (
            <li key={p.title} className="bg-charcoal p-6 sm:p-8">
              <Reveal delay={i * 0.06}>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-champagne/40 text-champagne"><Icon name={WHY_ICONS[i % 4]} /></span>
                <h3 className="mt-5 text-2xl !text-ivory">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#c9bfb0]">{p.text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function BeforeAfterSection({ gallery }: { gallery: GalleryItem[] }) {
  return (
    <section className="container-lux py-20 sm:py-28" aria-labelledby="beforeAfter-title">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHead id="beforeAfter" />
          <Link href="/before-after" className="btn btn-ghost mt-8">View the gallery</Link>
        </div>
        {gallery[0] ? (
          <Reveal><BeforeAfterSlider item={gallery[0]} /></Reveal>
        ) : (
          <p className="rounded-3xl border border-dashed border-sand bg-cream p-8 text-center text-muted">Results will appear here once consented photographs are added.</p>
        )}
      </div>
    </section>
  );
}

function PricingSection({ treatments }: { treatments: Treatment[] }) {
  const { content } = useSite();
  const list = treatments.filter((t) => t.price.type !== "consultation").sort((a, b) => Number(b.price.type === "promo") - Number(a.price.type === "promo") || Number(b.featured) - Number(a.featured)).slice(0, 8);
  return (
    <section className="bg-cream py-20 sm:py-28" aria-labelledby="pricing-title">
      <div className="container-lux grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <SectionHead id="pricing" />
          <Link href="/pricing" className="btn btn-primary mt-8">Full price list</Link>
        </div>
        <ul className="divide-y divide-line rounded-3xl border border-line bg-surface px-5 sm:px-7" data-testid="home-pricing">
          {list.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-4 py-4">
              <Link href={`/treatments/${t.slug}`} className="min-w-0 font-medium text-charcoal hover:text-gold">
                {t.name}
                {t.price.type === "promo" && <span className="chip ml-2 bg-charcoal align-middle text-ivory">Offer</span>}
              </Link>
              <PriceTag price={t.price} currency={content.currency} className="flex-none text-right" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function BlogSection({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;
  return (
    <section className="container-lux py-20 sm:py-28" aria-labelledby="blog-title">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHead id="blog" />
        <Link href="/blog" className="inline-flex flex-none items-center gap-2 text-sm font-semibold text-gold">All articles <Icon name="arrow" size={16} /></Link>
      </div>
      <ul className="mt-10 grid gap-8 md:grid-cols-3">
        {posts.slice(0, 3).map((p) => <li key={p.id}><PostCard p={p} /></li>)}
      </ul>
    </section>
  );
}

function CtaSection() {
  const s = useSection("cta");
  return (
    <section className="container-lux py-16 sm:py-20" aria-labelledby="cta-title">
      <Reveal className="relative overflow-hidden rounded-[2rem] bg-charcoal px-6 py-16 text-center sm:px-12 sm:py-20">
        <SmartImage src="/images/s-clinic-room.jpg" alt="" className="!absolute inset-0 h-full w-full opacity-25" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/40 to-charcoal/80" aria-hidden="true" />
        <div className="relative">
          <p className="eyebrow !text-champagne">{s.eyebrow}</p>
          <h2 id="cta-title" className="mx-auto mt-4 max-w-2xl text-[2.3rem] !text-ivory sm:text-6xl">{s.title}</h2>
          <p className="mx-auto mt-4 max-w-lg text-[#e2dace]">{s.intro}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/book" className="btn btn-gold">Book online <Icon name="arrow" size={18} /></Link>
            <WhatsAppLink className="btn border border-white/30 text-ivory hover:bg-white/10"><Icon name="whatsapp" size={18} /> WhatsApp</WhatsAppLink>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function FaqSection() {
  const { content } = useSite();
  return (
    <section className="container-lux py-20 sm:py-28" aria-labelledby="faq-title">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <SectionHead id="faq" />
        <FaqList items={content.faqs} />
      </div>
    </section>
  );
}

function ContactSection() {
  const { content } = useSite();
  const { contact } = content;
  const hours = useHours();
  return (
    <section id="contact" className="container-lux py-20 sm:py-28" aria-labelledby="contact-title">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <SectionHead id="contact" />
          <ul className="mt-8 space-y-5">
            <ContactRow icon="pin" title={content.brand.clinicName}>{contact.address}{contact.city && `, ${contact.city}`}</ContactRow>
            <ContactRow icon="clock" title="Clinic hours">{hours.days}: {hours.time}{hours.closed.length > 0 && <><br />Closed {hours.closed.join(", ")}</>}</ContactRow>
            {contact.phone && <ContactRow icon="phone" title="Phone"><a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="hover:text-gold">{contact.phone}</a></ContactRow>}
            {contact.email && <ContactRow icon="mail" title="Email"><a href={`mailto:${contact.email}`} className="hover:text-gold">{contact.email}</a></ContactRow>}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={mapsUrl(contact.mapsQuery)} target="_blank" rel="noopener noreferrer" className="btn btn-primary"><Icon name="pin" size={18} /> Get directions</a>
            <WhatsAppLink className="btn btn-ghost"><Icon name="whatsapp" size={18} className="text-whatsapp" /> WhatsApp</WhatsAppLink>
          </div>
        </div>
        <MapEmbed query={contact.mapsQuery} />
      </div>
    </section>
  );
}

function ContactRow({ icon, title, children }: { icon: "pin" | "clock" | "phone" | "mail"; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-cream text-gold"><Icon name={icon} /></span>
      <div>
        <p className="font-semibold text-charcoal">{title}</p>
        <p className="text-muted">{children}</p>
      </div>
    </li>
  );
}

export { formatMoney };
