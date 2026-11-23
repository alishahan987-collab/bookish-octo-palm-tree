import type { PriceModel, PriceType } from "./data/types";

export function formatMoney(n: number, currency = "PKR"): string {
  return `${currency} ${Math.round(n).toLocaleString("en-US")}`;
}
/** @deprecated use formatMoney */
export const formatPKR = (n: number) => formatMoney(n);

export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  fixed: "Fixed price",
  from: "Starting from",
  range: "Price range",
  consultation: "Consultation required",
  promo: "Discounted price",
  package: "Session packages",
};

/** One-line summary used on cards and in the admin list. */
export function priceSummary(p: PriceModel, currency = "PKR"): string {
  const f = (n: number) => formatMoney(n, currency);
  switch (p.type) {
    case "fixed":
      return `${f(p.amount)}${p.unit ? ` ${p.unit}` : ""}`;
    case "from":
      return `From ${f(p.amount)}${p.unit ? ` ${p.unit}` : ""}`;
    case "range":
      return `${f(p.min)} – ${p.max.toLocaleString("en-US")}${p.unit ? ` ${p.unit}` : ""}`;
    case "consultation":
      return "Price after consultation";
    case "promo":
      return `${f(p.promo)} (was ${p.regular.toLocaleString("en-US")})`;
    case "package":
      return `${f(p.perSession)} per session`;
  }
}

export function packageSaving(perSession: number, pkg: { sessions: number; price: number }): number {
  return Math.max(0, perSession * pkg.sessions - pkg.price);
}

export function promoSavingPercent(regular: number, promo: number): number {
  if (regular <= 0 || promo >= regular) return 0;
  return Math.round(((regular - promo) / regular) * 100);
}

/** Validation used by the admin price editor (and in Phase 2, the API). */
export function validatePrice(p: PriceModel): string | null {
  const pos = (n: number) => Number.isFinite(n) && n > 0;
  switch (p.type) {
    case "fixed":
    case "from":
      return pos(p.amount) ? null : "Enter a price above zero.";
    case "range":
      if (!pos(p.min) || !pos(p.max)) return "Enter both minimum and maximum.";
      return p.min < p.max ? null : "Minimum must be lower than maximum.";
    case "consultation":
      return null;
    case "promo":
      if (!pos(p.regular) || !pos(p.promo)) return "Enter both regular and discounted price.";
      return p.promo < p.regular ? null : "Promotional price must be lower than the regular price.";
    case "package":
      if (!pos(p.perSession)) return "Enter the per-session price.";
      for (const pkg of p.packages) {
        if (!(pkg.sessions >= 2) || !pos(pkg.price)) return "Each package needs 2+ sessions and a price.";
      }
      return null;
  }
}
