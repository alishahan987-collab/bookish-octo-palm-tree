"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdmin, useData } from "@/components/admin/store";
import { Card, PageTitle, SaveBar, SortableList, Text, btn, inputCls, useDraft, useToast } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { newId } from "@/lib/id";
import type { Navigation, NavItem } from "@/lib/types";

function ItemsEditor({ items, onChange, pages }: { items: NavItem[]; onChange: (v: NavItem[]) => void; pages: { id: string; title: string; slug: string; published: boolean }[] }) {
  const upd = (i: number, p: Partial<NavItem>) => onChange(items.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <>
      <SortableList
        items={items}
        onReorder={onChange}
        render={(it, handle, i) => (
          <div className={`flex flex-wrap items-center gap-2 rounded-lg border bg-white p-2 ${it.hidden ? "border-dashed border-stone-300 opacity-70" : "border-stone-200"}`}>
            {handle}
            <input className={`${inputCls} !w-44 flex-1 sm:flex-none`} value={it.label} onChange={(e) => upd(i, { label: e.target.value })} aria-label="Link label" placeholder="Label" />
            <select className={`${inputCls} !w-auto`} value={it.kind} onChange={(e) => upd(i, { kind: e.target.value as NavItem["kind"] })} aria-label="Link type">
              <option value="page">Page</option>
              <option value="url">Custom link</option>
            </select>
            {it.kind === "page" ? (
              <select className={`${inputCls} !w-auto flex-1`} value={it.pageId ?? ""} onChange={(e) => upd(i, { pageId: e.target.value })} aria-label="Page">
                <option value="">Choose a page…</option>
                {pages.map((p) => <option key={p.id} value={p.id}>{p.title}{p.published ? "" : " (hidden)"}</option>)}
              </select>
            ) : (
              <input className={`${inputCls} flex-1`} value={it.href ?? ""} onChange={(e) => upd(i, { href: e.target.value })} placeholder="https://… or /treatments/laser-hair-removal" aria-label="URL" />
            )}
            <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={Boolean(it.newTab)} onChange={(e) => upd(i, { newTab: e.target.checked })} /> New tab</label>
            <button type="button" className={btn.ghost} onClick={() => upd(i, { hidden: !it.hidden })}>{it.hidden ? "Show" : "Hide"}</button>
            <button type="button" className={btn.ghost} aria-label="Remove link" onClick={() => onChange(items.filter((_, j) => j !== i))}><Icon name="close" size={16} /></button>
          </div>
        )}
      />
      <button type="button" className={`${btn.secondary} mt-2`} onClick={() => onChange([...items, { id: newId("n"), label: "New link", kind: "page", pageId: "" }])}>+ Add link</button>
    </>
  );
}

export default function NavigationPage() {
  const data = useData();
  const { saveDoc } = useAdmin();
  const toast = useToast();
  const { draft, setDraft, dirty, reset } = useDraft<Navigation>(data.navigation);
  const [saving, setSaving] = useState(false);
  const pages = data.pages.map(({ id, title, slug, published }) => ({ id, title, slug, published }));

  async function save() {
    setSaving(true);
    try {
      await saveDoc("navigation", draft);
      toast("Menus saved.");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle title="Menus" description="Drag links to reorder. Links to hidden pages are not shown. The 'Book Appointment' header button is set under Design → Header." />
      <div className="space-y-6">
        <Card title="Main menu (header)"><ItemsEditor items={draft.header} onChange={(header) => setDraft({ ...draft, header })} pages={pages} /></Card>
        <Card title="Footer columns" actions={<button type="button" className={btn.secondary} onClick={() => setDraft({ ...draft, footer: [...draft.footer, { id: newId("fc"), title: "New column", items: [] }] })}>+ Add column</button>}>
          {draft.footer.map((col, ci) => (
            <div key={col.id} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <div className="mb-3 flex items-end gap-2">
                <div className="flex-1"><Text label="Column title" value={col.title} onChange={(v) => setDraft({ ...draft, footer: draft.footer.map((c, j) => (j === ci ? { ...c, title: v } : c)) })} /></div>
                <button type="button" className={`${btn.ghost} text-red-700`} onClick={() => setDraft({ ...draft, footer: draft.footer.filter((_, j) => j !== ci) })}>Remove column</button>
              </div>
              <ItemsEditor items={col.items} onChange={(items) => setDraft({ ...draft, footer: draft.footer.map((c, j) => (j === ci ? { ...c, items } : c)) })} pages={pages} />
            </div>
          ))}
        </Card>
        <Card title="Legal links (bottom of footer)"><ItemsEditor items={draft.legal} onChange={(legal) => setDraft({ ...draft, legal })} pages={pages} /></Card>
        <p className="text-sm text-stone-500">Footer address, hours, social links and text: <Link href="/admin/design" className="underline">Design → Footer</Link> and <Link href="/admin/business" className="underline">Business info</Link>.</p>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </>
  );
}
