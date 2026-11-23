import type { ThemeConfig } from "./data/types";

/** Colour presets offered in Admin → Appearance. Each has been checked for WCAG AA text contrast. */
export const THEME_PRESETS: Record<string, Omit<ThemeConfig, "headingFont" | "bodyFont" | "preset">> = {
  champagne: { background: "#fbf8f3", surface: "#fffdf9", cream: "#f5efe5", accent: "#7a5d27", accentText: "#ffffff", ink: "#1f1d1a" },
  pearl: { background: "#ffffff", surface: "#ffffff", cream: "#f6f3ee", accent: "#8a6a2e", accentText: "#ffffff", ink: "#1c1c1c" },
  rose: { background: "#fcf7f5", surface: "#fffdfc", cream: "#f6ebe6", accent: "#8c4f45", accentText: "#ffffff", ink: "#2a1f1d" },
  sage: { background: "#f7f8f4", surface: "#fdfdfb", cream: "#eef0e8", accent: "#4d6248", accentText: "#ffffff", ink: "#1d221c" },
  noir: { background: "#f8f6f2", surface: "#ffffff", cream: "#efebe4", accent: "#2b2724", accentText: "#f3e6c9", ink: "#151311" },
};

export const FONT_LABELS = {
  heading: { cormorant: "Cormorant Garamond (classic)", playfair: "Playfair Display (editorial)", bodoni: "Bodoni Moda (fashion)" },
  body: { manrope: "Manrope (modern)", inter: "Inter (neutral)", dmsans: "DM Sans (soft)" },
} as const;

/** Relative luminance contrast ratio (WCAG). */
export function contrast(a: string, b: string): number {
  const lum = (h: string) => {
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** CSS custom properties applied to <html>. */
export function themeToCss(t: ThemeConfig): Record<string, string> {
  return {
    "--color-ivory": t.background,
    "--color-surface": t.surface,
    "--color-cream": t.cream,
    "--color-gold": t.accent,
    "--color-accent-text": t.accentText,
    "--color-charcoal": t.ink,
    "--font-serif": `var(--font-${t.headingFont}), Georgia, serif`,
    "--font-sans": `var(--font-${t.bodyFont}), system-ui, sans-serif`,
  };
}
