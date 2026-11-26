"use client";

import { useSettingsDraft } from "@/components/admin/useSettings";
import { Area, Card, Grid, Notice, Num, PageTitle, SaveBar, Text, Toggle, btn, inputCls } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { newId } from "@/lib/id";
import type { EmailKind, Settings } from "@/lib/types";

const MODES: { value: Settings["booking"]["mode"]; title: string; text: string }[] = [
  { value: "both", title: "Website requests + Booksy (recommended)", text: "Visitors can send a request through the website (you approve it) or book instantly on Booksy." },
  { value: "request", title: "Website requests only", text: "All Book buttons open the website request form." },
  { value: "booksy", title: "Booksy only", text: "All Book buttons go to your Booksy page. The website form is switched off." },
];

const EMAILS: { kind: EmailKind; label: string; when: string }[] = [
  { kind: "received", label: "Request received", when: "Sent to the customer right after they submit a request (says it is NOT confirmed yet)." },
  { kind: "approved", label: "Appointment confirmed", when: "Sent when you approve a request." },
  { kind: "rejected", label: "Request declined", when: "Sent when you reject a request. {{reason}} is the message you type." },
  { kind: "rescheduled", label: "Time changed", when: "Sent when you reschedule." },
  { kind: "cancelled", label: "Cancelled", when: "Sent when you cancel. {{reason}} is the message you type." },
  { kind: "contactReply", label: "Contact form auto-reply", when: "Sent to people who use the contact form." },
];

export default function BookingPage() {
  const { draft, setDraft, dirty, reset, saving, save } = useSettingsDraft();
  const bk = draft.booking;
  const set = (p: Partial<Settings["booking"]>) => setDraft({ ...draft, booking: { ...bk, ...p } });
  const setEmail = (k: EmailKind, p: Partial<Settings["emails"][EmailKind]>) => setDraft({ ...draft, emails: { ...draft.emails, [k]: { ...draft.emails[k], ...p } } });

  return (
    <>
      <PageTitle title="Booking & emails" description="How online booking works, which times can be requested, and the emails customers receive." />
      <div className="space-y-6">
        <Card title="Booking method">
          <div className="grid gap-2 md:grid-cols-3">
            {MODES.map((m) => (
              <label key={m.value} className={`cursor-pointer rounded-lg border p-4 ${bk.mode === m.value ? "border-stone-900 ring-1 ring-stone-900" : "border-stone-200"}`}>
                <input type="radio" name="mode" className="sr-only" checked={bk.mode === m.value} onChange={() => set({ mode: m.value })} />
                <span className="block font-medium">{m.title}</span>
                <span className="mt-1 block text-sm text-stone-500">{m.text}</span>
              </label>
            ))}
          </div>
          {bk.mode === "both" && <Notice tone="blue">Website requests and Booksy bookings are separate calendars. Website requests stay &quot;pending&quot; until you approve them, so check Booksy for conflicts before approving.</Notice>}
          <Grid>
            <Text label="Booksy booking link" value={bk.booksyUrl} onChange={(v) => set({ booksyUrl: v })} hint="Open your Booksy page, copy the address and paste it here." />
            <Text label="Booksy button text" value={bk.booksyLabel} onChange={(v) => set({ booksyLabel: v })} />
            <Text label="Financing link (optional)" value={bk.financingUrl} onChange={(v) => set({ financingUrl: v })} />
            <Text label="Financing text" value={bk.financingLabel} onChange={(v) => set({ financingLabel: v })} />
          </Grid>
        </Card>

        <Card title="Online request times" description="Times offered follow your opening hours (Business info & hours).">
          <Grid cols={3}>
            <Num label="Start times every (minutes)" value={bk.slotInterval} onChange={(v) => set({ slotInterval: v })} min={5} max={240} />
            <Num label="Appointments at the same time" value={bk.capacity} onChange={(v) => set({ capacity: v })} min={1} max={20} hint="Number of rooms or providers. 1 = no overlapping appointments." />
            <Num label="Default appointment length (minutes)" value={bk.defaultMinutes} onChange={(v) => set({ defaultMinutes: v })} min={5} max={480} hint="Used when a treatment has no length set." />
            <Num label="Minimum notice (hours)" value={bk.minNoticeHours} onChange={(v) => set({ minNoticeHours: v })} min={0} max={240} />
            <Num label="How far ahead (days)" value={bk.windowDays} onChange={(v) => set({ windowDays: v })} min={1} max={120} />
          </Grid>
          <Toggle label="Email address required" checked={bk.requireEmail} onChange={(v) => set({ requireEmail: v })} hint="Recommended: customers receive the confirmation by email." />
        </Card>

        <Card title="Closed dates & times" description="Holidays, training days or a few hours away. These times cannot be requested online." actions={<button type="button" className={btn.secondary} onClick={() => set({ blocked: [...bk.blocked, { id: newId("x"), date: "", start: "", end: "", reason: "" }] })}>+ Add</button>}>
          {bk.blocked.length === 0 && <p className="text-sm text-stone-500">None.</p>}
          {bk.blocked.map((x, i) => (
            <div key={x.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 p-2.5">
              <input type="date" className={`${inputCls} !w-auto`} value={x.date} onChange={(e) => set({ blocked: bk.blocked.map((y, j) => (j === i ? { ...y, date: e.target.value } : y)) })} aria-label="Date" />
              <input type="time" className={`${inputCls} !w-32`} value={x.start} onChange={(e) => set({ blocked: bk.blocked.map((y, j) => (j === i ? { ...y, start: e.target.value } : y)) })} aria-label="From" />
              <span className="text-sm">to</span>
              <input type="time" className={`${inputCls} !w-32`} value={x.end} onChange={(e) => set({ blocked: bk.blocked.map((y, j) => (j === i ? { ...y, end: e.target.value } : y)) })} aria-label="Until" />
              <input className={`${inputCls} flex-1`} placeholder="Reason (e.g. Thanksgiving)" value={x.reason} onChange={(e) => set({ blocked: bk.blocked.map((y, j) => (j === i ? { ...y, reason: e.target.value } : y)) })} aria-label="Reason" />
              <button type="button" className={btn.ghost} aria-label="Remove" onClick={() => set({ blocked: bk.blocked.filter((_, j) => j !== i) })}><Icon name="close" size={16} /></button>
            </div>
          ))}
          <p className="text-xs text-stone-500">Leave the times empty to close the whole day.</p>
        </Card>

        <Card title="Booking form text">
          <Area label="Note at the top of the form" value={bk.formNote} onChange={(v) => set({ formNote: v })} rows={3} />
          <Area label="Consent checkbox text" value={bk.consentText} onChange={(v) => set({ consentText: v })} rows={2} />
          <Text label="Success heading" value={bk.successTitle} onChange={(v) => set({ successTitle: v })} />
          <Area label="Success message" value={bk.successMessage} onChange={(v) => set({ successMessage: v })} rows={3} />
        </Card>

        <Card title="Emails to customers" description={<>Placeholders: <code>{"{{name}}"}</code> <code>{"{{treatment}}"}</code> <code>{"{{date}}"}</code> <code>{"{{time}}"}</code> <code>{"{{reference}}"}</code> <code>{"{{business}}"}</code> <code>{"{{phone}}"}</code> <code>{"{{address}}"}</code> <code>{"{{reason}}"}</code></>}>
          {EMAILS.map((e) => (
            <details key={e.kind} className="rounded-lg border border-stone-200 p-3">
              <summary className="cursor-pointer font-medium">{e.label} <span className="font-normal text-stone-500">— {e.when}</span></summary>
              <div className="mt-4 space-y-3">
                <Text label="Subject" value={draft.emails[e.kind].subject} onChange={(v) => setEmail(e.kind, { subject: v })} />
                <Area label="Message" value={draft.emails[e.kind].body} onChange={(v) => setEmail(e.kind, { body: v })} rows={8} />
              </div>
            </details>
          ))}
          <Area label="Signature (all emails)" value={draft.emails.signature} onChange={(v) => setDraft({ ...draft, emails: { ...draft.emails, signature: v } })} rows={3} />
        </Card>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </>
  );
}
