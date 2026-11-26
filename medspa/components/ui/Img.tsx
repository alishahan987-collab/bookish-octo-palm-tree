import Image, { type ImageProps } from "next/image";

/**
 * Image wrapper: optimised (responsive sizes, AVIF/WebP, lazy) for local
 * images and the Supabase media bucket; any other host is shown as-is.
 */
const MEDIA_HOST = process.env.NEXT_PUBLIC_MEDIA_HOST || "";

export function canOptimize(src: string) {
  if (src.startsWith("/")) return true;
  try {
    return Boolean(MEDIA_HOST) && new URL(src).host === MEDIA_HOST;
  } catch {
    return false;
  }
}

export function Img({ src, alt, className, ...rest }: Omit<ImageProps, "src"> & { src?: string }) {
  if (!src) return <div aria-hidden="true" className={`bg-alt ${className ?? ""}`} />;
  return <Image src={src} alt={alt} className={className} unoptimized={!canOptimize(src)} {...rest} />;
}
