"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteTreatment, getDoctors, getTreatments, saveTreatment, updatePrice } from "@/lib/data";
import { ALL_CONCERNS, CATEGORIES, categoryLabel } from "@/lib/data/catalog";
import { useData } from "@/lib/data/hooks";
import type { PriceModel, Treatment, TreatmentInput } from "@/lib/data/types";
import { PRICE_TYPE_LABELS, priceSummary, validatePrice } from "@/lib/pricing";
import { PALETTES, TreatmentArt } from "../ui/Art";
import { Dialog } from "../ui/Dialog";
import { Icon } from "../ui/Icon";
import { PriceEditor } from "./PriceEditor";
import { DemoChip, errorMessage, useToast } from "./ui";

const BLANK: TreatmentInput = {
  slug: "",
  name: "",
  category: "facials",
  tagline: "",
  shortDescription: "",
  description: "",
  howItWorks: [],
  benefits: [],
  suitableFor: [],
  downtime: "",
  sessions: "",
  sessionLength: "",
  sideEffects: [],
  faqs: [],
  price: { type: "fixed", amount: 5000 },
  concerns: [],
  doctorIds: ["dr-sajjad"],
  featured: false,
  active: true,
  palette: 0,
};

export function TreatmentsAdmin() {
  const toast = useToast();
  const { data: treatments, ready } = useData(() => getTreatments({ includeInactive: true }), []);
  const [priceTarget, setPriceTarget] = useState<{ t: Treatment; price: PriceModel } | null>(null);
  const [editing, setEditing] = useState<TreatmentInput | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Treatment | null>(null);

  const toggle = async (t: Treatment, key: "featured" | "active") => {
    try {
      await saveTreatment({ ...t, [key]: !t[key] });
      toast(`${t.name}: ${key} ${!t[key] ? "on" : "off"}`);
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl sm:text-5xl">Treatments &amp; pricing</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">Changes appear immediately on the public website (treatment pages, catalogue and homepage offers).</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing({ ...BLANK, palette: treatments.length % PALETTES.length })}>
          <Icon name="plus" size={18} /> Add treatment
        </button>
      </div>

      <ul className="mt-6 space-y-3" data-testid="treatment-admin-list">
        {treatments.map((t) => (
          <li key={t.id} className={`card flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${t.active ? "" : "opacity-70"}`} data-slug={t.slug}>
            <TreatmentArt palette={t.palette} className="hidden h-16 w-20 flex-none rounded-xl sm:block" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-charcoal">{t.name}</p>
                <span className="chip bg-cream text-muted">{categoryLabel(t.category)}</span>
                {!t.active && <span className="chip bg-[#ece8e2] text-ink">Hidden</span>}
              </div>
              <p className="mt-1 text-sm text-ink" data-testid="admin-price">
                <span className="text-muted">{PRICE_TYPE_LABELS[t.price.type]}: </span>{priceSummary(t.price)}
              </p>
              <div className="mt-1.5"><DemoChip /></div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Switch label="Featured" checked={t.featured} onChange={() => toggle(t, "featured")} />
              <Switch label="Visible" checked={t.active} onChange={() => toggle(t, "active")} />
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setPriceTarget({ t, price: t.price })}>
                <Icon name="tag" size={15} /> Edit price<span className="sr-only"> for {t.name}</span>
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(t)}>
                <Icon name="edit" size={15} /> Edit<span className="sr-only"> {t.name}</span>
              </button>
              <Link href={`/treatments/${t.slug}`} target="_blank" className="btn btn-ghost btn-sm" aria-label={`View ${t.name} on the website`}>
                <Icon name="eye" size={15} />
              </Link>
              <button type="button" className="btn btn-ghost btn-sm !text-danger" onClick={() => setDeleteTarget(t)} aria-label={`Delete ${t.name}`}>
                <Icon name="trash" size={15} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {ready && treatments.length === 0 && <p className="card p-8 text-center text-muted">No treatments. Add one, or reset the demo data.</p>}

      {/* Quick price editor */}
      <Dialog open={!!priceTarget} onClose={() => setPriceTarget(null)} title={priceTarget ? `Price: ${priceTarget.t.name}` : "Price"} wide>
        {priceTarget && (
          <>
            <PriceEditor value={priceTarget.price} onChange={(price) => setPriceTarget({ ...priceTarget, price })} />
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setPriceTarget(null)}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!!validatePrice(priceTarget.price)}
                data-testid="save-price"
                onClick={async () => {
                  try {
                    await updatePrice(priceTarget.t.id, priceTarget.price);
                    toast(`Price updated: ${priceTarget.t.name}`);
                    setPriceTarget(null);
                  } catch (e) {
                    toast(errorMessage(e), "error");
                  }
                }}
              >
                Save price
              </button>
            </div>
          </>
        )}
      </Dialog>

      {editing && <TreatmentEditor initial={editing} onClose={() => setEditing(null)} />}

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete treatment?">
        {deleteTarget && (
          <>
            <p className="text-muted">
              <strong className="text-charcoal">{deleteTarget.name}</strong> will be removed from the website and booking page. Existing appointments keep their record. Tip: use &ldquo;Visible&rdquo; to hide it temporarily instead.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Keep</button>
              <button type="button" className="btn btn-primary !bg-danger" onClick={async () => {
                await deleteTreatment(deleteTarget.id);
                toast(`${deleteTarget.name} deleted`);
                setDeleteTarget(null);
              }}>
                Delete
              </button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={onChange}
      className="inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-xs font-semibold text-ink hover:bg-cream">
      <span className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-gold" : "bg-sand"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? "left-[1.1rem]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

/* ------------------------------ Full editor ------------------------------ */

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

function TreatmentEditor({ initial, onClose }: { initial: TreatmentInput; onClose: () => void }) {
  const toast = useToast();
  const { data: doctors } = useData(getDoctors, []);
  const [t, setT] = useState<TreatmentInput>(initial);
  const [text, setText] = useState({
    howItWorks: initial.howItWorks.join("\n"),
    benefits: initial.benefits.join("\n"),
    suitableFor: initial.suitableFor.join("\n"),
    sideEffects: initial.sideEffects.join("\n"),
  });
  const [error, setError] = useState<string | null>(null);
  const isNew = !initial.id;
  const set = <K extends keyof TreatmentInput>(k: K, v: TreatmentInput[K]) => setT((x) => ({ ...x, [k]: v }));

  const save = async () => {
    setError(null);
    if (!t.name.trim()) return setError("Treatment name is required.");
    if (!t.shortDescription.trim()) return setError("Add a short description for treatment cards.");
    try {
      const saved = await saveTreatment({
        ...t,
        howItWorks: lines(text.howItWorks),
        benefits: lines(text.benefits),
        suitableFor: lines(text.suitableFor),
        sideEffects: lines(text.sideEffects),
        faqs: t.faqs.filter((f) => f.q.trim() && f.a.trim()),
      });
      toast(isNew ? `${saved.name} added` : `${saved.name} saved`);
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <Dialog open onClose={onClose} title={isNew ? "Add treatment" : `Edit: ${initial.name}`} wide>
      <div className="space-y-8">
        <Group title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <F id="e-name" label="Name *"><input id="e-name" className="field" value={t.name} onChange={(e) => set("name", e.target.value)} /></F>
            <F id="e-slug" label="Web address" hint={`/treatments/${t.slug || "auto-from-name"}`}>
              <input id="e-slug" className="field" value={t.slug} placeholder="auto" onChange={(e) => set("slug", e.target.value)} />
            </F>
            <F id="e-cat" label="Category">
              <select id="e-cat" className="field" value={t.category} onChange={(e) => set("category", e.target.value as TreatmentInput["category"])}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </F>
            <F id="e-tag" label="Tagline"><input id="e-tag" className="field" value={t.tagline} onChange={(e) => set("tagline", e.target.value)} /></F>
          </div>
          <F id="e-short" label="Short description (cards) *"><input id="e-short" className="field" value={t.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} /></F>
          <F id="e-desc" label="Description"><textarea id="e-desc" className="field min-h-28" value={t.description} onChange={(e) => set("description", e.target.value)} /></F>
          <div>
            <p className="label">Artwork</p>
            <div className="flex flex-wrap gap-2">
              {PALETTES.map((p, i) => (
                <button key={i} type="button" onClick={() => set("palette", i)} aria-label={`Artwork style ${i + 1}`} aria-pressed={t.palette === i}
                  className={`h-10 w-10 rounded-full border-2 ${t.palette === i ? "border-charcoal" : "border-transparent"}`}
                  style={{ background: `linear-gradient(135deg, ${p[0]}, ${p[1]}, ${p[2]})` }} />
              ))}
            </div>
          </div>
        </Group>

        <Group title="Price">
          <PriceEditor value={t.price} onChange={(p) => set("price", p)} />
        </Group>

        <Group title="Treatment details" hint="One item per line.">
          <div className="grid gap-4 sm:grid-cols-2">
            <F id="e-how" label="How it works (steps)"><textarea id="e-how" className="field min-h-28" value={text.howItWorks} onChange={(e) => setText({ ...text, howItWorks: e.target.value })} /></F>
            <F id="e-ben" label="Benefits"><textarea id="e-ben" className="field min-h-28" value={text.benefits} onChange={(e) => setText({ ...text, benefits: e.target.value })} /></F>
            <F id="e-suit" label="Who it may suit"><textarea id="e-suit" className="field min-h-28" value={text.suitableFor} onChange={(e) => setText({ ...text, suitableFor: e.target.value })} /></F>
            <F id="e-side" label="Possible side effects"><textarea id="e-side" className="field min-h-28" value={text.sideEffects} onChange={(e) => setText({ ...text, sideEffects: e.target.value })} /></F>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <F id="e-down" label="Downtime"><input id="e-down" className="field" value={t.downtime} onChange={(e) => set("downtime", e.target.value)} /></F>
            <F id="e-sess" label="Sessions"><input id="e-sess" className="field" value={t.sessions} onChange={(e) => set("sessions", e.target.value)} /></F>
            <F id="e-len" label="Session length"><input id="e-len" className="field" value={t.sessionLength} onChange={(e) => set("sessionLength", e.target.value)} /></F>
          </div>
        </Group>

        <Group title="FAQ">
          {t.faqs.map((f, i) => (
            <div key={i} className="grid gap-2 rounded-2xl border border-line p-3 sm:grid-cols-[1fr_1.4fr_auto]">
              <input aria-label={`Question ${i + 1}`} className="field" placeholder="Question" value={f.q} onChange={(e) => set("faqs", t.faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
              <input aria-label={`Answer ${i + 1}`} className="field" placeholder="Answer" value={f.a} onChange={(e) => set("faqs", t.faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
              <button type="button" className="rounded-full p-2.5 text-muted hover:bg-cream hover:text-danger" aria-label={`Remove question ${i + 1}`} onClick={() => set("faqs", t.faqs.filter((_, j) => j !== i))}>
                <Icon name="trash" size={18} />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => set("faqs", [...t.faqs, { q: "", a: "" }])}><Icon name="plus" size={16} /> Add question</button>
        </Group>

        <Group title="Skin Concern Finder & visibility">
          <fieldset>
            <legend className="label">Concerns this treatment may help with</legend>
            <div className="flex flex-wrap gap-2">
              {ALL_CONCERNS.map((c) => {
                const on = t.concerns.includes(c.id);
                return (
                  <label key={c.id} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${on ? "border-charcoal bg-charcoal text-ivory" : "border-sand hover:bg-cream"}`}>
                    <input type="checkbox" className="sr-only" checked={on} onChange={() => set("concerns", on ? t.concerns.filter((x) => x !== c.id) : [...t.concerns, c.id])} />
                    {c.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">Doctors</legend>
            {doctors.map((d) => (
              <label key={d.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-[#8a6a30]" checked={t.doctorIds.includes(d.id)}
                  onChange={(e) => set("doctorIds", e.target.checked ? [...t.doctorIds, d.id] : t.doctorIds.filter((x) => x !== d.id))} />
                {d.name}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-wrap gap-4">
            <Switch label="Featured on homepage" checked={t.featured} onChange={() => set("featured", !t.featured)} />
            <Switch label="Visible on website" checked={t.active} onChange={() => set("active", !t.active)} />
          </div>
        </Group>
      </div>

      {error && <p role="alert" className="mt-6 rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}
      <div className="sticky bottom-0 -mx-5 mt-6 flex justify-end gap-3 border-t border-line bg-ivory px-5 py-4 sm:-mx-7 sm:px-7">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={save}>{isNew ? "Add treatment" : "Save changes"}</button>
      </div>
    </Dialog>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
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

function F({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}
