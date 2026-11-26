"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDate, formatDateLong, formatTime, timeToMinutes } from "@/lib/dates";
import type { DayAvailability } from "@/lib/types";
import { validateAppointmentRequest, type FieldErrors } from "@/lib/validation";
import { Icon } from "../ui/Icon";

interface TreatmentOption { id: string; slug: string; name: string; category: string; duration: string; price: string; booksyUrl: string }

interface Props {
  mode: "request" | "booksy" | "both";
  booksy: { url: string; label: string };
  financing: { url: string; label: string };
  treatments: TreatmentOption[];
  requireEmail: boolean;
  note: string;
  successTitle: string;
  successMessage: string;
  consentText: string;
  privacyHref: string;
  phone: string;
  phoneDisplay: string;
}

type Success = { reference: string; date: string; time: string; treatmentName: string; emailed: boolean };

const PAGE = 14;

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="mb-5 flex items-center gap-3 text-2xl md:text-[1.7rem]">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-accent font-sans text-sm font-semibold text-accent-ink">{n}</span>
      {children}
    </h2>
  );
}

export function BookingForm(p: Props) {
  const [treatmentId, setTreatmentId] = useState("");
  const [days, setDays] = useState<DayAvailability[] | null>(null);
  const [loadingDays, setLoadingDays] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(0);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", consent: false, website: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState<Success | null>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const formOn = p.mode !== "booksy";

  // Preselect from /book?treatment=slug
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("treatment");
    const t = p.treatments.find((x) => x.slug === slug);
    if (t) setTreatmentId(t.id);
  }, [p.treatments]);

  const loadDays = useCallback(async (id: string) => {
    setLoadingDays(true);
    setLoadError("");
    try {
      const res = await fetch(`/api/availability?treatment=${encodeURIComponent(id)}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load times.");
      setDays(json.days);
      return json.days as DayAvailability[];
    } catch (e) {
      setLoadError((e as Error).message || "Could not load available times. Please call us.");
      setDays(null);
      return null;
    } finally {
      setLoadingDays(false);
    }
  }, []);

  useEffect(() => {
    if (!treatmentId || !formOn) return;
    setDate("");
    setTime("");
    setPage(0);
    loadDays(treatmentId).then((d) => {
      const first = d?.find((x) => x.open && x.available > 0);
      if (first) setDate(first.date);
    });
  }, [treatmentId, formOn, loadDays]);

  const treatment = p.treatments.find((t) => t.id === treatmentId);
  const day = days?.find((d) => d.date === date);
  const pageDays = useMemo(() => days?.slice(page * PAGE, page * PAGE + PAGE) ?? [], [days, page]);
  const pages = Math.ceil((days?.length ?? 0) / PAGE);

  const set = (k: keyof typeof form, v: string | boolean) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    const payload = { treatmentId, date, time, ...form };
    const errs = validateAppointmentRequest(payload, { requireEmail: p.requireEmail });
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      document.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.fields) setErrors(json.fields);
        setSubmitError(json.error || "Your request could not be sent. Please try again or call us.");
        if (res.status === 409) {
          setTime("");
          loadDays(treatmentId);
        }
        return;
      }
      setSuccess({ ...json.appointment, emailed: json.emailed });
      requestAnimationFrame(() => successRef.current?.focus());
    } catch {
      setSubmitError("Network problem. Please check your connection and try again, or call us.");
    } finally {
      setSubmitting(false);
    }
  }

  const aside = (
    <aside className="space-y-6">
      {p.mode !== "request" && p.booksy.url && (
        <div className="card border border-line bg-surface p-6 reset-tone">
          <p className="eyebrow mb-2">{p.mode === "booksy" ? "Online booking" : "Prefer instant booking?"}</p>
          <p className="text-[0.95rem] text-fg-muted">{p.mode === "booksy" ? "Choose your service and time in our Booksy calendar." : "You can also choose a time directly in our Booksy calendar."}</p>
          <a href={treatment?.booksyUrl || p.booksy.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-5 w-full !border-ink !text-ink">
            <Icon name="calendar" size={16} /> {p.booksy.label}
          </a>
        </div>
      )}
      <div className="card border border-line bg-surface p-6 reset-tone">
        <p className="eyebrow mb-2">Questions?</p>
        <p className="text-[0.95rem] text-fg-muted">Not sure which treatment to choose? Call us and we will help.</p>
        {p.phone && (
          <a href={`tel:${p.phone}`} className="mt-4 inline-flex items-center gap-2 font-semibold">
            <Icon name="phone" size={16} /> {p.phoneDisplay}
          </a>
        )}
      </div>
      {p.financing.url && p.financing.label && (
        <a href={p.financing.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm underline-offset-4 hover:underline">
          <Icon name="card" size={18} /> {p.financing.label}
        </a>
      )}
    </aside>
  );

  if (!formOn) {
    return <div className="mx-auto max-w-xl">{aside}</div>;
  }

  if (success) {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="card mx-auto max-w-2xl border border-line bg-surface p-8 text-center reset-tone outline-none md:p-12" data-testid="booking-success">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-alt text-ink"><Icon name="check" size={26} /></div>
        <h2 className="mt-6 text-4xl">{p.successTitle}</h2>
        <p className="mx-auto mt-4 max-w-lg text-fg-muted">{p.successMessage}</p>
        <dl className="mx-auto mt-8 grid max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-y border-line py-6 text-left text-sm">
          <dt className="text-fg-muted">Treatment</dt><dd className="font-medium">{success.treatmentName}</dd>
          <dt className="text-fg-muted">Requested</dt><dd className="font-medium">{formatDateLong(success.date)}, {formatTime(success.time)}</dd>
          <dt className="text-fg-muted">Reference</dt><dd className="font-mono font-medium">{success.reference}</dd>
          <dt className="text-fg-muted">Status</dt><dd className="font-medium">Pending approval</dd>
        </dl>
        {!success.emailed && <p className="mt-6 text-sm text-fg-muted">Please keep your reference number. We will contact you by phone or email.</p>}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="btn btn-primary">Back to home</Link>
          <button type="button" className="btn btn-outline !border-ink !text-ink" onClick={() => { setSuccess(null); setTime(""); setForm((f) => ({ ...f, message: "" })); loadDays(treatmentId); }}>
            Request another time
          </button>
        </div>
      </div>
    );
  }

  const morning = day?.open ? day.slots.filter((s) => timeToMinutes(s.time) < 12 * 60) : [];
  const afternoon = day?.open ? day.slots.filter((s) => timeToMinutes(s.time) >= 12 * 60) : [];

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-14">
      <form onSubmit={submit} noValidate className="min-w-0 card border border-line bg-surface p-5 reset-tone sm:p-8 md:p-10" aria-describedby="booking-note">
        <p id="booking-note" className="mb-8 flex gap-3 rounded-md bg-alt/60 p-4 text-sm leading-relaxed">
          <Icon name="info" size={18} className="mt-0.5 flex-none" /> {p.note}
        </p>

        {/* 1. Treatment */}
        <fieldset className="min-w-0">
          <legend className="sr-only">Treatment</legend>
          <StepTitle n={1}>Choose a treatment</StepTitle>
          <div className="grid gap-2.5 sm:grid-cols-2" data-field="treatmentId" tabIndex={-1}>
            {p.treatments.map((t) => (
              <label key={t.id} className={`flex min-h-[64px] cursor-pointer items-center justify-between gap-3 rounded-md border px-4 py-3 transition-colors ${treatmentId === t.id ? "border-ink bg-alt/50" : "border-line hover:border-ink/40"}`}>
                <span>
                  <span className="block font-medium">{t.name}</span>
                  {(t.duration || t.price) && <span className="block text-xs text-fg-muted">{[t.duration, t.price].filter(Boolean).join(" · ")}</span>}
                </span>
                <input type="radio" name="treatment" value={t.id} checked={treatmentId === t.id} onChange={() => { setTreatmentId(t.id); setErrors((e) => ({ ...e, treatmentId: undefined })); }} className="h-5 w-5 flex-none accent-[var(--c-ink)]" />
              </label>
            ))}
          </div>
          {errors.treatmentId && <p className="field-error">{errors.treatmentId}</p>}
        </fieldset>

        {/* 2. Date */}
        <fieldset className="mt-12 min-w-0" disabled={!treatmentId}>
          <legend className="sr-only">Date</legend>
          <StepTitle n={2}>Choose a preferred date</StepTitle>
          {!treatmentId && <p className="text-sm text-fg-muted">Choose a treatment first to see available dates.</p>}
          {loadingDays && <p className="text-sm text-fg-muted" role="status">Loading available dates…</p>}
          {loadError && <p className="field-error" role="alert">{loadError}</p>}
          {treatmentId && days && !loadingDays && (
            <>
              <div className="flex items-center gap-2">
                <button type="button" className="hidden h-11 w-11 flex-none items-center justify-center rounded-full border border-line disabled:opacity-30 sm:flex" onClick={() => setPage((x) => x - 1)} disabled={page === 0} aria-label="Earlier dates">
                  <Icon name="chevronLeft" size={18} />
                </button>
                <div className="no-scrollbar -mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 py-1" data-field="date" tabIndex={-1} role="radiogroup" aria-label="Dates">
                  {pageDays.map((d) => {
                    const available = d.open && d.available > 0;
                    const selected = d.date === date;
                    return (
                      <button
                        key={d.date}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={!available}
                        onClick={() => { setDate(d.date); setTime(""); setErrors((e) => ({ ...e, date: undefined })); }}
                        className={`flex min-h-[72px] min-w-[64px] flex-none flex-col items-center justify-center rounded-md border px-2 text-center transition-colors ${selected ? "border-ink bg-ink text-white" : available ? "border-line hover:border-ink/50" : "border-transparent text-fg-muted line-through opacity-60"}`}
                        aria-label={`${formatDateLong(d.date)}${available ? "" : ", unavailable"}`}
                      >
                        <span className="text-[0.68rem] font-semibold uppercase tracking-wider">{formatDate(d.date, { weekday: "short" })}</span>
                        <span className="font-display text-2xl leading-none">{formatDate(d.date, { day: "numeric" })}</span>
                        <span className="text-[0.68rem]">{formatDate(d.date, { month: "short" })}</span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" className="hidden h-11 w-11 flex-none items-center justify-center rounded-full border border-line disabled:opacity-30 sm:flex" onClick={() => setPage((x) => x + 1)} disabled={page >= pages - 1} aria-label="Later dates">
                  <Icon name="chevronRight" size={18} />
                </button>
              </div>
              <div className="mt-3 flex justify-between sm:hidden">
                <button type="button" className="text-sm font-medium disabled:opacity-30" onClick={() => setPage((x) => x - 1)} disabled={page === 0}>← Earlier</button>
                <button type="button" className="text-sm font-medium disabled:opacity-30" onClick={() => setPage((x) => x + 1)} disabled={page >= pages - 1}>Later →</button>
              </div>
              {days.every((d) => !d.open || d.available === 0) && <p className="mt-3 text-sm">No online times are available right now. Please call us at {p.phoneDisplay}.</p>}
              {errors.date && <p className="field-error">{errors.date}</p>}
            </>
          )}
        </fieldset>

        {/* 3. Time */}
        <fieldset className="mt-12 min-w-0" disabled={!date}>
          <legend className="sr-only">Time</legend>
          <StepTitle n={3}>Choose a time</StepTitle>
          {!date && <p className="text-sm text-fg-muted">Choose a date to see times.</p>}
          {day && day.open && (
            <div data-field="time" tabIndex={-1} className="space-y-5">
              <p className="text-sm text-fg-muted">{formatDateLong(day.date)}</p>
              {[["Morning", morning], ["Afternoon", afternoon]].map(([label, slots]) =>
                (slots as typeof morning).length ? (
                  <div key={label as string}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">{label as string}</p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5" role="radiogroup" aria-label={`${label} times`}>
                      {(slots as typeof morning).map((s) => (
                        <button
                          key={s.time}
                          type="button"
                          role="radio"
                          aria-checked={time === s.time}
                          disabled={s.state !== "available"}
                          onClick={() => { setTime(s.time); setErrors((e) => ({ ...e, time: undefined })); }}
                          className={`min-h-[48px] rounded-md border text-sm tabular-nums transition-colors ${time === s.time ? "border-ink bg-ink text-white" : s.state === "available" ? "border-line hover:border-ink/50" : "border-transparent bg-alt/40 text-fg-muted line-through"}`}
                          aria-label={`${formatTime(s.time)}${s.state === "available" ? "" : ", unavailable"}`}
                        >
                          {formatTime(s.time)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          )}
          {errors.time && <p className="field-error" role="alert">{errors.time}</p>}
        </fieldset>

        {/* 4. Details */}
        <fieldset className="mt-12 min-w-0">
          <legend className="sr-only">Your details</legend>
          <StepTitle n={4}>Your details</StepTitle>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="bk-name" className="field-label">Full name</label>
              <input id="bk-name" data-field="name" className="field" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "bk-name-err" : undefined} maxLength={100} />
              {errors.name && <p id="bk-name-err" className="field-error">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="bk-email" className="field-label">Email address{!p.requireEmail && " (optional)"}</label>
              <input id="bk-email" data-field="email" type="email" inputMode="email" className="field" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "bk-email-err" : undefined} maxLength={200} />
              {errors.email && <p id="bk-email-err" className="field-error">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="bk-phone" className="field-label">Phone number</label>
              <input id="bk-phone" data-field="phone" type="tel" inputMode="tel" className="field" autoComplete="tel" placeholder="(305) 555-0123" value={form.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "bk-phone-err" : undefined} maxLength={30} />
              {errors.phone && <p id="bk-phone-err" className="field-error">{errors.phone}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="bk-message" className="field-label">Message (optional)</label>
              <textarea id="bk-message" data-field="message" className="field min-h-[110px]" value={form.message} onChange={(e) => set("message", e.target.value)} maxLength={1000} placeholder="Anything we should know? Please don't include detailed medical information." />
              {errors.message && <p className="field-error">{errors.message}</p>}
            </div>
            <div className="hidden" aria-hidden="true">
              <label htmlFor="bk-website">Website</label>
              <input id="bk-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set("website", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="flex cursor-pointer gap-3 text-sm leading-relaxed">
                <input type="checkbox" data-field="consent" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-1 h-5 w-5 flex-none accent-[var(--c-ink)]" aria-invalid={Boolean(errors.consent)} />
                <span>
                  {p.consentText}
                  {p.privacyHref && <> <Link href={p.privacyHref} className="underline underline-offset-2" target="_blank">Privacy Policy</Link></>}
                </span>
              </label>
              {errors.consent && <p className="field-error">{errors.consent}</p>}
            </div>
          </div>
        </fieldset>

        {(treatment || date || time) && (
          <div className="mt-10 rounded-md border border-line p-4 text-sm" aria-live="polite">
            <span className="font-semibold">Your request: </span>
            {[treatment?.name, date && formatDateLong(date), time && formatTime(time)].filter(Boolean).join(" · ")}
          </div>
        )}

        {submitError && <p className="mt-6 rounded-md border border-[#b42318]/30 bg-[#b42318]/5 p-4 text-sm text-[#b42318]" role="alert">{submitError}</p>}

        <button type="submit" className="btn btn-primary mt-8 w-full sm:w-auto" disabled={submitting}>
          {submitting ? "Sending your request…" : "Request appointment"}
        </button>
      </form>
      {aside}
    </div>
  );
}
