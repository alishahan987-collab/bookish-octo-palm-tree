import { useId } from "react";

/**
 * Abstract, photo-free artwork. Each treatment gets a palette so the catalogue
 * feels curated without stock photos of people.
 */
export const PALETTES: [string, string, string][] = [
  ["#f6ead6", "#dcbf90", "#b48a5a"], // champagne
  ["#eef0ea", "#cfdad2", "#9fb5aa"], // pearl sage
  ["#3a342d", "#8a6a30", "#e0c48d"], // charcoal gold
  ["#f7e8e0", "#e6c2b2", "#c59483"], // blush
  ["#f3eadb", "#dcc6a0", "#b4945f"], // sand
  ["#f1e5d6", "#cdb093", "#8d6d53"], // mocha
  ["#2b2723", "#6e5424", "#d2b273"], // bronze night
  ["#fcf8ef", "#ecdcb9", "#c9aa6c"], // ivory gold
];

export function TreatmentArt({ palette, className = "", variant = 0 }: { palette: number; className?: string; variant?: number }) {
  const id = useId().replace(/:/g, "");
  const [a, b, c] = PALETTES[((palette % PALETTES.length) + PALETTES.length) % PALETTES.length];
  const dark = palette % PALETTES.length === 2 || palette % PALETTES.length === 6;
  const v = (palette + variant) % 3;
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
        <radialGradient id={`orb${id}`} cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor={dark ? b : "#fffaf0"} stopOpacity="0.95" />
          <stop offset="0.55" stopColor={b} stopOpacity="0.6" />
          <stop offset="1" stopColor={c} stopOpacity="0.9" />
        </radialGradient>
        <radialGradient id={`glow${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={dark ? "#e0c48d" : "#ffffff"} stopOpacity="0.7" />
          <stop offset="1" stopColor={dark ? "#e0c48d" : "#ffffff"} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#bg${id})`} />
      <circle cx={v === 0 ? 290 : v === 1 ? 120 : 210} cy={v === 2 ? 190 : 140} r="190" fill={`url(#glow${id})`} />
      <circle cx={v === 0 ? 250 : v === 1 ? 160 : 200} cy={v === 2 ? 160 : 150} r={v === 1 ? 86 : 96} fill={`url(#orb${id})`} />
      <g fill="none" stroke={dark ? "#e0c48d" : "#8a6a30"} strokeOpacity={dark ? 0.55 : 0.35} strokeWidth="1">
        <circle cx={v === 0 ? 250 : v === 1 ? 160 : 200} cy={v === 2 ? 160 : 150} r="128" />
        <path d={v === 1 ? "M-20 250 C 120 150, 260 320, 420 170" : "M-20 70 C 120 170, 280 -20, 420 110"} />
        <path d={v === 1 ? "M-20 268 C 130 170, 260 330, 420 190" : "M-20 88 C 120 190, 280 0, 420 130"} strokeOpacity={dark ? 0.3 : 0.18} />
      </g>
    </svg>
  );
}
