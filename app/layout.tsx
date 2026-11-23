import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { HideOnAdmin } from "@/components/layout/HideOnAdmin";
import { PreviewBanner } from "@/components/layout/PreviewBanner";
import { MotionProvider } from "@/components/ui/Motion";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Aesthetica by Dr. Sajjad | Skin & Laser Clinic, Abbottabad (Design preview)",
    template: "%s | Aesthetica by Dr. Sajjad (Design preview)",
  },
  description:
    "Design preview of a website and booking system for Aesthetica by Dr. Sajjad, a skin and laser clinic in Abbottabad. Not the official website.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = {
  themeColor: "#fbf8f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-charcoal focus:px-4 focus:py-2 focus:text-ivory">
          Skip to content
        </a>
        <MotionProvider>
          <PreviewBanner />
          <HideOnAdmin>
            <Header />
          </HideOnAdmin>
          <main id="main">{children}</main>
          <HideOnAdmin>
            <Footer />
          </HideOnAdmin>
          <FloatingActions />
        </MotionProvider>
      </body>
    </html>
  );
}
