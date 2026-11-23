"use client";

import { useMemo, useState } from "react";
import { allowedNextStatuses, canReschedule, dataMode, getAvailability, getBookings, getTreatments, rescheduleBooking, setBookingStatus } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import type { Booking, BookingFilters, BookingResult, BookingStatus, DayAvailability, NotificationLog } from "@/lib/data/types";
import { addDays, formatDate, formatDateLong, formatTime, todayISO } from "@/lib/dates";
import { buildMessages, type MessageKind, type MessagePreview as Preview } from "@/lib/messages";
import { clinicNow } from "@/lib/tz";
import { MessagePreview } from "../booking/MessagePreview";
import { SlotPicker } from "../booking/SlotPicker";
import { useSite } from "../site/SiteProvider";
import { Dialog } from "../ui/Dialog";
import { Icon } from "../ui/Icon";
import { STATUS_STYLES, StatusBadge, errorMessage, useToast } from "./ui";

type Scope = NonNullable<BookingFilters["scope"]>;
type Act = Exclude<BookingStatus, "pending">;

const ACTION: Record<Act, { label: string; tone: "primary" | "ghost" | "danger" }> = {
  confirmed: { label: "Accept", tone: "primary" },
  rejected: { label: "Reject", tone: "danger" },
  arrived: { label: "Mark arrived", tone: "ghost" },
  completed: { label: "Mark completed", tone: "ghost" },
  cancelled: { label: "Cancel", tone: "danger" },
};

export function Appointments() {
  const toast = useToast();
  const { content } = useSite();
  const [scope, setScope] = useState<Scope>("upcoming");
  const [search, setSearch] = useState("");
  const [treatmentId, setTreatmentId] = useState("");
  const [status, setStatus] = useState<BookingStatus | "">("");

  const filters: BookingFilters = { scope, search, treatmentId: treatmentId || undefined, status: status || undefined };
  const { data: bookings, ready, error } = useData(() => getBookings(filters), [], [scope, search, treatmentId, status], { fresh: true });
  const { data: all } = useData(() => getBookings(), [], [], { fresh: true });
  const { data: treatments } = useData(() => getTreatments({ includeInactive: true }), [], [], { fresh: true });

  const [reasonFor, setReasonFor] = useState<{ b: Booking; action: "rejected" | "cancelled" } | null>(null);
  const [reason, setReason] = useState("");
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [sent, setSent] = useState<{ title: string; preview: Preview; logs: NotificationLog[] } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const today = todayISO(clinicNow());
  const stats = useMemo(
    () => [
      { label: "Today", value: all.filter((b) => b.date === today && !["cancelled", "rejected"].includes(b.status)).length },
      { label: "Awaiting review", value: all.filter((b) => b.status === "pending" && b.date >= today).length },
      { label: "Next 7 days", value: all.filter((b) => b.date > today && b.date <= addDays(today, 7) && ["pending", "confirmed"].includes(b.status)).length },
      { label: "Accepted upcoming", value: all.filter((b) => b.date >= today && b.status === "confirmed").length },
    ],
    [all, today],
  );

  const showResult = (r: BookingResult, kind: MessageKind | null, title: string, extra?: Parameters<typeof buildMessages>[3]) => {
    if (kind) setSent({ title, preview: buildMessages(kind, r.booking, content, extra), logs: r.notifications });
  };

  const act = async (b: Booking, next: Act, note?: string) => {
    if ((next === "rejected" || next === "cancelled") && note === undefined) {
      setReason("");
      setReasonFor({ b, action: next });
      return;
    }
    setBusy(b.id);
    try {
      const r = await setBookingStatus(b.id, next, note || undefined);
      toast(`${b.reference}: ${STATUS_STYLES[next].label.toLowerCase()}`);
      const kind: MessageKind | null = next === "confirmed" ? "accepted" : next === "rejected" ? "rejected" : next === "cancelled" ? "cancellation" : null;
      showResult(r, kind, `${STATUS_STYLES[next].label}: patient notification`, { reason: note });
      setReasonFor(null);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(null);
    }
  };

  const hasFilters = !!(search || treatmentId || status);

  return (
    <div>
      <h1 className="text-4xl sm:text-5xl">Appointments</h1>
      <p className="mt-1 text-sm text-muted">{formatDateLong(today)}</p>

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{s.label}</dt>
            <dd className="mt-1 font-serif text-4xl text-charcoal">{s.value}</dd>
          </div>
        ))}
      </dl>

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
            <input id="appt-search" type="search" className="field !pl-10" placeholder="Name, phone, email or reference" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="f-treatment" className="sr-only">Treatment</label>
            <select id="f-treatment" className="field" value={treatmentId} onChange={(e) => setTreatmentId(e.target.value)}>
              <option value="">All treatments</option>
              {treatments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-status" className="sr-only">Status</label>
            <select id="f-status" className="field" value={status} onChange={(e) => setStatus(e.target.value as BookingStatus | "")}>
              <option value="">All statuses</option>
              {(Object.keys(STATUS_STYLES) as BookingStatus[]).map((s) => <option key={s} value={s}>{STATUS_STYLES[s].label}</option>)}
            </select>
          </div>
        </div>
        {hasFilters && (
          <button type="button" className="mt-3 text-sm font-semibold text-gold underline-offset-4 hover:underline" onClick={() => { setSearch(""); setTreatmentId(""); setStatus(""); }}>Clear filters</button>
        )}
      </div>

      <p className="mt-6 text-sm text-muted" aria-live="polite">{error ? <span className="text-danger">{error}</span> : ready ? `${bookings.length} appointment${bookings.length === 1 ? "" : "s"}` : "Loading…"}</p>
      <ul className="mt-3 space-y-3" data-testid="appointment-list">
        {bookings.map((b) => {
          const nexts = allowedNextStatuses(b.status) as Act[];
          const open = expanded === b.id;
          return (
            <li key={b.id} className="card p-4 sm:p-5" data-ref={b.reference}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex flex-none items-center gap-4 md:w-36 md:flex-col md:items-start md:gap-0">
                  <p className="font-serif text-3xl leading-none text-charcoal">{formatTime(b.time)}</p>
                  <p className="text-sm text-muted md:mt-1">{b.date === today ? "Today" : formatDate(b.date)}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-charcoal">{b.patientName}</p>
                    <StatusBadge status={b.status} />
                    {b.demo && <span className="chip bg-cream text-muted">Demo</span>}
                  </div>
                  <p className="mt-1 text-sm text-ink">{b.treatmentName}</p>
                  <p className="mt-0.5 break-words text-xs text-muted">{b.reference} · {b.phone}{b.email && ` · ${b.email}`}</p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {nexts.map((n) => (
                    <button key={n} type="button" disabled={busy === b.id} onClick={() => act(b, n)}
                      className={`btn btn-sm ${ACTION[n].tone === "primary" ? "btn-primary" : "btn-ghost"} ${ACTION[n].tone === "danger" ? "!text-danger" : ""}`}>
                      {ACTION[n].label}<span className="sr-only"> {b.reference}</span>
                    </button>
                  ))}
                  {canReschedule(b.status) && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRescheduleTarget(b)}>Reschedule<span className="sr-only"> {b.reference}</span></button>
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
                    {b.email && <p className="break-all">{b.email}</p>}
                    <p className="text-muted">Prefers: {{ whatsapp: "WhatsApp", email: "Email", both: "Email + WhatsApp" }[b.contactMethod]}</p>
                    {b.notes && <p className="mt-2 text-muted">Note: {b.notes}</p>}
                    <p className="mt-3 text-xs text-muted">Consent recorded {new Date(b.consent.at).toLocaleString("en-GB")}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">History</p>
                    <ol className="mt-1 space-y-1 text-muted">
                      {b.history.map((h, i) => (
                        <li key={i}><span className="capitalize text-ink">{h.action === "confirmed" ? "accepted" : h.action}</span> · {new Date(h.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}{h.note && <span> · {h.note}</span>}</li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Notifications</p>
                    <NotificationLogList logs={b.notifications ?? []} />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {ready && bookings.length === 0 && <div className="card p-8 text-center text-muted">{scope === "today" ? "No appointments today." : "No appointments match these filters."}</div>}

      <Dialog open={!!reasonFor} onClose={() => setReasonFor(null)} title={reasonFor?.action === "rejected" ? "Reject this request?" : "Cancel appointment?"}>
        {reasonFor && (
          <>
            <p className="text-muted">{reasonFor.b.patientName} · {reasonFor.b.treatmentName} · {formatDateLong(reasonFor.b.date)}, {formatTime(reasonFor.b.time)}</p>
            <label htmlFor="reason" className="label mt-5">{reasonFor.action === "rejected" ? "Message to the patient (optional)" : "Reason (internal, optional)"}</label>
            <textarea id="reason" className="field" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300}
              placeholder={reasonFor.action === "rejected" ? "e.g. The doctor is unavailable that day. Please choose another date." : ""} />
            <p className="hint">The patient is notified and the time slot becomes available again.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setReasonFor(null)}>Back</button>
              <button type="button" className="btn btn-primary !bg-danger" disabled={busy === reasonFor.b.id} onClick={() => act(reasonFor.b, reasonFor.action, reason)}>
                {reasonFor.action === "rejected" ? "Reject request" : "Cancel appointment"}
              </button>
            </div>
          </>
        )}
      </Dialog>

      {rescheduleTarget && (
        <RescheduleDialog
          booking={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onDone={(r) => {
            setRescheduleTarget(null);
            showResult(r, "reschedule", "Rescheduled: patient notification", { previous: r.previous });
            toast(`${r.booking.reference} moved to ${formatDate(r.booking.date)}, ${formatTime(r.booking.time)}`);
          }}
        />
      )}

      <Dialog open={!!sent} onClose={() => setSent(null)} title={sent?.title ?? ""} wide>
        {sent && (
          <>
            <div className="mb-4 rounded-2xl border border-line bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Delivery</p>
              <NotificationLogList logs={sent.logs} />
            </div>
            <MessagePreview preview={sent.preview} title={dataMode === "demo" ? "What the patient would receive (demo)" : "Message content"} />
          </>
        )}
        <button type="button" className="btn btn-primary mt-5 w-full sm:w-auto" onClick={() => setSent(null)}>Done</button>
      </Dialog>
    </div>
  );
}

export function NotificationLogList({ logs }: { logs: NotificationLog[] }) {
  if (logs.length === 0) return <p className="mt-1 text-muted">No notifications for this action.</p>;
  return (
    <ul className="mt-1 space-y-1" data-testid="notification-log">
      {logs.map((n, i) => (
        <li key={i} className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className={`chip ${n.status === "sent" ? "bg-[#e3efe6] text-success" : n.status === "failed" ? "bg-[#f6e3e1] text-danger" : "bg-cream text-muted"}`}>{n.status}</span>
          <span className="text-ink">{n.channel === "email" ? "Email" : "WhatsApp"} to {n.audience}</span>
          <span className="text-xs text-muted">({n.kind}{n.detail ? ` · ${n.detail}` : ""})</span>
        </li>
      ))}
    </ul>
  );
}

function RescheduleDialog({ booking, onClose, onDone }: { booking: Booking; onClose: () => void; onDone: (r: BookingResult & { previous: { date: string; time: string } }) => void }) {
  const toast = useToast();
  const { data: days } = useData<DayAvailability[]>(() => getAvailability(booking.doctorId, { ignoreBookingId: booking.id }), [], [booking.id], { fresh: true });
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open onClose={onClose} title="Reschedule appointment" wide>
      <p className="text-sm text-muted">{booking.patientName} · {booking.treatmentName}. Currently {formatDateLong(booking.date)}, {formatTime(booking.time)}.</p>
      <div className="mt-5">{days.length > 0 ? <SlotPicker days={days} date={date} time={time} onDate={(d) => { setDate(d); setTime(null); }} onTime={setTime} /> : <div className="h-32 animate-pulse rounded-2xl bg-cream" />}</div>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-primary" disabled={!date || !time || saving || (date === booking.date && time === booking.time)}
          onClick={async () => {
            if (!date || !time) return;
            setSaving(true);
            try {
              onDone(await rescheduleBooking(booking.id, date, time));
            } catch (e) {
              toast(errorMessage(e), "error");
            } finally {
              setSaving(false);
            }
          }}>
          Save new time
        </button>
      </div>
    </Dialog>
  );
}
