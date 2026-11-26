"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { deletePost, getPosts, savePost } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import type { Post, PostInput } from "@/lib/data/types";
import { useSite } from "../site/SiteProvider";
import { Dialog } from "../ui/Dialog";
import { Icon } from "../ui/Icon";
import { Markdown } from "../ui/Markdown";
import { SmartImage } from "../ui/SmartImage";
import { ImageUpload, TextArea, TextInput, errorMessage, useToast } from "./ui";

export function BlogAdmin() {
  const toast = useToast();
  const { content } = useSite();
  const { data: posts, ready } = useData(() => getPosts({ includeDrafts: true }), [], [], { fresh: true });
  const [editing, setEditing] = useState<PostInput | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const blank: PostInput = { slug: "", title: "", excerpt: "", content: "", tags: [], status: "draft", author: `The ${content.brand.clinicName} team` };
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl sm:text-5xl">Blog articles</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">Write skincare education articles. Save as a draft until you are ready to publish.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing(blank)}><Icon name="plus" size={18} /> New article</button>
      </div>
      <ul className="mt-6 space-y-3" data-testid="post-admin-list">
        {posts.map((p) => (
          <li key={p.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center" data-post-admin={p.slug}>
            <SmartImage src={p.cover} alt="" className="h-16 w-24 flex-none rounded-xl" sizes="96px" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-charcoal">{p.title}</p>
                <span className={`chip ${p.status === "published" ? "bg-[#e3efe6] text-success" : "bg-[#fbefd5] text-[#7a5410]"}`}>{p.status === "published" ? "Published" : "Draft"}</span>
              </div>
              <p className="mt-0.5 line-clamp-1 text-sm text-muted">{p.excerpt}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(p)}><Icon name="edit" size={15} /> Edit<span className="sr-only"> {p.title}</span></button>
              {p.status === "published" && <Link href={`/blog/${p.slug}`} target="_blank" className="btn btn-ghost btn-sm" aria-label={`View ${p.title}`}><Icon name="eye" size={15} /></Link>}
              <button type="button" className="btn btn-ghost btn-sm !text-danger" onClick={() => setDeleteTarget(p)} aria-label={`Delete ${p.title}`}><Icon name="trash" size={15} /></button>
            </div>
          </li>
        ))}
      </ul>
      {ready && posts.length === 0 && <p className="card p-8 text-center text-muted">No articles yet.</p>}
      {editing && <PostEditor initial={editing} onClose={() => setEditing(null)} />}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete article?">
        <p className="text-muted">&ldquo;{deleteTarget?.title}&rdquo; will be permanently deleted.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Keep</button>
          <button type="button" className="btn btn-primary !bg-danger" onClick={async () => { if (deleteTarget) await deletePost(deleteTarget.id); toast("Article deleted"); setDeleteTarget(null); }}>Delete</button>
        </div>
      </Dialog>
    </div>
  );
}

const TOOLS: { label: string; before: string; after?: string; line?: boolean; icon: string }[] = [
  { label: "Heading", before: "## ", line: true, icon: "H" },
  { label: "Subheading", before: "### ", line: true, icon: "h" },
  { label: "Bold", before: "**", after: "**", icon: "B" },
  { label: "Italic", before: "*", after: "*", icon: "I" },
  { label: "Bullet list", before: "- ", line: true, icon: "•" },
  { label: "Numbered list", before: "1. ", line: true, icon: "1." },
  { label: "Quote", before: "> ", line: true, icon: "❝" },
  { label: "Link", before: "[", after: "](https://)", icon: "🔗" },
];

function PostEditor({ initial, onClose }: { initial: PostInput; onClose: () => void }) {
  const toast = useToast();
  const [p, setP] = useState(initial);
  const [tags, setTags] = useState(initial.tags.join(", "));
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const set = <K extends keyof PostInput>(k: K, v: PostInput[K]) => setP((x) => ({ ...x, [k]: v }));

  const format = (t: (typeof TOOLS)[number]) => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const sel = value.slice(s, e);
    let next: string;
    let cursor: number;
    if (t.line) {
      const lineStart = value.lastIndexOf("\n", s - 1) + 1;
      next = value.slice(0, lineStart) + t.before + value.slice(lineStart);
      cursor = e + t.before.length;
    } else {
      next = value.slice(0, s) + t.before + (sel || t.label.toLowerCase()) + (t.after ?? "") + value.slice(e);
      cursor = s + t.before.length + (sel || t.label.toLowerCase()).length;
    }
    set("content", next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(cursor, cursor); });
  };

  const save = async (status: PostInput["status"]) => {
    setError(null);
    setSaving(true);
    try {
      const saved = await savePost({ ...p, status, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) });
      toast(status === "published" ? `Published: ${saved.title}` : `Draft saved: ${saved.title}`);
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} title={initial.id ? "Edit article" : "New article"} wide>
      <div className="space-y-5">
        <TextInput id="p-title" label="Title *" value={p.title} onChange={(v) => set("title", v)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput id="p-slug" label="Web address" value={p.slug} placeholder="auto" onChange={(v) => set("slug", v)} hint={`/blog/${p.slug || "generated-from-title"}`} />
          <TextInput id="p-author" label="Author" value={p.author} onChange={(v) => set("author", v)} />
        </div>
        <TextArea id="p-excerpt" label="Summary" value={p.excerpt} onChange={(v) => set("excerpt", v)} rows={2} hint="Shown on article cards and in search results." />
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUpload label="Cover image" value={p.cover} onChange={(v) => set("cover", v)} folder="blog" aspect="aspect-[16/10]" testId="post-cover" />
          <div className="space-y-4">
            <TextInput id="p-alt" label="Cover description" value={p.coverAlt ?? ""} onChange={(v) => set("coverAlt", v)} />
            <TextInput id="p-tags" label="Topics" value={tags} onChange={setTags} hint="Separate with commas, e.g. Acne, Skincare" />
          </div>
        </div>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="p-content" className="label !mb-0">Article</label>
            <div className="flex flex-wrap items-center gap-1" role="toolbar" aria-label="Formatting">
              {!preview && TOOLS.map((t) => (
                <button key={t.label} type="button" onClick={() => format(t)} title={t.label} aria-label={t.label} className="h-8 min-w-8 rounded-lg border border-sand px-2 text-sm font-semibold hover:bg-cream">{t.icon}</button>
              ))}
              <button type="button" onClick={() => setPreview((v) => !v)} className="ml-2 rounded-lg border border-sand px-3 py-1 text-sm font-semibold hover:bg-cream" aria-pressed={preview}>{preview ? "Edit" : "Preview"}</button>
            </div>
          </div>
          {preview ? (
            <div className="mt-2 max-h-[50vh] overflow-y-auto rounded-2xl border border-line bg-surface p-5"><Markdown source={p.content || "*Nothing written yet.*"} /></div>
          ) : (
            <textarea ref={area} id="p-content" className="field mt-2 min-h-[18rem] font-mono text-sm" value={p.content} onChange={(e) => set("content", e.target.value)}
              placeholder={"Write your article here.\n\n## A heading\n\nA paragraph with **bold** text.\n\n- A list item"} />
          )}
          <p className="hint">Use the toolbar for headings, lists and links. Leave a blank line between paragraphs.</p>
        </div>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
      <div className="sticky bottom-0 -mx-5 mt-6 flex flex-wrap justify-end gap-3 border-t border-line bg-ivory px-5 py-4 sm:-mx-7 sm:px-7">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => save("draft")}>{p.status === "published" ? "Unpublish (save as draft)" : "Save draft"}</button>
        <button type="button" className="btn btn-primary" disabled={saving} onClick={() => save("published")}>{p.status === "published" ? "Update" : "Publish"}</button>
      </div>
    </Dialog>
  );
}
