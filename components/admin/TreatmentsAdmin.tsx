"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteTreatment, getConditions, getTreatments, saveTreatment, updatePrice } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import type { CategoryId, PriceModel, Treatment, TreatmentInput } from "@/lib/data/types";
import { PRICE_TYPE_LABELS, priceSummary, validatePrice } from "@/lib/pricing";
import { CATEGORY_LABEL } from "../site/Cards";
import { useSite } from "../site/SiteProvider";
import { Dialog } from "../ui/Dialog";
import { Icon } from "../ui/Icon";
import { SmartImage } from "../ui/SmartImage";
import { PriceEditor } from "./PriceEditor";
import { ImageUpload, LinesInput, MoveButtons, Switch, TextArea, TextInput, errorMessage, useToast } from "./ui";

const BLANK: TreatmentInput = {
  slug: "", name: "", category: "skin", tagline: "", shortDescription: "", description: "", howItWorks: [], benefits: [], suitableFor: [],
  downtime: "", sessions: "", sessionLength: "", sideEffects: [], faqs: [], price: { type: "fixed", amount: 5000 }, concerns: [],
  doctorIds: ["main"], featured: false, active: true, order: 999, palette: 0,
};

export function TreatmentsAdmin() {
  const toast = useToast();
  const { content } = useSite();
  const { data: treatments, ready } = useData(() => getTreatments({ includeInactive: true }), [], [], { fresh: true });
  const [priceTarget, setPriceTarget] = useState<{ t: Treatment; price: PriceModel } | null>(null);
  const [editing, setEditing] = useState<TreatmentInput | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Treatment | null>(null);
  const [filter, setFilter] = useState<CategoryId | "all">("all");
  const list = treatments.filter((t) => filter === "all" || t.category === filter);

  const quick = async (t: Treatment, patch: Partial<Treatment>, msg: string) => {
    try {
      await saveTreatment({ ...t, ...patch });
      toast(msg);
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };
  const move = async (i: number, dir: -1 | 1) => {
    const a = list[i], b = list[i + dir];
    if (!a || !b) return;
    await Promise.all([saveTreatment({ ...a, order: b.order }), saveTreatment({ ...b, order: a.order === b.order ? a.order + dir : a.order })]);
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl sm:text-5xl">Procedures & prices</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">Every change appears immediately on the website: procedure pages, pricing, homepage and booking.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing({ ...BLANK, order: treatments.length, palette: treatments.length % 8 })}><Icon name="plus" size={18} /> Add treatment</button>
      </div>

      <div role="group" aria-label="Filter" className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {(["all", "skin", "injectables", "laser", "wellness", "consultation"] as const).map((c) => (
          <button key={c} type="button" aria-pressed={filter === c} onClick={() => setFilter(c)} className={`flex-none rounded-full border px-4 py-1.5 text-sm font-medium ${filter === c ? "border-charcoal bg-charcoal text-ivory" : "border-sand hover:bg-cream"}`}>
            {c === "all" ? "All" : CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-3" data-testid="treatment-admin-list">
        {list.map((t, i) => (
          <li key={t.id} className={`card flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${t.active ? "" : "opacity-70"}`} data-slug={t.slug}>
            <div className="flex items-center gap-3">
              <MoveButtons label={t.name} onUp={i > 0 ? () => move(i, -1) : undefined} onDown={i < list.length - 1 ? () => move(i, 1) : undefined} />
              <SmartImage src={t.image} alt="" palette={t.palette} className="h-16 w-20 flex-none rounded-xl" sizes="80px" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-charcoal">{t.name}</p>
                <span className="chip bg-cream text-muted">{CATEGORY_LABEL[t.category]}</span>
                {!t.active && <span className="chip bg-[#ece8e2] text-ink">Hidden</span>}
                {t.price.type === "promo" && <span className="chip bg-charcoal text-ivory">Discount</span>}
              </div>
              <p className="mt-1 text-sm text-ink" data-testid="admin-price"><span className="text-muted">{PRICE_TYPE_LABELS[t.price.type]}: </span>{priceSummary(t.price, content.currency)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Switch label="Featured" checked={t.featured} onChange={(v) => quick(t, { featured: v }, `${t.name}: ${v ? "featured" : "not featured"}`)} />
              <Switch label="Visible" checked={t.active} onChange={(v) => quick(t, { active: v }, `${t.name}: ${v ? "visible" : "hidden"}`)} />
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setPriceTarget({ t, price: t.price })}><Icon name="tag" size={15} /> Price<span className="sr-only"> for {t.name}</span></button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(t)}><Icon name="edit" size={15} /> Edit<span className="sr-only"> {t.name}</span></button>
              <Link href={`/treatments/${t.slug}`} target="_blank" className="btn btn-ghost btn-sm" aria-label={`View ${t.name} on the website`}><Icon name="eye" size={15} /></Link>
              <button type="button" className="btn btn-ghost btn-sm !text-danger" onClick={() => setDeleteTarget(t)} aria-label={`Delete ${t.name}`}><Icon name="trash" size={15} /></button>
            </div>
          </li>
        ))}
      </ul>
      {ready && list.length === 0 && <p className="card p-8 text-center text-muted">No procedures here yet.</p>}

      <Dialog open={!!priceTarget} onClose={() => setPriceTarget(null)} title={priceTarget ? `Price: ${priceTarget.t.name}` : "Price"} wide>
        {priceTarget && (
          <>
            <PriceEditor value={priceTarget.price} currency={content.currency} onChange={(price) => setPriceTarget({ ...priceTarget, price })} />
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setPriceTarget(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" disabled={!!validatePrice(priceTarget.price)} data-testid="save-price"
                onClick={async () => {
                  try {
                    await updatePrice(priceTarget.t.id, priceTarget.price);
                    toast(`Price updated: ${priceTarget.t.name}`);
                    setPriceTarget(null);
                  } catch (e) {
                    toast(errorMessage(e), "error");
                  }
                }}>Save price</button>
            </div>
          </>
        )}
      </Dialog>

      {editing && <TreatmentEditor initial={editing} onClose={() => setEditing(null)} />}

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete procedure?">
        {deleteTarget && (
          <>
            <p className="text-muted"><strong className="text-charcoal">{deleteTarget.name}</strong> will be removed from the website and booking page. Existing appointments keep their record. Tip: switch off &ldquo;Visible&rdquo; to hide it temporarily instead.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Keep</button>
              <button type="button" className="btn btn-primary !bg-danger" onClick={async () => { await deleteTreatment(deleteTarget.id); toast(`${deleteTarget.name} deleted`); setDeleteTarget(null); }}>Delete</button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}

function TreatmentEditor({ initial, onClose }: { initial: TreatmentInput; onClose: () => void }) {
  const toast = useToast();
  const { content } = useSite();
  const { data: conditions } = useData(() => getConditions({ includeInactive: true }), [], [], { fresh: true });
  const [t, setT] = useState<TreatmentInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isNew = !initial.id;
  const set = <K extends keyof TreatmentInput>(k: K, v: TreatmentInput[K]) => setT((x) => ({ ...x, [k]: v }));

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const saved = await saveTreatment({ ...t, faqs: t.faqs.filter((f) => f.q.trim() && f.a.trim()) });
      toast(isNew ? `${saved.name} added` : `${saved.name} saved`);
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} title={isNew ? "Add treatment" : `Edit: ${initial.name}`} wide>
      <div className="space-y-8">
        <Group title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput id="e-name" label="Name *" value={t.name} onChange={(v) => set("name", v)} />
            <TextInput id="e-slug" label="Web address" value={t.slug} placeholder="auto" onChange={(v) => set("slug", v)} hint={`/treatments/${t.slug || "generated-from-name"}`} />
            <div>
              <label htmlFor="e-cat" className="label">Category</label>
              <select id="e-cat" className="field" value={t.category} onChange={(e) => set("category", e.target.value as CategoryId)}>
                {(Object.keys(CATEGORY_LABEL) as CategoryId[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
              </select>
            </div>
            <TextInput id="e-tag" label="Tagline" value={t.tagline} onChange={(v) => set("tagline", v)} />
          </div>
          <TextInput id="e-short" label="Short description *" value={t.shortDescription} onChange={(v) => set("shortDescription", v)} hint="Shown on cards and the pricing page." />
          <TextArea id="e-desc" label="Overview" value={t.description} onChange={(v) => set("description", v)} rows={5} />
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUpload label="Procedure image" value={t.image} onChange={(v) => set("image", v)} folder="procedures" testId="procedure-image" />
            <TextInput id="e-alt" label="Image description (for accessibility)" value={t.imageAlt ?? ""} onChange={(v) => set("imageAlt", v)} />
          </div>
        </Group>

        <Group title="Price & discount">
          <PriceEditor value={t.price} currency={content.currency} onChange={(p) => set("price", p)} />
        </Group>

        <Group title="Details" hint="Lists: one item per line.">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextInput id="e-len" label="Procedure duration" value={t.sessionLength} onChange={(v) => set("sessionLength", v)} />
            <TextInput id="e-sess" label="Number of sessions" value={t.sessions} onChange={(v) => set("sessions", v)} />
            <TextInput id="e-down" label="Expected recovery time" value={t.downtime} onChange={(v) => set("downtime", v)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <LinesInput id="e-how" label="How it works (steps)" value={t.howItWorks} onChange={(v) => set("howItWorks", v)} />
            <LinesInput id="e-ben" label="Benefits" value={t.benefits} onChange={(v) => set("benefits", v)} />
            <LinesInput id="e-suit" label="Suitable candidates" value={t.suitableFor} onChange={(v) => set("suitableFor", v)} />
            <LinesInput id="e-side" label="Possible side effects" value={t.sideEffects} onChange={(v) => set("sideEffects", v)} />
          </div>
        </Group>

        <Group title="FAQ">
          {t.faqs.map((f, i) => (
            <div key={i} className="grid gap-2 rounded-2xl border border-line p-3 sm:grid-cols-[1fr_1.4fr_auto]">
              <input aria-label={`Question ${i + 1}`} className="field" placeholder="Question" value={f.q} onChange={(e) => set("faqs", t.faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
              <textarea aria-label={`Answer ${i + 1}`} className="field" rows={2} placeholder="Answer" value={f.a} onChange={(e) => set("faqs", t.faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
              <button type="button" className="rounded-full p-2.5 text-muted hover:bg-cream hover:text-danger" aria-label={`Remove question ${i + 1}`} onClick={() => set("faqs", t.faqs.filter((_, j) => j !== i))}><Icon name="trash" size={18} /></button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => set("faqs", [...t.faqs, { q: "", a: "" }])}><Icon name="plus" size={16} /> Add question</button>
        </Group>

        <Group title="Linked conditions & visibility">
          <fieldset>
            <legend className="label">Conditions this procedure is relevant to</legend>
            <div className="flex flex-wrap gap-2">
              {conditions.map((c) => {
                const on = t.concerns.includes(c.slug);
                return (
                  <label key={c.id} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${on ? "border-charcoal bg-charcoal text-ivory" : "border-sand hover:bg-cream"}`}>
                    <input type="checkbox" className="sr-only" checked={on} onChange={() => set("concerns", on ? t.concerns.filter((x) => x !== c.slug) : [...t.concerns, c.slug])} />
                    {c.name}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-4">
            <Switch label="Featured on homepage" checked={t.featured} onChange={(v) => set("featured", v)} />
            <Switch label="Visible on website" checked={t.active} onChange={(v) => set("active", v)} />
          </div>
        </Group>
      </div>

      {error && <p role="alert" className="mt-6 rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}
      <div className="sticky bottom-0 -mx-5 mt-6 flex justify-end gap-3 border-t border-line bg-ivory px-5 py-4 sm:-mx-7 sm:px-7">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : isNew ? "Add treatment" : "Save changes"}</button>
      </div>
    </Dialog>
  );
}

export function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="border-b border-line pb-2">
        <h3 className="text-2xl">{title}</h3>
        {hint && <p className="hint !mt-0">{hint}</p>}
      </div>
      {children}
    </section>
  );
}
