/**
 * Phone numbers.
 *
 * The clinic is in California, so US numbers are the default and can be typed
 * any common way: (909) 516-7066, 909-516-7066, 9095167066, +1 909 516 7066.
 * Visitors with a non-US number enter it with the country code (+44 ..., +86 ...).
 *
 * Stored format: "+1 (909) 516-7066" for US numbers, "+<digits>" otherwise.
 */
export function normalisePhone(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (/[^\d\s\-+().]/.test(raw)) return null;
  const international = raw.startsWith("+") || raw.startsWith("00");
  let digits = raw.replace(/\D/g, "");
  if (raw.startsWith("00")) digits = digits.slice(2);

  // North American Numbering Plan: area code and exchange cannot start with 0 or 1.
  const nanp = (d: string) => /^[2-9]\d{2}[2-9]\d{6}$/.test(d);
  if (!international || digits.startsWith("1")) {
    const d = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
    if (nanp(d)) return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    if (!international) return null;
  }
  // Other countries: E.164 allows up to 15 digits including the country code.
  if (digits.length >= 8 && digits.length <= 15 && !digits.startsWith("0")) return `+${digits}`;
  return null;
}

export const isValidPhone = (input: string) => normalisePhone(input) !== null;

/** "+1 (909) 516-7066" -> "tel:+19095167066"; plain local numbers are assumed to be US. */
export function telHref(phone: string): string {
  const n = normalisePhone(phone);
  return `tel:${n ? n.replace(/[^\d+]/g, "") : phone.replace(/[^\d+]/g, "")}`;
}

/** Digits only, for wa.me links. */
export function toWhatsAppDigits(normalised: string): string {
  return normalised.replace(/\D/g, "");
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.trim());
}
