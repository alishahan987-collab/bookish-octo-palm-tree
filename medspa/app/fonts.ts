import { Bodoni_Moda, Cormorant_Garamond, DM_Sans, Inter, Jost, Manrope, Marcellus, Playfair_Display } from "next/font/google";

/** Fonts offered in Admin → Design. Only the fonts in use are downloaded by visitors. */
export const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });
export const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-playfair", display: "swap", preload: false });
export const bodoni = Bodoni_Moda({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-bodoni", display: "swap", preload: false });
export const marcellus = Marcellus({ subsets: ["latin"], weight: ["400"], variable: "--font-marcellus", display: "swap", preload: false });
export const dmsans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-dmsans", display: "swap" });
export const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter", display: "swap", preload: false });
export const jost = Jost({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-jost", display: "swap", preload: false });
export const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-manrope", display: "swap", preload: false });

export const fontVariables = [cormorant, playfair, bodoni, marcellus, dmsans, inter, jost, manrope].map((f) => f.variable).join(" ");
