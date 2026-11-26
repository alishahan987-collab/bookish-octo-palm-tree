"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useAdmin, useData } from "@/components/admin/store";
import { Area, Card, Grid, ImagePicker, Notice, Num, PageTitle, SaveBar, Select, SortableList, StringList, Text, Toggle, btn, useDraft, useToast } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { newId, slugify } from "@/lib/id";
import type { Treatment } from "@/lib/types";

export default function TreatmentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const t = useData().treatments.find((x) => x.id === id);
  if (!t) return <p>Treatment not found. <Link href="/admin/treatments" className="underline">Back</Link></p>;
  return <Editor t={t} />;
}

function Editor({ t }: { t: Treatment }) {
  const { saveItem } = useAdmin();
  const { settings } = useData();
  const toast = useToast();
  const { draft, setDraft, dirty, reset } = useDraft(t);
  const [saving, setSaving] = useState(false);
  const set = (p: Partial<Treatment>) => setDraft({ ...draft, ...p });
  const cats = Array.from(new Set([...settings.treatmentCategories, draft.category].filter(Boolean)));

  async function save() {
    setSaving(true);
    try {
      await saveItem("treatments", draft);
      toast("Treatment saved. The website is updated.");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle title={`Edit: ${t.name}`} description={<><Link href="/admin/treatments" className="underline">All treatments</Link> · Live at /treatments/{draft.slug}</>} actions={<a href={`/treatments/${t.slug}`} target="_blank" className={btn.secondary}>View page</a>} />
      <div className="space-y-6">
        <Card title="Status">
          <div className="grid gap-4 sm:grid-cols-2">
            <Toggle label="Published (visible on the website)" checked={draft.published} onChange={(v) => set({ published: v })} />
            <Toggle label="Verified by the business" checked={draft.verified} onChange={(v) => set({ verified: v })} hint="Turn on once the spa has confirmed this service and its details are current. Until then a notice asks visitors to confirm details." />
            <Toggle label="Featured (shown on the homepage)" checked={draft.featured} onChange={(v) => set({ featured: v })} />
            <Toggle label="Can be requested online" checked={draft.bookable} onChange={(v) => set({ bookable: v })} />
          </div>
        </Card>

        <Card title="Basics">
          <Grid>
            <Text label="Treatment name" value={draft.name} onChange={(v) => set({ name: v })} />
            <Text label="Web address (slug)" value={draft.slug} onChange={(v) => set({ slug: slugify(v) })} hint="Changing it breaks old links." />
            <Select label="Category" value={draft.category} onChange={(v) => set({ category: v })} options={cats.map((c) => ({ value: c, label: c }))} hint="Edit categories under SEO & site settings." />
          </Grid>
          <Area label="Short description (cards and search results)" value={draft.shortDescription} onChange={(v) => set({ shortDescription: v })} rows={2} />
          <Area label="Full description" value={draft.description} onChange={(v) => set({ description: v })} rows={9} formatting />
          <ImagePicker label="Main image" value={draft.image} onChange={(v) => set({ image: v })} alt={draft.imageAlt} onAltChange={(v) => set({ imageAlt: v })} aspect="aspect-[4/5]" />
        </Card>

        <Card title="Price & duration" description="Leave empty to hide. Only publish prices and durations the spa has confirmed.">
          <Grid cols={3}>
            <Text label="Price" value={draft.price} onChange={(v) => set({ price: v })} placeholder={settings.treatmentText.priceFallback} hint='e.g. "$120", "From $89", "$450 / package of 6"' />
            <Text label="Price note (optional)" value={draft.priceNote} onChange={(v) => set({ priceNote: v })} placeholder="e.g. Consultation required" />
            <Text label="Duration shown to visitors" value={draft.duration} onChange={(v) => set({ duration: v })} placeholder="e.g. 60 minutes" />
          </Grid>
          <Grid>
            <Num label="Calendar time to reserve (minutes)" value={draft.bookingMinutes} onChange={(v) => set({ bookingMinutes: v })} min={5} max={480} hint="Used to prevent overlapping appointments." />
            <Text label="Booksy link for this treatment (optional)" value={draft.booksyUrl} onChange={(v) => set({ booksyUrl: v })} placeholder="https://booksy.com/…" />
          </Grid>
        </Card>

        <Card title="Benefits" description="Benefits are only shown when the business has verified them.">
          <Notice>Only list benefits the spa can support. Avoid guarantees or medical claims (e.g. &quot;permanent&quot;, &quot;cures&quot;, &quot;FDA-approved&quot;) unless the spa has documentation for them.</Notice>
          <StringList label="Benefits" values={draft.benefits} onChange={(v) => set({ benefits: v })} placeholder="e.g. Personalised to your skin type" />
          <Toggle label="These benefits are verified and may be shown" checked={draft.benefitsVerified} onChange={(v) => set({ benefitsVerified: v })} />
        </Card>

        <Card title="Extra sections" description='Optional sections such as "What to expect", "Preparation" or "Aftercare".'>
          <SortableList
            items={draft.sections}
            onReorder={(sections) => set({ sections })}
            render={(s, handle, i) => (
              <div className="flex gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
                {handle}
                <div className="flex-1 space-y-3">
                  <Text label="Heading" value={s.title} onChange={(v) => set({ sections: draft.sections.map((x, j) => (j === i ? { ...x, title: v } : x)) })} />
                  <Area label="Text" value={s.body} onChange={(v) => set({ sections: draft.sections.map((x, j) => (j === i ? { ...x, body: v } : x)) })} rows={5} formatting />
                </div>
                <button type="button" className={`${btn.ghost} self-start`} aria-label="Remove section" onClick={() => set({ sections: draft.sections.filter((_, j) => j !== i) })}><Icon name="close" size={16} /></button>
              </div>
            )}
          />
          <button type="button" className={btn.secondary} onClick={() => set({ sections: [...draft.sections, { id: newId("s"), title: "", body: "" }] })}>+ Add section</button>
        </Card>

        <Card title="Questions (FAQ)">
          <SortableList
            items={draft.faqs}
            onReorder={(faqs) => set({ faqs })}
            render={(f, handle, i) => (
              <div className="flex gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
                {handle}
                <div className="flex-1 space-y-3">
                  <Text label="Question" value={f.q} onChange={(v) => set({ faqs: draft.faqs.map((x, j) => (j === i ? { ...x, q: v } : x)) })} />
                  <Area label="Answer" value={f.a} onChange={(v) => set({ faqs: draft.faqs.map((x, j) => (j === i ? { ...x, a: v } : x)) })} rows={3} />
                </div>
                <button type="button" className={`${btn.ghost} self-start`} aria-label="Remove question" onClick={() => set({ faqs: draft.faqs.filter((_, j) => j !== i) })}><Icon name="close" size={16} /></button>
              </div>
            )}
          />
          <button type="button" className={btn.secondary} onClick={() => set({ faqs: [...draft.faqs, { id: newId("q"), q: "", a: "" }] })}>+ Add question</button>
        </Card>

        <Card title="Search engines (SEO)">
          <Text label="SEO title" value={draft.seoTitle} onChange={(v) => set({ seoTitle: v })} hint={`${draft.seoTitle.length}/60 · e.g. "${draft.name} in Hollywood, FL"`} />
          <Area label="Meta description" value={draft.seoDescription} onChange={(v) => set({ seoDescription: v })} rows={3} hint={`${draft.seoDescription.length}/155`} />
        </Card>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </>
  );
}
