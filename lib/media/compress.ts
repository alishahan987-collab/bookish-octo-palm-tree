/**
 * Client-side image preparation before upload: validates type/size, fixes
 * orientation, resizes to a sensible maximum and re-encodes as WebP/JPEG.
 * Keeps storage small and pages fast, and strips location metadata (EXIF).
 */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif"];
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export async function prepareImage(file: File, maxSize = 2000, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file (JPG, PNG or WebP).");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Image is larger than 15 MB. Please choose a smaller file.");
  if (file.type === "image/svg+xml") throw new Error("SVG images are not supported for security reasons.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This image format could not be read. Please use JPG, PNG or WebP.");
  }
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process this image.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const toBlob = (type: string) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality));
  const out = (await toBlob("image/webp")) ?? (await toBlob("image/jpeg"));
  if (!out) throw new Error("Could not compress this image.");
  return out;
}
