"use client";

import { useState } from "react";
import { useAdmin, useData } from "@/components/admin/store";
import { Area, Card, Grid, ImagePicker, Notice, PageTitle, SaveBar, Select, Text, Toggle, btn, inputCls, useDraft, useToast } from "@/components/admin/ui";
import { SEED_DESIGN } from "@/lib/seed";
import { contrast, isHexColor, themeVars } from "@/lib/theme";
import type { Design } from "@/lib/types";

const PRESETS: { name: string; colors: Design["colors"] }[] = [
  { name: "Champagne (original)", colors: SEED_DESIGN.colors },
  { name: "Rose quartz", colors: { background: "#FAF5F2", surface: "#FFFFFF", alt: "#EFDDD6", accent: "#B98A7E", muted: "#A8938C", ink: "#2A2323" } },
  { name: "Sage", colors: { background: "#F5F5EF", surface: "#FFFFFF", alt: "#DFE3D3", accent: "#8C9A76", muted: "#9AA08F", ink: "#23261F" } },
  { name: "Noir & gold", colors: { background: "#F4F1EA", surface: "#FFFFFF", alt: "#1F1F1F", accent: "#C2A36B", muted: "#8F877C", ink: "#151515" } },
];

const COLOR_LABELS: [keyof Design["colors"], string, string][] = [
  ["background", "Background (ivory)", "Main page background"],
  ["surface", "Surface (white)", "Cards and forms"],
  ["alt", "Accent background (champagne)", "Alternate sections"],
  ["accent", "Accent (muted gold)", "Details, hover, stars"],
  ["muted", "Muted (taupe)", "Secondary text (auto-darkened for readability)"],
  ["ink", "Text (charcoal)", "Headings, text, dark sections, buttons"],
];

function ColorInput({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <input type="color" value={isHexColor(value) && value.length === 7 ? value : "#000000"} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-10 w-12 cursor-pointer rounded border border-stone-300 bg-white p-0.5" aria-label={`${label} picker`} />
        <input className={`${inputCls} !w-32 font-mono uppercase`} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} />
      </div>
      <p className="mt-1 text-xs text-stone-500">{hint}</p>
      {!isHexColor(value) && <p className="mt-1 text-xs text-red-700">Use a colour like #B49A70</p>}
    </div>
  );
}

export default function DesignPage() {
  const data = useData();
  const { saveDoc } = useAdmin();
  const toast = useToast();
  const { draft, setDraft, dirty, reset } = useDraft<Design>(data.design);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Design>(k: K, v: Partial<Design[K]>) => setDraft({ ...draft, [k]: typeof draft[k] === "object" ? { ...(draft[k] as object), ...v } : v });
  const c = draft.colors;
  const valid = Object.values(c).every(isHexColor);
  const textContrast = valid ? contrast(c.ink, c.background) : 0;

  async function save() {
    setSaving(true);
    try {
      await saveDoc("design", draft);
      toast("Design saved. Reload the website to see it.");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  const preview = (
    <div style={valid ? (themeVars(draft) as React.CSSProperties) : undefined} className={`overflow-hidden rounded-xl border border-stone-300 ${draft.buttons.style === "outline" ? "btn-style-outline" : ""}`} aria-label="Design preview">
      <div className="tone-ivory p-6" style={{ fontFamily: "var(--font-body)", fontSize: "var(--base-size)", color: "var(--fg)" }}>
        <p className="eyebrow mb-3">Med Spa · Hollywood</p>
        <h3 className="text-4xl">Skincare, thoughtfully done.</h3>
        <p className="mt-3 text-fg-muted">Body text and secondary text look like this.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="btn btn-primary">Book now</span>
          <span className="btn btn-outline">Explore</span>
        </div>
      </div>
      <div className="tone-champagne p-6" style={{ fontFamily: "var(--font-body)" }}>
        <div className="card reset-tone border border-line bg-surface p-5">
          <h4 className="text-2xl">Card title</h4>
          <p className="mt-2 text-sm text-fg-muted">Cards, forms and reviews use the surface colour.</p>
        </div>
      </div>
      <div className="tone-charcoal p-6" style={{ fontFamily: "var(--font-body)" }}>
        <h4 className="text-3xl">Dark section</h4>
        <p className="mt-2 text-fg-muted">Calls to action and the footer.</p>
        <span className="btn btn-primary mt-4">Book an appointment</span>
      </div>
    </div>
  );

  return (
    <>
      <PageTitle title="Design" description="Colours, fonts, buttons, spacing, header and footer for the whole website." actions={<button type="button" className={btn.secondary} onClick={() => setDraft(structuredClone(SEED_DESIGN))}>Restore original design</button>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card title="Colours">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.name} type="button" onClick={() => set("colors", p.colors)} className="flex items-center gap-2 rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:border-stone-500">
                  <span className="flex">{Object.values(p.colors).slice(0, 4).map((col, i) => <span key={i} className="h-4 w-4 rounded-full border border-white" style={{ background: col, marginLeft: i ? -4 : 0 }} />)}</span>
                  {p.name}
                </button>
              ))}
            </div>
            <Grid cols={3}>
              {COLOR_LABELS.map(([k, label, hint]) => <ColorInput key={k} label={label} hint={hint} value={c[k]} onChange={(v) => set("colors", { [k]: v })} />)}
            </Grid>
            {valid && textContrast < 7 && <Notice tone={textContrast < 4.5 ? "red" : "amber"}>Text contrast is {textContrast.toFixed(1)}:1. {textContrast < 4.5 ? "This is too low to read comfortably (minimum 4.5:1)." : "Readable, but a darker text colour reads better (7:1 or more)."}</Notice>}
          </Card>

          <Card title="Fonts">
            <Grid>
              <Select label="Headings" value={draft.fonts.heading} onChange={(v) => set("fonts", { heading: v })} options={[{ value: "cormorant", label: "Cormorant Garamond (elegant serif)" }, { value: "playfair", label: "Playfair Display (classic serif)" }, { value: "bodoni", label: "Bodoni Moda (fashion serif)" }, { value: "marcellus", label: "Marcellus (refined, wide)" }]} />
              <Select label="Body text" value={draft.fonts.body} onChange={(v) => set("fonts", { body: v })} options={[{ value: "dmsans", label: "DM Sans" }, { value: "inter", label: "Inter" }, { value: "jost", label: "Jost" }, { value: "manrope", label: "Manrope" }]} />
              <Select label="Base text size" value={draft.fonts.baseSize} onChange={(v) => set("fonts", { baseSize: v })} options={[15, 16, 17, 18].map((n) => ({ value: n as 15 | 16 | 17 | 18, label: `${n}px${n === 16 ? " (standard)" : ""}` }))} />
              <Select label="Heading style" value={draft.fonts.headingCase} onChange={(v) => set("fonts", { headingCase: v })} options={[{ value: "normal", label: "Normal" }, { value: "uppercase", label: "UPPERCASE" }]} />
            </Grid>
          </Card>

          <Card title="Buttons, corners & spacing">
            <Grid cols={3}>
              <Select label="Button shape" value={draft.buttons.shape} onChange={(v) => set("buttons", { shape: v })} options={[{ value: "square", label: "Square" }, { value: "soft", label: "Slightly rounded" }, { value: "pill", label: "Pill" }]} />
              <Select label="Main button style" value={draft.buttons.style} onChange={(v) => set("buttons", { style: v })} options={[{ value: "solid", label: "Solid" }, { value: "outline", label: "Outline" }]} />
              <Select label="Image & card corners" value={draft.corners} onChange={(v) => setDraft({ ...draft, corners: v })} options={[{ value: "square", label: "Square" }, { value: "soft", label: "Slightly rounded" }, { value: "round", label: "Rounded" }]} />
              <Select label="Section spacing" value={draft.spacing} onChange={(v) => setDraft({ ...draft, spacing: v })} options={[{ value: "compact", label: "Compact" }, { value: "normal", label: "Normal" }, { value: "airy", label: "Airy" }]} />
            </Grid>
            <Toggle label="Uppercase button text" checked={draft.buttons.uppercase} onChange={(v) => set("buttons", { uppercase: v })} />
          </Card>

          <Card title="Header">
            <ImagePicker label="Logo (optional; otherwise the text logo is used)" value={draft.header.logo} onChange={(v) => set("header", { logo: v })} aspect="aspect-[3/1]" hint="Use a PNG or WebP with a transparent background, at least 360px wide." />
            <Grid>
              <Text label="Text logo" value={draft.header.logoText} onChange={(v) => set("header", { logoText: v })} />
              <Text label="Text under the logo" value={draft.header.logoSubtext} onChange={(v) => set("header", { logoSubtext: v })} />
              <Text label="Book button text" value={draft.header.bookLabel} onChange={(v) => set("header", { bookLabel: v })} />
            </Grid>
            <div className="grid gap-4 sm:grid-cols-2">
              <Toggle label="Show Book button in the header" checked={draft.header.showBookButton} onChange={(v) => set("header", { showBookButton: v })} />
              <Toggle label="Show phone number in the header (large screens)" checked={draft.header.showPhone} onChange={(v) => set("header", { showPhone: v })} />
            </div>
          </Card>

          <Card title="Footer">
            <Select label="Footer colour" value={draft.footer.tone} onChange={(v) => set("footer", { tone: v })} options={[{ value: "charcoal", label: "Charcoal (dark)" }, { value: "champagne", label: "Champagne" }, { value: "ivory", label: "Ivory (light)" }]} />
            <Area label="Short description" value={draft.footer.about} onChange={(v) => set("footer", { about: v })} rows={2} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Toggle label="Show opening hours" checked={draft.footer.showHours} onChange={(v) => set("footer", { showHours: v })} />
              <Toggle label="Show social links" checked={draft.footer.showSocial} onChange={(v) => set("footer", { showSocial: v })} />
            </div>
            <Area label="Disclaimer" value={draft.footer.disclaimer} onChange={(v) => set("footer", { disclaimer: v })} rows={3} />
            <Text label="Copyright line" value={draft.footer.copyright} onChange={(v) => set("footer", { copyright: v })} hint="{{year}} is replaced by the current year." />
          </Card>
        </div>
        <div className="xl:sticky xl:top-6 xl:self-start">
          <p className="mb-2 text-sm font-medium">Preview</p>
          {preview}
        </div>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </>
  );
}
