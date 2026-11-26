"use client";

import { useCallback, useEffect, useState } from "react";
import { useData } from "@/components/admin/store";
import { Area, Badge, Modal, Notice, PageTitle, Select, Text, Toggle, btn, inputCls, useToast } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/client/api";
import { formatDate, formatDateLong, formatTime } from "@/lib/dates";
import type { Appointment, AppointmentStatus, DayAvailability } from "@/lib/types";

const VIEWS = [
  { id: "pending", label: "Pending" },
  { id: "upcoming", label: "Upcoming" },
  { id: "today", label: "Today" },
  { id: "past", label: "Past" },
  { id: "all", label: "All" },
];

const STATUS: Record<AppointmentStatus, { label: string; tone: "amber" | "green" | "red" | "stone" | "blue" }> = {
  pending: { label: "Pending approval", tone: "amber" },
  approved: { label: "Approved", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
  cancelled: { label: "Cancelled", tone: "stone" },
  completed: { label: "Completed", tone: "blue" },
  no_show: { label: "No-show", tone: "red" },
};

/* --------------------------- slot picker (admin) --------------------------- */

function SlotPicker({ treatmentId, ignoreId, value, onChange }: { treatmentId: string; ignoreId?: string; value: { date: string; time: string }; onChange: (v: { date: string; time: string }) => void }) {
  const [days, setDays] = useState<DayAvailability[] | null>(null);
  const [from, setFrom] = useState("");
  useEffect(() => {
    if (!treatmentId) return;
    const q = new URLSearchParams({ treatment: treatmentId, days: "21", ...(from ? { from } : {}), ...(ignoreId ? { ignore: ignoreId } : {}) });
    setDays(null);
    api<{ days: DayAvailability[] }>(`/api/admin/availability?${q}`).then((r) => setDays(r.days)).catch(() => setDays([]));
  }, [treatmentId, ignoreId, from]);
  const day = days?.find((d) => d.date === value.date);
  if (!treatmentId) return <p className="text-sm text-stone-500">Choose a treatment first.</p>;
  if (!days) return <p className="text-sm text-stone-500">Loading availability…</p>;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-stone-600" htmlFor="slot-from">From</label>
        <input id="slot-from" type="date" className={`${inputCls} !w-auto`} value={from || days[0]?.date || ""} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Date">
        {days.map((d) => {
          const ok = d.open && d.available > 0;
          return (
            <button key={d.date} type="button" disabled={!ok} role="radio" aria-checked={value.date === d.date} onClick={() => onChange({ date: d.date, time: "" })}
              className={`min-w-[64px] rounded-md border px-2 py-1.5 text-xs ${value.date === d.date ? "border-stone-900 bg-stone-900 text-white" : ok ? "border-stone-300 hover:border-stone-500" : "border-transparent text-stone-400 line-through"}`}>
              {formatDate(d.date)}
            </button>
          );
        })}
      </div>
      {day?.open && (
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Time">
          {day.slots.map((s) => (
            <button key={s.time} type="button" disabled={s.state !== "available"} role="radio" aria-checked={value.time === s.time} onClick={() => onChange({ ...value, time: s.time })}
              className={`min-w-[78px] rounded-md border px-2 py-1.5 text-sm tabular-nums ${value.time === s.time ? "border-stone-900 bg-stone-900 text-white" : s.state === "available" ? "border-stone-300 hover:border-stone-500" : "border-transparent bg-stone-100 text-stone-400 line-through"}`}>
              {formatTime(s.time)}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-stone-500">Times already held by pending or approved appointments are crossed out. Staff bookings ignore the online minimum-notice rule.</p>
    </div>
  );
}

/* ------------------------------ detail modal ------------------------------ */

function Detail({ appt, onClose, onChanged }: { appt: Appointment; onClose: () => void; onChanged: (a: Appointment) => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [notify, setNotify] = useState(true);
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"" | "reject" | "cancel" | "reschedule">("");
  const [slot, setSlot] = useState({ date: appt.date, time: "" });
  const [notes, setNotes] = useState(appt.internalNotes);

  async function act(body: Record<string, unknown>, done: string) {
    setBusy(true);
    try {
      const r = await api<{ appointment: Appointment }>(`/api/admin/appointments/${appt.id}`, { method: "PATCH", body: { notify, ...body } });
      onChanged(r.appointment);
      const last = r.appointment.notifications.at(-1);
      toast(body.action !== "notes" && last && last.to === "customer" && Date.now() - Date.parse(last.at) < 15000 ? `${done} Email: ${last.status}${last.status !== "sent" ? ` (${last.detail})` : ""}` : done);
      setMode("");
      setReason("");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  const s = appt.status;
  const phoneDigits = appt.phone.replace(/[^\d+]/g, "");
  return (
    <Modal open onClose={onClose} title={`${appt.name} · ${appt.reference}`} wide>
      <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2"><Badge tone={STATUS[s].tone}>{STATUS[s].label}</Badge>{appt.source === "admin" && <Badge>Added by staff</Badge>}</div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-stone-500">Treatment</dt><dd className="font-medium">{appt.treatmentName}</dd>
            <dt className="text-stone-500">When</dt><dd className="font-medium">{formatDateLong(appt.date)} · {formatTime(appt.time)} ({appt.durationMinutes} min)</dd>
            <dt className="text-stone-500">Phone</dt><dd>{appt.phone}</dd>
            <dt className="text-stone-500">Email</dt><dd className="break-all">{appt.email || "—"}</dd>
            <dt className="text-stone-500">Received</dt><dd>{new Date(appt.createdAt).toLocaleString("en-US")}</dd>
          </dl>
          {appt.message && <div className="rounded-lg bg-stone-50 p-3 text-sm"><p className="mb-1 text-xs font-semibold uppercase text-stone-500">Customer message</p><p className="whitespace-pre-wrap">{appt.message}</p></div>}
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${phoneDigits}`} className={btn.secondary}><Icon name="phone" size={15} /> Call</a>
            <a href={`sms:${phoneDigits}`} className={btn.secondary}>Text</a>
            {appt.email && <a href={`mailto:${appt.email}?subject=${encodeURIComponent(`Your appointment request ${appt.reference}`)}`} className={btn.secondary}><Icon name="mail" size={15} /> Email</a>}
            <a href={`https://wa.me/${phoneDigits.replace("+", "")}`} target="_blank" rel="noopener noreferrer" className={btn.secondary}><Icon name="whatsapp" size={15} /> WhatsApp</a>
          </div>
          <div>
            <Area label="Internal notes (staff only)" value={notes} onChange={setNotes} rows={3} />
            <button type="button" className={`${btn.secondary} mt-2`} disabled={busy || notes === appt.internalNotes} onClick={() => act({ action: "notes", internalNotes: notes }, "Notes saved.")}>Save notes</button>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-semibold">Actions</p>
          <Toggle label="Email the customer about this change" checked={notify} onChange={setNotify} hint={appt.email ? undefined : "No email address on this appointment."} disabled={!appt.email} />
          {s === "pending" && <Notice tone="blue">This request is not confirmed yet. Check your Booksy calendar for conflicts before approving.</Notice>}
          <div className="flex flex-wrap gap-2">
            {s === "pending" && <button type="button" className={btn.success} disabled={busy} onClick={() => act({ action: "approve" }, "Appointment approved.")} data-testid="approve">Approve</button>}
            {s === "pending" && <button type="button" className={btn.danger} disabled={busy} onClick={() => setMode("reject")}>Reject</button>}
            {(s === "pending" || s === "approved") && <button type="button" className={btn.secondary} disabled={busy} onClick={() => setMode("reschedule")}>Reschedule</button>}
            {s === "approved" && <button type="button" className={btn.primary} disabled={busy} onClick={() => act({ action: "complete" }, "Marked as completed.")}>Mark completed</button>}
            {s === "approved" && <button type="button" className={btn.secondary} disabled={busy} onClick={() => act({ action: "no_show" }, "Marked as no-show.")}>No-show</button>}
            {(s === "pending" || s === "approved") && <button type="button" className={btn.danger} disabled={busy} onClick={() => setMode("cancel")}>Cancel</button>}
          </div>

          {(mode === "reject" || mode === "cancel") && (
            <div className="space-y-2 rounded-lg border border-stone-200 p-3">
              <Area label={mode === "reject" ? "Message to the customer (optional)" : "Reason (optional, included in the email)"} value={reason} onChange={setReason} rows={3} placeholder="e.g. That time is no longer available. We have openings on Thursday afternoon." />
              <div className="flex gap-2">
                <button type="button" className={btn.danger} disabled={busy} onClick={() => act({ action: mode, reason }, mode === "reject" ? "Request rejected." : "Appointment cancelled.")}>Confirm {mode}</button>
                <button type="button" className={btn.ghost} onClick={() => setMode("")}>Back</button>
              </div>
            </div>
          )}
          {mode === "reschedule" && (
            <div className="space-y-3 rounded-lg border border-stone-200 p-3">
              <SlotPicker treatmentId={appt.treatmentId} ignoreId={appt.id} value={slot} onChange={setSlot} />
              <div className="flex gap-2">
                <button type="button" className={btn.primary} disabled={busy || !slot.date || !slot.time} onClick={() => act({ action: "reschedule", date: slot.date, time: slot.time }, "Appointment rescheduled.")}>Move to {slot.time ? `${formatDate(slot.date)} ${formatTime(slot.time)}` : "…"}</button>
                <button type="button" className={btn.ghost} onClick={() => setMode("")}>Back</button>
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-semibold">History</p>
            <ol className="space-y-1.5 text-xs text-stone-600">
              {appt.history.map((h, i) => (
                <li key={i}>{new Date(h.at).toLocaleString("en-US")} · <strong className="capitalize">{h.action.replace("_", "-")}</strong>{h.note ? ` · ${h.note}` : ""}{h.by ? ` · ${h.by}` : ""}</li>
              ))}
            </ol>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Emails</p>
            {appt.notifications.length === 0 ? <p className="text-xs text-stone-500">None yet.</p> : (
              <ol className="space-y-1.5 text-xs">
                {appt.notifications.map((n, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={n.status === "sent" ? "green" : n.status === "failed" ? "red" : "amber"}>{n.status}</Badge>
                    <span>{n.to === "clinic" ? "To spa" : "To customer"} · {n.kind}</span>
                    <span className="text-stone-500">{n.detail}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------------------- new appointment ---------------------------- */

function NewAppointment({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (a: Appointment) => void }) {
  const { treatments } = useData();
  const toast = useToast();
  const [f, setF] = useState({ treatmentId: "", name: "", phone: "", email: "", message: "", status: "approved", notify: false });
  const [slot, setSlot] = useState({ date: "", time: "" });
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      const r = await api<{ appointment: Appointment }>("/api/admin/appointments", { body: { ...f, ...slot } });
      onCreated(r.appointment);
      toast("Appointment added.");
      onClose();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal open={open} onClose={onClose} title="Add appointment (phone or walk-in)" wide footer={<><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} disabled={busy || !slot.time} onClick={save}>{busy ? "Saving…" : "Add appointment"}</button></>}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <Select label="Treatment" value={f.treatmentId} onChange={(v) => { setF({ ...f, treatmentId: v }); setSlot({ date: "", time: "" }); }} options={[{ value: "", label: "Choose…" }, ...treatments.map((t) => ({ value: t.id, label: t.name }))]} />
          <Text label="Customer name" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
          <Text label="Phone" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} type="tel" />
          <Text label="Email (optional)" value={f.email} onChange={(v) => setF({ ...f, email: v })} type="email" />
          <Area label="Notes from the customer (optional)" value={f.message} onChange={(v) => setF({ ...f, message: v })} rows={2} />
          <Select label="Status" value={f.status} onChange={(v) => setF({ ...f, status: v })} options={[{ value: "approved", label: "Approved (confirmed)" }, { value: "pending", label: "Pending" }]} />
          <Toggle label="Email the customer" checked={f.notify} onChange={(v) => setF({ ...f, notify: v })} disabled={!f.email} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Date & time</p>
          <SlotPicker treatmentId={f.treatmentId} value={slot} onChange={setSlot} />
        </div>
      </div>
    </Modal>
  );
}

/* --------------------------------- page --------------------------------- */

export default function AppointmentsPage() {
  const [view, setView] = useState("pending");
  const [list, setList] = useState<Appointment[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const toast = useToast();

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("view")) setView(p.get("view")!);
    if (p.get("open")) { setOpenId(p.get("open")); setView("all"); }
  }, []);

  const load = useCallback(() => {
    setList(null);
    api<{ appointments: Appointment[] }>(`/api/admin/appointments?view=${view}`).then((r) => setList(r.appointments)).catch((e) => toast(e.message, "error"));
  }, [view, toast]);
  useEffect(load, [load]);

  const open = list?.find((a) => a.id === openId);
  const filtered = list?.filter((a) => !q || `${a.name} ${a.email} ${a.phone} ${a.reference} ${a.treatmentName}`.toLowerCase().includes(q.toLowerCase()));
  const replace = (a: Appointment) => setList((l) => l?.map((x) => (x.id === a.id ? a : x)) ?? l);

  return (
    <>
      <PageTitle title="Appointments" description="Website requests are pending until you approve them. Approving, rejecting, rescheduling or cancelling emails the customer (if email is configured)." actions={<><button type="button" className={btn.secondary} onClick={load}>Refresh</button><button type="button" className={btn.primary} onClick={() => setAdding(true)}>+ Add appointment</button></>} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg bg-stone-200/60 p-1" role="tablist">
          {VIEWS.map((v) => (
            <button key={v.id} role="tab" aria-selected={view === v.id} type="button" onClick={() => setView(v.id)} className={`rounded-md px-3 py-1.5 text-sm ${view === v.id ? "bg-white font-medium shadow-sm" : "text-stone-600"}`}>{v.label}</button>
          ))}
        </div>
        <input className={`${inputCls} sm:max-w-xs`} placeholder="Search name, phone, email, reference" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search appointments" />
      </div>
      {!filtered ? <p className="text-stone-500">Loading…</p> : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">No appointments here.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => setOpenId(a.id)} className="grid w-full gap-2 rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm hover:border-stone-400 sm:grid-cols-[130px_1fr_auto] sm:items-center" data-appointment={a.reference}>
                <span>
                  <span className="block font-medium">{formatDate(a.date)}</span>
                  <span className="block text-sm text-stone-500">{formatTime(a.time)}</span>
                </span>
                <span>
                  <span className="block font-medium">{a.name}</span>
                  <span className="block text-sm text-stone-500">{a.treatmentName} · {a.phone}</span>
                </span>
                <Badge tone={STATUS[a.status].tone}>{STATUS[a.status].label}</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && <Detail key={open.id + open.updatedAt} appt={open} onClose={() => setOpenId(null)} onChanged={replace} />}
      {adding && <NewAppointment open onClose={() => setAdding(false)} onCreated={(a) => { setView("upcoming"); setList((l) => (l ? [...l, a] : l)); }} />}
    </>
  );
}
