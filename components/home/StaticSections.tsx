import Link from "next/link";
import { CATEGORIES } from "@/lib/data/catalog";
import { TreatmentArt } from "../ui/Art";
import { Icon, type IconName } from "../ui/Icon";
import { Reveal } from "../ui/Motion";
import { Placeholder, SectionHeading } from "../ui/SectionHeading";

/* ----------------------------------- Hero ----------------------------------- */

export function Hero() {
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-title">
      {/* soft background wash */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_85%_20%,#efe0c2_0%,transparent_60%),radial-gradient(50%_50%_at_10%_90%,#f3e8d8_0%,transparent_60%)]" />
      <div className="container-lux relative grid items-center gap-10 pb-16 pt-10 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:pb-24 lg:pt-20">
        <div>
          <p className="eyebrow animate-rise">Skin &amp; Laser Clinic · Abbottabad</p>
          <h1 id="hero-title" className="mt-5 text-[2.9rem] leading-[1.02] sm:text-6xl lg:text-[4.6rem]">
            Considered skin care, <em className="font-normal text-gold">in calm, expert hands.</em>
          </h1>
          <p className="mt-6 max-w-xl text-[1.06rem] leading-relaxed text-muted">
            Doctor-led skin, laser and hair treatments, with honest advice and a plan built around you, not a one-size-fits-all package.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/book" className="btn btn-primary">
              Book an appointment <Icon name="arrow" size={18} />
            </Link>
            <Link href="/skin-finder" className="btn btn-ghost">
              Find the right treatment
            </Link>
          </div>
          <ul className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-6 text-[0.8rem] leading-snug text-muted">
            <li><span className="block font-serif text-xl text-charcoal">Doctor-led</span>consultations</li>
            <li><span className="block font-serif text-xl text-charcoal">Clear</span>pricing online</li>
            <li><span className="block font-serif text-xl text-charcoal">Online</span>booking, 24/7</li>
          </ul>
        </div>

        <div className="relative mx-auto aspect-[4/5] w-full max-w-[26rem] lg:max-w-none" aria-hidden="true">
          <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] shadow-[var(--shadow-lift)]">
            <TreatmentArt palette={7} className="h-full w-full" />
          </div>
          <div className="absolute -left-6 bottom-10 hidden w-44 overflow-hidden rounded-3xl border-4 border-ivory shadow-[var(--shadow-lift)] motion-safe:animate-float sm:block">
            <TreatmentArt palette={2} className="aspect-square w-full" />
          </div>
          <div className="absolute -right-3 top-8 rounded-2xl border border-line bg-ivory/90 px-4 py-3 text-sm shadow-[var(--shadow-soft)] backdrop-blur">
            <p className="eyebrow !text-[0.62rem]">Next step</p>
            <p className="mt-1 font-serif text-lg text-charcoal">Start with a consultation</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Introduction ------------------------------- */

export function Introduction() {
  return (
    <section className="container-lux py-16 sm:py-24" aria-labelledby="intro-title">
      <Reveal className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <p className="eyebrow">Welcome to Aesthetica</p>
          <h2 id="intro-title" className="mt-3 text-[2.1rem] sm:text-5xl">A quieter kind of clinic.</h2>
        </div>
        <div className="space-y-5 text-[1.05rem] leading-relaxed text-muted">
          <p>
            Aesthetica by Dr. Sajjad is a skin and laser clinic at Jadoon Plaza, Phase 2 Road, Abbottabad. Every treatment begins with listening: understanding your skin, your history and what you would like to change.
          </p>
          <p>
            From there, you receive clear options, realistic expectations and transparent costs, so you can decide with confidence. No pressure, no rushed appointments.
          </p>
          <div className="gold-rule !mt-8" />
        </div>
      </Reveal>
    </section>
  );
}

/* --------------------------------- Doctor ---------------------------------- */

export function MeetTheDoctor() {
  return (
    <section id="doctor" className="bg-cream py-16 sm:py-24" aria-labelledby="doctor-title">
      <div className="container-lux grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#efe1c6] via-[#e6d2ae] to-[#c9aa6c]">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-serif text-8xl text-ivory/95" aria-hidden="true">SA</span>
              <span className="mt-4 rounded-full bg-ivory/80 px-3 py-1 text-xs font-medium text-muted">Portrait to be provided by clinic</span>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="eyebrow">Meet the doctor</p>
          <h2 id="doctor-title" className="mt-3 text-[2.3rem] sm:text-5xl">Dr. Sajjad Ahmad</h2>
          <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-gold">Founder, Aesthetica</p>
          <Placeholder className="mt-6">
            <p className="font-semibold text-charcoal">Biography: to be provided by clinic</p>
            <p className="mt-1">
              This space is reserved for Dr. Sajjad&apos;s approved biography, qualifications and professional registration details. Nothing is shown here until the clinic supplies and confirms it.
            </p>
          </Placeholder>
          <Link href="/book" className="btn btn-primary mt-8">Book a consultation</Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------- Explore procedures ---------------------------- */

const CATEGORY_COPY: Record<string, { text: string; palette: number }> = {
  laser: { text: "Light-based treatments for hair reduction and skin refresh.", palette: 2 },
  facials: { text: "Cleansing, hydrating facials for a healthy-looking glow.", palette: 1 },
  peels: { text: "Medical-grade peels tailored to your skin.", palette: 3 },
  "skin-concerns": { text: "Plans for acne, scarring and pigmentation.", palette: 4 },
  hair: { text: "Support for thinning hair.", palette: 6 },
  consultation: { text: "Not sure where to start? Begin here.", palette: 0 },
};

export function ExploreProcedures() {
  return (
    <section className="container-lux py-16 sm:py-24" aria-labelledby="explore-title">
      <SectionHeading id="explore-title" eyebrow="Explore procedures" title="Find care by category" />
      <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {CATEGORIES.map((c, i) => (
          <li key={c.id}>
            <Reveal delay={i * 0.05} className="h-full">
              <Link
                href={`/treatments?category=${c.id}`}
                className="group relative flex h-full min-h-40 flex-col justify-end overflow-hidden rounded-2xl border border-line p-4 sm:min-h-52 sm:p-6"
              >
                <TreatmentArt palette={CATEGORY_COPY[c.id].palette} className="absolute inset-0 h-full w-full opacity-90 transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/75 via-charcoal/25 to-transparent" />
                <div className="relative">
                  <h3 className="text-2xl text-ivory sm:text-3xl">{c.label}</h3>
                  <p className="mt-1 hidden text-sm text-ivory/85 sm:block">{CATEGORY_COPY[c.id].text}</p>
                </div>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------- Why choose -------------------------------- */

const PILLARS: { icon: IconName; title: string; text: string }[] = [
  { icon: "user", title: "Doctor-led care", text: "Your concerns are assessed by a doctor before any treatment is recommended." },
  { icon: "leaf", title: "Honest, personalised plans", text: "Realistic expectations, explained clearly. Sometimes the right advice is to wait or do less." },
  { icon: "tag", title: "Clear pricing", text: "Prices and packages are shown up front, with final costs confirmed before you begin." },
  { icon: "shield", title: "Privacy & comfort", text: "Unhurried appointments in a calm, private setting. Your information stays confidential." },
];

export function WhyChoose() {
  return (
    <section className="bg-charcoal py-16 text-[#e8e0d3] sm:py-24" aria-labelledby="why-title">
      <div className="container-lux">
        <div className="max-w-2xl">
          <p className="eyebrow !text-champagne">Why Aesthetica</p>
          <h2 id="why-title" className="mt-3 text-[2.1rem] !text-ivory sm:text-5xl">Care that starts with listening.</h2>
        </div>
        <ul className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p, i) => (
            <li key={p.title} className="bg-charcoal p-6 sm:p-8">
              <Reveal delay={i * 0.06}>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-champagne/40 text-champagne">
                  <Icon name={p.icon} />
                </span>
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

/* ------------------------- Technology & facilities ------------------------- */

const FACILITIES: { title: string; text: string; palette: number }[] = [
  { title: "Laser systems", text: "Make, model and approvals of each laser to be listed by the clinic.", palette: 2 },
  { title: "HydraFacial", text: "Device details to be confirmed by the clinic.", palette: 1 },
  { title: "Treatment rooms", text: "Photos of the clinic's own rooms to be added (no stock images).", palette: 0 },
  { title: "Hygiene & safety", text: "Sterilisation and safety protocols to be described by the clinic.", palette: 4 },
];

export function Technology() {
  return (
    <section className="container-lux py-16 sm:py-24" aria-labelledby="tech-title">
      <SectionHeading id="tech-title" eyebrow="Technology & facilities" title="Equipment and setting">
        This section will show the clinic&apos;s actual equipment and rooms. Details below are placeholders until confirmed.
      </SectionHeading>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FACILITIES.map((f, i) => (
          <li key={f.title}>
            <Reveal delay={i * 0.05} className="card h-full overflow-hidden">
              <TreatmentArt palette={f.palette} variant={1} className="aspect-[16/10] w-full" />
              <div className="p-5">
                <h3 className="text-2xl">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.text}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* --------------------------------- Reviews --------------------------------- */

export function Reviews() {
  return (
    <section className="bg-cream py-16 sm:py-24" aria-labelledby="reviews-title">
      <div className="container-lux">
        <SectionHeading id="reviews-title" eyebrow="Patient reviews" title="In their words" align="center" />
        <Reveal className="mx-auto mt-10 max-w-2xl">
          <div className="rounded-3xl border border-dashed border-sand bg-ivory p-8 text-center sm:p-10">
            <span className="font-serif text-6xl leading-none text-champagne" aria-hidden="true">&ldquo;</span>
            <p className="mt-2 font-serif text-2xl text-charcoal">Patient reviews will appear here after approval.</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
              Only genuine reviews from real patients, published with their written consent and approved by the clinic. No reviews are shown in this preview.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------- Book CTA band ------------------------------ */

export function BookCTA() {
  return (
    <section className="container-lux py-16 sm:py-24" aria-labelledby="cta-title">
      <Reveal className="relative overflow-hidden rounded-[2rem] bg-charcoal px-6 py-14 text-center sm:px-12 sm:py-20">
        <div aria-hidden="true" className="absolute inset-0 opacity-60">
          <TreatmentArt palette={6} className="h-full w-full" />
        </div>
        <div className="relative">
          <p className="eyebrow !text-champagne">Book appointment</p>
          <h2 id="cta-title" className="mx-auto mt-4 max-w-2xl text-[2.3rem] !text-ivory sm:text-6xl">Your first step is a conversation.</h2>
          <p className="mx-auto mt-4 max-w-lg text-[#d9d1c4]">Choose a treatment and a time that suits you. The clinic will confirm your appointment.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/book" className="btn btn-gold">Book online <Icon name="arrow" size={18} /></Link>
            <Link href="/treatments" className="btn border border-white/25 text-ivory hover:bg-white/10">View all treatments</Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ----------------------------------- FAQ ----------------------------------- */

const FAQS = [
  { q: "Do I need a consultation before treatment?", a: "For most treatments, yes. A consultation lets the doctor understand your skin and medical history, explain options and confirm whether a treatment is suitable for you." },
  { q: "How do I book, change or cancel an appointment?", a: "Book online at any time. Once the clinic confirms, you will receive a message on WhatsApp or email. To make changes, reply to that message." },
  { q: "Are the prices on the website final?", a: "Prices shown are a guide. Your final price is confirmed by the clinic before treatment, based on the plan agreed with your doctor." },
  { q: "Will I see results after one session?", a: "It depends on the treatment and on your skin. Many treatments need a course of sessions, and results vary between individuals. Your doctor will explain what is realistic for you." },
  { q: "Is my information kept private?", a: "Yes. Your details are used only to manage your appointments and contact you by the method you choose." },
];

export function FAQSection() {
  return (
    <section className="container-lux py-16 sm:py-24" aria-labelledby="faq-title">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <SectionHeading id="faq-title" eyebrow="FAQ" title="Questions, answered">
          Anything else? Ask us on WhatsApp.
        </SectionHeading>
        <FaqList items={FAQS} />
      </div>
    </section>
  );
}

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((f) => (
        <details key={f.q} className="group py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-serif text-xl text-charcoal sm:text-2xl [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-sand text-gold transition-transform group-open:rotate-45">
              <Icon name="plus" size={16} />
            </span>
          </summary>
          <p className="pb-5 pr-10 leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
