"use client";

import { useState } from "react";
import { CATEGORIES, MENU_CATEGORIES } from "@/lib/categories";
import { getContent, saveContent } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import { SEED_CONTENT } from "@/lib/data/seed";
import type { HomeSection, HomeSectionType, SiteContent, TeamMember, Testimonial, ThemeConfig } from "@/lib/data/types";
import { uid } from "@/lib/id";
import { normalisePhone, toWhatsAppDigits } from "@/lib/phone";
import { FONT_LABELS, PRESET_LABELS, THEME_PRESETS, contrast, deriveTheme } from "@/lib/theme";
import { Icon } from "../ui/Icon";
import { Card, ImageUpload, MoveButtons, SaveBar, Switch, TextArea, TextInput, errorMessage, useDraft, useToast } from "./ui";

type Section = "site" | "team" | "contact" | "appearance";

/* ------------------------------ section library ------------------------------ */

const LIBRARY: Record<HomeSectionType, { name: string; description: string; make: () => Omit<HomeSection, "id" | "type" | "visible"> }> = {
  hero: { name: "Hero", description: "Large photograph, headline and booking buttons.", make: () => ({ eyebrow: "", title: "A new headline,", highlight: "beautifully said.", intro: "", image: "/images/hero-skin.jpg", imageAlt: "", ctaLabel: "Book an Appointment", ctaHref: "/book", secondaryLabel: "Explore Treatments", secondaryHref: "/treatments" }) },
  treatments: { name: "Treatment cards", description: "Cards with image, name, description and Learn more.", make: () => ({ eyebrow: "Treatments", title: "Popular treatments", intro: "", category: "featured", limit: 6, ctaLabel: "View all treatments", ctaHref: "/treatments" }) },
  about: { name: "About the clinic", description: "Photograph, philosophy and the three values from the About page.", make: () => ({ eyebrow: "About the clinic", title: "Our philosophy", intro: "", image: "/images/about-serum.jpg", imageAlt: "", imageSide: "left", ctaLabel: "About us", ctaHref: "/about" }) },
  why: { name: "Why choose us", description: "Icons with short reasons. Edit the points under “Why choose us” below.", make: () => ({ eyebrow: "Why choose us", title: "Care you can feel confident in.", intro: "" }) },
  beforeAfter: { name: "Before & after", description: "Consented results from Admin → Before & after.", make: () => ({ eyebrow: "Results", title: "Before & after", intro: "", ctaLabel: "View the gallery", ctaHref: "/before-after" }) },
  testimonials: { name: "Reviews & testimonials", description: "Rating summary and approved testimonials (Team & reviews tab).", make: () => ({ eyebrow: "Client reviews", title: "Loved by our clients", intro: "", limit: 6 }) },
  team: { name: "Meet the team", description: "Portraits and credentials (Team & reviews tab).", make: () => ({ eyebrow: "Meet the team", title: "The people behind your care", intro: "" }) },
  booking: { name: "Appointment banner", description: "Dark banner with Book and Call buttons.", make: () => ({ eyebrow: "Appointments", title: "Book your visit", intro: "", ctaLabel: "Book an Appointment", ctaHref: "/book", image: "/images/s-serum.jpg", imageAlt: "" }) },
  location: { name: "Location & hours", description: "Address, map, directions, hours and visit notes.", make: () => ({ eyebrow: "Visit us", title: "Find us", intro: "" }) },
  faq: { name: "FAQ", description: "Questions and answers (edit below).", make: () => ({ eyebrow: "FAQ", title: "Questions, answered", intro: "" }) },
  concerns: { name: "Skin concerns", description: "Cards linking to each skin-concern page.", make: () => ({ eyebrow: "Shop by concern", title: "What would you like to change?", intro: "", limit: 8 }) },
  pricing: { name: "Price list", description: "Short price list linking to the Pricing page.", make: () => ({ eyebrow: "Pricing", title: "Clear, upfront pricing", intro: "", limit: 8 }) },
  journal: { name: "Journal articles", description: "Latest articles from the blog.", make: () => ({ eyebrow: "Journal", title: "Skincare, explained", intro: "", limit: 3 }) },
  custom: { name: "Custom text & image", description: "Your own heading, text, optional image and button.", make: () => ({ eyebrow: "", title: "New section", intro: "", imageSide: "right", tone: "light", ctaLabel: "", ctaHref: "" }) },
};

const sectionLabel = (s: HomeSection) => `${LIBRARY[s.type].name}${s.title ? `: ${s.title}` : ""}`;

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
      const n = normalisePhone(raw.startsWith("+") || raw.length <= 14 ? raw : `+${raw}`);
      if (!n) return setError("WhatsApp number looks invalid. Use e.g. (909) 516-7066, or + and the country code.");
      whatsapp = toWhatsAppDigits(n);
    }
    if (c.contact.phone.trim() && !normalisePhone(c.contact.phone)) return setError("Phone number looks invalid. Use e.g. (909) 516-7066.");
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
    site: ["Homepage & pages", "Build the homepage from sections: edit, reorder, hide, duplicate or remove each one, or add new ones."],
    team: ["Team & reviews", "Team profiles, client testimonials and your public rating."],
    contact: ["Contact & visit", "Address, phone, email, map, visit notes and social links."],
    appearance: ["Branding & appearance", "Clinic name, logo, colors and typography."],
  };

  return (
    <div>
      <h1 className="text-4xl sm:text-5xl">{titles[section][0]}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">{titles[section][1]}</p>
      <div className="mt-6 space-y-6">
        {section === "site" && <SiteSections c={c} setDraft={setDraft} patch={patch} />}
        {section === "team" && <TeamAndReviews c={c} setDraft={setDraft} patch={patch} />}
        {section === "contact" && <ContactSection c={c} setDraft={setDraft} patch={patch} />}
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
  const [open, setOpen] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [newType, setNewType] = useState<HomeSectionType>("custom");
  const list = c.homeSections;
  const setList = (fn: (l: HomeSection[]) => HomeSection[]) => setDraft((d) => ({ ...d, homeSections: fn(d.homeSections) }));
  const update = (id: string, v: Partial<HomeSection>) => setList((l) => l.map((s) => (s.id === id ? { ...s, ...v } : s)));
  const move = (i: number, dir: -1 | 1) =>
    setList((l) => {
      const n = [...l];
      [n[i], n[i + dir]] = [n[i + dir], n[i]];
      return n;
    });
  const duplicate = (i: number) => {
    const id = uid("sec");
    setList((l) => [...l.slice(0, i + 1), { ...structuredClone(l[i]), id }, ...l.slice(i + 1)]);
    setOpen(id);
  };
  const remove = (id: string) => {
    setList((l) => l.filter((s) => s.id !== id));
    setConfirmRemove(null);
  };
  const add = () => {
    const id = uid("sec");
    setList((l) => [...l, { id, type: newType, visible: true, ...LIBRARY[newType].make() }]);
    setOpen(id);
  };

  return (
    <>
      <Card title="Homepage sections" description="Sections appear on the homepage in this order. The footer is shared by every page and is edited under “Search engines & footer”.">
        <ol className="divide-y divide-line border border-line bg-surface" data-testid="section-list">
          {list.map((s, i) => {
            const label = sectionLabel(s);
            const isOpen = open === s.id;
            return (
              <li key={s.id} className="p-3" data-section-admin={s.id} data-section-type={s.type}>
                <div className="flex flex-wrap items-center gap-2">
                  <MoveButtons label={label} onUp={i > 0 ? () => move(i, -1) : undefined} onDown={i < list.length - 1 ? () => move(i, 1) : undefined} />
                  <span className={`min-w-0 flex-1 basis-40 ${s.visible ? "text-charcoal" : "text-muted line-through"}`}>
                    <span className="block text-[0.68rem] font-medium uppercase tracking-[0.14em] text-gold">{LIBRARY[s.type].name}</span>
                    <span className="block truncate font-medium">{s.title || "Untitled"}</span>
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <Switch label="Visible" checked={s.visible} onChange={(v) => update(s.id, { visible: v })} testId={`visible-${s.id}`} />
                    <button type="button" className="btn btn-ghost btn-sm" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.id)}>
                      Edit<span className="sr-only"> {label}</span><Icon name="chevron" size={14} className={isOpen ? "rotate-180" : ""} />
                    </button>
                    <button type="button" className="flex h-11 w-10 items-center justify-center text-muted hover:text-charcoal" aria-label={`Duplicate ${label}`} title="Duplicate" onClick={() => duplicate(i)}>
                      <Icon name="copy" size={17} />
                    </button>
                    <button type="button" className="flex h-11 w-10 items-center justify-center text-muted hover:text-danger" aria-label={`Remove ${label}`} title="Remove" onClick={() => setConfirmRemove(s.id)}>
                      <Icon name="trash" size={17} />
                    </button>
                  </div>
                </div>
                {confirmRemove === s.id && (
                  <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 border border-danger/30 bg-danger/5 p-3 text-sm">
                    <span className="flex-1">Remove “{label}” from the homepage? You can add it again later from the library.</span>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmRemove(null)}>Keep</button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => remove(s.id)}>Remove section</button>
                  </div>
                )}
                {isOpen && <SectionEditor s={s} update={(v) => update(s.id, v)} />}
              </li>
            );
          })}
        </ol>
        {list.length === 0 && <p className="text-sm text-muted">The homepage has no sections. Add one below.</p>}
        <div className="flex flex-col gap-3 border border-dashed border-sand p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="new-section-type" className="label">Add a section</label>
            <select id="new-section-type" className="field" value={newType} onChange={(e) => setNewType(e.target.value as HomeSectionType)}>
              {(Object.keys(LIBRARY) as HomeSectionType[]).map((t) => <option key={t} value={t}>{LIBRARY[t].name}</option>)}
            </select>
            <p className="hint">{LIBRARY[newType].description}</p>
          </div>
          <button type="button" className="btn btn-primary btn-sm sm:mb-6" onClick={add} data-testid="add-section"><Icon name="plus" size={16} /> Add section</button>
        </div>
      </Card>

      <Card title="Why choose us" description="Only list strengths you can verify.">
        {c.why.map((w, i) => (
          <div key={i} className="grid gap-3 border border-line p-3 sm:grid-cols-[1fr_2fr_9rem_auto]">
            <TextInput id={`w-t-${i}`} label="Title" value={w.title} onChange={(v) => setDraft((d) => ({ ...d, why: d.why.map((x, j) => (j === i ? { ...x, title: v } : x)) }))} />
            <TextArea id={`w-x-${i}`} label="Text" value={w.text} rows={2} onChange={(v) => setDraft((d) => ({ ...d, why: d.why.map((x, j) => (j === i ? { ...x, text: v } : x)) }))} />
            <div>
              <label htmlFor={`w-i-${i}`} className="label">Icon</label>
              <select id={`w-i-${i}`} className="field" value={w.icon ?? ""} onChange={(e) => setDraft((d) => ({ ...d, why: d.why.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)) }))}>
                {["star", "sparkle", "clock", "accessible", "shield", "heart", "leaf", "user"].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button type="button" className="flex h-11 w-11 items-center justify-center self-end text-muted hover:text-danger" aria-label={`Remove ${w.title}`} onClick={() => setDraft((d) => ({ ...d, why: d.why.filter((_, j) => j !== i) }))}><Icon name="trash" size={18} /></button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft((d) => ({ ...d, why: [...d.why, { title: "New point", text: "", icon: "sparkle" }] }))}><Icon name="plus" size={16} /> Add point</button>
      </Card>

      <Card title="About page" description="Shown on /about. The three values also appear in the homepage “About” section.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput id="ab-eyebrow" label="Small heading" value={c.about.eyebrow} onChange={(v) => patch("about", { eyebrow: v })} />
          <TextInput id="ab-title" label="Heading" value={c.about.title} onChange={(v) => patch("about", { title: v })} />
        </div>
        <TextArea id="ab-body" label="Text" hint="Leave a blank line between paragraphs." value={c.about.body} onChange={(v) => patch("about", { body: v })} rows={8} />
        <ImageUpload label="Image" value={c.about.image} onChange={(v) => patch("about", { image: v })} folder="site" aspect="aspect-[4/5]" testId="about-image" />
        <div className="grid gap-3 sm:grid-cols-3">
          {c.about.values.map((v, i) => (
            <div key={i} className="space-y-2 border border-line p-3">
              <TextInput id={`ab-v-t-${i}`} label={`Value ${i + 1}`} value={v.title} onChange={(x) => patch("about", { values: c.about.values.map((y, j) => (j === i ? { ...y, title: x } : y)) })} />
              <TextArea id={`ab-v-x-${i}`} label="Text" value={v.text} rows={2} onChange={(x) => patch("about", { values: c.about.values.map((y, j) => (j === i ? { ...y, text: x } : y)) })} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Frequently asked questions">
        {c.faqs.map((f, i) => (
          <div key={i} className="grid gap-3 border border-line p-3 sm:grid-cols-[1fr_1.5fr_auto]">
            <TextInput id={`faq-q-${i}`} label="Question" value={f.q} onChange={(v) => setDraft((d) => ({ ...d, faqs: d.faqs.map((x, j) => (j === i ? { ...x, q: v } : x)) }))} />
            <TextArea id={`faq-a-${i}`} label="Answer" value={f.a} rows={2} onChange={(v) => setDraft((d) => ({ ...d, faqs: d.faqs.map((x, j) => (j === i ? { ...x, a: v } : x)) }))} />
            <button type="button" className="flex h-11 w-11 items-center justify-center self-end text-muted hover:text-danger" aria-label={`Remove question ${i + 1}`} onClick={() => setDraft((d) => ({ ...d, faqs: d.faqs.filter((_, j) => j !== i) }))}><Icon name="trash" size={18} /></button>
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
        <div className="border border-dashed border-champagne p-3">
          <Switch label="Preview mode: show banner, show placeholders, hide site from Google" checked={c.previewBanner.enabled} onChange={(v) => patch("previewBanner", { enabled: v })} testId="preview-toggle" />
          <TextInput id="pv-text" label="Preview banner text" value={c.previewBanner.text} onChange={(v) => patch("previewBanner", { text: v })} className="mt-2" />
          <p className="hint">Turn this off when the website goes live. Empty sections (team, results, testimonials) are then hidden automatically.</p>
        </div>
      </Card>
    </>
  );
}

function SectionEditor({ s, update }: { s: HomeSection; update: (v: Partial<HomeSection>) => void }) {
  const id = (k: string) => `s-${s.id}-${k}`;
  const has = (...types: HomeSectionType[]) => types.includes(s.type);
  return (
    <div className="mt-3 grid gap-4 bg-cream/60 p-4">
      <p className="text-sm text-muted">{LIBRARY[s.type].description}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput id={id("eyebrow")} label="Small heading" value={s.eyebrow} onChange={(v) => update({ eyebrow: v })} />
        <TextInput id={id("title")} label="Heading" value={s.title} onChange={(v) => update({ title: v })} />
      </div>
      {has("hero") && <TextInput id={id("highlight")} label="Highlighted words (italic, after the heading)" value={s.highlight ?? ""} onChange={(v) => update({ highlight: v })} />}
      <TextArea id={id("intro")} label={has("custom") ? "Text" : "Paragraph"} value={s.intro} onChange={(v) => update({ intro: v })} rows={3} />
      {has("hero", "about", "booking", "custom") && (
        <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
          <ImageUpload label={has("booking") ? "Background image" : "Image"} value={s.image} onChange={(v) => update({ image: v })} folder="site" aspect={has("hero", "about") ? "aspect-[4/5]" : "aspect-[4/3]"} testId={`image-${s.id}`} />
          <TextInput id={id("alt")} label="Image description (for screen readers)" value={s.imageAlt ?? ""} onChange={(v) => update({ imageAlt: v })} hint="Describe the photo in a few words. Leave empty if it is purely decorative." />
        </div>
      )}
      {has("hero", "about", "treatments", "booking", "custom", "beforeAfter") && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput id={id("cta")} label="Button text" value={s.ctaLabel ?? ""} onChange={(v) => update({ ctaLabel: v })} />
          <TextInput id={id("href")} label="Button link" value={s.ctaHref ?? ""} onChange={(v) => update({ ctaHref: v })} placeholder="/book" />
        </div>
      )}
      {has("hero") && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput id={id("cta2")} label="Second button text" value={s.secondaryLabel ?? ""} onChange={(v) => update({ secondaryLabel: v })} />
          <TextInput id={id("href2")} label="Second button link" value={s.secondaryHref ?? ""} onChange={(v) => update({ secondaryHref: v })} placeholder="/treatments" />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {has("treatments") && (
          <div>
            <label htmlFor={id("category")} className="label">Show</label>
            <select id={id("category")} className="field" value={s.category ?? "featured"} onChange={(e) => update({ category: e.target.value as HomeSection["category"] })}>
              <option value="featured">Featured treatments first</option>
              <option value="all">All treatments</option>
              {MENU_CATEGORIES.map((k) => <option key={k} value={k}>{CATEGORIES[k].label}</option>)}
            </select>
          </div>
        )}
        {has("treatments", "testimonials", "concerns", "pricing", "journal") && (
          <TextInput id={id("limit")} label="How many" type="number" value={String(s.limit ?? 6)} onChange={(v) => update({ limit: Math.max(1, Math.min(24, Number(v) || 1)) })} />
        )}
        {!has("hero", "booking") && (
          <div>
            <label htmlFor={id("tone")} className="label">Background</label>
            <select id={id("tone")} className="field" value={s.tone ?? ""} onChange={(e) => update({ tone: (e.target.value || undefined) as HomeSection["tone"] })}>
              <option value="">Default</option><option value="light">Ivory</option><option value="cream">Champagne beige</option><option value="dark">Charcoal</option>
            </select>
          </div>
        )}
        {has("about", "custom") && (
          <div>
            <label htmlFor={id("side")} className="label">Image side</label>
            <select id={id("side")} className="field" value={s.imageSide ?? "left"} onChange={(e) => update({ imageSide: e.target.value as HomeSection["imageSide"] })}>
              <option value="left">Left</option><option value="right">Right</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- Team & reviews ---------------------------- */

function TeamAndReviews({ c, setDraft, patch }: { c: SiteContent; setDraft: SetDraft; patch: Patch }) {
  const setTeam = (fn: (t: TeamMember[]) => TeamMember[]) => setDraft((d) => ({ ...d, team: fn(d.team) }));
  const setQuotes = (fn: (t: Testimonial[]) => Testimonial[]) => setDraft((d) => ({ ...d, testimonials: fn(d.testimonials) }));
  const r = c.reviews;
  return (
    <>
      <Card title="Rating summary" description="Shown in the hero and reviews section. Copy the numbers from your Google Business Profile and update the date whenever they change.">
        <Switch label="Show rating on the website" checked={r.enabled} onChange={(v) => patch("reviews", { enabled: v })} testId="reviews-toggle" />
        <div className="grid gap-4 sm:grid-cols-4">
          <TextInput id="rv-rating" label="Average rating" type="number" value={String(r.rating)} onChange={(v) => patch("reviews", { rating: Math.max(0, Math.min(5, Number(v) || 0)) })} />
          <TextInput id="rv-count" label="Number of reviews" type="number" value={String(r.count)} onChange={(v) => patch("reviews", { count: Math.max(0, Math.round(Number(v) || 0)) })} />
          <TextInput id="rv-source" label="Source" value={r.source} onChange={(v) => patch("reviews", { source: v })} />
          <TextInput id="rv-asof" label="Checked on" type="date" value={r.asOf} onChange={(v) => patch("reviews", { asOf: v })} />
        </div>
        <TextInput id="rv-url" label="Link to your reviews" value={r.url} onChange={(v) => patch("reviews", { url: v })} />
      </Card>

      <Card title="Testimonials" description="Only real reviews, quoted accurately, with the client's permission. Never write or edit reviews on a client's behalf (FTC rules on consumer reviews).">
        {c.testimonials.length === 0 && <p className="text-sm text-muted">No testimonials yet.</p>}
        {c.testimonials.map((q, i) => (
          <div key={q.id} className="space-y-3 border border-line p-4" data-testimonial-admin={q.id}>
            <TextArea id={`q-text-${i}`} label="Review text (exactly as written)" value={q.quote} rows={3} onChange={(v) => setQuotes((t) => t.map((x) => (x.id === q.id ? { ...x, quote: v } : x)))} />
            <div className="grid gap-3 sm:grid-cols-4">
              <TextInput id={`q-author-${i}`} label="Name shown" value={q.author} onChange={(v) => setQuotes((t) => t.map((x) => (x.id === q.id ? { ...x, author: v } : x)))} hint="e.g. first name and initial" />
              <TextInput id={`q-source-${i}`} label="Source" value={q.source} onChange={(v) => setQuotes((t) => t.map((x) => (x.id === q.id ? { ...x, source: v } : x)))} />
              <TextInput id={`q-date-${i}`} label="Date" type="date" value={q.date ?? ""} onChange={(v) => setQuotes((t) => t.map((x) => (x.id === q.id ? { ...x, date: v || undefined } : x)))} />
              <TextInput id={`q-rating-${i}`} label="Stars (1–5)" type="number" value={String(q.rating ?? 5)} onChange={(v) => setQuotes((t) => t.map((x) => (x.id === q.id ? { ...x, rating: Math.max(1, Math.min(5, Number(v) || 5)) } : x)))} />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" className="h-5 w-5 accent-[#252525]" checked={q.permission} onChange={(e) => setQuotes((t) => t.map((x) => (x.id === q.id ? { ...x, permission: e.target.checked } : x)))} />
                The client gave permission to publish this review
              </label>
              <Switch label="Visible" checked={q.visible} onChange={(v) => setQuotes((t) => t.map((x) => (x.id === q.id ? { ...x, visible: v } : x)))} />
              <button type="button" className="btn btn-ghost btn-sm ml-auto !text-danger" onClick={() => setQuotes((t) => t.filter((x) => x.id !== q.id))}>Remove</button>
            </div>
            {q.visible && !q.permission && <p className="text-sm text-danger">Hidden on the website until permission is confirmed.</p>}
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" data-testid="add-testimonial" onClick={() => setQuotes((t) => [...t, { id: uid("tm"), quote: "", author: "", source: "Google", permission: false, visible: true, rating: 5 }])}><Icon name="plus" size={16} /> Add testimonial</button>
      </Card>

      <Card title="Team" description="Add team members once their names, roles and license details have been verified. The Meet the Team section appears when at least one member is visible.">
        {c.team.length === 0 && <p className="text-sm text-muted">No team members yet.</p>}
        {c.team.map((m, i) => (
          <div key={m.id} className="space-y-3 border border-line p-4" data-team-admin={m.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <MoveButtons label={m.name || "team member"} onUp={i > 0 ? () => setTeam((t) => { const n = [...t]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; }) : undefined} onDown={i < c.team.length - 1 ? () => setTeam((t) => { const n = [...t]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; }) : undefined} />
              <div className="flex items-center gap-2">
                <Switch label="Visible" checked={m.visible} onChange={(v) => setTeam((t) => t.map((x) => (x.id === m.id ? { ...x, visible: v } : x)))} />
                <button type="button" className="btn btn-ghost btn-sm !text-danger" onClick={() => setTeam((t) => t.filter((x) => x.id !== m.id))}>Remove</button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
              <ImageUpload label="Portrait" value={m.photo} onChange={(v) => setTeam((t) => t.map((x) => (x.id === m.id ? { ...x, photo: v } : x)))} folder="team" aspect="aspect-[4/5]" testId={`team-photo-${i}`} hint="Portrait orientation, at least 1200px tall." />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput id={`tm-name-${i}`} label="Full name" value={m.name} onChange={(v) => setTeam((t) => t.map((x) => (x.id === m.id ? { ...x, name: v } : x)))} />
                <TextInput id={`tm-role-${i}`} label="Role" value={m.role} onChange={(v) => setTeam((t) => t.map((x) => (x.id === m.id ? { ...x, role: v } : x)))} placeholder="e.g. Nurse Injector" />
                <TextInput id={`tm-cred-${i}`} label="Qualifications & license" value={m.credentials} onChange={(v) => setTeam((t) => t.map((x) => (x.id === m.id ? { ...x, credentials: v } : x)))} placeholder="e.g. RN, BSN" className="sm:col-span-2" />
                <TextArea id={`tm-bio-${i}`} label="Short biography" value={m.bio} rows={3} onChange={(v) => setTeam((t) => t.map((x) => (x.id === m.id ? { ...x, bio: v } : x)))} className="sm:col-span-2" />
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" data-testid="add-team-member" onClick={() => setTeam((t) => [...t, { id: uid("tm"), name: "", role: "", credentials: "", bio: "", visible: true }])}><Icon name="plus" size={16} /> Add team member</button>
      </Card>
    </>
  );
}

/* -------------------------------- Contact -------------------------------- */

function ContactSection({ c, setDraft, patch }: { c: SiteContent; setDraft: SetDraft; patch: Patch }) {
  const set = (v: Partial<SiteContent["contact"]>) => patch("contact", v);
  return (
    <>
      <Card title="Clinic contact details">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput id="ct-address" label="Street address" value={c.contact.address} onChange={(v) => set({ address: v })} />
          <TextInput id="ct-city" label="City, state & ZIP" value={c.contact.city} onChange={(v) => set({ city: v })} />
          <TextInput id="ct-phone" label="Phone number" value={c.contact.phone} onChange={(v) => set({ phone: v })} placeholder="(909) 516-7066" />
          <TextInput id="ct-email" label="Email" type="email" value={c.contact.email} onChange={(v) => set({ email: v })} />
          <TextInput id="ct-wa" label="WhatsApp number (optional)" value={c.contact.whatsapp ? `+${c.contact.whatsapp}` : ""} onChange={(v) => set({ whatsapp: v })} placeholder="Leave empty to hide WhatsApp" hint="Adds WhatsApp buttons and a WhatsApp option in booking." />
          <TextInput id="ct-alert" label="Email for new-booking alerts" type="email" value={c.contact.bookingAlertEmail} onChange={(v) => set({ bookingAlertEmail: v })} hint="Defaults to the clinic email." />
        </div>
        <TextInput id="ct-maps" label="Google Maps search" value={c.contact.mapsQuery} onChange={(v) => set({ mapsQuery: v })} hint="Exactly what you would type into Google Maps to find the clinic." />
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.contact.mapsQuery)}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm w-fit"><Icon name="pin" size={16} /> Test map link</a>
      </Card>
      <Card title="Good to know" description="Short notes shown with your address and hours, e.g. accessibility, parking and payment.">
        {c.visitInfo.map((v, i) => (
          <div key={i} className="grid gap-3 border border-line p-3 sm:grid-cols-[1fr_2fr_auto]">
            <TextInput id={`vi-t-${i}`} label="Title" value={v.title} onChange={(x) => setDraft((d) => ({ ...d, visitInfo: d.visitInfo.map((y, j) => (j === i ? { ...y, title: x } : y)) }))} />
            <TextArea id={`vi-x-${i}`} label="Text" value={v.text} rows={2} onChange={(x) => setDraft((d) => ({ ...d, visitInfo: d.visitInfo.map((y, j) => (j === i ? { ...y, text: x } : y)) }))} />
            <button type="button" className="flex h-11 w-11 items-center justify-center self-end text-muted hover:text-danger" aria-label={`Remove ${v.title}`} onClick={() => setDraft((d) => ({ ...d, visitInfo: d.visitInfo.filter((_, j) => j !== i) }))}><Icon name="trash" size={18} /></button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft((d) => ({ ...d, visitInfo: [...d.visitInfo, { title: "", text: "" }] }))}><Icon name="plus" size={16} /> Add note</button>
      </Card>
      <Card title="Social media" description="Leave empty to hide an icon.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput id="so-ig" label="Instagram URL" value={c.social.instagram} onChange={(v) => patch("social", { instagram: v })} placeholder="https://instagram.com/yourclinic" />
          <TextInput id="so-fb" label="Facebook URL" value={c.social.facebook} onChange={(v) => patch("social", { facebook: v })} placeholder="https://facebook.com/yourclinic" />
          <TextInput id="so-tt" label="TikTok URL" value={c.social.tiktok} onChange={(v) => patch("social", { tiktok: v })} />
          <TextInput id="so-yt" label="YouTube URL" value={c.social.youtube} onChange={(v) => patch("social", { youtube: v })} />
          <TextInput id="so-yelp" label="Yelp URL" value={c.social.yelp} onChange={(v) => patch("social", { yelp: v })} />
        </div>
      </Card>
    </>
  );
}

/* ------------------------------- Appearance ------------------------------- */

function AppearanceSection({ c, patch, setDraft }: { c: SiteContent; patch: Patch; setDraft: SetDraft }) {
  const t = c.theme;
  const setTheme = (v: Partial<ThemeConfig>) => setDraft((d) => ({ ...d, theme: { ...d.theme, ...v } }));
  const d = deriveTheme(t);
  const checks: [string, number, number][] = [
    ["Body text on background", contrast(t.ink, t.background), 4.5],
    ["Gold text on background", contrast(d.gold, t.background), 4.5],
    ["Gold text on champagne sections", contrast(d.gold, t.cream), 4.5],
    ["Secondary text on champagne sections", contrast(d.muted, t.cream), 4.5],
    ["Text on gold buttons", contrast(d.onGold, t.accent), 4.5],
    ["Form borders on white", contrast(d.sand, t.surface), 3],
  ];
  return (
    <>
      <Card title="Clinic name & logo">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput id="b-name" label="Clinic name" value={c.brand.clinicName} onChange={(v) => patch("brand", { clinicName: v })} />
          <TextInput id="b-short" label="Short name (logo text)" value={c.brand.shortName} onChange={(v) => patch("brand", { shortName: v })} />
          <TextInput id="b-tagline" label="Tagline (under logo)" value={c.brand.tagline} onChange={(v) => patch("brand", { tagline: v })} />
          <TextInput id="b-currency" label="Currency code" value={c.currency} onChange={(v) => setDraft((dr) => ({ ...dr, currency: v.toUpperCase().slice(0, 3) }))} hint="USD shows prices as $168." />
        </div>
        <ImageUpload label="Logo (optional: replaces the text logo)" value={c.brand.logo} onChange={(v) => patch("brand", { logo: v })} folder="brand" aspect="aspect-[3/1]" testId="logo-upload"
          hint="Transparent PNG or WebP works best, at least 400px wide." />
      </Card>
      <Card title="Colors" description="Pick your brand colors. Text shades are adjusted automatically so every page stays readable (WCAG AA).">
        <div role="group" aria-label="Color presets" className="flex flex-wrap gap-3">
          {Object.entries(THEME_PRESETS).map(([name, p]) => (
            <button key={name} type="button" aria-pressed={t.preset === name} onClick={() => setTheme({ preset: name, ...p })}
              className={`flex min-h-11 items-center gap-2 border px-3 py-2 text-sm font-medium ${t.preset === name ? "border-charcoal ring-2 ring-charcoal/20" : "border-sand"}`} data-preset={name}>
              <span className="flex">{[p.background, p.cream, p.accent, p.taupe, p.ink].map((col, i) => <span key={i} className="-ml-1 h-5 w-5 rounded-full border border-white first:ml-0" style={{ background: col }} />)}</span>
              {PRESET_LABELS[name] ?? name}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {([["background", "Page background (ivory)"], ["cream", "Section background (champagne)"], ["surface", "Cards (white)"], ["accent", "Accent (muted gold)"], ["taupe", "Hairlines (taupe)"], ["ink", "Text (charcoal)"]] as [keyof ThemeConfig, string][]).map(([k, label]) => (
            <div key={k}>
              <label htmlFor={`th-${k}`} className="label">{label}</label>
              <div className="flex items-center gap-2">
                <input id={`th-${k}`} type="color" className="h-11 w-14 cursor-pointer border border-sand bg-transparent" value={t[k] as string} onChange={(e) => setTheme({ [k]: e.target.value, preset: "custom" })} />
                <code className="text-sm text-muted">{t[k] as string}</code>
              </div>
            </div>
          ))}
        </div>
        <div className="border border-line p-4">
          <p className="label">Derived text colors</p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            {([["Gold text", d.gold], ["Secondary text", d.muted], ["Form borders", d.sand]] as const).map(([l, col]) => (
              <span key={l} className="flex items-center gap-2"><span className="h-5 w-5 border border-line" style={{ background: col }} /> {l} <code className="text-muted">{col}</code></span>
            ))}
          </div>
          <ul className="mt-4 space-y-1 text-sm">
            {checks.map(([label, ratio, min]) => <ContrastLine key={label} label={label} ratio={ratio} min={min} />)}
          </ul>
        </div>
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
            <label htmlFor="font-b" className="label">Body text, navigation & buttons</label>
            <select id="font-b" className="field" value={t.bodyFont} onChange={(e) => setTheme({ bodyFont: e.target.value as ThemeConfig["bodyFont"] })}>
              {Object.entries(FONT_LABELS.body).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <p className="mt-3 text-base text-muted" style={{ fontFamily: `var(--font-${t.bodyFont})` }}>Every treatment is personalized to you.</p>
          </div>
        </div>
        <p className="hint">Changes appear on the website after you save.</p>
      </Card>
    </>
  );
}

function ContrastLine({ label, ratio, min }: { label: string; ratio: number; min: number }) {
  const ok = ratio >= min;
  return (
    <li className={`flex items-center gap-2 ${ok ? "text-success" : "text-danger"}`}>
      <Icon name={ok ? "check" : "info"} size={16} /> {label}: {ratio.toFixed(1)}:1 {ok ? "(passes)" : `(too low: needs ${min}:1)`}
    </li>
  );
}
