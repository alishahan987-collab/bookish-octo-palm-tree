import { repo } from "@/lib/repo";
import { withAdmin } from "@/lib/server/admin";
import { ApiError, ok } from "@/lib/server/http";

const TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/avif": "avif" };
const MAX = 15 * 1024 * 1024;

/** Checks the file's real signature, not only the declared type. */
function sniff(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 && String.fromCharCode(...b.slice(8, 12)).startsWith("avi")) return "image/avif";
  return null;
}

export const GET = withAdmin(async () => ok({ files: await repo.listMedia() }));

export const POST = withAdmin(async (req) => {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob)) throw new ApiError(400, "No image received.");
  if (file.size > MAX) throw new ApiError(413, "Image is larger than 15 MB.");
  const data = new Uint8Array(await file.arrayBuffer());
  const type = sniff(data);
  if (!type || !TYPES[type]) throw new ApiError(400, "Please upload a JPG, PNG, WebP or AVIF image.");
  return ok({ file: await repo.uploadMedia(data, type, TYPES[type]) }, 201);
});

export const DELETE = withAdmin(async (req) => {
  const path = req.nextUrl.searchParams.get("path") ?? "";
  if (!path) throw new ApiError(400, "Missing image path.");
  await repo.deleteMedia(path);
  return ok({ ok: true });
});
