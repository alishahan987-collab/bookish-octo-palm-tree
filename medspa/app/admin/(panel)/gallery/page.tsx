"use client";

import { useState } from "react";
import { useAdmin, useData } from "@/components/admin/store";
import { Area, Badge, Grid, ImagePicker, Modal, Notice, PageTitle, Select, SortableList, Text, Toggle, btn, useToast } from "@/components/admin/ui";
import { newId } from "@/lib/id";
import type { GalleryItem } from "@/lib/types";

export default function GalleryPage() {
  const { gallery, settings, treatments } = useData();
  const { saveItem, deleteItem, reorder } = useAdmin();
  const toast = useToast();
  const [edit, setEdit] = useState<GalleryItem | null>(null);
  const [busy, setBusy] = useState(false);
  const blank = (): GalleryItem => ({ id: newId("g"), title: "", category: settings.galleryCategories[0] ?? "", treatmentId: "", beforeAlt: "", afterAlt: "", caption: "", display: "slider", consentConfirmed: false, consentNote: "", published: false, order: 0, updatedAt: "" });

  async function save() {
    if (!edit) return;
    setBusy(true);
    try {
      await saveItem("gallery", edit);
      toast("Saved.");
      setEdit(null);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageTitle title="Before & after" description="Upload genuine client results by treatment category. A photo set can only be published after you confirm written client consent." actions={<button type="button" className={btn.primary} onClick={() => setEdit(blank())}>+ Add before & after</button>} />
      <div className="mb-5"><Notice>Use only real photos of your own clients, taken with their written consent, and never stock images. Don&apos;t retouch results; keep lighting and angles the same in both photos. Store the signed consent form outside the website.</Notice></div>
      {gallery.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">No photos yet. The gallery page shows a short note and your Instagram link until you publish some.</p>
      ) : (
        <SortableList
          items={gallery}
          onReorder={(n) => reorder("gallery", n).catch((e) => toast(e.message, "error"))}
          render={(g, handle) => (
            <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-2 pr-3 shadow-sm">
              {handle}
              <div className="flex gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {[g.before, g.after].map((src, i) => src ? <img key={i} src={src} alt="" className="h-14 w-14 rounded-md object-cover" /> : <span key={i} className="h-14 w-14 rounded-md bg-stone-100" />)}
              </div>
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setEdit(g)}>
                <span className="flex flex-wrap items-center gap-2 font-medium">{g.title} {g.published ? <Badge tone="green">Published</Badge> : <Badge tone="amber">Hidden</Badge>} {!g.consentConfirmed && <Badge tone="red">No consent recorded</Badge>}</span>
                <span className="block text-xs text-stone-500">{g.category}</span>
              </button>
              <button type="button" className={btn.ghost} onClick={() => setEdit(g)}>Edit</button>
              <button type="button" className={`${btn.ghost} text-red-700`} onClick={async () => { if (confirm("Delete this before & after?")) { try { await deleteItem("gallery", g.id); toast("Deleted."); } catch (e) { toast((e as Error).message, "error"); } } }}>Delete</button>
            </div>
          )}
        />
      )}
      {edit && (
        <Modal open onClose={() => setEdit(null)} title={edit.updatedAt ? "Edit before & after" : "New before & after"} wide footer={<><button type="button" className={btn.secondary} onClick={() => setEdit(null)}>Cancel</button><button type="button" className={btn.primary} onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button></>}>
          <div className="space-y-5">
            <Grid>
              <Text label="Title" value={edit.title} onChange={(v) => setEdit({ ...edit, title: v })} placeholder="e.g. Underarm laser hair removal, 6 sessions" />
              <Select label="Category" value={edit.category} onChange={(v) => setEdit({ ...edit, category: v })} options={settings.galleryCategories.map((c) => ({ value: c, label: c }))} />
              <Select label="Treatment (optional)" value={edit.treatmentId} onChange={(v) => setEdit({ ...edit, treatmentId: v })} options={[{ value: "", label: "—" }, ...treatments.map((t) => ({ value: t.id, label: t.name }))]} />
              <Select label="Display" value={edit.display} onChange={(v) => setEdit({ ...edit, display: v })} options={[{ value: "slider", label: "Comparison slider" }, { value: "side", label: "Side by side" }]} />
            </Grid>
            <Grid>
              <ImagePicker label="Before photo" value={edit.before} onChange={(v) => setEdit({ ...edit, before: v })} alt={edit.beforeAlt} onAltChange={(v) => setEdit({ ...edit, beforeAlt: v })} />
              <ImagePicker label="After photo" value={edit.after} onChange={(v) => setEdit({ ...edit, after: v })} alt={edit.afterAlt} onAltChange={(v) => setEdit({ ...edit, afterAlt: v })} />
            </Grid>
            <Area label="Caption (optional)" value={edit.caption} onChange={(v) => setEdit({ ...edit, caption: v })} rows={2} placeholder="e.g. Results after 6 sessions. Individual results vary." />
            <div className="rounded-lg border border-stone-200 p-4">
              <Toggle label="I have the client's written consent to publish these photos" checked={edit.consentConfirmed} onChange={(v) => setEdit({ ...edit, consentConfirmed: v, published: v ? edit.published : false })} />
              <div className="mt-3"><Text label="Consent reference (internal)" value={edit.consentNote} onChange={(v) => setEdit({ ...edit, consentNote: v })} placeholder="e.g. Signed form on file, 12 Oct 2026" /></div>
            </div>
            <Toggle label="Published on the website" checked={edit.published} disabled={!edit.consentConfirmed || !edit.before || !edit.after} onChange={(v) => setEdit({ ...edit, published: v })} hint={!edit.consentConfirmed ? "Confirm consent first." : !edit.before || !edit.after ? "Add both photos first." : undefined} />
          </div>
        </Modal>
      )}
    </>
  );
}
