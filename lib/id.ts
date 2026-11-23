/** Short unique id. crypto.randomUUID is unavailable on plain-http LAN URLs (e.g. testing on a phone), so fall back. */
export function uid(prefix = "id"): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  const rand = c && "randomUUID" in c ? c.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}
