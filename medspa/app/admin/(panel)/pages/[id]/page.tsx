"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { BlocksEditor } from "@/components/admin/BlocksEditor";
import { useAdmin, useData } from "@/components/admin/store";
import { Area, Card, ImagePicker, Notice, PageTitle, SaveBar, Text, Toggle, btn, useDraft, useToast } from "@/components/admin/ui";
import { slugify } from "@/lib/id";
import type { Page } from "@/lib/types";

export default function PageEditor() {
  const { id } = useParams<{ id: string }>();
  const data = useData();
  const page = data.pages.find((p) => p.id === id);
  if (!page) return <p>Page not found. <Link href="/admin/pages" className="underline">Back to pages</Link></p>;
  return <Editor page={page} />;
}

function Editor({ page }: { page: Page }) {
  const { saveItem } = useAdmin();
  const { pages } = useData();
  const toast = useToast();
  const { draft, setDraft, dirty, reset } = useDraft(page);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [stamp, setStamp] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const set = (patch: Partial<Page>) => setDraft({ ...draft, ...patch });
  const url = draft.slug ? `/${draft.slug}` : "/";
  const pageRefs = pages.map((p) => ({ slug: p.slug, title: p.title }));

  async function save() {
    setSaving(true);
    try {
      await saveItem("pages", draft);
      toast("Page saved. The website is updated.");
      setStamp(Date.now());
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle
        title={`Edit: ${page.title}`}
        description={<><Link href="/admin/pages" className="underline">All pages</Link> · Changes go live when you press Save.</>}
        actions={<><button type="button" className={btn.secondary} onClick={() => setPreview((v) => !v)}>{preview ? "Hide preview" : "Show preview"}</button><a href={url} target="_blank" className={btn.secondary}>Open page</a></>}
      />
      <div className={preview ? "grid gap-6 xl:grid-cols-[1fr_420px]" : ""}>
        <div className="space-y-6">
          <Card title="Page settings">
            <div className="grid gap-5 sm:grid-cols-2">
              <Text label="Page title (admin & browser tab)" value={draft.title} onChange={(v) => set({ title: v })} />
              {page.system === "home" ? (
                <Text label="Web address" value="/ (homepage)" onChange={() => undefined} hint="The homepage address cannot change." />
              ) : (
                <Text label="Web address (slug)" value={draft.slug} onChange={(v) => set({ slug: slugify(v) })} hint={`Live at ${url}. Changing it breaks old links; menu links update automatically.`} />
              )}
            </div>
            {page.system !== "home" && (
              <Toggle label="Published (visible on the website)" checked={draft.published} onChange={(v) => set({ published: v })} hint={page.system ? "This is a required page: it can be hidden but not deleted." : undefined} />
            )}
            {draft.system === "book" && <Notice tone="blue">Booking form behaviour, Booksy and email texts are under <Link href="/admin/booking" className="underline">Booking & emails</Link>.</Notice>}
          </Card>

          <Card title="Sections" description="Drag the handle (or use ↑ ↓) to reorder. Click a section to edit its text, images and style.">
            <BlocksEditor blocks={draft.blocks} onChange={(blocks) => set({ blocks })} pages={pageRefs} />
          </Card>

          <Card title="Search engines (SEO)" description="How this page appears on Google and when shared.">
            <Text label="SEO title" value={draft.seoTitle} onChange={(v) => set({ seoTitle: v })} hint={`${draft.seoTitle.length}/60 characters recommended. Include the treatment and "Hollywood, FL" where natural.`} />
            <Area label="Meta description" value={draft.seoDescription} onChange={(v) => set({ seoDescription: v })} rows={3} hint={`${draft.seoDescription.length}/155 characters recommended.`} />
            <ImagePicker label="Social sharing image (optional)" value={draft.ogImage} onChange={(v) => set({ ogImage: v })} />
            <Toggle label="Hide this page from search engines" checked={Boolean(draft.noindex)} onChange={(v) => set({ noindex: v })} />
          </Card>
        </div>

        {preview && (
          <div className="xl:sticky xl:top-6 xl:self-start">
            <div className="overflow-hidden rounded-xl border border-stone-300 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-stone-200 px-3 py-2 text-xs text-stone-500">
                <span>Live preview (saved version)</span>
                <button type="button" className={btn.ghost} onClick={() => setStamp(Date.now())}>Reload</button>
              </div>
              <iframe ref={frame} key={stamp} title="Page preview" src={`${url}${url.includes("?") ? "&" : "?"}preview=${stamp}`} className="h-[75vh] w-full" />
            </div>
            {dirty && <p className="mt-2 text-xs text-stone-500">Save to see your latest changes in the preview.</p>}
          </div>
        )}
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </>
  );
}
