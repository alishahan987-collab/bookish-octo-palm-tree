"use client";

import type { PriceModel, PriceType } from "@/lib/data/types";
import { PRICE_TYPE_LABELS, formatMoney, packageSaving, validatePrice } from "@/lib/pricing";
import { Icon } from "../ui/Icon";
import { PriceBlock } from "../ui/Price";

/** Convert between price types while keeping a sensible number. */
function convert(p: PriceModel, type: PriceType): PriceModel {
  const ref =
    p.type === "fixed" || p.type === "from" ? p.amount
      : p.type === "range" ? p.min
        : p.type === "promo" ? p.regular
          : p.type === "package" ? p.perSession
            : 5000;
  const unit = "unit" in p ? p.unit : undefined;
  switch (type) {
    case "fixed": return { type, amount: ref, unit };
    case "from": return { type, amount: ref, unit };
    case "range": return { type, min: ref, max: Math.round(ref * 1.5), unit };
    case "consultation": return { type, note: "Plan and price confirmed after examination." };
    case "promo": return { type, regular: ref, promo: Math.round(ref * 0.8), label: "Special offer", unit };
    case "package": return { type, perSession: ref, packages: [{ sessions: 3, price: Math.round(ref * 3 * 0.9) }] };
  }
}

export function PriceEditor({ value, onChange, currency = "USD" }: { value: PriceModel; onChange: (p: PriceModel) => void; currency?: string }) {
  const money = (n: number) => formatMoney(n, currency);
  const err = validatePrice(value);
  const num = (v: string) => (v === "" ? 0 : Math.max(0, Number(v)));

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_17rem]">
      <div className="space-y-4">
        <fieldset>
          <legend className="label">Price type</legend>
          <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.keys(PRICE_TYPE_LABELS) as PriceType[]).map((t) => (
              <label key={t} className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${value.type === t ? "border-charcoal bg-charcoal text-ivory" : "border-sand hover:bg-cream"}`}>
                <input type="radio" name="price-type" className="sr-only" checked={value.type === t} onChange={() => onChange(convert(value, t))} />
                {PRICE_TYPE_LABELS[t]}
              </label>
            ))}
          </div>
        </fieldset>

        {(value.type === "fixed" || value.type === "from") && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Num id="p-amount" label={value.type === "from" ? `Starting price (${currency})` : `Price (${currency})`} value={value.amount} onChange={(v) => onChange({ ...value, amount: num(v) })} />
            <Text id="p-unit" label="Unit (optional)" placeholder="per session" value={value.unit ?? ""} onChange={(v) => onChange({ ...value, unit: v || undefined })} />
          </div>
        )}
        {value.type === "range" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Num id="p-min" label={`Minimum (${currency})`} value={value.min} onChange={(v) => onChange({ ...value, min: num(v) })} />
            <Num id="p-max" label={`Maximum (${currency})`} value={value.max} onChange={(v) => onChange({ ...value, max: num(v) })} />
            <Text id="p-unit" label="Unit (optional)" placeholder="per area" value={value.unit ?? ""} onChange={(v) => onChange({ ...value, unit: v || undefined })} />
          </div>
        )}
        {value.type === "consultation" && (
          <Text id="p-note" label="Note shown to patients" value={value.note ?? ""} onChange={(v) => onChange({ ...value, note: v || undefined })} />
        )}
        {value.type === "promo" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Num id="p-regular" label={`Regular price (${currency})`} value={value.regular} onChange={(v) => onChange({ ...value, regular: num(v) })} />
            <Num id="p-promo" label={`Discounted price (${currency})`} value={value.promo} onChange={(v) => onChange({ ...value, promo: num(v) })} />
            <Text id="p-label" label="Discount label" placeholder="Winter offer" value={value.label ?? ""} onChange={(v) => onChange({ ...value, label: v || undefined })} />
            <div>
              <label htmlFor="p-until" className="label">Valid until (optional)</label>
              <input id="p-until" type="date" className="field" value={value.validUntil ?? ""} onChange={(e) => onChange({ ...value, validUntil: e.target.value || undefined })} />
            </div>
            <Text id="p-unit" label="Unit (optional)" placeholder="per session" value={value.unit ?? ""} onChange={(v) => onChange({ ...value, unit: v || undefined })} />
          </div>
        )}
        {value.type === "package" && (
          <div className="space-y-3">
            <Num id="p-per" label={`Price per session (${currency})`} value={value.perSession} onChange={(v) => onChange({ ...value, perSession: num(v) })} />
            <p className="label !mb-0">Packages</p>
            {value.packages.map((pkg, i) => (
              <div key={i} className="flex items-end gap-2">
                <Num id={`p-s-${i}`} label="Sessions" value={pkg.sessions} onChange={(v) => onChange({ ...value, packages: value.packages.map((x, j) => (j === i ? { ...x, sessions: num(v) } : x)) })} />
                <Num id={`p-p-${i}`} label={`Package price (${currency})`} value={pkg.price} onChange={(v) => onChange({ ...value, packages: value.packages.map((x, j) => (j === i ? { ...x, price: num(v) } : x)) })} />
                <button type="button" className="mb-1 rounded-full p-2.5 text-muted hover:bg-cream hover:text-danger" aria-label={`Remove package ${i + 1}`}
                  onClick={() => onChange({ ...value, packages: value.packages.filter((_, j) => j !== i) })}>
                  <Icon name="trash" size={18} />
                </button>
              </div>
            ))}
            {value.packages.map((pkg, i) => packageSaving(value.perSession, pkg) > 0 && (
              <p key={`s${i}`} className="text-xs text-success">{pkg.sessions} sessions saves clients {money(packageSaving(value.perSession, pkg))}</p>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange({ ...value, packages: [...value.packages, { sessions: 6, price: value.perSession * 5 }] })}>
              <Icon name="plus" size={16} /> Add package
            </button>
          </div>
        )}
        {err && <p className="error-text" role="alert">{err}</p>}
      </div>
      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Live preview</p>
        <PriceBlock price={value} currency={currency} />
      </div>
    </div>
  );
}

function Num({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} type="number" inputMode="numeric" min={0} step={100} className="field" value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Text({ id, label, value, onChange, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} className="field" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
