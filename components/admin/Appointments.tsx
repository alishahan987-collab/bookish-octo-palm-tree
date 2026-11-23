"use client";

import { useMemo, useState } from "react";
import {
  allowedNextStatuses,
  getAvailability,
  getBookings,
  getDoctors,
  getTreatments,
  rescheduleBooking,
  setBookingStatus,
} from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import type { Booking, BookingFilters, BookingStatus, DayAvailability } from "@/lib/data/types";
import { addDays, formatDate, formatDateLong, formatTime, todayISO } from "@/lib/dates";
import { buildMessages, type MessagePreview as Preview } from "@/lib/messages";
import { MessagePreview } from "../booking/MessagePreview";
import { SlotPicker } from "../booking/SlotPicker";
import { useSettings } from "../layout/useSettings";
import { Dialog } from "../ui/Dialog";
import { Icon } from "../ui/Icon";
import { STATUS_STYLES, StatusBadge, errorMessage, useToast } from "./ui";

type Scope = NonNullable<BookingFilters["scope"]>;

const ACTION_LABEL: Partial<Record<BookingStatus, string>> = {
  confirmed: "Confirm",
  arrived: "Mark arrived",
  completed: "Mark completed",
  cancelled: "Cancel",
};

export function Appointments() {
  const toast = useToast();
  const [scope, setScope] = useState<Scope>("today");
  const [search, setSearch] = useState("");
  const [treatmentId, setTreatmentId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [status, setStatus] = useState<BookingStatus | "">("");

  const filters: BookingFilters = { scope, search, treatmentId: treatmentId || undefined, doctorId: doctorId || undefined, status: status || undefined };
  const { data: bookings, ready } = useData(() => getBookings(filters), [], [scope, search, treatmentId, doctorId, status]);
  const { data: all } = useData(() => getBookings(), []);
  const { data: treatments } = useData(() => getTreatments({ includeInactive: true }), []);
  const { data: doctors } = useData(getDoctors, []);
  const { data: settings } = useSettings();

  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [preview, setPreview] = useState<{ title: string; preview: Preview } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const today = todayISO();
  const weekEnd = addDays(today, 7);
  const stats = useMemo(
    () => [
      { label: "Today", value: all.filter((b) => b.date === today && b.status !== "cancelled").length },
      { label: "Awaiting confirmation", value: all.filter((b) => b.status === "pending" && b.date >= today).length },
      { label: "Next 7 days", value: all.filter((b) => b.date > today && b.date <= weekEnd && b.status !== "cancelled").length },
      { label: "Checked in today", value: all.filter((b) => b.date === today && (b.status === "arrived" || b.status === "completed")).length },
    ],
    [all, today, weekEnd],
  );

  const changeStatus = async (b: Booking, next: Exclude<BookingStatus, "pending">) => {
    if (next === "cancelled") {
      setCancelReason("");
      setCancelTarget(b);
      return;
    }
    try {
      await setBookingStatus(b.id, next);
      toast(`${b.reference}: ${STATUS_STYLES[next].label.toLowerCase()}`);
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  const doCancel = async () => {
    if (!cancelTarget) return;
    try {
      const updated = await setBookingStatus(cancelTarget.id, "cancelled", cancelReason.trim() || undefined);
      setCancelTarget(null);
      setPreview({ title: "Cancellation notice preview", preview: buildMessages("cancellation", updated, settings) });
      toast(`${updated.reference} cancelled`);
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  const doctorName = (id: string) => doctors.find((d) => d.id === id)?.name ?? "—";
  const hasFilters = !!(search || treatmentId || doctorId || status);

  return (
    <div>
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl sm:text-5xl">Appointments</h1>
          <p className="mt-1 text-sm text-muted">{formatDateLong(today)}</p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{s.label}</dt>
            <dd className="mt-1 font-serif text-4xl text-charcoal">{s.value}</dd>
          </div>
        ))}
      </dl>

      {/* Scope + filters */}
      <div className="card mt-6 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Show" className="inline-flex w-full rounded-full border border-sand p-1 sm:w-auto">
            {(["today", "upcoming", "all"] as Scope[]).map((s) => (
              <button key={s} type="button" aria-pressed={scope === s} onClick={() => setScope(s)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors sm:flex-none ${scope === s ? "bg-charcoal text-ivory" : "text-ink hover:bg-cream"}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="relative lg:w-80">
            <Icon name="search" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <label htmlFor="appt-search" className="sr-only">Search appointments</label>
            <input id="appt-search" type="search" className="field !pl-10" placeholder="Search name, phone or reference" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SelectFilter id="f-treatment" label="Treatment" value={treatmentId} onChange={setTreatmentId}
            options={treatments.map((t) => ({ value: t.id, label: t.name }))} />
          <SelectFilter id="f-doctor" label="Doctor" value={doctorId} onChange={setDoctorId}
            options={doctors.map((d) => ({ value: d.id, label: d.name }))} />
          <SelectFilter id="f-status" label="Status" value={status} onChange={(v) => setStatus(v as BookingStatus | "")}
            options={(Object.keys(STATUS_STYLES) as BookingStatus[]).map((s) => ({ value: s, label: STATUS_STYLES[s].label }))} />
        </div>
        {hasFilters && (
          <button type="button" className="mt-3 text-sm font-semibold text-gold underline-offset-4 hover:underline"
            onClick={() => { setSearch(""); setTreatmentId(""); setDoctorId(""); setStatus(""); }}>
            Clear filters
          </button>
        )}
      </div>

      {/* List */}
      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {ready ? `${bookings.length} appointment${bookings.length === 1 ? "" : "s"}` : "Loading…"}
      </p>
      <ul className="mt-3 space-y-3" data-testid="appointment-list">
        {bookings.map((b) => {
          const nexts = allowedNextStatuses(b.status) as Exclude<BookingStatus, "pending">[];
          const canReschedule = b.status === "pending" || b.status === "confirmed";
          const open = expanded === b.id;
          return (
            <li key={b.id} className="card p-4 sm:p-5" data-ref={b.reference}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex flex-none items-center gap-4 md:w-40 md:flex-col md:items-start md:gap-0">
                  <p className="font-serif text-3xl leading-none text-charcoal">{formatTime(b.time)}</p>
                  <p className="text-sm text-muted md:mt-1">{b.date === today ? "Today" : formatDate(b.date)}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-charcoal">{b.patientName}</p>
                    <StatusBadge status={b.status} />
                    {b.demo && <span className="chip bg-cream text-muted">Demo</span>}
                  </div>
                  <p className="mt-1 text-sm text-ink">{b.treatmentName} · {doctorName(b.doctorId)}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {b.reference} · {b.phone} · prefers {{ whatsapp: "WhatsApp", email: "email", both: "WhatsApp + email" }[b.contactMethod]}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {nexts.filter((n) => n !== "cancelled").map((n) => (
                    <button key={n} type="button" className="btn btn-primary btn-sm" onClick={() => changeStatus(b, n)}>
                      {ACTION_LABEL[n]}<span className="sr-only"> {b.reference}</span>
                    </button>
                  ))}
                  {canReschedule && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRescheduleTarget(b)}>
                      Reschedule<span className="sr-only"> {b.reference}</span>
                    </button>
                  )}
                  {nexts.includes("cancelled") && (
                    <button type="button" className="btn btn-ghost btn-sm !text-danger" onClick={() => changeStatus(b, "cancelled")}>
                      Cancel<span className="sr-only"> {b.reference}</span>
                    </button>
                  )}
                  <button type="button" className="btn btn-ghost btn-sm" aria-expanded={open} onClick={() => setExpanded(open ? null : b.id)}>
                    Details<span className="sr-only"> {b.reference}</span>
                    <Icon name="chevron" size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>
              {open && (
                <div className="mt-4 grid gap-4 border-t border-line pt-4 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Contact</p>
                    <p className="mt-1">{b.phone}</p>
                    {b.email && <p>{b.email}</p>}
                    {b.notes && <p className="mt-2 text-muted">Note: {b.notes}</p>}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Consent record</p>
                    <p className="mt-1 text-muted">Given {new Date(b.consent.at).toLocaleString("en-GB")}</p>
                    <p className="mt-1 text-xs text-muted">&ldquo;{b.consent.text}&rdquo;</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">History</p>
                    <ol className="mt-1 space-y-1 text-muted">
                      {b.history.map((h, i) => (
                        <li key={i}>
                          <span className="capitalize text-ink">{h.action}</span> · {new Date(h.at).toLocaleDateString("en-GB")}
                          {h.note && <span> · {h.note}</span>}
                        </li>
                      ))}
                    </ol>
                    <button type="button" className="mt-3 text-sm font-semibold text-gold underline-offset-4 hover:underline"
                      onClick={() => setPreview({ title: "Reminder preview", preview: buildMessages("reminder", b, settings) })}>
                      Preview reminder message
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {ready && bookings.length === 0 && (
        <div className="card p-8 text-center text-muted">
          {scope === "today" ? "No appointments today." : "No appointments match these filters."}
        </div>
      )}

      {/* Cancel dialog */}
      <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} title="Cancel appointment?">
        {cancelTarget && (
          <>
            <p className="text-muted">
              {cancelTarget.patientName} · {cancelTarget.treatmentName} · {formatDateLong(cancelTarget.date)}, {formatTime(cancelTarget.time)}
            </p>
            <label htmlFor="cancel-reason" className="label mt-5">Reason (internal, optional)</label>
            <input id="cancel-reason" className="field" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            <p className="hint">The slot becomes available to book again.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setCancelTarget(null)}>Keep appointment</button>
              <button type="button" className="btn btn-primary !bg-danger" onClick={doCancel}>Cancel appointment</button>
            </div>
          </>
        )}
      </Dialog>

      {rescheduleTarget && (
        <RescheduleDialog
          booking={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onDone={(updated, previous) => {
            setRescheduleTarget(null);
            setPreview({ title: "Reschedule notice preview", preview: buildMessages("reschedule", updated, settings, { previous }) });
            toast(`${updated.reference} moved to ${formatDate(updated.date)}, ${formatTime(updated.time)}`);
          }}
        />
      )}

      <Dialog open={!!preview} onClose={() => setPreview(null)} title={preview?.title ?? ""} wide>
        {preview && <MessagePreview preview={preview.preview} title="What the patient would receive" />}
        <button type="button" className="btn btn-primary mt-5 w-full sm:w-auto" onClick={() => setPreview(null)}>Done</button>
      </Dialog>
    </div>
  );
}

function RescheduleDialog({
  booking,
  onClose,
  onDone,
}: {
  booking: Booking;
  onClose: () => void;
  onDone: (b: Booking, previous: { date: string; time: string }) => void;
}) {
  const toast = useToast();
  const { data: days } = useData<DayAvailability[]>(() => getAvailability(booking.doctorId, { ignoreBookingId: booking.id }), [], [booking.id]);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open onClose={onClose} title="Reschedule appointment" wide>
      <p className="text-sm text-muted">
        {booking.patientName} · {booking.treatmentName}. Currently {formatDateLong(booking.date)}, {formatTime(booking.time)}.
      </p>
      <div className="mt-5">
        {days.length > 0 && <SlotPicker days={days} date={date} time={time} onDate={(d) => { setDate(d); setTime(null); }} onTime={setTime} />}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!date || !time || saving || (date === booking.date && time === booking.time)}
          onClick={async () => {
            if (!date || !time) return;
            setSaving(true);
            try {
              const { booking: updated, previous } = await rescheduleBooking(booking.id, date, time);
              onDone(updated, previous);
            } catch (e) {
              toast(errorMessage(e), "error");
            } finally {
              setSaving(false);
            }
          }}
        >
          Save new time
        </button>
      </div>
    </Dialog>
  );
}

function SelectFilter({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All {label === "Status" ? "statuses" : `${label.toLowerCase()}s`}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
