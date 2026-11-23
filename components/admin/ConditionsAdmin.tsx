"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteCondition, getConditions, saveCondition } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import type { Condition, ConditionInput } from "@/lib/data/types";
import { Dialog } from "../ui/Dialog";
import { Icon } from "../ui/Icon";
import { SmartImage } from "../ui/SmartImage";
import { Group } from "./TreatmentsAdmin";
import { ImageUpload, LinesInput, MoveButtons, Switch, TextArea, TextInput, errorMessage, useToast } from "./ui";

const BLANK: ConditionInput = { slug: "", name: "", summary: "", overview: "", symptoms: [], causes: [], treatments: [], whenToConsult: [], inFinder: true, active: true, order: 999 };

export function ConditionsAdmin() {
  const toast = useToast();
  const { data: list, ready } = useData(() => getConditions({ includeInactive: true }), [], [], { fresh: true });
  const [editing, setEditing] = useState<ConditionInput | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Condition | null>(null);
  const move = async (i: number, dir: -1 | 1) => {
    const a = list[i], b = list[i + dir];
    if (a && b) await Promise.all([saveCondition({ ...a, order: b.order }), saveCondition({ ...b, order: a.order === b.order ? a.order + dir : a.order })]);
  };
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl sm:text-5xl">Skin conditions</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">Each condition has its own page and appears on the homepage, in search and in the Skin Concern Finder.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing({ ...BLANK, order: list.length })}><Icon name="plus" size={18} /> Add condition</button>
      </div>
      <ul className="mt-6 space-y-3" data-testid="condition-admin-list">
        {list.map((c, i) => (
          <li key={c.id} className={`card flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${c.active ? "" : "opacity-70"}`} data-slug={c.slug}>
            <div className="flex items-center gap-3">
              <MoveButtons label={c.name} onUp={i > 0 ? () => move(i, -1) : undefined} onDown={i < list.length - 1 ? () => move(i, 1) : undefined} />
              <SmartImage src={c.image} alt="" palette={i} className="h-16 w-20 flex-none rounded-xl" sizes="80px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-charcoal">{c.name} {!c.active && <span className="chip ml-1 bg-[#ece8e2] text-ink">Hidden</span>}</p>
              <p className="mt-0.5 line-clamp-1 text-sm text-muted">{c.summary}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Switch label="Visible" checked={c.active} onChange={async (v) => { try { await saveCondition({ ...c, active: v }); toast(`${c.name}: ${v ? "visible" : "hidden"}`); } catch (e) { toast(errorMessage(e), "error"); } }} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(c)}><Icon name="edit" size={15} /> Edit<span className="sr-only"> {c.name}</span></button>
              <Link href={`/conditions/${c.slug}`} target="_blank" className="btn btn-ghost btn-sm" aria-label={`View ${c.name}`}><Icon name="eye" size={15} /></Link>
              <button type="button" className="btn btn-ghost btn-sm !text-danger" onClick={() => setDeleteTarget(c)} aria-label={`Delete ${c.name}`}><Icon name="trash" size={15} /></button>
            </div>
          </li>
        ))}
      </ul>
      {ready && list.length === 0 && <p className="card p-8 text-center text-muted">No conditions yet.</p>}
      {editing && <ConditionEditor initial={editing} onClose={() => setEditing(null)} />}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete condition?">
        <p className="text-muted">{deleteTarget?.name} and its page will be removed from the website.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Keep</button>
          <button type="button" className="btn btn-primary !bg-danger" onClick={async () => { if (deleteTarget) await deleteCondition(deleteTarget.id); toast("Condition deleted"); setDeleteTarget(null); }}>Delete</button>
        </div>
      </Dialog>
    </div>
  );
}

function ConditionEditor({ initial, onClose }: { initial: ConditionInput; onClose: () => void }) {
  const toast = useToast();
  const [c, setC] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof ConditionInput>(k: K, v: ConditionInput[K]) => setC((x) => ({ ...x, [k]: v }));
  const isNew = !initial.id;
  return (
    <Dialog open onClose={onClose} title={isNew ? "Add condition" : `Edit: ${initial.name}`} wide>
      <div className="space-y-8">
        <Group title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput id="c-name" label="Name *" value={c.name} onChange={(v) => set("name", v)} />
            <TextInput id="c-slug" label="Web address" value={c.slug} placeholder="auto" onChange={(v) => set("slug", v)} hint={`/conditions/${c.slug || "generated-from-name"}`} />
          </div>
          <TextInput id="c-summary" label="Short description (card)" value={c.summary} onChange={(v) => set("summary", v)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUpload label="Image" value={c.image} onChange={(v) => set("image", v)} folder="conditions" testId="condition-image" />
            <TextInput id="c-alt" label="Image description" value={c.imageAlt ?? ""} onChange={(v) => set("imageAlt", v)} />
          </div>
        </Group>
        <Group title="Page content" hint="Lists: one item per line.">
          <TextArea id="c-overview" label="1. What is the condition?" value={c.overview} onChange={(v) => set("overview", v)} rows={4} />
          <div className="grid gap-4 sm:grid-cols-2">
            <LinesInput id="c-symptoms" label="2. Common symptoms" value={c.symptoms} onChange={(v) => set("symptoms", v)} />
            <LinesInput id="c-causes" label="3. Causes" value={c.causes} onChange={(v) => set("causes", v)} />
            <LinesInput id="c-treatments" label="4. Available treatments" value={c.treatments} onChange={(v) => set("treatments", v)} />
            <LinesInput id="c-consult" label="5. When to consult a dermatologist" value={c.whenToConsult} onChange={(v) => set("whenToConsult", v)} />
          </div>
        </Group>
        <div className="flex flex-wrap gap-4">
          <Switch label="Show in Skin Concern Finder" checked={c.inFinder} onChange={(v) => set("inFinder", v)} />
          <Switch label="Visible on website" checked={c.active} onChange={(v) => set("active", v)} />
        </div>
      </div>
      {error && <p role="alert" className="mt-6 text-sm text-danger">{error}</p>}
      <div className="sticky bottom-0 -mx-5 mt-6 flex justify-end gap-3 border-t border-line bg-ivory px-5 py-4 sm:-mx-7 sm:px-7">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={async () => {
          try { const s = await saveCondition(c); toast(isNew ? `${s.name} added` : `${s.name} saved`); onClose(); } catch (e) { setError(errorMessage(e)); }
        }}>{isNew ? "Add condition" : "Save changes"}</button>
      </div>
    </Dialog>
  );
}
