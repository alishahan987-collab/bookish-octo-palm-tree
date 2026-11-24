"use client";

import { useState } from "react";
import { getContent, saveContent } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import { SEED_CONTENT } from "@/lib/data/seed";
import type { CustomSection, SectionId, SiteContent, ThemeConfig } from "@/lib/data/types";
import { uid } from "@/lib/id";
import { normalisePkMobile, toWhatsAppDigits } from "@/lib/phone";
import { FONT_LABELS, THEME_PRESETS, contrast } from "@/lib/theme";
import { Icon } from "../ui/Icon";
import { Card, ImageUpload, LinesInput, MoveButtons, SaveBar, Switch, TextArea, TextInput, errorMessage, useDraft, useToast } from "./ui";

const SECTION_NAMES: Record<SectionId, string> = {
  intro: "Introduction", conditions: "Skin conditions", procedures: "Procedures gallery", doctor: "Meet the doctor", why: "Why choose us",
  beforeAfter: "Before & after", pricing: "Pricing", blog: "Blog", cta: "Book appointment banner", faq: "FAQ", contact: "Location & contact",
};

type Section = "site" | "doctor" | "contact" | "appearance";

export function ContentAdmin({ section }: { section: Section }) {
  const toast = useToast();
  const { data: saved, ready } = useData(getContent, SEED_CONTENT, [], { fresh: true });
  const { draft: c, setDraft, dirty, reset } = useDraft<SiteContent>(saved, ready);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const patch = <K extends keyof SiteContent>(k: K, v: Partial<SiteContent[K]>) =>
    setDraft((d) => ({ ...d, [k]: Array.isArray(d[k]) ? v : { ...(d[k] as object), ...v } }) as SiteContent);

  const save = async () => {
    setError(null);
    const raw = c.contact.whatsapp.trim();
    let whatsapp = "";
    if (raw) {
      const n = normalisePkMobile(raw) ?? (raw.replace(/\D/g, "").length >= 10 ? `+${raw.replace(/\D/g, "")}` : null);
      if (!n) return setError("WhatsApp number looks invalid. Use e.g. 0300 1234567 or +92 300 1234567.");
      whatsapp = toWhatsAppDigits(n);
    }
    setSaving(true);
    try {
      await saveContent({ ...c, contact: { ...c.contact, whatsapp } });
      toast("Saved. The website is updated.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const titles: Record<Section, [string, string]> = {
    site: ["Homepage & sections", "Edit every heading and paragraph, reorder sections and show or hide them."],
    doctor: ["Doctor profile", "Photo, credentials and biography shown on the homepage and About page."],
    contact: ["Contact & social", "Address, phone, email, WhatsApp, map and social media links."],
    appearance: ["Branding & appearance", "Clinic name, logo, colours and typography."],
  };

  return (
    <div>
      <h1 className="text-4xl sm:text-5xl">{titles[section][0]}</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">{titles[section][1]}</p>
      <div className="mt-6 space-y-6">
        {section === "site" && <SiteSections c={c} setDraft={setDraft} patch={patch} />}
        {section === "doctor" && <DoctorSection c={c} patch={patch} />}
        {section === "contact" && <ContactSection c={c} patch={patch} />}
        {section === "appearance" && <AppearanceSection c={c} patch={patch} setDraft={setDraft} />}
      </div>
      <SaveBar dirty={dirty} saving={saving} error={error} onSave={save} onDiscard={() => { reset(); setError(null); }} testId="save-content" />
    </div>
  );
}

type Patch = <K extends keyof SiteContent>(k: K, v: Partial<SiteContent[K]>) => void;
type SetDraft = React.Dispatch<React.SetStateAction<SiteContent>>;

/* ------------------------------- Homepage ------------------------------- */

function SiteSections({ c, setDraft, patch }: { c: SiteContent; setDraft: SetDraft; patch: Patch }) {
  type Item = { key: string; builtIn?: SectionId; custom?: CustomSection; order: number };
  const ordered: Item[] = [
    ...(Object.keys(c.sections) as SectionId[]).map((id) => ({ key: id, builtIn: id, order: c.sections[id].order })),
    ...(c.customSections ?? []).map((cs) => ({ key: `custom-${cs.id}`, custom: cs, order: cs.order })),
  ].sort((a, b) => a.order - b.order);
  const setSection = (id: SectionId, v: Partial<SiteContent["sections"][SectionId]>) =>
    setDraft((d) => ({ ...d, sections: { ...d.sections, [id]: { ...d.sections[id], ...v } } }));
  const setCustom = (id: string, v: Partial<CustomSection>) =>
    setDraft((d) => ({ ...d, customSections: d.customSections.map((x) => (x.id === id ? { ...x, ...v } : x)) }));
  const setOrder = (it: Item, order: number) => (it.builtIn ? setSection(it.builtIn, { order }) : setCustom(it.custom!.id, { order }));
  const move = (i: number, dir: -1 | 1) => {
    // Renumber everything so orders stay unique, then swap the two neighbours.
    const list = ordered.map((it, idx) => ({ it, order: idx + 1 }));
    const a = list[i], b = list[i + dir];
    [a.order, b.order] = [b.order, a.order];
    list.forEach(({ it, order }) => setOrder(it, order));
  };
  const addCustom = () => {
    const id = uid("sec");
    setDraft((d) => ({
      ...d,
      customSections: [...(d.customSections ?? []), { id, visible: true, order: ordered.length + 1, eyebrow: "", title: "New section", body: "", imageSide: "right", ctaLabel: "", ctaHref: "", tone: "light" }],
    }));
    setOpen(`custom-${id}`);
  };
  const label = (it: Item) => (it.builtIn ? SECTION_NAMES[it.builtIn] : `Custom: ${it.custom!.title || "Untitled"}`);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      <Card title="Hero (first screen)">
        <TextInput id="h-eyebrow" label="Small heading" value={c.hero.eyebrow} onChange={(v) => patch("hero", { eyebrow: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput id="h-title" label="Main heading" value={c.hero.title} onChange={(v) => patch("hero", { title: v })} />
          <TextInput id="h-highlight" label="Highlighted words (gold, italic)" value={c.hero.highlight} onChange={(v) => patch("hero", { highlight: v })} />
        </div>
        <TextArea id="h-intro" label="Introduction" value={c.hero.intro} onChange={(v) => patch("hero", { intro: v })} rows={3} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput id="h-cta1" label="Primary button" value={c.hero.primaryCta} onChange={(v) => patch("hero", { primaryCta: v })} />
          <TextInput id="h-cta2" label="Secondary button" value={c.hero.secondaryCta} onChange={(v) => patch("hero", { secondaryCta: v })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {c.hero.badges.map((b, i) => (
            <div key={i} className="rounded-2xl border border-line p-3">
              <TextInput id={`hb-t-${i}`} label={`Badge ${i + 1} title`} value={b.title} onChange={(v) => patch("hero", { badges: c.hero.badges.map((x, j) => (j === i ? { ...x, title: v } : x)) })} />
              <TextInput id={`hb-x-${i}`} label="Text" value={b.text} onChange={(v) => patch("hero", { badges: c.hero.badges.map((x, j) => (j === i ? { ...x, text: v } : x)) })} className="mt-2" />
            </div>
          ))}
        </div>
        <ImageUpload label="Background image (optional, shown very subtly)" value={c.hero.backgroundImage} onChange={(v) => patch("hero", { backgroundImage: v })} folder="site" aspect="aspect-video" testId="hero-bg" />
        <p className="hint">The doctor&apos;s portrait is managed under <strong>Doctor profile</strong>.</p>
      </Card>

      <Card title="Homepage sections" description="Show, hide, reorder and edit sections, or add your own.">
        <ul className="divide-y divide-line rounded-2xl border border-line" data-testid="section-list">
          {ordered.map((it, i) => {
            const visible = it.builtIn ? c.sections[it.builtIn].visible : it.custom!.visible;
            const setVisible = (v: boolean) => (it.builtIn ? setSection(it.builtIn, { visible: v }) : setCustom(it.custom!.id, { visible: v }));
            return (
              <li key={it.key} className="p-3" data-section-admin={it.key}>
                <div className="flex flex-wrap items-center gap-2">
                  <MoveButtons label={label(it)} onUp={i > 0 ? () => move(i, -1) : undefined} onDown={i < ordered.length - 1 ? () => move(i, 1) : undefined} />
                  <span className={`flex-1 font-medium ${visible ? "text-charcoal" : "text-muted line-through"}`}>{label(it)}</span>
                  <Switch label="Visible" checked={visible} onChange={setVisible} testId={`visible-${it.key}`} />
                  <button type="button" className="btn btn-ghost btn-sm" aria-expanded={open === it.key} onClick={() => setOpen(open === it.key ? null : it.key)}>
                    Edit<span className="sr-only"> {label(it)}</span><Icon name="chevron" size={14} className={open === it.key ? "rotate-180" : ""} />
                  </button>
                  {it.custom && (
                    <button type="button" className="rounded-full p-2 text-muted hover:bg-cream hover:text-danger" aria-label={`Delete ${label(it)}`}
                      onClick={() => setDraft((d) => ({ ...d, customSections: d.customSections.filter((x) => x.id !== it.custom!.id) }))}>
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </div>
                {open === it.key && it.builtIn && (
                  <div className="mt-3 grid gap-3 rounded-2xl bg-cream/50 p-3">
                    <TextInput id={`s-${it.key}-eyebrow`} label="Small heading" value={c.sections[it.builtIn].eyebrow} onChange={(v) => setSection(it.builtIn!, { eyebrow: v })} />
                    <TextInput id={`s-${it.key}-title`} label="Heading" value={c.sections[it.builtIn].title} onChange={(v) => setSection(it.builtIn!, { title: v })} />
                    <TextArea id={`s-${it.key}-intro`} label="Paragraph" value={c.sections[it.builtIn].intro} onChange={(v) => setSection(it.builtIn!, { intro: v })} rows={3} />
                  </div>
                )}
                {open === it.key && it.custom && (
                  <div className="mt-3 grid gap-3 rounded-2xl bg-cream/50 p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TextInput id={`cs-${it.key}-eyebrow`} label="Small heading" value={it.custom.eyebrow} onChange={(v) => setCustom(it.custom!.id, { eyebrow: v })} />
                      <TextInput id={`cs-${it.key}-title`} label="Heading" value={it.custom.title} onChange={(v) => setCustom(it.custom!.id, { title: v })} />
                    </div>
                    <TextArea id={`cs-${it.key}-body`} label="Text" value={it.custom.body} onChange={(v) => setCustom(it.custom!.id, { body: v })} rows={4} />
                    <ImageUpload label="Image (optional)" value={it.custom.image} onChange={(v) => setCustom(it.custom!.id, { image: v })} folder="site" testId={`cs-image-${it.custom.id}`} />
                    <div className="grid gap-3 sm:grid-cols-4">
                      <TextInput id={`cs-${it.key}-cta`} label="Button text" value={it.custom.ctaLabel} onChange={(v) => setCustom(it.custom!.id, { ctaLabel: v })} />
                      <TextInput id={`cs-${it.key}-href`} label="Button link" value={it.custom.ctaHref} onChange={(v) => setCustom(it.custom!.id, { ctaHref: v })} placeholder="/book" />
                      <div>
                        <label htmlFor={`cs-${it.key}-tone`} className="label">Background</label>
                        <select id={`cs-${it.key}-tone`} className="field" value={it.custom.tone} onChange={(e) => setCustom(it.custom!.id, { tone: e.target.value as CustomSection["tone"] })}>
                          <option value="light">Light</option><option value="cream">Cream</option><option value="dark">Dark</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`cs-${it.key}-side`} className="label">Image side</label>
                        <select id={`cs-${it.key}-side`} className="field" value={it.custom.imageSide} onChange={(e) => setCustom(it.custom!.id, { imageSide: e.target.value as CustomSection["imageSide"] })}>
                          <option value="left">Left</option><option value="right">Right</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <button type="button" className="btn btn-ghost btn-sm" onClick={addCustom}><Icon name="plus" size={16} /> Add a new section</button>
      </Card>

      <Card title="Why choose us">
        {c.why.map((w, i) => (
          <div key={i} className="grid gap-3 rounded-2xl border border-line p-3 sm:grid-cols-[1fr_2fr_auto]">
            <TextInput id={`w-t-${i}`} label="Title" value={w.title} onChange={(v) => setDraft((d) => ({ ...d, why: d.why.map((x, j) => (j === i ? { ...x, title: v } : x)) }))} />
            <TextArea id={`w-x-${i}`} label="Text" value={w.text} rows={2} onChange={(v) => setDraft((d) => ({ ...d, why: d.why.map((x, j) => (j === i ? { ...x, text: v } : x)) }))} />
            <button type="button" className="self-end rounded-full p-2.5 text-muted hover:bg-cream hover:text-danger" aria-label={`Remove ${w.title}`} onClick={() => setDraft((d) => ({ ...d, why: d.why.filter((_, j) => j !== i) }))}><Icon name="trash" size={18} /></button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft((d) => ({ ...d, why: [...d.why, { title: "New point", text: "" }] }))}><Icon name="plus" size={16} /> Add point</button>
      </Card>

      <Card title="Frequently asked questions">
        {c.faqs.map((f, i) => (
          <div key={i} className="grid gap-3 rounded-2xl border border-line p-3 sm:grid-cols-[1fr_1.5fr_auto]">
            <TextInput id={`faq-q-${i}`} label="Question" value={f.q} onChange={(v) => setDraft((d) => ({ ...d, faqs: d.faqs.map((x, j) => (j === i ? { ...x, q: v } : x)) }))} />
            <TextArea id={`faq-a-${i}`} label="Answer" value={f.a} rows={2} onChange={(v) => setDraft((d) => ({ ...d, faqs: d.faqs.map((x, j) => (j === i ? { ...x, a: v } : x)) }))} />
            <button type="button" className="self-end rounded-full p-2.5 text-muted hover:bg-cream hover:text-danger" aria-label={`Remove question ${i + 1}`} onClick={() => setDraft((d) => ({ ...d, faqs: d.faqs.filter((_, j) => j !== i) }))}><Icon name="trash" size={18} /></button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft((d) => ({ ...d, faqs: [...d.faqs, { q: "", a: "" }] }))}><Icon name="plus" size={16} /> Add question</button>
      </Card>

      <Card title="Announcement bar" description="A slim message across the top of every page, e.g. a seasonal offer.">
        <Switch label="Show announcement" checked={c.announcement.enabled} onChange={(v) => patch("announcement", { enabled: v })} testId="announcement-toggle" />
        <TextInput id="an-text" label="Message" value={c.announcement.text} onChange={(v) => patch("announcement", { text: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput id="an-label" label="Link text" value={c.announcement.linkLabel} onChange={(v) => patch("announcement", { linkLabel: v })} />
          <TextInput id="an-href" label="Link address" value={c.announcement.href} onChange={(v) => patch("announcement", { href: v })} placeholder="/pricing" />
        </div>
      </Card>

      <Card title="Search engines & footer">
        <TextInput id="seo-title" label="Website title (Google)" value={c.seo.title} onChange={(v) => patch("seo", { title: v })} maxLength={70} hint={`${c.seo.title.length}/70 characters`} />
        <TextArea id="seo-desc" label="Website description (Google)" value={c.seo.description} onChange={(v) => patch("seo", { description: v })} rows={2} hint={`${c.seo.description.length}/160 characters recommended`} />
        <TextArea id="ft-about" label="Footer text" value={c.footer.about} onChange={(v) => patch("footer", { about: v })} rows={2} />
        <TextArea id="ft-disc" label="Footer disclaimer" value={c.footer.disclaimer} onChange={(v) => patch("footer", { disclaimer: v })} rows={2} />
        <div className="rounded-2xl border border-dashed border-champagne p-3">
          <Switch label="Show 'preview' banner and hide site from Google" checked={c.previewBanner.enabled} onChange={(v) => patch("previewBanner", { enabled: v })} testId="preview-toggle" />
          <TextInput id="pv-text" label="Preview banner text" value={c.previewBanner.text} onChange={(v) => patch("previewBanner", { text: v })} className="mt-2" />
          <p className="hint">Turn this off when the website goes live.</p>
        </div>
      </Card>
    </>
  );
}

/* -------------------------------- Doctor -------------------------------- */

function DoctorSection({ c, patch }: { c: SiteContent; patch: Patch }) {
  const d = c.doctor;
  const set = (v: Partial<SiteContent["doctor"]>) => patch("doctor", v);
  return (
    <>
      <Card title="Photograph">
        <ImageUpload label="Doctor's portrait" value={d.photo} onChange={(v) => set({ photo: v })} folder="doctor" aspect="aspect-[4/5]" testId="doctor-photo"
          hint="A professional portrait in portrait orientation works best (at least 1200px tall)." />
      </Card>
      <Card title="Profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput id="d-name" label="Full name" value={d.name} onChange={(v) => set({ name: v })} />
          <TextInput id="d-designation" label="Professional designation" value={d.designation} onChange={(v) => set({ designation: v })} />
          <TextInput id="d-spec" label="Specialization" value={d.specialization} onChange={(v) => set({ specialization: v })} />
          <TextInput id="d-exp" label="Experience" value={d.experience} onChange={(v) => set({ experience: v })} placeholder="e.g. 12+ years" />
        </div>
        <TextInput id="d-reg" label="Professional registration" value={d.registration} onChange={(v) => set({ registration: v })} placeholder="e.g. PMDC registration number" />
        <TextArea id="d-short" label="Short introduction (homepage)" value={d.shortIntro} onChange={(v) => set({ shortIntro: v })} rows={2} />
        <TextArea id="d-bio" label="Biography (About page)" value={d.bio} onChange={(v) => set({ bio: v })} rows={6} />
      </Card>
      <Card title="Credentials">
        <div className="grid gap-4 sm:grid-cols-2">
          <LinesInput id="d-qual" label="Qualifications" value={d.qualifications} onChange={(v) => set({ qualifications: v })} />
          <LinesInput id="d-cert" label="Certifications" value={d.certifications} onChange={(v) => set({ certifications: v })} />
          <LinesInput id="d-ach" label="Professional achievements" value={d.achievements} onChange={(v) => set({ achievements: v })} />
          <LinesInput id="d-expertise" label="Areas of expertise" value={d.expertise} onChange={(v) => set({ expertise: v })} />
        </div>
      </Card>
    </>
  );
}

/* -------------------------------- Contact -------------------------------- */

function ContactSection({ c, patch }: { c: SiteContent; patch: Patch }) {
  const set = (v: Partial<SiteContent["contact"]>) => patch("contact", v);
  return (
    <>
      <Card title="Clinic contact details">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput id="ct-address" label="Address" value={c.contact.address} onChange={(v) => set({ address: v })} />
          <TextInput id="ct-city" label="City" value={c.contact.city} onChange={(v) => set({ city: v })} />
          <TextInput id="ct-phone" label="Phone number (as displayed)" value={c.contact.phone} onChange={(v) => set({ phone: v })} placeholder="+92 992 000000" />
          <TextInput id="ct-email" label="Email" type="email" value={c.contact.email} onChange={(v) => set({ email: v })} />
          <TextInput id="ct-wa" label="WhatsApp number" value={c.contact.whatsapp ? (c.contact.whatsapp.startsWith("92") ? `+${c.contact.whatsapp}` : c.contact.whatsapp) : ""} onChange={(v) => set({ whatsapp: v })} placeholder="0300 1234567" hint="Used by every WhatsApp button and for new-booking alerts." />
          <TextInput id="ct-alert" label="Email for new-booking alerts" type="email" value={c.contact.bookingAlertEmail} onChange={(v) => set({ bookingAlertEmail: v })} hint="Defaults to the clinic email." />
        </div>
        <TextInput id="ct-maps" label="Google Maps search" value={c.contact.mapsQuery} onChange={(v) => set({ mapsQuery: v })} hint="Exactly what you would type into Google Maps to find the clinic." />
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.contact.mapsQuery)}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm w-fit"><Icon name="pin" size={16} /> Test map link</a>
      </Card>
      <Card title="Social media" description="Leave empty to hide an icon.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput id="so-ig" label="Instagram URL" value={c.social.instagram} onChange={(v) => patch("social", { instagram: v })} placeholder="https://instagram.com/yourclinic" />
          <TextInput id="so-fb" label="Facebook URL" value={c.social.facebook} onChange={(v) => patch("social", { facebook: v })} placeholder="https://facebook.com/yourclinic" />
          <TextInput id="so-yt" label="YouTube URL" value={c.social.youtube} onChange={(v) => patch("social", { youtube: v })} />
          <TextInput id="so-tt" label="TikTok URL" value={c.social.tiktok} onChange={(v) => patch("social", { tiktok: v })} />
        </div>
      </Card>
    </>
  );
}

/* ------------------------------- Appearance ------------------------------- */

function AppearanceSection({ c, patch, setDraft }: { c: SiteContent; patch: Patch; setDraft: SetDraft }) {
  const t = c.theme;
  const setTheme = (v: Partial<ThemeConfig>) => setDraft((d) => ({ ...d, theme: { ...d.theme, ...v } }));
  const accentRatio = contrast(t.accent, t.background);
  const inkRatio = contrast(t.ink, t.background);
  const btnRatio = contrast(t.accentText, t.accent);
  return (
    <>
      <Card title="Clinic name & logo">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput id="b-name" label="Clinic name" value={c.brand.clinicName} onChange={(v) => patch("brand", { clinicName: v })} />
          <TextInput id="b-short" label="Short name (logo text)" value={c.brand.shortName} onChange={(v) => patch("brand", { shortName: v })} />
          <TextInput id="b-tagline" label="Tagline (under logo)" value={c.brand.tagline} onChange={(v) => patch("brand", { tagline: v })} />
          <TextInput id="b-currency" label="Currency" value={c.currency} onChange={(v) => setDraft((d) => ({ ...d, currency: v.toUpperCase().slice(0, 4) }))} />
        </div>
        <ImageUpload label="Logo (optional: replaces the text logo)" value={c.brand.logo} onChange={(v) => patch("brand", { logo: v })} folder="brand" aspect="aspect-[3/1]" testId="logo-upload"
          hint="Transparent PNG or WebP works best, at least 400px wide." />
      </Card>
      <Card title="Colours">
        <div role="group" aria-label="Colour presets" className="flex flex-wrap gap-3">
          {Object.entries(THEME_PRESETS).map(([name, p]) => (
            <button key={name} type="button" aria-pressed={t.preset === name} onClick={() => setTheme({ preset: name, ...p })}
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium capitalize ${t.preset === name ? "border-charcoal ring-2 ring-charcoal/20" : "border-sand"}`} data-preset={name}>
              <span className="flex">{[p.background, p.cream, p.accent, p.ink].map((col) => <span key={col} className="-ml-1 h-5 w-5 rounded-full border border-white first:ml-0" style={{ background: col }} />)}</span>
              {name}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {([["background", "Background"], ["cream", "Section background"], ["surface", "Card background"], ["accent", "Accent (gold)"], ["accentText", "Text on accent"], ["ink", "Headings"]] as [keyof ThemeConfig, string][]).map(([k, label]) => (
            <div key={k}>
              <label htmlFor={`th-${k}`} className="label">{label}</label>
              <div className="flex items-center gap-2">
                <input id={`th-${k}`} type="color" className="h-11 w-14 cursor-pointer rounded-lg border border-sand bg-transparent" value={t[k] as string} onChange={(e) => setTheme({ [k]: e.target.value, preset: "custom" })} />
                <code className="text-sm text-muted">{t[k] as string}</code>
              </div>
            </div>
          ))}
        </div>
        <ul className="space-y-1 text-sm">
          <ContrastLine label="Accent text on background" ratio={accentRatio} />
          <ContrastLine label="Headings on background" ratio={inkRatio} />
          <ContrastLine label="Button text on accent" ratio={btnRatio} />
        </ul>
      </Card>
      <Card title="Typography">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="font-h" className="label">Headings</label>
            <select id="font-h" className="field" value={t.headingFont} onChange={(e) => setTheme({ headingFont: e.target.value as ThemeConfig["headingFont"] })}>
              {Object.entries(FONT_LABELS.heading).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <p className="mt-3 text-3xl text-charcoal" style={{ fontFamily: `var(--font-${t.headingFont})` }}>Radiant, healthy skin</p>
          </div>
          <div>
            <label htmlFor="font-b" className="label">Body text</label>
            <select id="font-b" className="field" value={t.bodyFont} onChange={(e) => setTheme({ bodyFont: e.target.value as ThemeConfig["bodyFont"] })}>
              {Object.entries(FONT_LABELS.body).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <p className="mt-3 text-base text-muted" style={{ fontFamily: `var(--font-${t.bodyFont})` }}>Every plan begins with a proper diagnosis and honest advice.</p>
          </div>
        </div>
        <p className="hint">Changes preview on the website after you save.</p>
      </Card>
    </>
  );
}

function ContrastLine({ label, ratio }: { label: string; ratio: number }) {
  const ok = ratio >= 4.5;
  return (
    <li className={`flex items-center gap-2 ${ok ? "text-success" : "text-danger"}`}>
      <Icon name={ok ? "check" : "info"} size={16} /> {label}: {ratio.toFixed(1)}:1 {ok ? "(readable)" : "(too low: aim for 4.5:1 or more)"}
    </li>
  );
}
