import type { Settings, Treatment } from "@/lib/types";
import { safeHref } from "@/lib/validation";

/** Structured data. Escapes "<" so stored text can never close the script tag. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * LocalBusiness markup for Google. Deliberately no aggregateRating: Google
 * treats ratings a business publishes about itself as "self-serving" and
 * ignores or penalises them; the Google Business Profile shows the real stars.
 */
export function localBusinessJsonLd(s: Settings, url: string) {
  const b = s.business;
  return {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    "@id": `${url}/#business`,
    name: b.name,
    url,
    telephone: b.phone || undefined,
    email: b.email || undefined,
    image: s.seo.ogImage ? new URL(s.seo.ogImage, url).toString() : undefined,
    priceRange: b.priceRange || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: [b.street, b.suite].filter(Boolean).join(", "),
      addressLocality: b.city,
      addressRegion: b.state,
      postalCode: b.zip,
      addressCountry: b.country,
    },
    ...(b.latitude && b.longitude ? { geo: { "@type": "GeoCoordinates", latitude: Number(b.latitude), longitude: Number(b.longitude) } } : {}),
    hasMap: safeHref(b.mapsUrl) || undefined,
    openingHoursSpecification: b.hours.filter((h) => !h.closed).map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: DAY[h.day], opens: h.open, closes: h.close })),
    sameAs: s.social.map((x) => safeHref(x.url)).filter((u) => u.startsWith("http")),
    availableLanguage: b.languages ? b.languages.split(/,\s*/) : undefined,
  };
}

export function serviceJsonLd(t: Treatment, s: Settings, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: t.name,
    description: t.shortDescription,
    url: `${url}/treatments/${t.slug}`,
    image: t.image ? new URL(t.image, url).toString() : undefined,
    areaServed: `${s.business.city}, ${s.business.state}`,
    provider: { "@id": `${url}/#business` },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}
