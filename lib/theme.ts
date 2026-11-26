import type { ThemeConfig } from "./data/types";

/**
 * Brand colours and the accessible tokens derived from them.
 *
 * The VVIP palette's muted gold (#B49A70) and taupe (#A99B8C) are beautiful
 * but too light to read as text on ivory (about 2.5:1; WCAG AA needs 4.5:1).
 * So the admin picks the brand colours, and the site derives:
 *   gold   – a deeper shade of the accent for small text and links (>= 4.5:1)
 *   muted  – secondary text (>= 4.5:1 on every light background)
 *   sand   – form-control borders (>= 3:1, WCAG 1.4.11)
 *   onGold – charcoal or white, whichever reads better on the accent
 * The accent itself stays for rules, icons, dark sections and button fills.
 */
export type ThemeColors = Omit<ThemeConfig, "headingFont" | "bodyFont" | "preset">;

export const THEME_PRESETS: Record<string, ThemeColors> = {
  vvip: { background: "#F8F6F1", surface: "#FFFFFF", cream: "#E8DDCE", accent: "#B49A70", taupe: "#A99B8C", ink: "#252525" },
  porcelain: { background: "#FFFFFF", surface: "#FFFFFF", cream: "#F3EEE7", accent: "#B49A70", taupe: "#B3A99D", ink: "#1E1E1E" },
  noir: { background: "#F4F1EC", surface: "#FFFFFF", cream: "#E4DCD0", accent: "#A88B5E", taupe: "#9C8F80", ink: "#161616" },
};

export const PRESET_LABELS: Record<string, string> = { vvip: "VVIP Ivory & Gold", porcelain: "Porcelain", noir: "Noir" };

export const FONT_LABELS = {
  heading: { cormorant: "Cormorant Garamond (classic)", playfair: "Playfair Display (editorial)", bodoni: "Bodoni Moda (fashion)" },
  body: { dmsans: "DM Sans (soft, modern)", inter: "Inter (neutral)", manrope: "Manrope (geometric)" },
} as const;

/* ------------------------------ colour maths ------------------------------ */

const hex = (h: string) => {
  const v = h.replace("#", "");
  const full = v.length === 3 ? v.split("").map((c) => c + c).join("") : v.padEnd(6, "0").slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};
const toHex = (rgb: number[]) => `#${rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("")}`;

function luminance(h: string): number {
  const c = hex(h).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** WCAG contrast ratio between two hex colours. */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Linear mix: 0 = a, 1 = b. */
export function mix(a: string, b: string, t: number): string {
  const [x, y] = [hex(a), hex(b)];
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
}

function toHsl(h: string): [number, number, number] {
  const [r, g, b] = hex(h).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const hue = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [hue * 60, s, l];
}

function fromHsl(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return toHex([f(0), f(8), f(4)].map((v) => v * 255));
}

/** Darkens a colour in HSL (keeping its hue, so gold stays gold) until it reaches `ratio` against every background. */
function deepen(color: string, backgrounds: string[], ratio: number): string {
  const [h, s, l] = toHsl(color);
  for (let light = l; light >= 0; light -= 0.01) {
    const c = fromHsl(h, Math.max(s, 0.34), light);
    if (backgrounds.every((bg) => contrast(c, bg) >= ratio)) return c;
  }
  return "#000000";
}

/** Moves `color` towards `toward` until it reaches `ratio` against every background. */
function reach(color: string, toward: string, backgrounds: string[], ratio: number): string {
  for (let t = 0; t <= 1.0001; t += 0.02) {
    const c = mix(color, toward, t);
    if (backgrounds.every((bg) => contrast(c, bg) >= ratio)) return c;
  }
  return toward;
}

export interface DerivedTheme {
  gold: string;
  muted: string;
  sand: string;
  line: string;
  onGold: string;
}

export function deriveTheme(t: ThemeColors): DerivedTheme {
  const lights = [t.background, t.surface, t.cream];
  return {
    gold: deepen(t.accent, lights, 4.6),
    muted: reach(mix(t.ink, t.taupe, 0.7), t.ink, lights, 4.6),
    sand: reach(t.taupe, t.ink, [t.background, t.surface], 3.1),
    line: mix(t.taupe, t.background, 0.55),
    onGold: contrast(t.ink, t.accent) >= contrast("#ffffff", t.accent) ? t.ink : "#ffffff",
  };
}

/** CSS custom properties applied to <html>. Names match the Tailwind tokens in globals.css. */
export function themeToCss(t: ThemeConfig): Record<string, string> {
  const d = deriveTheme(t);
  return {
    "--color-ivory": t.background,
    "--color-surface": t.surface,
    "--color-cream": t.cream,
    "--color-champagne": t.accent,
    "--color-taupe": t.taupe,
    "--color-charcoal": t.ink,
    "--color-ink": t.ink,
    "--color-gold": d.gold,
    "--color-muted": d.muted,
    "--color-sand": d.sand,
    "--color-line": d.line,
    "--color-on-gold": d.onGold,
    "--font-serif": `var(--font-${t.headingFont}), "Cormorant Garamond", Georgia, serif`,
    "--font-sans": `var(--font-${t.bodyFont}), system-ui, -apple-system, "Segoe UI", sans-serif`,
  };
}
