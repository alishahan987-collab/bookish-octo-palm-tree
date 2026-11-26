"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cloneBlock, BLOCK_DEFS } from "@/components/admin/blockDefs";
import { useAdmin, useData } from "@/components/admin/store";
import { Badge, Modal, PageTitle, Select, SortableList, Text, btn, useToast } from "@/components/admin/ui";
import { newId, slugify } from "@/lib/id";
import type { Block, Page } from "@/lib/types";

const make = (t: Block["type"]) => BLOCK_DEFS.find((d) => d.type === t)!.make();

const TEMPLATES: Record<string, { label: string; blocks: () => Block[] }> = {
  text: { label: "Simple page (title + text)", blocks: () => [make("pageHeader"), make("text")] },
  landing: { label: "Landing page (hero, highlights, treatments, call to action)", blocks: () => [make("hero"), make("features"), make("treatments"), make("cta")] },
  blank: { label: "Blank page", blocks: () => [] },
};

export default function PagesList() {
  const { pages, navigation } = useData();
  const { saveItem, deleteItem, reorder, saveDoc } = useAdmin();
  const toast = useToast();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState("text");
  const [busy, setBusy] = useState(false);

  const inMenu = (p: Page) => navigation.header.some((n) => n.kind === "page" && n.pageId === p.id && !n.hidden);

  async function toggleMenu(p: Page) {
    const header = inMenu(p)
      ? navigation.header.filter((n) => !(n.kind === "page" && n.pageId === p.id))
      : [...navigation.header, { id: newId("n"), label: p.title, kind: "page" as const, pageId: p.id }];
    try {
      await saveDoc("navigation", { ...navigation, header });
      toast(inMenu(p) ? "Removed from the main menu." : "Added to the main menu.");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  async function create(from?: Page) {
    setBusy(true);
    try {
      const base = from ? `${from.slug || "home"}-copy` : slugify(title) || "new-page";
      let slug = base;
      for (let n = 2; pages.some((p) => p.slug === slug); n++) slug = `${base}-${n}`;
      const page: Page = {
        id: newId("p"), slug, title: from ? `${from.title} (copy)` : title || "New page",
        seoTitle: from?.seoTitle ?? "", seoDescription: from?.seoDescription ?? "", ogImage: from?.ogImage,
        published: false, blocks: from ? from.blocks.map(cloneBlock) : TEMPLATES[template].blocks().map((b) => (b.type === "pageHeader" || b.type === "hero" ? { ...b, title: title || b.title } as Block : b)),
        order: 0, updatedAt: new Date().toISOString(),
      };
      const saved = await saveItem("pages", page);
      toast(from ? "Page duplicated (hidden until you publish it)." : "Page created (hidden until you publish it).");
      router.push(`/admin/pages/${saved.id}`);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: Page) {
    if (!confirm(`Delete the page "${p.title}"? This cannot be undone. Tip: you can hide it instead.`)) return;
    try {
      await deleteItem("pages", p.id);
      toast("Page deleted.");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  async function togglePublished(p: Page) {
    try {
      await saveItem("pages", { ...p, published: !p.published });
      toast(p.published ? "Page hidden from the website." : "Page published.");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  return (
    <>
      <PageTitle
        title="Pages & sections"
        description="Edit any page, add new pages, duplicate, hide or delete them. Drag to change the order of this list; the menu order is set under Menus."
        actions={<button type="button" className={btn.primary} onClick={() => { setTitle(""); setCreating(true); }}>+ New page</button>}
      />
      <SortableList
        items={pages}
        onReorder={(next) => reorder("pages", next).catch((e) => toast(e.message, "error"))}
        render={(p, handle) => (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white p-2 pr-3 shadow-sm sm:flex-nowrap" data-page={p.slug || "home"}>
            {handle}
            <Link href={`/admin/pages/${p.id}`} className="min-w-0 flex-1 rounded-md px-2 py-1.5 hover:bg-stone-50">
              <span className="flex flex-wrap items-center gap-2 font-medium">
                {p.title}
                {!p.published && <Badge tone="amber">Hidden</Badge>}
                {p.system && <Badge>Required</Badge>}
                {inMenu(p) && <Badge tone="blue">In menu</Badge>}
              </span>
              <span className="block text-xs text-stone-500">/{p.slug} · {p.blocks.length} section{p.blocks.length === 1 ? "" : "s"}</span>
            </Link>
            <div className="flex flex-wrap gap-1">
              <Link href={`/admin/pages/${p.id}`} className={btn.secondary}>Edit</Link>
              <a href={p.slug ? `/${p.slug}` : "/"} target="_blank" className={btn.ghost}>View</a>
              <button type="button" className={btn.ghost} onClick={() => toggleMenu(p)}>{inMenu(p) ? "Remove from menu" : "Add to menu"}</button>
              {p.system !== "home" && <button type="button" className={btn.ghost} onClick={() => togglePublished(p)}>{p.published ? "Hide" : "Publish"}</button>}
              <button type="button" className={btn.ghost} onClick={() => create(p)} disabled={busy}>Duplicate</button>
              {!p.system && <button type="button" className={`${btn.ghost} text-red-700`} onClick={() => remove(p)}>Delete</button>}
            </div>
          </div>
        )}
      />

      <Modal open={creating} onClose={() => setCreating(false)} title="New page" footer={<><button type="button" className={btn.secondary} onClick={() => setCreating(false)}>Cancel</button><button type="button" className={btn.primary} onClick={() => create()} disabled={busy || !title.trim()}>Create page</button></>}>
        <div className="space-y-4">
          <Text label="Page title" value={title} onChange={setTitle} placeholder="e.g. Specials, Our story, Bridal packages" hint={title ? `Address: /${slugify(title)}` : undefined} />
          <Select label="Start from" value={template} onChange={setTemplate} options={Object.entries(TEMPLATES).map(([value, t]) => ({ value, label: t.label }))} />
        </div>
      </Modal>
    </>
  );
}
