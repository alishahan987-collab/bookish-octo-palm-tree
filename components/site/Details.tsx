"use client";

import Link from "next/link";
import { getConditionBySlug, getConditions, getPostBySlug, getTreatmentBySlug, getTreatments } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import type { Condition, Post, Treatment } from "@/lib/data/types";
import { FaqList, MapEmbed } from "../home/parts";
import { mapsUrl, useHours } from "../layout/Footer";
import { WhatsAppLink } from "../layout/WhatsAppLink";
import { Icon, type IconName } from "../ui/Icon";
import { Markdown } from "../ui/Markdown";
import { PriceBlock } from "../ui/Price";
import { SmartImage } from "../ui/SmartImage";
import { CATEGORY_LABEL, CATEGORY_PAGE, ConditionCard, PostCard, ProcedureCard } from "./Cards";
import { PageHeader } from "./PageHeader";
import { useSite } from "./SiteProvider";

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
      <h2 id={id} className="text-3xl sm:text-[2.1rem]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Checks({ items, icon = "check" }: { items: string[]; icon?: IconName }) {
  return (
    <ul className="space-y-3">
      {items.map((b) => (
        <li key={b} className="flex gap-3 leading-relaxed text-muted">
          <Icon name={icon} size={18} className="mt-1 flex-none text-gold" />
          {b}
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------- Procedure ---------------------------------- */

export function TreatmentDetail({ slug, initial, initialAll }: { slug: string; initial: Treatment | null; initialAll: Treatment[] }) {
  const { content } = useSite();
  const { data: t, ready } = useData(() => getTreatmentBySlug(slug), initial, [slug]);
  const { data: all } = useData(() => getTreatments(), initialAll);
  if (!t) {
    if (!ready) return <div className="min-h-[60vh]" aria-busy="true" />;
    return <NotFound what="treatment" back={{ href: "/treatments", label: "See all treatments" }} />;
  }
  const related = all.filter((x) => x.id !== t.id && (x.category === t.category || x.concerns.some((c) => t.concerns.includes(c)))).slice(0, 3);
  const facts: { icon: IconName; label: string; value: string }[] = [
    { icon: "clock", label: "Procedure duration", value: t.sessionLength },
    { icon: "calendar", label: "Number of sessions", value: t.sessions },
    { icon: "leaf", label: "Expected recovery", value: t.downtime },
  ];
  return (
    <article>
      <section className="relative overflow-hidden border-b border-line">
        <div className="container-lux grid gap-8 pb-12 pt-8 sm:pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14 lg:pb-16">
          <div>
            <nav aria-label="Breadcrumb" className="text-sm text-muted">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li><Link href="/" className="hover:text-gold">Home</Link></li>
                <li aria-hidden="true">/</li>
                <li><Link href={CATEGORY_PAGE[t.category]} className="hover:text-gold">{CATEGORY_LABEL[t.category]}</Link></li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-charcoal">{t.name}</li>
              </ol>
            </nav>
            <p className="eyebrow mt-8">{CATEGORY_LABEL[t.category]}</p>
            <h1 className="mt-3 text-[2.7rem] leading-[1.03] sm:text-6xl">{t.name}</h1>
            <p className="mt-3 font-serif text-2xl italic text-gold">{t.tagline}</p>
            <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-muted">{t.shortDescription}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={`/book?treatment=${t.slug}`} className="btn btn-primary">Book appointment <Icon name="arrow" size={18} /></Link>
              <WhatsAppLink className="btn btn-ghost" message={`Assalam-o-Alaikum, I would like to ask about ${t.name}.`}>
                <Icon name="whatsapp" size={18} className="text-whatsapp" /> Ask a question
              </WhatsAppLink>
            </div>
          </div>
          <SmartImage src={t.image} alt={t.imageAlt ?? t.name} palette={t.palette} priority className="aspect-[4/3] rounded-[2rem] shadow-[var(--shadow-soft)]" sizes="(max-width: 1024px) 100vw, 45vw" />
        </div>
      </section>

      <div className="container-lux grid gap-10 py-12 lg:grid-cols-[1fr_22rem] lg:gap-14 lg:py-16">
        <aside className="order-first lg:order-last" aria-label="Price and booking">
          <div className="card p-6 lg:sticky lg:top-28" data-testid="price-block">
            <PriceBlock price={t.price} currency={content.currency} note={content.previewBanner.enabled ? "Placeholder price for this preview. Final prices are set by the clinic." : "Final price is confirmed by the clinic before treatment."} />
            <Link href={`/book?treatment=${t.slug}`} className="btn btn-primary mt-6 w-full">Book appointment</Link>
            <ul className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
              {facts.map((f) => (
                <li key={f.label} className="flex gap-3">
                  <Icon name={f.icon} size={18} className="mt-0.5 flex-none text-gold" />
                  <span><span className="font-semibold text-charcoal">{f.label}: </span><span className="text-muted">{f.value}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="min-w-0 space-y-12">
          <Block title="Procedure overview"><p className="leading-relaxed text-muted">{t.description}</p></Block>
          <Block title="How it works">
            <ol className="space-y-4">
              {t.howItWorks.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-cream font-serif text-lg text-gold">{i + 1}</span>
                  <p className="pt-1 leading-relaxed text-muted">{step}</p>
                </li>
              ))}
            </ol>
          </Block>
          <div className="grid gap-10 sm:grid-cols-2">
            <Block title="Benefits"><Checks items={t.benefits} /></Block>
            <Block title="Suitable candidates"><Checks items={t.suitableFor} /></Block>
          </div>
          <Block title="Duration, sessions & recovery">
            <dl className="grid gap-4 sm:grid-cols-3">
              {facts.map((f) => (
                <div key={f.label} className="rounded-2xl bg-cream p-4">
                  <dt className="eyebrow !text-[0.65rem]">{f.label}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-charcoal">{f.value}</dd>
                </div>
              ))}
            </dl>
          </Block>
          {t.sideEffects.length > 0 && (
            <Block title="Possible side effects">
              <Checks items={t.sideEffects} icon="info" />
              <p className="mt-4 text-sm text-muted">Your doctor will discuss risks, suitability and aftercare with you before treatment.</p>
            </Block>
          )}
          {t.faqs.length > 0 && <Block title="Frequently asked questions"><FaqList items={t.faqs} /></Block>}
          <p className="flex gap-3 rounded-2xl border border-line bg-cream/60 p-4 text-sm leading-relaxed text-muted">
            <Icon name="info" size={18} className="mt-0.5 flex-none text-gold" />
            General information, not medical advice. Suitability and expected results are discussed at consultation; results vary between individuals and no outcome can be guaranteed.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="bg-cream py-16" aria-labelledby="related-title">
          <div className="container-lux">
            <h2 id="related-title" className="text-4xl">You may also consider</h2>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => <li key={r.id}><ProcedureCard t={r} currency={content.currency} /></li>)}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}

/* ---------------------------------- Condition ---------------------------------- */

export function ConditionDetail({ slug, initial, initialTreatments, initialConditions }: { slug: string; initial: Condition | null; initialTreatments: Treatment[]; initialConditions: Condition[] }) {
  const { content } = useSite();
  const { data: c, ready } = useData(() => getConditionBySlug(slug), initial, [slug]);
  const { data: treatments } = useData(() => getTreatments(), initialTreatments);
  const { data: conditions } = useData(() => getConditions(), initialConditions);
  if (!c) {
    if (!ready) return <div className="min-h-[60vh]" aria-busy="true" />;
    return <NotFound what="condition" back={{ href: "/conditions", label: "See all conditions" }} />;
  }
  const procs = treatments.filter((t) => t.concerns.includes(c.slug) && t.category !== "consultation");
  const others = conditions.filter((x) => x.id !== c.id).slice(0, 4);
  const sections = [
    { n: "1", title: `What is ${c.name.toLowerCase()}?`, body: <p className="leading-relaxed text-muted">{c.overview}</p> },
    { n: "2", title: "Common symptoms", body: <Checks items={c.symptoms} /> },
    { n: "3", title: "Causes", body: <Checks items={c.causes} icon="info" /> },
    { n: "4", title: "Available treatments", body: <Checks items={c.treatments} icon="heartPulse" /> },
    { n: "5", title: "When to consult a dermatologist", body: <Checks items={c.whenToConsult} icon="user" /> },
  ];
  return (
    <article>
      <section className="border-b border-line">
        <div className="container-lux grid gap-8 pb-12 pt-8 sm:pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14">
          <div>
            <nav aria-label="Breadcrumb" className="text-sm text-muted">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li><Link href="/" className="hover:text-gold">Home</Link></li>
                <li aria-hidden="true">/</li>
                <li><Link href="/conditions" className="hover:text-gold">Skin conditions</Link></li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-charcoal">{c.name}</li>
              </ol>
            </nav>
            <p className="eyebrow mt-8">Skin condition</p>
            <h1 className="mt-3 text-[2.7rem] leading-[1.03] sm:text-6xl">{c.name}</h1>
            <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-muted">{c.summary}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/book?treatment=skin-consultation" className="btn btn-primary">Book a consultation <Icon name="arrow" size={18} /></Link>
            </div>
          </div>
          <SmartImage src={c.image} alt={c.imageAlt ?? c.name} palette={c.order} priority className="aspect-[4/3] rounded-[2rem] shadow-[var(--shadow-soft)]" sizes="(max-width: 1024px) 100vw, 45vw" />
        </div>
      </section>

      <div className="container-lux grid gap-12 py-12 lg:grid-cols-[1fr_20rem] lg:py-16">
        <div className="min-w-0 space-y-12">
          {sections.map((s) => (
            <section key={s.n} className="grid gap-4 sm:grid-cols-[3rem_1fr]">
              <span className="font-serif text-4xl text-champagne" aria-hidden="true">{s.n}</span>
              <div>
                <h2 className="text-3xl">{s.title}</h2>
                <div className="mt-4">{s.body}</div>
              </div>
            </section>
          ))}
          <p className="flex gap-3 rounded-2xl border border-line bg-cream/60 p-4 text-sm leading-relaxed text-muted">
            <Icon name="info" size={18} className="mt-0.5 flex-none text-gold" />
            This page is general information and not a diagnosis. Please see a doctor for advice about your own skin.
          </p>
        </div>
        <aside className="space-y-6" aria-label="Treatments and booking">
          <div className="card p-6 lg:sticky lg:top-28">
            <p className="font-serif text-2xl text-charcoal">Concerned about {c.name.toLowerCase()}?</p>
            <p className="mt-2 text-sm text-muted">A dermatologist can confirm the diagnosis and recommend a plan.</p>
            <Link href="/book?treatment=skin-consultation" className="btn btn-primary mt-5 w-full">Book consultation</Link>
            {procs.length > 0 && (
              <>
                <p className="mt-6 border-t border-line pt-5 text-xs font-semibold uppercase tracking-wider text-muted">Related procedures</p>
                <ul className="mt-3 space-y-2">
                  {procs.map((p) => (
                    <li key={p.id}><Link href={`/treatments/${p.slug}`} className="flex items-center justify-between gap-2 text-sm font-medium text-charcoal hover:text-gold">{p.name}<Icon name="chevronRight" size={16} className="text-gold" /></Link></li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </aside>
      </div>

      {procs.length > 0 && (
        <section className="bg-cream py-16">
          <div className="container-lux">
            <h2 className="text-4xl">Treatments that may help</h2>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {procs.slice(0, 3).map((t) => <li key={t.id}><ProcedureCard t={t} currency={content.currency} /></li>)}
            </ul>
          </div>
        </section>
      )}
      <section className="container-lux py-16">
        <h2 className="text-4xl">Other conditions</h2>
        <ul className="mt-8 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {others.map((o) => <li key={o.id}><ConditionCard c={o} /></li>)}
        </ul>
      </section>
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
  const date = p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
  return (
    <article>
      <header className="container-lux max-w-3xl pt-10 text-center sm:pt-14">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/blog" className="hover:text-gold">Journal</Link>
        </nav>
        <p className="eyebrow mt-6">{p.tags.join(" · ")}</p>
        <h1 className="mt-4 text-[2.6rem] leading-[1.05] sm:text-6xl">{p.title}</h1>
        <p className="mt-5 text-lg text-muted">{p.excerpt}</p>
        <p className="mt-5 text-sm text-muted">{p.author}{date && ` · ${date}`}</p>
      </header>
      <div className="container-lux mt-10 max-w-5xl">
        <SmartImage src={p.cover} alt={p.coverAlt ?? ""} priority className="aspect-[16/9] rounded-[2rem]" sizes="(max-width: 1024px) 100vw, 1024px" />
      </div>
      <div className="container-lux max-w-[42rem] py-12">
        <Markdown source={p.content} />
        <div className="mt-12 rounded-3xl bg-cream p-6 sm:p-8">
          <p className="font-serif text-2xl text-charcoal">Have a question about your skin?</p>
          <p className="mt-1 text-sm text-muted">Book a consultation for advice tailored to you.</p>
          <Link href="/book" className="btn btn-primary mt-5">Book appointment</Link>
        </div>
      </div>
      {related.filter((r) => r.slug !== slug).length > 0 && (
        <section className="container-lux border-t border-line py-14">
          <h2 className="text-4xl">More from the journal</h2>
          <ul className="mt-8 grid gap-8 md:grid-cols-3">
            {related.filter((r) => r.slug !== slug).slice(0, 3).map((r) => <li key={r.id}><PostCard p={r} /></li>)}
          </ul>
        </section>
      )}
    </article>
  );
}

/* ------------------------------------ About ------------------------------------ */

export function AboutView() {
  const { content } = useSite();
  const d = content.doctor;
  const lists: { title: string; items: string[]; icon: IconName }[] = [
    { title: "Qualifications", items: d.qualifications, icon: "check" },
    { title: "Certifications", items: d.certifications, icon: "shield" },
    { title: "Professional achievements", items: d.achievements, icon: "sparkle" },
  ];
  const missing = !d.bio && d.qualifications.length === 0;
  return (
    <>
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_85%_20%,#efdfc0_0%,transparent_62%)]" />
        <div className="container-lux relative grid items-center gap-12 pb-16 pt-10 sm:pt-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-t-[999px] rounded-b-[2.5rem] shadow-[var(--shadow-lift)]">
            {d.photo ? (
              <SmartImage src={d.photo} alt={`Portrait of ${d.name}`} priority className="absolute inset-0 h-full w-full" sizes="(max-width: 1024px) 90vw, 450px" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(160deg,#f6ecd9,#cfae76)]">
                <span className="font-serif text-8xl text-ivory/90">{d.name.replace(/^Dr\.?\s*/i, "").split(/\s+/).map((x) => x[0]).join("").slice(0, 2)}</span>
              </div>
            )}
          </div>
          <div>
            <p className="eyebrow">About the doctor</p>
            <h1 className="mt-3 text-[2.8rem] leading-[1.03] sm:text-6xl">{d.name}</h1>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-gold">{d.designation}</p>
            {d.specialization && <p className="mt-6 font-serif text-2xl leading-snug text-charcoal">{d.specialization}</p>}
            <p className="mt-6 whitespace-pre-line text-[1.05rem] leading-relaxed text-muted">{d.bio || d.shortIntro}</p>
            <dl className="mt-8 grid grid-cols-2 gap-4">
              {d.experience && (
                <div className="rounded-2xl bg-cream p-4"><dt className="eyebrow !text-[0.65rem]">Experience</dt><dd className="mt-1 font-serif text-2xl text-charcoal">{d.experience}</dd></div>
              )}
              {d.registration && (
                <div className="rounded-2xl bg-cream p-4"><dt className="eyebrow !text-[0.65rem]">Registration</dt><dd className="mt-1 text-sm text-charcoal">{d.registration}</dd></div>
              )}
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book" className="btn btn-primary">Book a consultation</Link>
              <Link href="/treatments" className="btn btn-ghost">Treatments</Link>
            </div>
          </div>
        </div>
      </section>

      {missing && (
        <div className="container-lux">
          <p className="rounded-2xl border border-dashed border-sand bg-cream p-5 text-sm text-muted">
            The doctor&apos;s biography, qualifications and registration details will appear here once added in the admin dashboard (Admin → Doctor profile).
          </p>
        </div>
      )}

      {d.expertise.length > 0 && (
        <section className="container-lux py-16">
          <h2 className="text-4xl">Areas of expertise</h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {d.expertise.map((e) => (
              <li key={e} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 font-medium text-charcoal">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-cream text-gold"><Icon name="sparkle" size={16} /></span>{e}
              </li>
            ))}
          </ul>
        </section>
      )}

      {lists.some((l) => l.items.length) && (
        <section className="bg-cream py-16">
          <div className="container-lux grid gap-10 md:grid-cols-3">
            {lists.filter((l) => l.items.length).map((l) => (
              <div key={l.title}>
                <h2 className="text-3xl">{l.title}</h2>
                <div className="mt-5"><Checks items={l.items} icon={l.icon} /></div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/* ----------------------------------- Contact ----------------------------------- */

export function ContactView() {
  const { content } = useSite();
  const { contact, social } = content;
  const hours = useHours();
  return (
    <>
      <PageHeader eyebrow="Contact us" title="We would love to hear from you" intro="Book online, message us on WhatsApp or visit the clinic." crumbs={[{ href: "/contact", label: "Contact" }]} />
      <section className="container-lux grid gap-10 py-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="text-2xl">Visit</h2>
            <p className="mt-2 text-muted">{content.brand.clinicName}<br />{contact.address}{contact.city && `, ${contact.city}`}</p>
            <a href={mapsUrl(contact.mapsQuery)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm mt-4"><Icon name="pin" size={16} /> Get directions</a>
          </div>
          <div className="card p-6">
            <h2 className="text-2xl">Clinic timings</h2>
            <p className="mt-2 text-muted">{hours.days}: {hours.time}</p>
            {hours.closed.length > 0 && <p className="text-muted">Closed {hours.closed.join(", ")}</p>}
          </div>
          <div className="card p-6">
            <h2 className="text-2xl">Get in touch</h2>
            <ul className="mt-3 space-y-2 text-muted">
              {contact.phone && <li><a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="hover:text-gold">{contact.phone}</a></li>}
              {contact.email && <li><a href={`mailto:${contact.email}`} className="hover:text-gold">{contact.email}</a></li>}
              {!contact.phone && !contact.email && <li>Phone and email will appear here once added by the clinic.</li>}
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              <WhatsAppLink className="btn btn-primary btn-sm"><Icon name="whatsapp" size={16} /> WhatsApp</WhatsAppLink>
              <Link href="/book" className="btn btn-ghost btn-sm">Book online</Link>
            </div>
            <div className="mt-5 flex gap-2">
              {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full border border-sand text-gold hover:bg-cream"><Icon name="instagram" size={18} /></a>}
              {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-full border border-sand text-gold hover:bg-cream"><Icon name="facebook" size={18} /></a>}
            </div>
          </div>
        </div>
        <MapEmbed query={contact.mapsQuery} autoLoad />
      </section>
    </>
  );
}
