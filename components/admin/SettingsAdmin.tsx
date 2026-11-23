"use client";

import { useEffect, useState } from "react";
import { getAvailability, getDoctors, updateSettings } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import type { ClinicSettings, DayAvailability, Weekday } from "@/lib/data/types";
import { WEEKDAYS, formatDate, parseISODate, todayISO } from "@/lib/dates";
import { uid } from "@/lib/id";
import { normalisePkMobile, toWhatsAppDigits } from "@/lib/phone";
import { useSettings } from "../layout/useSettings";
import { Icon } from "../ui/Icon";
import { errorMessage, useToast } from "./ui";

export function SettingsAdmin() {
  const toast = useToast();
  const { data: saved, ready } = useSettings();
  const [draft, setDraft] = useState<ClinicSettings>(saved);
  const [waInput, setWaInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [newHoliday, setNewHoliday] = useState({ date: "", label: "" });

  useEffect(() => {
    if (ready) {
      setDraft(saved);
      setWaInput(saved.whatsappNumber ? `+${saved.whatsappNumber}` : "");
    }
  }, [ready, saved]);

  const { data: doctors } = useData(getDoctors, []);
  const doctorId = doctors[0]?.id;
  const { data: days } = useData<DayAvailability[]>(() => (doctorId ? getAvailability(doctorId, { days: 14 }) : Promise.resolve([])), [], [doctorId]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved) || waInput !== (saved.whatsappNumber ? `+${saved.whatsappNumber}` : "");
  const set = <K extends keyof ClinicSettings>(k: K, v: ClinicSettings[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const save = async () => {
    setError(null);
    let whatsappNumber = "";
    if (waInput.trim()) {
      const n = normalisePkMobile(waInput);
      if (!n) return setError("WhatsApp number must be a Pakistani mobile number, e.g. 0300 1234567.");
      whatsappNumber = toWhatsAppDigits(n);
    }
    try {
      await updateSettings({ ...draft, whatsappNumber });
      toast("Settings saved. Booking page updated.");
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const toggleDay = (d: Weekday) =>
    set("workingDays", draft.workingDays.includes(d) ? draft.workingDays.filter((x) => x !== d) : [...draft.workingDays, d].sort());

  return (
    <div className="pb-24">
      <h1 className="text-4xl sm:text-5xl">Clinic settings</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">These rules control which times patients can book. Demo values, to be confirmed with the clinic.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card title="Working days">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Working days">
              {WEEKDAYS.map((d) => {
                const on = draft.workingDays.includes(d.id);
                return (
                  <button key={d.id} type="button" aria-pressed={on} onClick={() => toggleDay(d.id)} data-day={d.id}
                    className={`min-w-16 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${on ? "border-charcoal bg-charcoal text-ivory" : "border-sand text-muted hover:bg-cream"}`}>
                    {d.short}
                    <span className="block text-[0.65rem] font-medium">{on ? "Open" : "Closed"}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card title="Opening hours & slots">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field id="s-open" label="Opens"><input id="s-open" type="time" className="field" value={draft.openTime} onChange={(e) => set("openTime", e.target.value)} /></Field>
              <Field id="s-close" label="Closes"><input id="s-close" type="time" className="field" value={draft.closeTime} onChange={(e) => set("closeTime", e.target.value)} /></Field>
              <Field id="s-slot" label="Slot length">
                <select id="s-slot" className="field" value={draft.slotMinutes} onChange={(e) => set("slotMinutes", Number(e.target.value))}>
                  {[15, 20, 30, 45, 60, 90].map((n) => <option key={n} value={n}>{n} minutes</option>)}
                </select>
              </Field>
              <Field id="s-max" label="Max appointments / day">
                <input id="s-max" type="number" min={1} max={100} className="field" value={draft.maxPerDay} onChange={(e) => set("maxPerDay", Math.max(1, Number(e.target.value)))} />
              </Field>
              <Field id="s-window" label="Booking window (days ahead)">
                <input id="s-window" type="number" min={1} max={120} className="field" value={draft.bookingWindowDays} onChange={(e) => set("bookingWindowDays", Math.min(120, Math.max(1, Number(e.target.value))))} />
              </Field>
              <Field id="s-notice" label="Minimum notice (minutes)">
                <input id="s-notice" type="number" min={0} step={15} className="field" value={draft.minNoticeMinutes} onChange={(e) => set("minNoticeMinutes", Math.max(0, Number(e.target.value)))} />
              </Field>
            </div>
          </Card>

          <Card title="Breaks">
            <ul className="space-y-3">
              {draft.breaks.map((b, i) => (
                <li key={b.id} className="rounded-2xl border border-line p-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_8rem_8rem_auto] sm:items-end">
                    <Field id={`b-l-${i}`} label="Label"><input id={`b-l-${i}`} className="field" value={b.label} onChange={(e) => set("breaks", draft.breaks.map((x) => (x.id === b.id ? { ...x, label: e.target.value } : x)))} /></Field>
                    <Field id={`b-s-${i}`} label="From"><input id={`b-s-${i}`} type="time" className="field" value={b.start} onChange={(e) => set("breaks", draft.breaks.map((x) => (x.id === b.id ? { ...x, start: e.target.value } : x)))} /></Field>
                    <Field id={`b-e-${i}`} label="To"><input id={`b-e-${i}`} type="time" className="field" value={b.end} onChange={(e) => set("breaks", draft.breaks.map((x) => (x.id === b.id ? { ...x, end: e.target.value } : x)))} /></Field>
                    <button type="button" className="justify-self-start rounded-full p-2.5 text-muted hover:bg-cream hover:text-danger" aria-label={`Remove break ${b.label}`}
                      onClick={() => set("breaks", draft.breaks.filter((x) => x.id !== b.id))}>
                      <Icon name="trash" size={18} />
                    </button>
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
            <button type="button" className="btn btn-ghost btn-sm mt-3"
              onClick={() => set("breaks", [...draft.breaks, { id: uid("brk"), label: "Break", start: "16:00", end: "16:30", days: [] }])}>
              <Icon name="plus" size={16} /> Add break
            </button>
          </Card>

          <Card title="Holidays & closures">
            <ul className="divide-y divide-line">
              {[...draft.holidays].sort((a, b) => a.date.localeCompare(b.date)).map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span><span className="font-semibold text-charcoal">{formatDate(h.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span> · {h.label || "Closed"}</span>
                  <button type="button" className="rounded-full p-2 text-muted hover:bg-cream hover:text-danger" aria-label={`Remove holiday ${h.label} on ${h.date}`}
                    onClick={() => set("holidays", draft.holidays.filter((x) => x.id !== h.id))}>
                    <Icon name="trash" size={16} />
                  </button>
                </li>
              ))}
              {draft.holidays.length === 0 && <li className="py-2 text-sm text-muted">No holidays added.</li>}
            </ul>
            <form className="mt-3 grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newHoliday.date) return;
                set("holidays", [...draft.holidays.filter((h) => h.date !== newHoliday.date), { id: uid("hol"), date: newHoliday.date, label: newHoliday.label.trim() || "Clinic closed" }]);
                setNewHoliday({ date: "", label: "" });
              }}>
              <Field id="h-date" label="Date"><input id="h-date" type="date" min={todayISO()} className="field" value={newHoliday.date} onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })} /></Field>
              <Field id="h-label" label="Reason"><input id="h-label" className="field" placeholder="e.g. Eid ul-Fitr" value={newHoliday.label} onChange={(e) => setNewHoliday({ ...newHoliday, label: e.target.value })} /></Field>
              <button type="submit" className="btn btn-ghost" disabled={!newHoliday.date}><Icon name="plus" size={16} /> Add holiday</button>
            </form>
          </Card>

          <Card title="Contact details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="s-wa" label="WhatsApp number" hint="Used by the WhatsApp buttons on the website.">
                <input id="s-wa" type="tel" className="field" placeholder="0300 1234567" value={waInput} onChange={(e) => setWaInput(e.target.value)} />
              </Field>
              <Field id="s-phone" label="Phone (as displayed)"><input id="s-phone" className="field" value={draft.phoneDisplay} onChange={(e) => set("phoneDisplay", e.target.value)} /></Field>
              <Field id="s-email" label="Email"><input id="s-email" type="email" className="field" value={draft.email} onChange={(e) => set("email", e.target.value)} /></Field>
              <Field id="s-addr" label="Address"><input id="s-addr" className="field" value={draft.addressLine} onChange={(e) => set("addressLine", e.target.value)} /></Field>
            </div>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-36 lg:self-start" aria-label="Availability preview">
          <div className="card p-5">
            <h2 className="text-2xl">Next 14 days</h2>
            <p className="mt-1 text-xs text-muted">Live availability on the booking page (saved settings).</p>
            <ul className="mt-4 space-y-1.5" data-testid="availability-preview">
              {days.map((d) => (
                <li key={d.date} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm odd:bg-cream/60" data-date={d.date} data-open={d.open}>
                  <span className="text-charcoal">{parseISODate(d.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span>
                  {d.open ? (
                    <span className="font-semibold text-success">{d.availableCount} slots</span>
                  ) : (
                    <span className="text-muted">{d.reason}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Save bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ivory/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-muted" role={error ? "alert" : undefined}>
            {error ? <span className="text-danger">{error}</span> : dirty ? "You have unsaved changes." : "All changes saved."}
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost btn-sm" disabled={!dirty} onClick={() => { setDraft(saved); setWaInput(saved.whatsappNumber ? `+${saved.whatsappNumber}` : ""); setError(null); }}>Discard</button>
            <button type="button" className="btn btn-primary btn-sm" disabled={!dirty} onClick={save} data-testid="save-settings">Save settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-4 text-2xl">{title}</h2>
      {children}
    </section>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}
