/** Short random ids (URL-safe). Works in browsers and Node. */
export function newId(prefix = ""): string {
  const bytes = new Uint8Array(9);
  globalThis.crypto.getRandomValues(bytes);
  const s = Array.from(bytes, (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
  return prefix ? `${prefix}_${s}` : s;
}

/** Human-friendly booking reference without ambiguous characters, e.g. "MS-7K4Q2P". */
export function newReference(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  globalThis.crypto.getRandomValues(bytes);
  return "MS-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
