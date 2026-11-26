import type { Design } from "./types";

/** Turns the design settings into CSS custom properties, with automatic contrast fixes for small text. */

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) return [0, 0, 0];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
const toHex = (rgb: number[]) => "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");

function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

export function mix(a: string, b: string, t: number) {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
}

/** Darkens (or lightens) `color` toward `toward` until it reaches `ratio` against `bg`. */
export function readable(color: string, bg: string, ratio = 4.5, toward = "#000000") {
  let c = color;
  for (let i = 0; i < 20 && contrast(c, bg) < ratio; i++) c = mix(c, toward, 0.08);
  return c;
}

export const isHexColor = (v: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim());

const RADIUS = { square: "0px", soft: "4px", pill: "999px" } as const;
const CARD = { square: "0px", soft: "6px", round: "18px" } as const;
const SPACE = { compact: "3.5rem", normal: "5.5rem", airy: "7.5rem" } as const;
const SPACE_MOBILE = { compact: "2.75rem", normal: "3.75rem", airy: "4.75rem" } as const;
export const SECTION_SPACE = { SPACE, SPACE_MOBILE };

const HEADINGS = ["cormorant", "playfair", "bodoni", "marcellus"];
const BODIES = ["dmsans", "inter", "jost", "manrope"];
const FALLBACK = { background: "#F8F6F1", surface: "#FFFFFF", alt: "#E8DDCE", accent: "#B49A70", muted: "#A99B8C", ink: "#252525" };

/** Never trust stored values inside a <style> tag: only valid hex colours and known fonts pass. */
export function sanitizeDesign(d: Design): Design {
  const colors = Object.fromEntries(
    Object.entries(FALLBACK).map(([k, v]) => [k, isHexColor(String((d.colors as Record<string, string>)[k] ?? "")) ? (d.colors as Record<string, string>)[k] : v]),
  ) as Design["colors"];
  return {
    ...d,
    colors,
    fonts: {
      ...d.fonts,
      heading: HEADINGS.includes(d.fonts.heading) ? d.fonts.heading : "cormorant",
      body: BODIES.includes(d.fonts.body) ? d.fonts.body : "dmsans",
      baseSize: [15, 16, 17, 18].includes(Number(d.fonts.baseSize)) ? d.fonts.baseSize : 16,
    },
    buttons: { ...d.buttons, shape: d.buttons.shape in RADIUS ? d.buttons.shape : "soft" },
    corners: d.corners in CARD ? d.corners : "soft",
    spacing: d.spacing in SPACE ? d.spacing : "normal",
  };
}

export function themeCss(input: Design): string {
  return `:root{${Object.entries(themeVars(input)).map(([k, v]) => `${k}:${v}`).join(";")}}`;
}

export function themeVars(input: Design): Record<string, string> {
  const d = sanitizeDesign(input);
  const c = d.colors;
  const accentInk = readable(c.accent, c.background, 4.5);
  const mutedInk = readable(c.muted, c.background, 4.6);
  const onDarkMuted = readable(c.alt, c.ink, 4.5, "#ffffff");
  const vars: Record<string, string> = {
    "--c-bg": c.background,
    "--c-surface": c.surface,
    "--c-alt": c.alt,
    "--c-accent": c.accent,
    "--c-accent-ink": accentInk,
    "--c-muted": c.muted,
    "--c-muted-ink": mutedInk,
    "--c-ink": c.ink,
    "--c-line": mix(c.alt, c.ink, 0.12),
    "--c-on-dark-muted": onDarkMuted,
    "--font-heading": `var(--font-${d.fonts.heading})`,
    "--font-body": `var(--font-${d.fonts.body})`,
    "--base-size": `${d.fonts.baseSize}px`,
    "--heading-case": d.fonts.headingCase === "uppercase" ? "uppercase" : "none",
    "--heading-tracking": d.fonts.headingCase === "uppercase" ? "0.06em" : "-0.01em",
    "--btn-radius": RADIUS[d.buttons.shape],
    "--btn-case": d.buttons.uppercase ? "uppercase" : "none",
    "--btn-tracking": d.buttons.uppercase ? "0.14em" : "0.01em",
    "--btn-size": d.buttons.uppercase ? "0.75rem" : "0.95rem",
    "--card-radius": CARD[d.corners],
    "--section-space": SPACE[d.spacing],
    "--section-space-mobile": SPACE_MOBILE[d.spacing],
  };
  return vars;
}
