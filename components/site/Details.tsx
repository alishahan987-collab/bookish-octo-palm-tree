"use client";

import Link from "next/link";
import { getConditionBySlug, getConditions, getPostBySlug, getTreatmentBySlug, getTreatments } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import type { Condition, Post, Treatment } from "@/lib/data/types";
import { weeklyHours } from "@/lib/hours";
import { telHref } from "@/lib/phone";
import { FaqList, MapEmbed, Stars } from "../home/parts";
import { WhatsAppLink } from "../layout/WhatsAppLink";
import { Icon, type IconName } from "../ui/Icon";
import { Markdown } from "../ui/Markdown";
import { Reveal } from "../ui/Motion";
import { PriceBlock } from "../ui/Price";
import { SmartImage } from "../ui/SmartImage";
import { CATEGORY_LABEL, CATEGORY_PAGE, ConditionCard, PostCard, ProcedureCard } from "./Cards";
import { PageHeader } from "./PageHeader";
import { useSite } from "./SiteProvider";
import { directionsUrl, useOpenStatus } from "./useClinic";

function NotFound({ what, back }: { what: string; back: { href: string; label: string } }) {
  return (
    <section className="container-lux py-28 text-center">
      <p className="eyebrow">Not found</p>
      <h1 className="mt-4 text-5xl">This {what} is not available</h1>
      <p className="mx-auto mt-4 max-w-md text-muted">It may have been removed or renamed.</p>
      <Link href={back.href} className="btn btn-primary mt-8">{back.label}</Link>
    </section>
  );
}

function Block({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-[2rem] sm:text-[2.4rem]">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Checks({ items, icon = "check" }: { items: string[]; icon?: IconName }) {
  return (
    <ul className="space-y-3.5">
      {items.map((b) => (
        <li key={b} className="flex gap-3 leading-relaxed text-muted">
          <Icon name={icon} size={18} className="mt-1 flex-none text-gold" />
          {b}
        </li>
      ))}
    </ul>
  );
}

function Crumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[0.7rem] uppercase tracking-[0.18em] text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        <li><Link href="/" className="hover:text-gold">Home</Link></li>
        {items.map((c) => (
          <li key={c.label} className="flex items-center gap-2">
            <span aria-hidden="true" className="text-champagne">/</span>
            {c.href ? <Link href={c.href} className="hover:text-gold">{c.label}</Link> : <span aria-current="page" className="text-charcoal">{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

const Disclaimer = ({ children }: { children: React.ReactNode }) => (
  <p className="flex gap-3 border-t border-line pt-6 text-sm leading-relaxed text-muted">
    <Icon name="info" size={18} className="mt-0.5 flex-none text-gold" />
    {children}
  </p>
);

/* ---------------------------------- Treatment ---------------------------------- */

export function TreatmentDetail({ slug, initial, initialAll }: { slug: string; initial: Treatment | null; initialAll: Treatment[] }) {
  const { content } = useSite();
  const { data: t, ready } = useData(() => getTreatmentBySlug(slug), initial, [slug]);
  const { data: all } = useData(() => getTreatments(), initialAll);
  if (!t) {
    if (!ready) return <div className="min-h-[60vh]" aria-busy="true" />;
    return <NotFound what="treatment" back={{ href: "/treatments", label: "See all treatments" }} />;
  }
  const related = all.filter((x) => x.id !== t.id && x.category !== "consultation" && (x.category === t.category || x.concerns.some((c) => t.concerns.includes(c)))).slice(0, 3);
  const facts: { icon: IconName; label: string; value: string }[] = [
    { icon: "clock", label: "Duration", value: t.sessionLength },
    { icon: "calendar", label: "Sessions", value: t.sessions },
    { icon: "leaf", label: "Recovery", value: t.downtime },
  ];
  return (
    <article>
      <section className="border-b border-line">
        <div className="container-lux pt-8 sm:pt-10"><Crumbs items={[{ href: CATEGORY_PAGE[t.category], label: CATEGORY_LABEL[t.category] }, { label: t.name }]} /></div>
        <div className="container-lux grid gap-10 pb-12 pt-8 sm:pt-10 lg:pt-12 md:grid-cols-[1.1fr_0.9fr] md:items-center lg:gap-20 lg:pb-20">
          <div>
            <p className="eyebrow">{CATEGORY_LABEL[t.category]}</p>
            <h1 className="display mt-4 text-[2.8rem] sm:text-6xl lg:text-[4.6rem]">{t.name}</h1>
            <p className="mt-4 font-serif text-2xl italic text-gold">{t.tagline}</p>
            <p className="lead mt-6 max-w-xl">{t.shortDescription}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={`/book?treatment=${t.slug}`} className="btn btn-primary">Book {t.category === "consultation" ? "a consultation" : "this treatment"} <Icon name="arrow" size={16} /></Link>
              {content.contact.phone && <a href={telHref(content.contact.phone)} className="btn btn-ghost"><Icon name="phone" size={16} /> Ask a question</a>}
            </div>
          </div>
          <div className="reveal-img is-visible">
            <SmartImage src={t.image} alt={t.imageAlt ?? t.name} palette={t.palette} priority className="grade aspect-[4/5] w-full" sizes="(max-width: 768px) 100vw, 45vw" />
          </div>
        </div>
      </section>

      <div className="container-lux grid gap-12 py-14 lg:grid-cols-[1fr_22rem] lg:gap-20 lg:py-20">
        <aside className="order-first lg:order-last" aria-label="Price and booking">
          <div className="border border-line bg-surface p-6 sm:p-8 lg:sticky lg:top-28" data-testid="price-block">
            <PriceBlock price={t.price} currency={content.currency} note="Your final price is confirmed before treatment." />
            <Link href={`/book?treatment=${t.slug}`} className="btn btn-primary mt-7 w-full">Book an Appointment</Link>
            <dl className="mt-7 space-y-4 border-t border-line pt-6 text-sm">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="flex items-center gap-3 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-charcoal">
                    <Icon name={f.icon} size={18} className="flex-none text-gold" />{f.label}
                  </dt>
                  <dd className="mt-0.5 pl-[1.875rem] text-muted">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>

        <div className="min-w-0 space-y-16">
          <Block title="Overview"><p className="lead">{t.description}</p></Block>
          {t.howItWorks.length > 0 && (
            <Block title="How it works">
              <ol className="grid gap-px bg-line sm:grid-cols-2">
                {t.howItWorks.map((step, i) => (
                  <li key={i} className="bg-ivory p-5 sm:p-6">
                    <span className="font-serif text-3xl text-gold">0{i + 1}</span>
                    <p className="mt-2 leading-relaxed text-muted">{step}</p>
                  </li>
                ))}
              </ol>
            </Block>
          )}
          <div className="grid gap-12 sm:grid-cols-2">
            {t.benefits.length > 0 && <Block title="Benefits"><Checks items={t.benefits} /></Block>}
            {t.suitableFor.length > 0 && <Block title="Ideal for"><Checks items={t.suitableFor} /></Block>}
          </div>
          {t.sideEffects.length > 0 && (
            <Block title="Possible side effects">
              <Checks items={t.sideEffects} icon="info" />
              <p className="mt-5 text-sm text-muted">Risks, suitability and aftercare are discussed with you before treatment.</p>
            </Block>
          )}
          {t.faqs.length > 0 && <Block title="Questions"><FaqList items={t.faqs} /></Block>}
          <Disclaimer>General information, not medical advice. Suitability and expected results are discussed at your appointment; results vary between individuals and no outcome can be guaranteed.</Disclaimer>
        </div>
      </div>

      {related.length > 0 && (
        <section className="bg-cream py-20 lg:py-28" aria-labelledby="related-title">
          <div className="container-lux">
            <p className="eyebrow">Complementary treatments</p>
            <h2 id="related-title" className="mt-4 text-4xl sm:text-5xl">You may also consider</h2>
            <ul className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => <li key={r.id}><ProcedureCard t={r} currency={content.currency} /></li>)}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}

/* ---------------------------------- Skin concern ---------------------------------- */

export function ConditionDetail({ slug, initial, initialTreatments, initialConditions }: { slug: string; initial: Condition | null; initialTreatments: Treatment[]; initialConditions: Condition[] }) {
  const { content } = useSite();
  const { data: c, ready } = useData(() => getConditionBySlug(slug), initial, [slug]);
  const { data: treatments } = useData(() => getTreatments(), initialTreatments);
  const { data: conditions } = useData(() => getConditions(), initialConditions);
  if (!c) {
    if (!ready) return <div className="min-h-[60vh]" aria-busy="true" />;
    return <NotFound what="page" back={{ href: "/conditions", label: "See all skin concerns" }} />;
  }
  const procs = treatments.filter((t) => t.concerns.includes(c.slug) && t.category !== "consultation");
  const others = conditions.filter((x) => x.id !== c.id).slice(0, 4);
  const sections = [
    { n: "01", title: `About ${c.name.toLowerCase()}`, body: <p className="lead">{c.overview}</p> },
    { n: "02", title: "Common signs", body: <Checks items={c.symptoms} /> },
    { n: "03", title: "Common causes", body: <Checks items={c.causes} icon="info" /> },
    { n: "04", title: "Treatments that may help", body: <Checks items={c.treatments} icon="sparkle" /> },
    { n: "05", title: "When to see a medical professional", body: <Checks items={c.whenToConsult} icon="user" /> },
  ];
  return (
    <article>
      <section className="border-b border-line">
        <div className="container-lux pt-8 sm:pt-10"><Crumbs items={[{ href: "/conditions", label: "Skin concerns" }, { label: c.name }]} /></div>
        <div className="container-lux grid gap-10 pb-12 pt-8 sm:pt-10 lg:pt-12 md:grid-cols-[1.1fr_0.9fr] md:items-center lg:gap-20 lg:pb-20">
          <div>
            <p className="eyebrow">Skin concern</p>
            <h1 className="display mt-4 text-[2.8rem] sm:text-6xl lg:text-[4.6rem]">{c.name}</h1>
            <p className="lead mt-6 max-w-xl">{c.summary}</p>
            <Link href="/book?treatment=consultation" className="btn btn-primary mt-9">Book a consultation <Icon name="arrow" size={16} /></Link>
          </div>
          <div className="reveal-img is-visible">
            <SmartImage src={c.image} alt={c.imageAlt ?? c.name} palette={c.order} priority className="grade aspect-[4/3] w-full md:aspect-[4/5]" sizes="(max-width: 768px) 100vw, 45vw" />
          </div>
        </div>
      </section>

      <div className="container-lux grid gap-14 py-14 lg:grid-cols-[1fr_20rem] lg:gap-20 lg:py-20">
        <div className="min-w-0 space-y-14">
          {sections.map((s) => (
            <section key={s.n} className="grid gap-4 border-t border-line pt-8 sm:grid-cols-[4rem_1fr]">
              <span className="font-serif text-3xl text-gold" aria-hidden="true">{s.n}</span>
              <div>
                <h2 className="text-[2rem] sm:text-[2.3rem]">{s.title}</h2>
                <div className="mt-5">{s.body}</div>
              </div>
            </section>
          ))}
          <Disclaimer>This page is general information, not a diagnosis. For medical concerns about your skin, please see a physician or dermatologist.</Disclaimer>
        </div>
        <aside aria-label="Treatments and booking">
          <div className="border border-line bg-surface p-6 sm:p-8 lg:sticky lg:top-28">
            <p className="font-serif text-[1.7rem] leading-tight text-charcoal">Personalized advice for {c.name.toLowerCase()}</p>
            <p className="mt-3 text-sm text-muted">Talk through your goals and get a plan that suits your skin.</p>
            <Link href="/book?treatment=consultation" className="btn btn-primary mt-6 w-full">Book a consultation</Link>
            {procs.length > 0 && (
              <>
                <p className="mt-7 border-t border-line pt-6 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-charcoal">Related treatments</p>
                <ul className="mt-3">
                  {procs.map((p) => (
                    <li key={p.id}><Link href={`/treatments/${p.slug}`} className="flex min-h-11 items-center justify-between gap-2 text-sm text-charcoal hover:text-gold">{p.name}<Icon name="chevronRight" size={16} className="text-champagne" /></Link></li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </aside>
      </div>

      {procs.length > 0 && (
        <section className="bg-cream py-20 lg:py-28">
          <div className="container-lux">
            <h2 className="text-4xl sm:text-5xl">Treatments that may help</h2>
            <ul className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {procs.slice(0, 3).map((t) => <li key={t.id}><ProcedureCard t={t} currency={content.currency} /></li>)}
            </ul>
          </div>
        </section>
      )}
      {others.length > 0 && (
        <section className="container-lux py-20 lg:py-28">
          <h2 className="text-4xl sm:text-5xl">Other skin concerns</h2>
          <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {others.map((o) => <li key={o.id}><ConditionCard c={o} /></li>)}
          </ul>
        </section>
      )}
    </article>
  );
}

/* ----------------------------------- Article ----------------------------------- */

export function PostDetail({ slug, initial, related }: { slug: string; initial: Post | null; related: Post[] }) {
  const { data: p, ready } = useData(() => getPostBySlug(slug), initial, [slug]);
  if (!p) {
    if (!ready) return <div className="min-h-[60vh]" aria-busy="true" />;
    return <NotFound what="article" back={{ href: "/blog", label: "All articles" }} />;
  }
  const date = p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
  const more = related.filter((r) => r.slug !== slug);
  return (
    <article>
      <header className="container-lux max-w-4xl pt-10 text-center sm:pt-16">
        <nav aria-label="Breadcrumb" className="text-[0.7rem] uppercase tracking-[0.18em] text-muted">
          <Link href="/blog" className="hover:text-gold">Journal</Link>
        </nav>
        <p className="eyebrow mt-8">{p.tags.join(" · ")}</p>
        <h1 className="display mt-5 text-[2.7rem] sm:text-6xl">{p.title}</h1>
        <p className="lead mx-auto mt-6 max-w-2xl">{p.excerpt}</p>
        <p className="mt-6 text-sm text-muted">{p.author}{date && ` · ${date}`}</p>
      </header>
      <div className="container-lux mt-12 max-w-6xl">
        <SmartImage src={p.cover} alt={p.coverAlt ?? ""} priority className="aspect-[16/9]" sizes="(max-width: 1152px) 100vw, 1152px" />
      </div>
      <div className="container-lux max-w-[42rem] py-14">
        <Markdown source={p.content} />
        <div className="mt-14 bg-cream p-8">
          <p className="font-serif text-[1.8rem] leading-tight text-charcoal">Have a question about your skin?</p>
          <p className="mt-2 text-sm text-muted">Book a consultation for advice tailored to you.</p>
          <Link href="/book" className="btn btn-primary mt-6">Book an Appointment</Link>
        </div>
      </div>
      {more.length > 0 && (
        <section className="container-lux border-t border-line py-20">
          <h2 className="text-4xl sm:text-5xl">More from the journal</h2>
          <ul className="mt-12 grid gap-10 md:grid-cols-3">
            {more.slice(0, 3).map((r) => <li key={r.id}><PostCard p={r} /></li>)}
          </ul>
        </section>
      )}
    </article>
  );
}

/* ------------------------------------ About ------------------------------------ */

export function AboutView() {
  const { content } = useSite();
  const { about, reviews } = content;
  const team = content.team.filter((m) => m.visible);
  return (
    <>
      <section className="border-b border-line">
        <div className="container-lux pt-8 sm:pt-10"><Crumbs items={[{ label: "About" }]} /></div>
        <div className="container-lux grid items-center gap-12 pb-16 pt-8 sm:pt-10 lg:pt-12 md:grid-cols-2 lg:gap-24 lg:pb-24">
          <div>
            <p className="eyebrow">{about.eyebrow}</p>
            <h1 className="display mt-4 text-[2.8rem] sm:text-6xl lg:text-[4.6rem]">{about.title}</h1>
            <div className="mt-8 space-y-5">
              {about.body.split(/\n{2,}/).map((para, i) => <p key={i} className={i === 0 ? "lead" : "leading-relaxed text-muted"}>{para}</p>)}
            </div>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/book" className="btn btn-primary">Book an Appointment</Link>
              <Link href="/treatments" className="btn btn-ghost">Explore Treatments</Link>
            </div>
          </div>
          <div className="reveal-img is-visible">
            <SmartImage src={about.image} alt={about.imageAlt ?? ""} priority className="aspect-[4/5] w-full" sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      {about.values.length > 0 && (
        <section className="bg-cream py-20 lg:py-28" aria-labelledby="values-title">
          <div className="container-lux">
            <h2 id="values-title" className="text-4xl sm:text-5xl">Our approach</h2>
            <ol className="mt-12 grid gap-10 md:grid-cols-3">
              {about.values.map((v, i) => (
                <li key={v.title} className="border-t border-taupe/60 pt-6">
                  <span className="font-serif text-2xl text-gold">0{i + 1}</span>
                  <h3 className="mt-2 text-[1.9rem]">{v.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{v.text}</p>
                </li>
              ))}
            </ol>
            {reviews.enabled && reviews.count > 0 && (
              <a href={reviews.url} target="_blank" rel="noopener noreferrer" className="mt-14 inline-flex min-h-11 items-center gap-3 text-sm text-charcoal hover:text-gold">
                <Stars rating={reviews.rating} className="text-gold" /> {reviews.rating.toFixed(1)} from {reviews.count} {reviews.source} reviews
              </a>
            )}
          </div>
        </section>
      )}

      {team.length > 0 && (
        <section className="container-lux py-20 lg:py-28" aria-labelledby="team-title" data-testid="about-team">
          <p className="eyebrow">Meet the team</p>
          <h2 id="team-title" className="mt-4 text-4xl sm:text-5xl">The people behind your care</h2>
          <ul className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m, i) => (
              <li key={m.id}>
                <Reveal delay={(i % 3) * 0.07}>
                  <SmartImage src={m.photo} alt={m.photoAlt || `Portrait of ${m.name}`} palette={i} className="aspect-[4/5] w-full" sizes="(max-width: 640px) 100vw, 33vw" />
                  <p className="eyebrow mt-5">{m.role}</p>
                  <h3 className="mt-2 text-[1.9rem]">{m.name}</h3>
                  {m.credentials && <p className="mt-1 text-sm text-charcoal">{m.credentials}</p>}
                  {m.bio && <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{m.bio}</p>}
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/* ----------------------------------- Contact ----------------------------------- */

export function ContactView() {
  const { content, settings } = useSite();
  const { contact, social } = content;
  const week = weeklyHours(settings);
  const status = useOpenStatus();
  return (
    <>
      <PageHeader eyebrow="Contact" title="Visit us in Chino" intro="Book online, call us or stop by. We are open seven days a week." crumbs={[{ href: "/contact", label: "Contact" }]} />
      <section className="container-lux grid gap-12 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:py-20">
        <div className="space-y-10">
          <div>
            <h2 className="eyebrow">Address</h2>
            <address className="mt-3 font-serif text-[1.8rem] not-italic leading-snug text-charcoal">{content.brand.clinicName}<br />{contact.address}<br />{contact.city}</address>
            <a href={directionsUrl(contact.mapsQuery)} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-6"><Icon name="directions" size={16} /> Get directions</a>
          </div>
          <div className="border-t border-line pt-8">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="eyebrow">Opening hours</h2>
              {status && <p className={`text-sm ${status.open ? "text-success" : "text-muted"}`}>{status.label}</p>}
            </div>
            <dl className="mt-4">
              {week.map((d) => (
                <div key={d.id} className="flex justify-between gap-4 border-b border-line py-2.5 text-[0.95rem]">
                  <dt className="text-charcoal">{d.day}</dt><dd className="text-muted">{d.time}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="border-t border-line pt-8">
            <h2 className="eyebrow">Get in touch</h2>
            <ul className="mt-4 space-y-3 text-[1.05rem]">
              {contact.phone && <li><a href={telHref(contact.phone)} className="flex items-center gap-3 text-charcoal hover:text-gold"><Icon name="phone" size={18} className="text-gold" />{contact.phone}</a></li>}
              {contact.email && <li><a href={`mailto:${contact.email}`} className="flex items-center gap-3 break-all text-charcoal hover:text-gold"><Icon name="mail" size={18} className="text-gold" />{contact.email}</a></li>}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/book" className="btn btn-ghost btn-sm">Book online</Link>
              <WhatsAppLink className="btn btn-ghost btn-sm"><Icon name="whatsapp" size={16} /> WhatsApp</WhatsAppLink>
            </div>
            <div className="mt-6 flex gap-2">
              {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-11 w-11 items-center justify-center border border-sand text-gold hover:border-charcoal"><Icon name="instagram" size={18} /></a>}
              {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-11 w-11 items-center justify-center border border-sand text-gold hover:border-charcoal"><Icon name="facebook" size={18} /></a>}
              {social.yelp && <a href={social.yelp} target="_blank" rel="noopener noreferrer" aria-label="Yelp" className="flex h-11 w-11 items-center justify-center border border-sand text-gold hover:border-charcoal"><Icon name="yelp" size={18} /></a>}
            </div>
          </div>
          {content.visitInfo.length > 0 && (
            <dl className="grid gap-6 border-t border-line pt-8 sm:grid-cols-2">
              {content.visitInfo.map((v) => (
                <div key={v.title}><dt className="eyebrow">{v.title}</dt><dd className="mt-2 text-sm leading-relaxed text-muted">{v.text}</dd></div>
              ))}
            </dl>
          )}
        </div>
        <MapEmbed query={contact.mapsQuery} autoLoad className="aspect-[4/5] sm:aspect-[4/3] lg:aspect-auto lg:min-h-[40rem]" />
      </section>
    </>
  );
}
