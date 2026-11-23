/**
 * Pakistani mobile number validation.
 *
 * Accepts the common ways people type a mobile number:
 *   0300 1234567, 0300-1234567, 03001234567,
 *   +92 300 1234567, 92 300 1234567, 0092 300 1234567
 * Mobile numbers are 03XX followed by 7 digits (10 significant digits after
 * the leading 0). WhatsApp requires a mobile number, so landlines are rejected.
 */
export function normalisePkMobile(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (/[^\d\s\-+()]/.test(raw)) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0092")) digits = digits.slice(4);
  else if (digits.startsWith("92")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  else return null;
  if (!/^3\d{9}$/.test(digits)) return null;
  return `+92 ${digits.slice(0, 3)} ${digits.slice(3)}`;
}

export function isValidPkMobile(input: string): boolean {
  return normalisePkMobile(input) !== null;
}

/** "+92 300 1234567" -> "923001234567" for wa.me links */
export function toWhatsAppDigits(normalised: string): string {
  return normalised.replace(/\D/g, "");
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.trim());
}
