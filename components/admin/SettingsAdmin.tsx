"use client";

import { useState } from "react";
import { getAvailability, getSettings, updateSettings } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import { MAIN_DOCTOR_ID, SEED_SETTINGS } from "@/lib/data/seed";
import type { DayAvailability, Weekday } from "@/lib/data/types";
import { WEEKDAYS, formatDate, parseISODate, todayISO } from "@/lib/dates";
import { hoursFor } from "@/lib/hours";
import { uid } from "@/lib/id";
import { Icon } from "../ui/Icon";
import { Card, SaveBar, Switch, errorMessage, useDraft, useToast } from "./ui";

export function SettingsAdmin() {
  const toast = useToast();
  const { data: saved, ready } = useData(getSettings, SEED_SETTINGS, [], { fresh: true });
  const { draft, setDraft, dirty, reset } = useDraft(saved, ready);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ date: "", label: "" });
  const [newBlock, setNewBlock] = useState({ date: "", start: "15:00", end: "17:00", reason: "" });
  const { data: days } = useData<DayAvailability[]>(() => getAvailability(MAIN_DOCTOR_ID, { days: 14 }), [], [], { fresh: true });

  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const toggleDay = (d: Weekday) => set("workingDays", draft.workingDays.includes(d) ? draft.workingDays.filter((x) => x !== d) : [...draft.workingDays, d].sort());

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      await updateSettings(draft);
      toast("Booking settings saved. The booking page is updated.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-4xl sm:text-5xl">Booking hours & slots</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">These rules control which times patients can book online. Opening hours on the website update automatically.</p>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card title="Working days">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Working days">
              {WEEKDAYS.map((d) => {
                const on = draft.workingDays.includes(d.id);
                return (
                  <button key={d.id} type="button" aria-pressed={on} onClick={() => toggleDay(d.id)} data-day={d.id}
                    className={`min-w-16 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${on ? "border-charcoal bg-charcoal text-ivory" : "border-sand text-muted hover:bg-cream"}`}>
                    {d.short}<span className="block text-[0.65rem] font-medium">{on ? "Open" : "Closed"}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card title="Opening hours by day" description="Shown on the website and used for online booking. Turn a day off under Working days.">
            <ul className="divide-y divide-line border-y border-line" data-testid="day-hours">
              {WEEKDAYS.filter((d) => draft.workingDays.includes(d.id)).map((d) => {
                const h = hoursFor(draft, d.id) ?? { open: draft.openTime, close: draft.closeTime };
                const setDay = (v: Partial<typeof h>) => set("dayHours", { ...(draft.dayHours ?? {}), [String(d.id)]: { ...h, ...v } });
                return (
                  <li key={d.id} className="grid grid-cols-[5.5rem_1fr_1fr] items-center gap-3 py-2.5">
                    <span className="text-sm font-medium text-charcoal">{d.long}</span>
                    <label className="sr-only" htmlFor={`dh-o-${d.id}`}>{d.long} opens</label>
                    <input id={`dh-o-${d.id}`} type="time" className="field" value={h.open} onChange={(e) => setDay({ open: e.target.value })} />
                    <label className="sr-only" htmlFor={`dh-c-${d.id}`}>{d.long} closes</label>
                    <input id={`dh-c-${d.id}`} type="time" className="field" value={h.close} onChange={(e) => setDay({ close: e.target.value })} />
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card title="Slot rules">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field id="s-open" label="Default opening (new days)"><input id="s-open" type="time" className="field" value={draft.openTime} onChange={(e) => set("openTime", e.target.value)} /></Field>
              <Field id="s-close" label="Default closing (new days)"><input id="s-close" type="time" className="field" value={draft.closeTime} onChange={(e) => set("closeTime", e.target.value)} /></Field>
              <Field id="s-slot" label="Appointment slot length">
                <select id="s-slot" className="field" value={draft.slotMinutes} onChange={(e) => set("slotMinutes", Number(e.target.value))}>
                  {[15, 20, 30, 45, 60, 90].map((n) => <option key={n} value={n}>{n} minutes</option>)}
                </select>
              </Field>
              <Field id="s-max" label="Max appointments / day"><input id="s-max" type="number" min={1} max={200} className="field" value={draft.maxPerDay} onChange={(e) => set("maxPerDay", Math.max(1, Number(e.target.value)))} /></Field>
              <Field id="s-window" label="Bookable days ahead"><input id="s-window" type="number" min={1} max={120} className="field" value={draft.bookingWindowDays} onChange={(e) => set("bookingWindowDays", Math.min(120, Math.max(1, Number(e.target.value))))} /></Field>
              <Field id="s-notice" label="Minimum notice (minutes)"><input id="s-notice" type="number" min={0} step={15} className="field" value={draft.minNoticeMinutes} onChange={(e) => set("minNoticeMinutes", Math.max(0, Number(e.target.value)))} /></Field>
            </div>
            <Switch label="Require an email address when booking" checked={draft.requireEmail} onChange={(v) => set("requireEmail", v)} />
          </Card>

          <Card title="Daily breaks">
            <ul className="space-y-3">
              {draft.breaks.map((b, i) => (
                <li key={b.id} className="border border-line p-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_8rem_8rem_auto] sm:items-end">
                    <Field id={`b-l-${i}`} label="Label"><input id={`b-l-${i}`} className="field" value={b.label} onChange={(e) => set("breaks", draft.breaks.map((x) => (x.id === b.id ? { ...x, label: e.target.value } : x)))} /></Field>
                    <Field id={`b-s-${i}`} label="From"><input id={`b-s-${i}`} type="time" className="field" value={b.start} onChange={(e) => set("breaks", draft.breaks.map((x) => (x.id === b.id ? { ...x, start: e.target.value } : x)))} /></Field>
                    <Field id={`b-e-${i}`} label="To"><input id={`b-e-${i}`} type="time" className="field" value={b.end} onChange={(e) => set("breaks", draft.breaks.map((x) => (x.id === b.id ? { ...x, end: e.target.value } : x)))} /></Field>
                    <button type="button" className="justify-self-start rounded-full p-2.5 text-muted hover:bg-cream hover:text-danger" aria-label={`Remove break ${b.label}`} onClick={() => set("breaks", draft.breaks.filter((x) => x.id !== b.id))}><Icon name="trash" size={18} /></button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label={`Days for ${b.label}`}>
                    <span className="mr-1 text-xs text-muted">Applies on:</span>
                    {WEEKDAYS.map((d) => {
                      const on = b.days.length === 0 || b.days.includes(d.id);
                      return (
                        <button key={d.id} type="button" aria-pressed={on}
                          onClick={() => {
                            const current = b.days.length === 0 ? WEEKDAYS.map((w) => w.id) : b.days;
                            const days = on ? current.filter((x) => x !== d.id) : [...current, d.id];
                            set("breaks", draft.breaks.map((x) => (x.id === b.id ? { ...x, days: days.length === 7 ? [] : days } : x)));
                          }}
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${on ? "border-charcoal bg-charcoal text-ivory" : "border-sand text-muted"}`}>
                          {d.short}
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => set("breaks", [...draft.breaks, { id: uid("brk"), label: "Break", start: "16:00", end: "16:30", days: [] }])}><Icon name="plus" size={16} /> Add break</button>
          </Card>

          <Card title="Holidays & closed dates">
            <ul className="divide-y divide-line">
              {[...draft.holidays].sort((a, b) => a.date.localeCompare(b.date)).map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span><span className="font-semibold text-charcoal">{formatDate(h.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span> · {h.label}</span>
                  <button type="button" className="rounded-full p-2 text-muted hover:bg-cream hover:text-danger" aria-label={`Remove holiday ${h.label} on ${h.date}`} onClick={() => set("holidays", draft.holidays.filter((x) => x.id !== h.id))}><Icon name="trash" size={16} /></button>
                </li>
              ))}
              {draft.holidays.length === 0 && <li className="py-2 text-sm text-muted">No holidays added.</li>}
            </ul>
            <form className="grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end" onSubmit={(e) => {
              e.preventDefault();
              if (!newHoliday.date) return;
              set("holidays", [...draft.holidays.filter((h) => h.date !== newHoliday.date), { id: uid("hol"), date: newHoliday.date, label: newHoliday.label.trim() || "Clinic closed" }]);
              setNewHoliday({ date: "", label: "" });
            }}>
              <Field id="h-date" label="Date"><input id="h-date" type="date" min={todayISO()} className="field" value={newHoliday.date} onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })} /></Field>
              <Field id="h-label" label="Reason"><input id="h-label" className="field" placeholder="e.g. Christmas Day" value={newHoliday.label} onChange={(e) => setNewHoliday({ ...newHoliday, label: e.target.value })} /></Field>
              <button type="submit" className="btn btn-ghost" disabled={!newHoliday.date}><Icon name="plus" size={16} /> Add holiday</button>
            </form>
          </Card>

          <Card title="Blocked time slots" description="Block part of a day (e.g. a provider is away for a few hours). Those slots disappear from online booking.">
            <ul className="divide-y divide-line">
              {[...(draft.blocked ?? [])].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span><span className="font-semibold text-charcoal">{formatDate(b.date)}</span> · {b.start}–{b.end}{b.reason && ` · ${b.reason}`}</span>
                  <button type="button" className="rounded-full p-2 text-muted hover:bg-cream hover:text-danger" aria-label={`Remove blocked time on ${b.date}`} onClick={() => set("blocked", draft.blocked.filter((x) => x.id !== b.id))}><Icon name="trash" size={16} /></button>
                </li>
              ))}
              {(draft.blocked ?? []).length === 0 && <li className="py-2 text-sm text-muted">No blocked times.</li>}
            </ul>
            <form className="grid gap-3 sm:grid-cols-[10rem_7rem_7rem_1fr_auto] sm:items-end" onSubmit={(e) => {
              e.preventDefault();
              if (!newBlock.date || newBlock.start >= newBlock.end) return;
              set("blocked", [...(draft.blocked ?? []), { id: uid("blk"), ...newBlock, reason: newBlock.reason.trim() }]);
              setNewBlock({ ...newBlock, date: "", reason: "" });
            }}>
              <Field id="bl-date" label="Date"><input id="bl-date" type="date" min={todayISO()} className="field" value={newBlock.date} onChange={(e) => setNewBlock({ ...newBlock, date: e.target.value })} /></Field>
              <Field id="bl-start" label="From"><input id="bl-start" type="time" className="field" value={newBlock.start} onChange={(e) => setNewBlock({ ...newBlock, start: e.target.value })} /></Field>
              <Field id="bl-end" label="To"><input id="bl-end" type="time" className="field" value={newBlock.end} onChange={(e) => setNewBlock({ ...newBlock, end: e.target.value })} /></Field>
              <Field id="bl-reason" label="Reason"><input id="bl-reason" className="field" placeholder="Optional" value={newBlock.reason} onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })} /></Field>
              <button type="submit" className="btn btn-ghost" disabled={!newBlock.date || newBlock.start >= newBlock.end}><Icon name="plus" size={16} /> Block</button>
            </form>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-8 xl:self-start" aria-label="Availability preview">
          <div className="card p-5">
            <h2 className="text-2xl">Next 14 days</h2>
            <p className="mt-1 text-xs text-muted">Live availability (saved settings).</p>
            <ul className="mt-4 space-y-1.5" data-testid="availability-preview">
              {days.map((d) => (
                <li key={d.date} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm odd:bg-cream/60" data-date={d.date} data-open={d.open}>
                  <span className="text-charcoal">{parseISODate(d.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span>
                  {d.open ? <span className="font-semibold text-success">{d.availableCount} free</span> : <span className="text-muted">{d.reason}</span>}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
      <SaveBar dirty={dirty} saving={saving} error={error} onSave={save} onDiscard={() => { reset(); setError(null); }} testId="save-settings" />
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
    </div>
  );
}
