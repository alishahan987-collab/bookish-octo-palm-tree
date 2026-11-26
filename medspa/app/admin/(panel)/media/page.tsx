"use client";

import { useCallback, useEffect, useState } from "react";
import { useData } from "@/components/admin/store";
import { Badge, PageTitle, btn, useToast } from "@/components/admin/ui";
import { api, uploadImage } from "@/lib/client/api";
import { prepareImage } from "@/lib/client/compress";
import type { MediaFile } from "@/lib/types";

export default function MediaPage() {
  const data = useData();
  const toast = useToast();
  const [files, setFiles] = useState<MediaFile[] | null>(null);
  const [busy, setBusy] = useState("");
  const load = useCallback(() => api<{ files: MediaFile[] }>("/api/admin/media").then((r) => setFiles(r.files)).catch((e) => toast(e.message, "error")), [toast]);
  useEffect(() => { load(); }, [load]);

  const haystack = JSON.stringify([data.settings, data.design, data.pages, data.treatments, data.testimonials, data.gallery]);
  const inUse = (url: string) => haystack.includes(url);

  async function upload(list: FileList | null) {
    if (!list?.length) return;
    try {
      let i = 0;
      for (const f of Array.from(list)) {
        setBusy(`Uploading ${++i} of ${list.length}…`);
        await uploadImage(await prepareImage(f));
      }
      toast("Uploaded.");
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy("");
    }
  }

  async function remove(f: MediaFile) {
    const used = inUse(f.url);
    if (!confirm(used ? "This image is used on the website. Deleting it will leave an empty space there. Delete anyway?" : "Delete this image permanently?")) return;
    try {
      await api(`/api/admin/media?path=${encodeURIComponent(f.path)}`, { method: "DELETE" });
      setFiles((x) => x?.filter((y) => y.path !== f.path) ?? x);
      toast("Image deleted.");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  return (
    <>
      <PageTitle title="Image library" description="All uploaded images. Images are automatically resized and compressed, and location data is removed. Choose images for pages and treatments from their editors." actions={
        <label className={`${btn.primary} cursor-pointer`}>
          {busy || "Upload images"}
          <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={Boolean(busy)} onChange={(e) => upload(e.target.files)} />
        </label>
      } />
      {!files ? <p className="text-stone-500">Loading…</p> : files.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">No uploads yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {files.map((f) => (
            <li key={f.path} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
              <div className="space-y-2 p-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-stone-500">{Math.round(f.size / 1024)} KB</span>
                  {inUse(f.url) ? <Badge tone="green">In use</Badge> : <Badge>Unused</Badge>}
                </div>
                <div className="flex gap-1">
                  <button type="button" className={`${btn.ghost} !px-2 text-xs`} onClick={() => { navigator.clipboard?.writeText(f.url); toast("Link copied."); }}>Copy link</button>
                  <button type="button" className={`${btn.ghost} !px-2 text-xs text-red-700`} onClick={() => remove(f)}>Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
