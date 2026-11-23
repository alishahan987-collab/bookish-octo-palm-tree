import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Cormorant_Garamond, DM_Sans, Inter, Manrope, Playfair_Display } from "next/font/google";
import type { CSSProperties } from "react";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { HideOnAdmin } from "@/components/layout/HideOnAdmin";
import { PreviewBanner } from "@/components/layout/PreviewBanner";
import { SiteProvider } from "@/components/site/SiteProvider";
import { getSite } from "@/lib/server/data";
import { themeToCss } from "@/lib/theme";
import "./globals.css";

// Only the fonts selected in Admin → Appearance are downloaded by the browser.
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: "500", style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap", preload: false });
const bodoni = Bodoni_Moda({ subsets: ["latin"], variable: "--font-bodoni", display: "swap", preload: false });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap", preload: false });
const dmsans = DM_Sans({ subsets: ["latin"], variable: "--font-dmsans", display: "swap", preload: false });

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const { content } = await getSite();
  const noindex = content.previewBanner.enabled;
  return {
    metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
    title: { default: content.seo.title, template: `%s | ${content.brand.clinicName}` },
    description: content.seo.description,
    openGraph: { type: "website", siteName: content.brand.clinicName, title: content.seo.title, description: content.seo.description, images: ["/images/s-clinic.jpg"] },
    robots: noindex ? { index: false, follow: false, nocache: true } : { index: true, follow: true },
  };
}

export const viewport: Viewport = { themeColor: "#fbf8f3", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { content, settings } = await getSite();
  const fonts = [cormorant, manrope, playfair, bodoni, inter, dmsans].map((f) => f.variable).join(" ");
  return (
    <html lang="en" className={fonts} style={themeToCss(content.theme) as CSSProperties}>
      <body className="min-h-dvh">
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-charcoal focus:px-4 focus:py-2 focus:text-ivory">
          Skip to content
        </a>
        <SiteProvider content={content} settings={settings}>
          <PreviewBanner />
          <HideOnAdmin>
            <Header />
          </HideOnAdmin>
          <main id="main">{children}</main>
          <HideOnAdmin>
            <Footer />
          </HideOnAdmin>
          <FloatingActions />
        </SiteProvider>
      </body>
    </html>
  );
}
