import Link from "next/link";
import { bookHref } from "@/lib/links";
import type { Settings, Treatment } from "@/lib/types";
import { Img } from "../ui/Img";
import { Icon } from "../ui/Icon";

export function priceLabel(t: Treatment, s: Settings) {
  return t.price.trim() || s.treatmentText.priceFallback;
}

export function TreatmentCard({ t, settings, showPrice, priority }: { t: Treatment; settings: Settings; showPrice: boolean; priority?: boolean }) {
  const href = `/treatments/${t.slug}`;
  const book = bookHref(settings, t);
  return (
    <article className="group flex h-full flex-col" data-treatment={t.slug}>
      <Link href={href} className="img-radius relative block aspect-[4/3] bg-alt sm:aspect-[4/5]" tabIndex={-1} aria-hidden="true">
        <Img src={t.image} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" priority={priority} />
      </Link>
      <div className="flex flex-1 flex-col pt-5">
        <p className="eyebrow !text-[0.66rem]">{t.category}</p>
        <h3 className="mt-2 text-[1.6rem] leading-tight">
          <Link href={href} className="hover:text-accent-ink">{t.name}</Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-[0.95rem] text-fg-muted">{t.shortDescription}</p>
        {showPrice && <p className="mt-3 text-sm font-medium">{priceLabel(t, settings)}{t.duration ? <span className="text-fg-muted"> · {t.duration}</span> : null}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-5">
          <Link href={href} className="inline-flex items-center gap-2 text-sm font-semibold">
            <span className="link-underline pb-0.5">{settings.treatmentText.detailsLabel}<span className="sr-only"> about {t.name}</span></span> <Icon name="arrow" size={15} />
          </Link>
          {t.bookable && (
            <a href={book} className="text-sm font-semibold text-accent-ink hover:underline" {...(book.startsWith("/") ? {} : { target: "_blank", rel: "noopener noreferrer" })}>
              {settings.treatmentText.bookLabel}<span className="sr-only">: {t.name}</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
