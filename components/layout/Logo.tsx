import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group inline-flex flex-col leading-none" aria-label="Aesthetica by Dr. Sajjad, home">
      <span className={`font-serif text-[1.65rem] tracking-[0.02em] ${light ? "text-ivory" : "text-charcoal"}`}>
        Aesthetica
      </span>
      <span className={`mt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.32em] ${light ? "text-champagne" : "text-gold"}`}>
        by Dr. Sajjad
      </span>
    </Link>
  );
}
