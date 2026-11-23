import { formatDate } from "@/lib/dates";
import { formatMoney, packageSaving, promoSavingPercent } from "@/lib/pricing";
import type { PriceModel } from "@/lib/data/types";

/** Compact price for cards and lists. */
export function PriceTag({ price, currency = "PKR", className = "" }: { price: PriceModel; currency?: string; className?: string }) {
  const f = (n: number) => formatMoney(n, currency);
  const base = `text-sm text-charcoal ${className}`;
  switch (price.type) {
    case "fixed":
      return <p className={base}><span className="font-semibold">{f(price.amount)}</span></p>;
    case "from":
      return <p className={base}><span className="text-muted">From </span><span className="font-semibold">{f(price.amount)}</span></p>;
    case "range":
      return <p className={base}><span className="font-semibold">{f(price.min)} – {price.max.toLocaleString("en-US")}</span></p>;
    case "consultation":
      return <p className={base}><span className="font-semibold">On consultation</span></p>;
    case "promo":
      return (
        <p className={base}>
          <span className="font-semibold">{f(price.promo)}</span> <s className="text-muted">{price.regular.toLocaleString("en-US")}</s>
        </p>
      );
    case "package":
      return <p className={base}><span className="font-semibold">{f(price.perSession)}</span><span className="text-muted"> / session</span></p>;
  }
}

/** Full price block for procedure pages. */
export function PriceBlock({ price, currency = "PKR", note }: { price: PriceModel; currency?: string; note?: string }) {
  return (
    <div>
      <PriceBody price={price} currency={currency} />
      {note && (
        <p className="mt-4 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
          <span aria-hidden="true">✦</span> {note}
        </p>
      )}
    </div>
  );
}

function Amount({ children }: { children: React.ReactNode }) {
  return <p className="font-serif text-4xl leading-none text-charcoal">{children}</p>;
}
const Unit = ({ unit }: { unit?: string }) => (unit ? <p className="mt-2 text-sm text-muted">{unit}</p> : null);

function PriceBody({ price, currency }: { price: PriceModel; currency: string }) {
  const f = (n: number) => formatMoney(n, currency);
  switch (price.type) {
    case "fixed":
      return (<><p className="eyebrow">Price</p><div className="mt-3"><Amount>{f(price.amount)}</Amount></div><Unit unit={price.unit} /></>);
    case "from":
      return (
        <>
          <p className="eyebrow">Starting from</p>
          <div className="mt-3"><Amount>{f(price.amount)}</Amount></div>
          <Unit unit={price.unit} />
          <p className="mt-2 text-sm text-muted">Final price depends on the plan agreed with your doctor.</p>
        </>
      );
    case "range":
      return (<><p className="eyebrow">Price range</p><div className="mt-3"><Amount>{f(price.min)} – {price.max.toLocaleString("en-US")}</Amount></div><Unit unit={price.unit} /></>);
    case "consultation":
      return (
        <>
          <p className="eyebrow">Consultation required</p>
          <p className="mt-3 font-serif text-3xl leading-tight text-charcoal">Price confirmed after your consultation</p>
          {price.note && <p className="mt-2 text-sm text-muted">{price.note}</p>}
        </>
      );
    case "promo": {
      const pct = promoSavingPercent(price.regular, price.promo);
      return (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">Special offer</p>
            {price.label && <span className="chip bg-charcoal text-ivory">{price.label}</span>}
            {pct > 0 && <span className="chip bg-champagne-soft text-gold-deep">Save {pct}%</span>}
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-3">
            <Amount>{f(price.promo)}</Amount>
            <s className="text-lg text-muted" aria-label={`Regular price ${f(price.regular)}`}>{f(price.regular)}</s>
          </div>
          <Unit unit={price.unit} />
          {price.validUntil && <p className="mt-1 text-sm text-muted">Offer valid until {formatDate(price.validUntil, { day: "numeric", month: "long", year: "numeric" })}</p>}
        </>
      );
    }
    case "package":
      return (
        <>
          <p className="eyebrow">Per session</p>
          <div className="mt-3"><Amount>{f(price.perSession)}</Amount></div>
          {price.packages.length > 0 && (
            <ul className="mt-5 divide-y divide-line overflow-hidden rounded-xl border border-line bg-ivory">
              {price.packages.map((p) => {
                const save = packageSaving(price.perSession, p);
                return (
                  <li key={p.sessions} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="font-semibold text-charcoal">{p.sessions} sessions</p>
                      {save > 0 && <p className="text-xs text-success">Save {f(save)}</p>}
                    </div>
                    <p className="font-semibold text-charcoal">{f(p.price)}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      );
  }
}
