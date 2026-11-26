"use client";

import { useSettingsDraft } from "@/components/admin/useSettings";
import { Card, Grid, Notice, Num, PageTitle, SaveBar, Select, SortableList, Text, Toggle, btn, inputCls } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { WEEKDAYS } from "@/lib/dates";
import { newId } from "@/lib/id";
import type { Settings, SocialLink } from "@/lib/types";
import { normalizePhone } from "@/lib/validation";

const PLATFORMS: SocialLink["platform"][] = ["instagram", "facebook", "tiktok", "whatsapp", "youtube", "booksy", "google", "other"];

export default function BusinessPage() {
  const { draft, setDraft, dirty, reset, saving, save } = useSettingsDraft();
  const b = draft.business;
  const setB = (p: Partial<Settings["business"]>) => setDraft({ ...draft, business: { ...b, ...p } });
  const setHour = (day: number, p: Partial<Settings["business"]["hours"][number]>) => setB({ hours: b.hours.map((h) => (h.day === day ? { ...h, ...p } : h)) });

  return (
    <>
      <PageTitle title="Business info & hours" description="Contact details, address, map, opening hours, social links and Google rating, everywhere on the website." />
      <div className="space-y-6">
        <Card title="Contact details">
          <Grid>
            <Text label="Business name" value={b.name} onChange={(v) => setB({ name: v })} />
            <Text label="Tagline" value={b.tagline} onChange={(v) => setB({ tagline: v })} />
            <Text label="Phone (as shown)" value={b.phoneDisplay} onChange={(v) => setB({ phoneDisplay: v, phone: normalizePhone(v) ?? b.phone })} hint={`Call buttons dial ${b.phone || "—"}`} />
            <Text label="Public email (optional)" value={b.email} onChange={(v) => setB({ email: v.trim() })} type="email" hint="Shown on the website. Leave empty to hide." />
            <Text label="Notification email (private)" value={b.notificationEmail} onChange={(v) => setB({ notificationEmail: v.trim() })} type="email" hint="New appointment requests and contact messages are sent here." />
            <Text label="Languages spoken" value={b.languages} onChange={(v) => setB({ languages: v })} placeholder="English, Español" />
          </Grid>
        </Card>

        <Card title="Address & map">
          <Grid>
            <Text label="Street" value={b.street} onChange={(v) => setB({ street: v })} />
            <Text label="Suite / unit" value={b.suite} onChange={(v) => setB({ suite: v })} />
            <Text label="City" value={b.city} onChange={(v) => setB({ city: v })} />
            <Grid><Text label="State" value={b.state} onChange={(v) => setB({ state: v })} /><Text label="ZIP" value={b.zip} onChange={(v) => setB({ zip: v })} /></Grid>
          </Grid>
          <Text label="Google Maps link (for 'Get directions')" value={b.mapsUrl} onChange={(v) => setB({ mapsUrl: v })} hint="Tip: open your business on Google Maps, press Share, and paste the link here." />
          <Text label="Map search text (embedded map)" value={b.mapsQuery} onChange={(v) => setB({ mapsQuery: v })} hint="Usually the business name and full address." />
          <Grid>
            <Text label="Latitude (optional, for Google structured data)" value={b.latitude} onChange={(v) => setB({ latitude: v.trim() })} placeholder="26.01…" />
            <Text label="Longitude (optional)" value={b.longitude} onChange={(v) => setB({ longitude: v.trim() })} placeholder="-80.1…" />
          </Grid>
        </Card>

        <Card title="Opening hours" description="Shown on the website and used for online appointment times.">
          <div className="space-y-2">
            {WEEKDAYS.map((d) => {
              const h = b.hours.find((x) => x.day === d.id)!;
              return (
                <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-stone-200 p-2.5" data-day={d.long}>
                  <span className="w-28 font-medium">{d.long}</span>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!h.closed} onChange={(e) => setHour(d.id, { closed: !e.target.checked })} /> Open</label>
                  {!h.closed && (
                    <>
                      <input type="time" className={`${inputCls} !w-36`} value={h.open} onChange={(e) => setHour(d.id, { open: e.target.value })} aria-label={`${d.long} opening time`} />
                      <span>to</span>
                      <input type="time" className={`${inputCls} !w-36`} value={h.close} onChange={(e) => setHour(d.id, { close: e.target.value })} aria-label={`${d.long} closing time`} />
                    </>
                  )}
                  {h.closed && <span className="text-sm text-stone-500">Closed</span>}
                </div>
              );
            })}
          </div>
          <Text label="Note under the hours (optional)" value={b.hoursNote} onChange={(v) => setB({ hoursNote: v })} />
          <p className="text-sm text-stone-500">Closed for a holiday or a few hours? Add it under Booking & emails → Closed dates & times.</p>
        </Card>

        <Card title="Social & messaging links" actions={<button type="button" className={btn.secondary} onClick={() => setDraft({ ...draft, social: [...draft.social, { id: newId("s"), platform: "instagram", label: "Instagram", url: "" }] })}>+ Add link</button>}>
          <SortableList
            items={draft.social}
            onReorder={(social) => setDraft({ ...draft, social })}
            render={(s, handle, i) => (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 p-2">
                {handle}
                <Icon name={s.platform} size={18} />
                <select className={`${inputCls} !w-auto`} value={s.platform} onChange={(e) => setDraft({ ...draft, social: draft.social.map((x, j) => (j === i ? { ...x, platform: e.target.value as SocialLink["platform"] } : x)) })} aria-label="Platform">
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <input className={`${inputCls} !w-36`} value={s.label} onChange={(e) => setDraft({ ...draft, social: draft.social.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} aria-label="Label" placeholder="Label" />
                <input className={`${inputCls} flex-1`} value={s.url} onChange={(e) => setDraft({ ...draft, social: draft.social.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} aria-label="URL" placeholder="https://…" />
                <button type="button" className={btn.ghost} aria-label="Remove" onClick={() => setDraft({ ...draft, social: draft.social.filter((_, j) => j !== i) })}><Icon name="close" size={16} /></button>
              </div>
            )}
          />
        </Card>

        <Card title="Google rating" description="Shown as a badge and in the reviews section. Update it from your Google Business Profile from time to time.">
          <Notice>Only enter the rating and number of reviews exactly as Google shows them, and update the &quot;as of&quot; date when you do.</Notice>
          <Toggle label="Show the Google rating on the website" checked={draft.reviews.showBadge} onChange={(v) => setDraft({ ...draft, reviews: { ...draft.reviews, showBadge: v } })} />
          <Grid cols={3}>
            <Num label="Rating (0–5)" value={draft.reviews.rating} step={0.1} min={0} max={5} onChange={(v) => setDraft({ ...draft, reviews: { ...draft.reviews, rating: v } })} />
            <Num label="Number of reviews" value={draft.reviews.count} min={0} onChange={(v) => setDraft({ ...draft, reviews: { ...draft.reviews, count: Math.round(v) } })} />
            <Text label="As of" value={draft.reviews.asOf} onChange={(v) => setDraft({ ...draft, reviews: { ...draft.reviews, asOf: v } })} placeholder="November 2026" />
          </Grid>
          <Text label="Link to your Google reviews" value={draft.reviews.googleUrl} onChange={(v) => setDraft({ ...draft, reviews: { ...draft.reviews, googleUrl: v } })} />
        </Card>

        <Card title="Floating buttons on phones" description="A bar at the bottom of the screen on mobile.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Toggle label="Call button" checked={draft.floating.showCall} onChange={(v) => setDraft({ ...draft, floating: { ...draft.floating, showCall: v } })} />
            <Toggle label="Book button" checked={draft.floating.showBook} onChange={(v) => setDraft({ ...draft, floating: { ...draft.floating, showBook: v } })} />
            <Toggle label="WhatsApp button" checked={draft.floating.showWhatsApp} onChange={(v) => setDraft({ ...draft, floating: { ...draft.floating, showWhatsApp: v } })} />
          </div>
          <Text label="WhatsApp link" value={draft.floating.whatsappUrl} onChange={(v) => setDraft({ ...draft, floating: { ...draft.floating, whatsappUrl: v } })} placeholder="https://wa.me/13053367129" />
          <Select label="Price range for Google (optional)" value={b.priceRange} onChange={(v) => setB({ priceRange: v })} options={[{ value: "", label: "Not set" }, { value: "$", label: "$" }, { value: "$$", label: "$$" }, { value: "$$$", label: "$$$" }, { value: "$$$$", label: "$$$$" }]} />
        </Card>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </>
  );
}
