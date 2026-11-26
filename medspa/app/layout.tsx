import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontVariables } from "./fonts";
import { getSite } from "@/lib/server/content";
import { themeCss } from "@/lib/theme";
import { siteUrl } from "@/lib/server/http";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSite();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: settings.business.name, template: `%s | ${settings.seo.titleSuffix}` },
    description: settings.seo.defaultDescription,
    robots: settings.seo.indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { type: "website", siteName: settings.business.name, locale: "en_US", images: settings.seo.ogImage ? [settings.seo.ogImage] : [] },
    formatDetection: { telephone: true },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const { design } = await getSite();
  return { themeColor: design.colors.background, width: "device-width", initialScale: 1 };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { design } = await getSite();
  return (
    <html lang="en" className={fontVariables}>
      <head>
        <style id="theme" dangerouslySetInnerHTML={{ __html: themeCss(design) }} />
      </head>
      <body className={design.buttons.style === "outline" ? "btn-style-outline" : ""}>{children}</body>
    </html>
  );
}
