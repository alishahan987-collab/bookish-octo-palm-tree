"use client";

import { useState } from "react";
import { useAdmin, useData } from "@/components/admin/store";
import { Area, Badge, Grid, Modal, Notice, Num, PageTitle, Select, SortableList, Text, Toggle, btn, useToast } from "@/components/admin/ui";
import { Stars } from "@/components/site/Info";
import { newId } from "@/lib/id";
import type { Testimonial } from "@/lib/types";

const blank = (): Testimonial => ({ id: newId("r"), name: "", text: "", rating: 5, source: "google", sourceUrl: "", date: "", treatment: "", permissionConfirmed: false, featured: false, published: false, order: 0, updatedAt: "" });

export default function TestimonialsPage() {
  const { testimonials, treatments } = useData();
  const { saveItem, deleteItem, reorder } = useAdmin();
  const toast = useToast();
  const [edit, setEdit] = useState<Testimonial | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!edit) return;
    setBusy(true);
    try {
      await saveItem("testimonials", edit);
      toast("Testimonial saved.");
      setEdit(null);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageTitle title="Testimonials" description="Add genuine client reviews (for example from Google, with the client's permission). Drag to reorder; featured ones show first on the homepage." actions={<button type="button" className={btn.primary} onClick={() => setEdit(blank())}>+ Add testimonial</button>} />
      <div className="mb-5"><Notice>Never write or edit reviews on a client&apos;s behalf. Copy the client&apos;s words exactly, show only the name they agreed to (e.g. first name and initial), and keep proof of permission. The FTC prohibits fake or misleading reviews.</Notice></div>
      {testimonials.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">No testimonials yet. Until you add some, the website shows your Google rating and a link to your Google reviews.</p>
      ) : (
        <SortableList
          items={testimonials}
          onReorder={(n) => reorder("testimonials", n).catch((e) => toast(e.message, "error"))}
          render={(r, handle) => (
            <div className="flex items-start gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
              {handle}
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setEdit(r)}>
                <span className="flex flex-wrap items-center gap-2 font-medium">{r.name || "(no name)"} {r.rating > 0 && <Stars rating={r.rating} size={13} />} {!r.published && <Badge tone="amber">Hidden</Badge>} {r.featured && <Badge tone="blue">Featured</Badge>} {!r.permissionConfirmed && <Badge tone="red">Permission not confirmed</Badge>}</span>
                <span className="mt-1 line-clamp-2 block text-sm text-stone-600">{r.text}</span>
              </button>
              <div className="flex flex-col gap-1 sm:flex-row">
                <button type="button" className={btn.ghost} onClick={() => setEdit(r)}>Edit</button>
                <button type="button" className={`${btn.ghost} text-red-700`} onClick={async () => { if (confirm("Delete this testimonial?")) { try { await deleteItem("testimonials", r.id); toast("Deleted."); } catch (e) { toast((e as Error).message, "error"); } } }}>Delete</button>
              </div>
            </div>
          )}
        />
      )}
      {edit && (
        <Modal open onClose={() => setEdit(null)} title={edit.updatedAt ? "Edit testimonial" : "New testimonial"} wide footer={<><button type="button" className={btn.secondary} onClick={() => setEdit(null)}>Cancel</button><button type="button" className={btn.primary} onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button></>}>
          <div className="space-y-5">
            <Area label="Review text (exactly as written by the client)" value={edit.text} onChange={(v) => setEdit({ ...edit, text: v })} rows={5} />
            <Grid>
              <Text label="Name to display" value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} placeholder="e.g. Maria G." />
              <Num label="Star rating (0 = don't show)" value={edit.rating} onChange={(v) => setEdit({ ...edit, rating: Math.max(0, Math.min(5, v)) })} min={0} max={5} />
              <Select label="Source" value={edit.source} onChange={(v) => setEdit({ ...edit, source: v })} options={["google", "instagram", "facebook", "booksy", "in-person", "other"].map((s) => ({ value: s as Testimonial["source"], label: s[0].toUpperCase() + s.slice(1) }))} />
              <Text label="Link to the original review (optional)" value={edit.sourceUrl} onChange={(v) => setEdit({ ...edit, sourceUrl: v })} />
              <Text label="Date (optional)" value={edit.date} onChange={(v) => setEdit({ ...edit, date: v })} placeholder="e.g. October 2026" />
              <Select label="Treatment (optional)" value={edit.treatment} onChange={(v) => setEdit({ ...edit, treatment: v })} options={[{ value: "", label: "—" }, ...treatments.map((t) => ({ value: t.name, label: t.name }))]} />
            </Grid>
            <Toggle label="This is a genuine review and the client agreed to it being shown (or it is their public review)" checked={edit.permissionConfirmed} onChange={(v) => setEdit({ ...edit, permissionConfirmed: v, published: v ? edit.published : false })} />
            <Toggle label="Published on the website" checked={edit.published} disabled={!edit.permissionConfirmed} onChange={(v) => setEdit({ ...edit, published: v })} hint={!edit.permissionConfirmed ? "Confirm permission first." : undefined} />
            <Toggle label="Featured (shown first)" checked={edit.featured} onChange={(v) => setEdit({ ...edit, featured: v })} />
          </div>
        </Modal>
      )}
    </>
  );
}
