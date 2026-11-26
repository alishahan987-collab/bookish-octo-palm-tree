"use client";

import { useState } from "react";
import type { Block } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { BLOCK_DEFS, blockDef, blockSummary, cloneBlock, type FieldDef } from "./blockDefs";
import { Area, Badge, ImagePicker, LinkEditor, Modal, Num, Select, SortableList, Text, Toggle, btn, moveItem } from "./ui";

type Rec = Record<string, unknown>;
type PageRef = { slug: string; title: string };

const TONES = [
  { value: "ivory", label: "Ivory", swatch: "var(--c-bg)" },
  { value: "white", label: "White", swatch: "var(--c-surface)" },
  { value: "champagne", label: "Champagne", swatch: "var(--c-alt)" },
  { value: "charcoal", label: "Charcoal (dark)", swatch: "var(--c-ink)" },
];

function FieldInput({ f, value, onChange, obj, setObj, pages }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void; obj: Rec; setObj: (o: Rec) => void; pages: PageRef[] }) {
  switch (f.type) {
    case "text":
      return <Text label={f.label} value={String(value ?? "")} onChange={onChange} hint={f.hint} />;
    case "area":
      return <Area label={f.label} value={String(value ?? "")} onChange={onChange} rows={3} hint={f.hint} />;
    case "markdown":
      return <Area label={f.label} value={String(value ?? "")} onChange={onChange} rows={7} formatting />;
    case "image":
      return (
        <ImagePicker
          label={f.label}
          value={value as string | undefined}
          onChange={(v) => setObj({ ...obj, [f.key]: v })}
          alt={f.altKey ? String(obj[f.altKey] ?? "") : undefined}
          onAltChange={f.altKey ? (v) => setObj({ ...obj, [f.altKey!]: v }) : undefined}
          hint={f.hint}
        />
      );
    case "link":
      return <LinkEditor label={f.label} value={(value as { label: string; href: string }) ?? { label: "", href: "" }} onChange={onChange} pages={pages} />;
    case "toggle":
      return <Toggle label={f.label} checked={Boolean(value)} onChange={onChange} hint={f.hint} />;
    case "number":
      return <Num label={f.label} value={Number(value ?? 0)} onChange={onChange} min={f.min} max={f.max} hint={f.hint} />;
    case "select":
      return <Select label={f.label} value={(value ?? f.options[0].value) as string | number} onChange={onChange} options={f.options} hint={f.hint} />;
    case "repeater": {
      const items = (value as Rec[]) ?? [];
      return (
        <div>
          <p className="mb-2 text-sm font-medium text-stone-800">{f.label}</p>
          <SortableList
            items={items as (Rec & { id: string })[]}
            onReorder={(next) => onChange(next)}
            render={(item, handle, i) => (
              <div className="flex gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
                {handle}
                <div className="flex-1 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{f.itemLabel} {i + 1}</p>
                  {f.fields.map((sub) => (
                    <FieldInput key={sub.key} f={sub} value={item[sub.key]} pages={pages} obj={item} setObj={(o) => onChange(items.map((x, j) => (j === i ? o : x)))} onChange={(v) => onChange(items.map((x, j) => (j === i ? { ...x, [sub.key]: v } : x)))} />
                  ))}
                </div>
                <button type="button" className={`${btn.ghost} self-start`} aria-label={`Remove ${f.itemLabel}`} onClick={() => onChange(items.filter((_, j) => j !== i))}><Icon name="close" size={16} /></button>
              </div>
            )}
          />
          <button type="button" className={`${btn.secondary} mt-2`} onClick={() => onChange([...items, f.newItem()])}>+ Add {f.itemLabel.toLowerCase()}</button>
        </div>
      );
    }
  }
}

export function BlockForm({ block, onChange, pages }: { block: Block; onChange: (b: Block) => void; pages: PageRef[] }) {
  const def = blockDef(block.type);
  const obj = block as unknown as Rec;
  const setObj = (o: Rec) => onChange(o as unknown as Block);
  return (
    <div className="space-y-5">
      {def.fields.map((f) => (
        <FieldInput key={f.key} f={f} value={obj[f.key]} obj={obj} setObj={setObj} pages={pages} onChange={(v) => setObj({ ...obj, [f.key]: v })} />
      ))}
      <details className="rounded-lg border border-stone-200 p-3">
        <summary className="cursor-pointer text-sm font-medium">Section style</summary>
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-stone-800">Background</p>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button key={t.value} type="button" onClick={() => setObj({ ...obj, tone: t.value })} aria-pressed={block.tone === t.value} className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${block.tone === t.value ? "border-stone-900 ring-1 ring-stone-900" : "border-stone-300"}`}>
                  <span className="h-4 w-4 rounded-full border border-stone-300" style={{ background: t.swatch }} /> {t.label}
                </button>
              ))}
            </div>
          </div>
          <Select label="Spacing above and below" value={block.spacing} onChange={(v) => setObj({ ...obj, spacing: v })} options={[{ value: "compact", label: "Compact" }, { value: "normal", label: "Normal" }, { value: "airy", label: "Airy" }]} />
          <Text label="Anchor (optional)" value={block.anchor ?? ""} onChange={(v) => setObj({ ...obj, anchor: v.toLowerCase().replace(/[^a-z0-9-]/g, "") })} hint="Lets you link straight to this section, e.g. anchor 'faq' → /page#faq" />
        </div>
      </details>
    </div>
  );
}

/** Ordered list of sections with drag-and-drop, hide, duplicate, delete and add. */
export function BlocksEditor({ blocks, onChange, pages }: { blocks: Block[]; onChange: (b: Block[]) => void; pages: PageRef[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState<number | null>(null);

  const update = (b: Block) => onChange(blocks.map((x) => (x.id === b.id ? b : x)));
  const insert = (b: Block, at: number) => {
    const next = [...blocks];
    next.splice(at, 0, b);
    onChange(next);
    setOpenId(b.id);
  };

  return (
    <div>
      {blocks.length === 0 && <p className="mb-3 rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">This page has no sections yet.</p>}
      <SortableList
        items={blocks}
        onReorder={onChange}
        render={(b, handle, i) => {
          const open = openId === b.id;
          const def = blockDef(b.type);
          return (
            <div className={`rounded-xl border bg-white shadow-sm ${b.hidden ? "border-dashed border-stone-300" : "border-stone-200"}`} data-section={b.type}>
              <div className="flex items-center gap-1 p-2">
                {handle}
                <button type="button" className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-stone-50" onClick={() => setOpenId(open ? null : b.id)} aria-expanded={open}>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm font-medium">{def?.label ?? b.type} {b.hidden && <Badge>Hidden</Badge>}</span>
                    <span className="block truncate text-xs text-stone-500">{blockSummary(b) || def?.description}</span>
                  </span>
                  <Icon name="chevronDown" size={16} className={`ml-auto flex-none transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                <div className="flex flex-none items-center">
                  <button type="button" className={btn.ghost} onClick={() => onChange(moveItem(blocks, i, -1))} disabled={i === 0} aria-label="Move up">↑</button>
                  <button type="button" className={btn.ghost} onClick={() => onChange(moveItem(blocks, i, 1))} disabled={i === blocks.length - 1} aria-label="Move down">↓</button>
                  <button type="button" className={btn.ghost} onClick={() => update({ ...b, hidden: !b.hidden })} aria-label={b.hidden ? "Show section" : "Hide section"} title={b.hidden ? "Show" : "Hide"}>
                    {b.hidden ? "Show" : "Hide"}
                  </button>
                  <button type="button" className={`${btn.ghost} hidden sm:inline-flex`} onClick={() => insert(cloneBlock(b), i + 1)} title="Duplicate">Duplicate</button>
                  <button type="button" className={`${btn.ghost} text-red-700`} onClick={() => { if (confirm(`Delete the "${def?.label}" section? Tip: use Hide to keep it for later.`)) onChange(blocks.filter((x) => x.id !== b.id)); }} aria-label="Delete section">
                    <Icon name="close" size={16} />
                  </button>
                </div>
              </div>
              {open && (
                <div className="border-t border-stone-100 p-4 md:p-5">
                  <BlockForm block={b} onChange={update} pages={pages} />
                  <div className="mt-4 flex flex-wrap gap-2 sm:hidden">
                    <button type="button" className={btn.secondary} onClick={() => insert(cloneBlock(b), i + 1)}>Duplicate section</button>
                  </div>
                  <button type="button" className={`${btn.secondary} mt-4`} onClick={() => setAdding(i + 1)}>+ Add a section below</button>
                </div>
              )}
            </div>
          );
        }}
      />
      <button type="button" className={`${btn.primary} mt-4`} onClick={() => setAdding(blocks.length)} data-testid="add-section">+ Add section</button>

      <Modal open={adding !== null} onClose={() => setAdding(null)} title="Add a section" wide>
        <div className="grid gap-2 sm:grid-cols-2">
          {BLOCK_DEFS.map((d) => (
            <button key={d.type} type="button" className="rounded-lg border border-stone-200 p-4 text-left hover:border-stone-500" onClick={() => { insert(d.make(), adding ?? blocks.length); setAdding(null); }}>
              <span className="block font-medium">{d.label}</span>
              <span className="mt-1 block text-sm text-stone-500">{d.description}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
