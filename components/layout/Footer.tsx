import Link from "next/link";
import { Logo } from "./Logo";
import { NAV_LINKS } from "./nav";

export function Footer() {
  return (
    <footer className="mt-24 bg-charcoal text-[#d9d1c4]">
      <div className="container-lux grid gap-10 py-14 pb-28 sm:grid-cols-2 lg:grid-cols-4 lg:pb-14">
        <div className="lg:col-span-2">
          <Logo light />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#bfb5a6]">
            Skin, laser and hair treatments in Abbottabad. Jadoon Plaza, Phase 2 Road.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="eyebrow !text-champagne">Explore</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-champagne">{l.label}</Link>
              </li>
            ))}
            <li><Link href="/book" className="hover:text-champagne">Book appointment</Link></li>
          </ul>
        </nav>
        <div>
          <p className="eyebrow !text-champagne">Preview</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/admin" className="hover:text-champagne">Clinic admin (demo)</Link></li>
          </ul>
          <p className="mt-5 text-xs leading-relaxed text-[#a89e8f]">
            Design preview only. Copy, prices and clinic details are placeholders for review by the clinic. No real patient data is collected; demo data stays in this browser.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="container-lux py-5 text-xs text-[#a89e8f]">
          © {new Date().getFullYear()} Design preview for Aesthetica by Dr. Sajjad. Not the official website.
        </p>
      </div>
    </footer>
  );
}
