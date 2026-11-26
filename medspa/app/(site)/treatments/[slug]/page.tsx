import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { breadcrumbJsonLd, JsonLd, serviceJsonLd } from "@/components/site/JsonLd";
import { priceLabel, TreatmentCard } from "@/components/site/TreatmentCard";
import { Icon } from "@/components/ui/Icon";
import { Img } from "@/components/ui/Img";
import { Markdown } from "@/components/ui/Markdown";
import { bookHref } from "@/lib/links";
import { getPublicTreatments, getSite } from "@/lib/server/content";
import { siteUrl } from "@/lib/server/http";
import { safeHref } from "@/lib/validation";

export const revalidate = 300;
export const dynamicParams = true;
export const generateStaticParams = async () => [];

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const list = await getPublicTreatments();
  return { t: list.find((x) => x.slug === slug), list };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { t } = await load((await params).slug);
  if (!t) return {};
  const { settings } = await getSite();
  const title = t.seoTitle || `${t.name} in ${settings.business.city}, ${settings.business.state}`;
  return {
    title,
    description: t.seoDescription || t.shortDescription,
    alternates: { canonical: `/treatments/${t.slug}` },
    openGraph: { title, description: t.seoDescription || t.shortDescription, images: t.image ? [t.image] : [] },
  };
}

export default async function TreatmentPage({ params }: Props) {
  const { slug } = await params;
  const { t, list } = await load(slug);
  if (!t) notFound();
  const { settings, design } = await getSite();
  const url = siteUrl();
  const book = bookHref(settings, t);
  const external = !book.startsWith("/");
  const related = list.filter((x) => x.id !== t.id && x.category === t.category).concat(list.filter((x) => x.id !== t.id && x.category !== t.category)).slice(0, 3);
  const showBenefits = t.benefitsVerified && t.benefits.filter(Boolean).length > 0;
  const facts = [
    t.duration && { label: "Duration", value: t.duration },
    { label: "Price", value: priceLabel(t, settings), note: t.priceNote },
    { label: "Category", value: t.category },
  ].filter(Boolean) as { label: string; value: string; note?: string }[];

  return (
    <>
      <section className="tone-ivory pb-14 pt-8 md:pb-20 md:pt-12">
        <div className="container-x">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-fg-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-fg">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/treatments" className="hover:text-fg">Treatments</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-fg">{t.name}</li>
            </ol>
          </nav>
          <div className="grid items-start gap-10 md:grid-cols-2 lg:gap-16">
            <div className="img-radius relative aspect-[4/5] bg-alt md:sticky md:top-28">
              <Img src={t.image} alt={t.imageAlt} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
            </div>
            <div>
              <p className="eyebrow mb-4">{t.category}</p>
              <h1 className="text-[2.7rem] leading-[1.04] sm:text-5xl lg:text-6xl">{t.name}</h1>
              <p className="mt-5 text-[1.12rem] text-fg-muted">{t.shortDescription}</p>

              <dl className={`mt-8 grid gap-px overflow-hidden border border-line bg-line ${facts.length === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
                {facts.map((f) => (
                  <div key={f.label} className={`bg-bg p-4 ${facts.length === 3 && f.label === "Category" ? "col-span-2 sm:col-span-1" : ""}`}>
                    <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-fg-muted">{f.label}</dt>
                    <dd className="mt-1 font-medium">{f.value}</dd>
                    {f.note && <dd className="mt-1 text-xs text-fg-muted">{f.note}</dd>}
                  </div>
                ))}
              </dl>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {t.bookable && (
                  <a href={book} className="btn btn-primary" {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    <Icon name="calendar" size={16} /> {settings.treatmentText.bookLabel}
                  </a>
                )}
                {settings.business.phone && (
                  <a href={`tel:${settings.business.phone}`} className="btn btn-outline">
                    <Icon name="phone" size={16} /> {settings.business.phoneDisplay}
                  </a>
                )}
              </div>
              {settings.booking.financingUrl && settings.booking.financingLabel && (
                <a href={safeHref(settings.booking.financingUrl)} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm text-fg-muted underline-offset-4 hover:underline">
                  <Icon name="card" size={16} /> {settings.booking.financingLabel}
                </a>
              )}

              {!t.verified && settings.treatmentText.unverifiedNotice && (
                <p className="mt-8 flex gap-3 rounded-md bg-alt/60 p-4 text-sm" data-testid="unverified-notice">
                  <Icon name="info" size={18} className="mt-0.5 flex-none" />
                  {settings.treatmentText.unverifiedNotice}
                </p>
              )}

              <div className="mt-10 border-t border-line pt-10">
                <h2 className="mb-5 text-3xl">About this treatment</h2>
                <Markdown source={t.description} className="text-[1.04rem] leading-[1.8]" />
              </div>

              {showBenefits && (
                <div className="mt-10">
                  <h2 className="mb-5 text-3xl">Benefits</h2>
                  <ul className="space-y-3">
                    {t.benefits.filter(Boolean).map((x, i) => (
                      <li key={i} className="flex gap-3"><Icon name="check" size={18} className="mt-1 flex-none text-accent-ink" /> {x}</li>
                    ))}
                  </ul>
                </div>
              )}

              {t.sections.filter((s) => s.title || s.body).map((s) => (
                <div key={s.id} className="mt-10">
                  {s.title && <h2 className="mb-5 text-3xl">{s.title}</h2>}
                  <Markdown source={s.body} className="text-[1.04rem] leading-[1.8]" />
                </div>
              ))}

              {t.faqs.length > 0 && (
                <div className="mt-10">
                  <h2 className="mb-5 text-3xl">Questions</h2>
                  <div className="divide-y divide-line border-y border-line">
                    {t.faqs.map((f) => (
                      <details key={f.id} className="group">
                        <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-xl [&::-webkit-details-marker]:hidden">
                          {f.q}
                          <Icon name="chevronDown" size={18} className="flex-none transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="pb-5 text-fg-muted"><Markdown source={f.a} /></div>
                      </details>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-10 text-xs leading-relaxed text-fg-muted">{design.footer.disclaimer}</p>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="tone-white section">
          <div className="container-x">
            <p className="eyebrow mb-4">You may also like</p>
            <h2 className="mb-12 text-4xl">Other treatments</h2>
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => <TreatmentCard key={r.id} t={r} settings={settings} showPrice={false} />)}
            </div>
          </div>
        </section>
      )}

      <JsonLd data={serviceJsonLd(t, settings, url)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", url }, { name: "Treatments", url: `${url}/treatments` }, { name: t.name, url: `${url}/treatments/${t.slug}` }])} />
    </>
  );
}
