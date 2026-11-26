"use client";

import Link from "next/link";
import { groupedHours } from "@/lib/hours";
import { telHref } from "@/lib/phone";
import { useSite } from "../site/SiteProvider";
import { directionsUrl, mapsUrl } from "../site/useClinic";
import { Icon, type IconName } from "../ui/Icon";
import { Logo } from "./Logo";
import { FOOTER_CLINIC_LINKS, TREATMENT_GROUPS } from "./nav";

export { mapsUrl };

/** Opening hours grouped for display: [{ days: "Mon – Fri", time: "9:30 AM – 6:30 PM" }, ...]. */
export function useHours() {
  const { settings } = useSite();
  return groupedHours(settings);
}

export function Footer() {
  const { content } = useSite();
  const { contact, social } = content;
  const hours = useHours();
  const socials = (
    [
      ["instagram", social.instagram, "Instagram"],
      ["facebook", social.facebook, "Facebook"],
      ["tiktok", social.tiktok, "TikTok"],
      ["youtube", social.youtube, "YouTube"],
      ["yelp", social.yelp, "Yelp"],
    ] as [IconName, string, string][]
  ).filter(([, url]) => url);
  const head = "text-[0.68rem] font-medium uppercase tracking-[0.26em] text-champagne";

  return (
    <footer className="on-dark bg-charcoal text-[#d9d3ca]">
      <div className="container-lux">
        <div className="flex flex-col items-start justify-between gap-8 border-b border-white/10 py-14 md:flex-row md:items-end lg:py-20">
          <p className="max-w-xl font-serif text-[2.1rem] leading-[1.08] text-ivory sm:text-5xl">
            Personalized care for skin that feels <em className="text-champagne">like yours.</em>
          </p>
          <Link href="/book" className="btn btn-gold flex-none">Book an Appointment <Icon name="arrow" size={16} /></Link>
        </div>

        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.9fr_0.9fr_1.2fr] lg:gap-12">
          <div>
            <Logo light />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-[#bdb5aa]">{content.footer.about}</p>
            {socials.length > 0 && (
              <ul className="mt-6 flex gap-2" aria-label="Social media">
                {socials.map(([icon, url, label]) => (
                  <li key={icon}>
                    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex h-11 w-11 items-center justify-center border border-white/15 text-champagne transition-colors hover:border-champagne">
                      <Icon name={icon} size={18} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav aria-label="Treatments">
            <p className={head}>Treatments</p>
            <ul className="mt-5 space-y-3 text-sm">
              {TREATMENT_GROUPS.map((g) => (
                <li key={g.href}><Link href={g.href} className="hover:text-champagne">{g.label}</Link></li>
              ))}
              <li><Link href="/treatments" className="hover:text-champagne">All treatments</Link></li>
            </ul>
          </nav>

          <nav aria-label="Clinic">
            <p className={head}>Clinic</p>
            <ul className="mt-5 space-y-3 text-sm">
              {FOOTER_CLINIC_LINKS.map((l) => (
                <li key={l.href}><Link href={l.href} className="hover:text-champagne">{l.label}</Link></li>
              ))}
            </ul>
          </nav>

          <div>
            <p className={head}>Visit</p>
            <address className="mt-5 space-y-4 text-sm not-italic">
              <a href={directionsUrl(contact.mapsQuery)} target="_blank" rel="noopener noreferrer" className="flex gap-3 hover:text-champagne">
                <Icon name="pin" size={18} className="mt-0.5 flex-none text-champagne" />
                <span>{contact.address}{contact.city && <><br />{contact.city}</>}</span>
              </a>
              {contact.phone && (
                <a href={telHref(contact.phone)} className="flex gap-3 hover:text-champagne">
                  <Icon name="phone" size={18} className="mt-0.5 flex-none text-champagne" />
                  {contact.phone}
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex gap-3 break-all hover:text-champagne">
                  <Icon name="mail" size={18} className="mt-0.5 flex-none text-champagne" />
                  {contact.email}
                </a>
              )}
            </address>
            <dl className="mt-6 space-y-1.5 text-sm">
              {hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-4 border-b border-white/10 pb-1.5">
                  <dt>{h.days}</dt>
                  <dd className={h.closed ? "text-[#a39b8f]" : "text-ivory"}>{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="container-lux flex flex-col gap-3 py-6 text-xs leading-relaxed text-[#a39b8f] lg:flex-row lg:items-center lg:justify-between">
          <p>© {new Date().getFullYear()} {content.brand.clinicName}. {content.footer.disclaimer}</p>
          <p className="flex flex-none flex-wrap gap-x-6 gap-y-2">
            <Link href="/privacy" className="hover:text-champagne">Privacy</Link>
            <Link href="/accessibility" className="hover:text-champagne">Accessibility</Link>
            <Link href="/admin" className="hover:text-champagne">Staff login</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
