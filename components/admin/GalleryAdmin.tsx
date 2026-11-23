"use client";

import { useState } from "react";
import { deleteGalleryItem, getGallery, getTreatments, saveGalleryItem } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import type { CategoryId, GalleryInput, GalleryItem } from "@/lib/data/types";
import { CATEGORY_LABEL } from "../site/Cards";
import { Dialog } from "../ui/Dialog";
import { Icon } from "../ui/Icon";
import { SmartImage } from "../ui/SmartImage";
import { ImageUpload, MoveButtons, Switch, TextInput, errorMessage, useToast } from "./ui";

const BLANK: GalleryInput = { title: "", category: "skin", before: "", after: "", caption: "", consentConfirmed: false, consentNote: "", published: false, order: 999 };

export function GalleryAdmin() {
  const toast = useToast();
  const { data: items, ready } = useData(() => getGallery({ includeUnpublished: true }), [], [], { fresh: true });
  const [editing, setEditing] = useState<GalleryInput | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const move = async (i: number, dir: -1 | 1) => {
    const a = items[i], b = items[i + dir];
    if (a && b) await Promise.all([saveGalleryItem({ ...a, order: b.order }), saveGalleryItem({ ...b, order: a.order === b.order ? a.order + dir : a.order })]);
  };
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl sm:text-5xl">Before & after</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">Upload consented patient photographs. A photo can only be published after you confirm the patient&apos;s written consent.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing({ ...BLANK, order: items.length })}><Icon name="plus" size={18} /> Add result</button>
      </div>
      <ul className="mt-6 grid gap-4 md:grid-cols-2" data-testid="gallery-admin-list">
        {items.map((g, i) => (
          <li key={g.id} className="card overflow-hidden" data-gallery-admin={g.title}>
            <div className="grid grid-cols-2 gap-px bg-line">
              <SmartImage src={g.before} alt={`Before: ${g.title}`} className="aspect-[4/3]" sizes="200px" />
              <SmartImage src={g.after} alt={`After: ${g.title}`} className="aspect-[4/3]" sizes="200px" />
            </div>
            <div className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-charcoal">{g.title}</p>
                <span className="chip bg-cream text-muted">{CATEGORY_LABEL[g.category]}</span>
                {g.illustrative ? <span className="chip bg-cream text-muted">Illustration</span> : g.consentConfirmed ? <span className="chip bg-[#e3efe6] text-success">Consent ✓</span> : <span className="chip bg-[#fbefd5] text-[#7a5410]">No consent</span>}
                <span className={`chip ${g.published ? "bg-charcoal text-ivory" : "bg-[#ece8e2] text-ink"}`}>{g.published ? "Published" : "Draft"}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <MoveButtons label={g.title} onUp={i > 0 ? () => move(i, -1) : undefined} onDown={i < items.length - 1 ? () => move(i, 1) : undefined} />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(g)}><Icon name="edit" size={15} /> Edit<span className="sr-only"> {g.title}</span></button>
                <button type="button" className="btn btn-ghost btn-sm !text-danger" onClick={() => setDeleteTarget(g)} aria-label={`Delete ${g.title}`}><Icon name="trash" size={15} /></button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {ready && items.length === 0 && <p className="card p-8 text-center text-muted">No results yet. Add your first before-and-after pair.</p>}
      {editing && <GalleryEditor initial={editing} onClose={() => setEditing(null)} />}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete this result?">
        <p className="text-muted">&ldquo;{deleteTarget?.title}&rdquo; will be removed from the gallery.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Keep</button>
          <button type="button" className="btn btn-primary !bg-danger" onClick={async () => { if (deleteTarget) await deleteGalleryItem(deleteTarget.id); toast("Result deleted"); setDeleteTarget(null); }}>Delete</button>
        </div>
      </Dialog>
    </div>
  );
}

function GalleryEditor({ initial, onClose }: { initial: GalleryInput; onClose: () => void }) {
  const toast = useToast();
  const { data: treatments } = useData(() => getTreatments({ includeInactive: true }), [], [], { fresh: true });
  const [g, setG] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof GalleryInput>(k: K, v: GalleryInput[K]) => setG((x) => ({ ...x, [k]: v }));
  const canPublish = Boolean(g.consentConfirmed || g.illustrative);
  return (
    <Dialog open onClose={onClose} title={initial.id ? "Edit result" : "Add before & after"} wide>
      <div className="space-y-5">
        <TextInput id="g-title" label="Title" value={g.title} onChange={(v) => set("title", v)} placeholder="e.g. Acne scars: 3 sessions of microneedling" />
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUpload label="Before photo" value={g.before || undefined} onChange={(v) => set("before", v ?? "")} folder="gallery" testId="gallery-before" />
          <ImageUpload label="After photo" value={g.after || undefined} onChange={(v) => set("after", v ?? "")} folder="gallery" testId="gallery-after" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="g-cat" className="label">Category</label>
            <select id="g-cat" className="field" value={g.category} onChange={(e) => set("category", e.target.value as CategoryId)}>
              {(["skin", "aesthetic", "hair"] as CategoryId[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="g-treatment" className="label">Treatment</label>
            <select id="g-treatment" className="field" value={g.treatmentId ?? ""} onChange={(e) => set("treatmentId", e.target.value || undefined)}>
              <option value="">—</option>
              {treatments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <TextInput id="g-caption" label="Caption (optional)" value={g.caption ?? ""} onChange={(v) => set("caption", v)} placeholder="e.g. Photos taken 3 months apart. Individual results vary." />
        {!g.illustrative && (
          <div className="rounded-2xl border border-champagne bg-cream/60 p-4">
            <label className="flex cursor-pointer gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 h-5 w-5 flex-none accent-[#7a5d27]" checked={g.consentConfirmed} onChange={(e) => set("consentConfirmed", e.target.checked)} data-testid="gallery-consent" />
              <span className="text-ink"><strong>I confirm the patient has given written consent</strong> for these photographs to be published on the website.</span>
            </label>
            <TextInput id="g-consent-note" label="Consent reference (internal)" value={g.consentNote ?? ""} onChange={(v) => set("consentNote", v)} placeholder="e.g. Consent form #123, signed 12 Nov 2026" className="mt-3" />
          </div>
        )}
        <Switch label={canPublish ? "Published on website" : "Published (requires consent)"} checked={g.published && canPublish} onChange={(v) => canPublish && set("published", v)} testId="gallery-publish" />
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={async () => {
          try { await saveGalleryItem({ ...g, title: g.title.trim() || "Result", published: g.published && canPublish }); toast("Result saved"); onClose(); } catch (e) { setError(errorMessage(e)); }
        }}>Save</button>
      </div>
    </Dialog>
  );
}
