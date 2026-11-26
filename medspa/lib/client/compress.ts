/**
 * Prepares an image in the browser before upload: checks type and size, fixes
 * phone-camera orientation, resizes to at most 2400px and re-encodes as WebP
 * (or JPEG). This keeps pages fast and strips location (EXIF) metadata.
 */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export async function prepareImage(file: File, maxSize = 2400, quality = 0.86): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file (JPG, PNG or WebP).");
  if (file.type === "image/svg+xml") throw new Error("SVG images are not supported for security reasons.");
  if (file.size > MAX_UPLOAD_BYTES * 2) throw new Error("This image is too large. Please choose one under 30 MB.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This image format could not be read. Please use JPG, PNG or WebP (iPhone HEIC photos: export as JPG first).");
  }
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process this image.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const toBlob = (type: string) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality));
  const out = (await toBlob("image/webp")) ?? (await toBlob("image/jpeg"));
  if (!out) throw new Error("Could not compress this image.");
  if (out.size > MAX_UPLOAD_BYTES) throw new Error("Image is still larger than 15 MB after compression.");
  return out;
}
