"use client";

import Link from "next/link";
import { WEEKDAYS, formatTime } from "@/lib/dates";
import { useSite } from "../site/SiteProvider";
import { Icon, type IconName } from "../ui/Icon";
import { Logo } from "./Logo";
import { NAV_LINKS } from "./nav";
import { WhatsAppLink } from "./WhatsAppLink";

export function useHours() {
  const { settings } = useSite();
  const open = WEEKDAYS.filter((d) => settings.workingDays.includes(d.id));
  const closed = WEEKDAYS.filter((d) => !settings.workingDays.includes(d.id));
  const days = open.length === 7 ? "Every day" : open.length ? open.map((d) => d.short).join(", ") : "By appointment";
  return { days, time: `${formatTime(settings.openTime)} – ${formatTime(settings.closeTime)}`, closed: closed.map((d) => d.long) };
}

export function mapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function Footer() {
  const { content } = useSite();
  const { contact, social } = content;
  const hours = useHours();
  const socials = (
    [
      ["instagram", social.instagram, "Instagram"],
      ["facebook", social.facebook, "Facebook"],
      ["youtube", social.youtube, "YouTube"],
      ["tiktok", social.tiktok, "TikTok"],
    ] as [IconName, string, string][]
  ).filter(([, url]) => url);

  return (
    <footer className="mt-24 bg-charcoal text-[#d9d1c4]">
      <div className="container-lux grid gap-10 py-14 pb-28 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr] lg:pb-14">
        <div>
          <Logo light />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#bfb5a6]">{content.footer.about}</p>
          {socials.length > 0 && (
            <ul className="mt-6 flex gap-2" aria-label="Social media">
              {socials.map(([icon, url, label]) => (
                <li key={icon}>
                  <a href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-champagne transition-colors hover:bg-white/10">
                    <Icon name={icon} size={18} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Footer">
          <p className="eyebrow !text-champagne">Explore</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV_LINKS.slice(1).map((l) => (
              <li key={l.href}><Link href={l.href} className="hover:text-champagne">{l.label}</Link></li>
            ))}
            <li><Link href="/conditions" className="hover:text-champagne">Skin Conditions</Link></li>
          </ul>
        </nav>

        <div>
          <p className="eyebrow !text-champagne">Clinic hours</p>
          <p className="mt-4 text-sm">{hours.days}</p>
          <p className="text-sm">{hours.time}</p>
          {hours.closed.length > 0 && <p className="mt-1 text-sm text-[#a89e8f]">Closed {hours.closed.join(", ")}</p>}
          <Link href="/book" className="btn btn-gold btn-sm mt-6">Book appointment</Link>
        </div>

        <div>
          <p className="eyebrow !text-champagne">Contact</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-3">
              <Icon name="pin" size={18} className="mt-0.5 flex-none text-champagne" />
              <a href={mapsUrl(contact.mapsQuery)} target="_blank" rel="noopener noreferrer" className="hover:text-champagne">
                {contact.address}{contact.city && `, ${contact.city}`}
              </a>
            </li>
            {contact.phone && (
              <li className="flex gap-3">
                <Icon name="phone" size={18} className="mt-0.5 flex-none text-champagne" />
                <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="hover:text-champagne">{contact.phone}</a>
              </li>
            )}
            {contact.email && (
              <li className="flex gap-3">
                <Icon name="mail" size={18} className="mt-0.5 flex-none text-champagne" />
                <a href={`mailto:${contact.email}`} className="break-all hover:text-champagne">{contact.email}</a>
              </li>
            )}
          </ul>
          <WhatsAppLink className="btn btn-sm mt-5 border border-white/20 text-ivory hover:bg-white/10">
            <Icon name="whatsapp" size={16} className="text-[#4cd17b]" /> WhatsApp us
          </WhatsAppLink>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-lux flex flex-col gap-2 py-5 text-xs text-[#a89e8f] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {content.brand.clinicName}. {content.footer.disclaimer}</p>
          <p className="flex gap-4">
            <Link href="/privacy" className="hover:text-champagne">Privacy</Link>
            <Link href="/admin" className="hover:text-champagne">Staff login</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
