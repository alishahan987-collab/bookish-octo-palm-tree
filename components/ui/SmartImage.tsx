"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { idbObjectUrl } from "@/lib/media/idb";
import type { ImageRef } from "@/lib/data/types";
import { TreatmentArt } from "./Art";

/**
 * Renders any ImageRef:
 *  - "/images/..." and https URLs → optimised next/image (AVIF/WebP, responsive sizes)
 *  - "idb:<id>"                  → demo-mode upload from IndexedDB
 *  - "art:<variant>:<palette>"   → abstract illustration (demo gallery / fallbacks)
 *  - empty                       → abstract artwork using `palette`
 */
export function SmartImage({
  src,
  alt,
  palette = 0,
  className = "",
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority,
  fill = true,
  ...rest
}: { src?: ImageRef; alt: string; palette?: number; className?: string } & Partial<Omit<ImageProps, "src" | "alt">>) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const isIdb = !!src?.startsWith("idb:");

  useEffect(() => {
    if (!isIdb || !src) return;
    let alive = true;
    idbObjectUrl(src.slice(4)).then((u) => alive && setBlobUrl(u)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [isIdb, src]);

  if (!src || src.startsWith("art:")) {
    const [, variant, p] = src?.split(":") ?? [];
    return (
      <div className={`relative overflow-hidden ${className}`} role={alt ? "img" : undefined} aria-label={alt || undefined}>
        <TreatmentArt palette={p ? Number(p) : palette} variant={variant === "after" ? 1 : 0} className={`absolute inset-0 h-full w-full ${variant === "before" ? "grayscale-[60%] contrast-90" : ""}`} />
      </div>
    );
  }

  if (isIdb) {
    return (
      <div className={`relative overflow-hidden bg-cream ${className}`}>
        {blobUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={blobUrl} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-cream ${className}`}>
      <Image src={src} alt={alt} fill={fill} sizes={sizes} priority={priority} className="object-cover" {...rest} />
    </div>
  );
}
