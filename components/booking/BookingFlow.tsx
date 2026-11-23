"use client";

import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { DataError, createBooking, getAvailability, getDoctors } from "@/lib/data";
import { categoryLabel } from "@/lib/data/catalog";
import { useData } from "@/lib/data/hooks";
import type { Booking, ContactMethod, DayAvailability, Doctor, ISODate, Treatment } from "@/lib/data/types";
import { formatDateLong, formatTime } from "@/lib/dates";
import { bookingToICS } from "@/lib/ics";
import { CONSENT_TEXT, buildMessages } from "@/lib/messages";
import { isValidEmail, normalisePkMobile } from "@/lib/phone";
import { useSettings } from "../layout/useSettings";
import { useTreatments } from "../treatments/useTreatments";
import { Icon } from "../ui/Icon";
import { m } from "../ui/Motion";
import { PriceTag } from "../ui/Price";
import { MessagePreview } from "./MessagePreview";
import { SlotPicker } from "./SlotPicker";

const STEPS = ["Treatment", "Doctor", "Date & time", "Your details", "Review"] as const;

interface Details {
  name: string;
  phone: string;
  email: string;
  method: ContactMethod;
  consent: boolean;
  notes: string;
}

type Errors = Partial<Record<keyof Details, string>>;

export function BookingFlow({ initialTreatments, initialDoctors }: { initialTreatments: Treatment[]; initialDoctors: Doctor[] }) {
  const params = useSearchParams();
  const { data: treatments } = useTreatments(initialTreatments);
  const { data: doctors } = useData(getDoctors, initialDoctors);
  const { data: settings } = useSettings();

  const [step, setStep] = useState(0);
  const [treatmentId, setTreatmentId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [date, setDate] = useState<ISODate | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [details, setDetails] = useState<Details>({ name: "", phone: "", email: "", method: "whatsapp", consent: false, notes: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Preselect from ?treatment=slug (links from treatment pages and offers).
  useEffect(() => {
    const slug = params.get("treatment");
    const t = slug ? treatments.find((x) => x.slug === slug) : undefined;
    if (t && !treatmentId) {
      setTreatmentId(t.id);
      setStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, treatments]);

  // Only doctors who offer the chosen treatment.
  const treatment = treatments.find((t) => t.id === treatmentId) ?? null;
  const availableDoctors = useMemo(
    () => doctors.filter((d) => !treatment || treatment.doctorIds.length === 0 || treatment.doctorIds.includes(d.id)),
    [doctors, treatment],
  );
  useEffect(() => {
    if (availableDoctors.length === 1 && !doctorId) setDoctorId(availableDoctors[0].id);
  }, [availableDoctors, doctorId]);
  const doctor = doctors.find((d) => d.id === doctorId) ?? null;

  // Availability re-loads automatically when settings or bookings change (even from another tab).
  const { data: days } = useData<DayAvailability[]>(
    () => (doctorId ? getAvailability(doctorId) : Promise.resolve([])),
    [],
    [doctorId],
  );

  // If the selected slot becomes unavailable (taken in another tab, settings changed), drop it.
  useEffect(() => {
    if (!date || !days.length) return;
    const day = days.find((d) => d.date === date);
    if (!day || !day.open || day.availableCount === 0) {
      setDate(null);
      setTime(null);
    } else if (time && !day.slots.some((s) => s.time === time && s.state === "available")) {
      setTime(null);
    }
  }, [days, date, time]);

  // Move focus to the step heading for screen readers and keyboard users.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [step, booking]);

  const validateDetails = (): Errors => {
    const e: Errors = {};
    if (details.name.trim().length < 2) e.name = "Please enter your full name.";
    if (!normalisePkMobile(details.phone)) e.phone = "Enter a Pakistani mobile number, e.g. 0300 1234567.";
    const needsEmail = details.method === "email" || details.method === "both";
    if (details.email.trim() && !isValidEmail(details.email)) e.email = "Please enter a valid email address.";
    else if (needsEmail && !details.email.trim()) e.email = "Add an email address to receive email updates.";
    if (!details.consent) e.consent = "Please tick to agree so the clinic can contact you.";
    return e;
  };

  const canContinue = [!!treatment, !!doctor, !!date && !!time, true, true][step];

  const next = () => {
    if (step === 3) {
      const e = validateDetails();
      setErrors(e);
      if (Object.keys(e).length) {
        const first = Object.keys(e)[0];
        document.getElementById(`f-${first}`)?.focus();
        return;
      }
    }
    setFormError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const confirm = async () => {
    if (!treatment || !doctor || !date || !time) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const b = await createBooking({
        treatmentId: treatment.id,
        doctorId: doctor.id,
        date,
        time,
        patientName: details.name,
        phone: details.phone,
        email: details.email || undefined,
        contactMethod: details.method,
        consent: details.consent,
        notes: details.notes,
      });
      setBooking(b);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setFormError(msg);
      if (err instanceof DataError && (err.code === "SLOT_UNAVAILABLE" || err.code === "DAY_CLOSED")) {
        setTime(null);
        setStep(2);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setBooking(null);
    setStep(0);
    setTreatmentId(null);
    setDate(null);
    setTime(null);
    setDetails({ name: "", phone: "", email: "", method: "whatsapp", consent: false, notes: "" });
    setErrors({});
  };

  /* ------------------------------ Confirmation ------------------------------ */
  if (booking) {
    const preview = buildMessages("confirmation", booking, settings);
    const ics = `data:text/calendar;charset=utf-8,${encodeURIComponent(bookingToICS(booking, settings))}`;
    return (
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10 space-y-6" data-testid="confirmation">
        <div className="card overflow-hidden">
          <div className="bg-charcoal px-6 py-8 text-center text-ivory sm:px-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-champagne text-charcoal">
              <Icon name="check" size={28} />
            </span>
            <h2 ref={headingRef} tabIndex={-1} className="mt-4 text-4xl !text-ivory focus:outline-none">Request received</h2>
            <p className="mt-2 text-[#d9d1c4]">The clinic will confirm your appointment shortly.</p>
            <p className="mt-5 text-xs uppercase tracking-[0.2em] text-champagne">Reference</p>
            <p className="font-serif text-3xl tracking-wide text-ivory" data-testid="reference">{booking.reference}</p>
          </div>
          <dl className="grid gap-4 p-6 text-sm sm:grid-cols-2 sm:p-8">
            <Summary label="Treatment" value={booking.treatmentName} />
            <Summary label="Doctor" value={doctor?.name ?? ""} />
            <Summary label="Date" value={formatDateLong(booking.date)} />
            <Summary label="Time" value={formatTime(booking.time)} />
            <Summary label="Name" value={booking.patientName} />
            <Summary label="Mobile" value={booking.phone} />
            <Summary label="Status" value="Awaiting clinic confirmation" />
            <Summary label="Location" value={`${settings.addressLine}, ${settings.city}`} />
          </dl>
          <div className="flex flex-col gap-3 border-t border-line p-6 sm:flex-row sm:p-8">
            <a href={ics} download={`${booking.reference}.ics`} className="btn btn-ghost">
              <Icon name="calendar" size={18} /> Add to calendar
            </a>
            <button type="button" onClick={reset} className="btn btn-ghost">Book another</button>
            <Link href="/" className="btn btn-primary sm:ml-auto">Back to home</Link>
          </div>
        </div>
        <MessagePreview preview={preview} />
      </m.div>
    );
  }

  /* --------------------------------- Steps --------------------------------- */
  return (
    <div className="mt-8">
      {/* Progress */}
      <ol className="flex items-center gap-1.5" aria-label="Booking progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1" aria-current={i === step ? "step" : undefined}>
            <div className={`h-1 rounded-full transition-colors duration-500 ${i <= step ? "bg-champagne" : "bg-line"}`} />
            <p className={`mt-2 hidden text-xs font-medium sm:block ${i === step ? "text-charcoal" : "text-muted"}`}>{label}</p>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-muted sm:hidden">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>

      <div className="card mt-6 p-5 sm:p-8">
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
            <h2 ref={headingRef} tabIndex={-1} className="text-3xl focus:outline-none sm:text-4xl">
              {["Which treatment?", "Choose your doctor", "Pick a date and time", "Your details", "Review and confirm"][step]}
            </h2>

            {formError && (
              <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{formError}</p>
            )}

            {/* Step 1: treatment */}
            {step === 0 && (
              <fieldset className="mt-6">
                <legend className="sr-only">Treatment</legend>
                <div className="grid gap-3">
                  {treatments.map((t) => (
                    <ChoiceCard key={t.id} name="treatment" checked={treatmentId === t.id} onChange={() => { setTreatmentId(t.id); setDoctorId(null); setDate(null); setTime(null); }}>
                      <span className="flex flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <span>
                          <span className="block font-semibold text-charcoal">{t.name}</span>
                          <span className="text-xs text-muted">{categoryLabel(t.category)} · {t.sessionLength}</span>
                        </span>
                        <PriceTag price={t.price} className="sm:text-right" />
                      </span>
                    </ChoiceCard>
                  ))}
                </div>
                <p className="hint mt-4">
                  Not sure? Choose <strong>Skin Consultation</strong>, or try the{" "}
                  <Link href="/skin-finder" className="font-semibold text-gold underline underline-offset-2">Skin Concern Finder</Link>.
                </p>
              </fieldset>
            )}

            {/* Step 2: doctor */}
            {step === 1 && (
              <fieldset className="mt-6">
                <legend className="sr-only">Doctor</legend>
                <div className="grid gap-3">
                  {availableDoctors.map((d) => (
                    <ChoiceCard key={d.id} name="doctor" checked={doctorId === d.id} onChange={() => { setDoctorId(d.id); setDate(null); setTime(null); }}>
                      <span className="flex items-center gap-4">
                        <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-gradient-to-br from-champagne-soft to-champagne font-serif text-xl text-charcoal">
                          {d.name.replace("Dr. ", "").split(" ").map((p) => p[0]).join("")}
                        </span>
                        <span>
                          <span className="block font-semibold text-charcoal">{d.name}</span>
                          <span className="text-xs text-muted">{d.role}</span>
                        </span>
                      </span>
                    </ChoiceCard>
                  ))}
                </div>
                {treatment && <p className="hint mt-4">Showing doctors who offer {treatment.name}.</p>}
              </fieldset>
            )}

            {/* Step 3: date & time */}
            {step === 2 && (
              <div className="mt-6">
                {days.length === 0 ? (
                  <div className="h-40" aria-busy="true" />
                ) : days.every((d) => !d.open || d.availableCount === 0) ? (
                  <p className="rounded-2xl bg-cream p-4 text-sm text-muted">No times are available in the next {settings.bookingWindowDays} days. Please message the clinic on WhatsApp.</p>
                ) : (
                  <SlotPicker days={days} date={date} time={time} onDate={(d) => { setDate(d); setTime(null); }} onTime={setTime} />
                )}
              </div>
            )}

            {/* Step 4: details */}
            {step === 3 && (
              <div className="mt-6 grid gap-5" data-testid="details-form">
                <Field id="f-name" label="Full name" error={errors.name}>
                  <input id="f-name" className="field" autoComplete="name" value={details.name} aria-invalid={!!errors.name} aria-describedby={errors.name ? "f-name-err" : undefined}
                    onChange={(e) => setDetails({ ...details, name: e.target.value })} />
                </Field>
                <Field id="f-phone" label="Mobile number" error={errors.phone} hint="Pakistani mobile, e.g. 0300 1234567 or +92 300 1234567">
                  <input id="f-phone" className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="0300 1234567" value={details.phone}
                    aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "f-phone-err" : "f-phone-hint"}
                    onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                    onBlur={() => details.phone && setErrors((er) => ({ ...er, phone: normalisePkMobile(details.phone) ? undefined : "Enter a Pakistani mobile number, e.g. 0300 1234567." }))} />
                </Field>
                <Field id="f-email" label={details.method === "whatsapp" ? "Email (optional)" : "Email"} error={errors.email}>
                  <input id="f-email" className="field" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={details.email}
                    aria-invalid={!!errors.email} aria-describedby={errors.email ? "f-email-err" : undefined}
                    onChange={(e) => setDetails({ ...details, email: e.target.value })} />
                </Field>

                <fieldset>
                  <legend className="label">How should the clinic contact you?</legend>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    {([["whatsapp", "WhatsApp"], ["email", "Email"], ["both", "Both"]] as const).map(([v, l]) => (
                      <label key={v} className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-2 py-3 text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${details.method === v ? "border-charcoal bg-charcoal text-ivory" : "border-sand text-charcoal hover:bg-cream"}`}>
                        <input type="radio" name="method" value={v} className="sr-only" checked={details.method === v} onChange={() => setDetails({ ...details, method: v })} />
                        {l}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label className={`flex cursor-pointer gap-3 rounded-2xl border p-4 text-sm leading-relaxed ${errors.consent ? "border-danger" : "border-line"} bg-ivory`}>
                    <input id="f-consent" type="checkbox" className="mt-0.5 h-5 w-5 flex-none accent-[#8a6a30]" checked={details.consent}
                      aria-invalid={!!errors.consent} aria-describedby={errors.consent ? "f-consent-err" : undefined}
                      onChange={(e) => setDetails({ ...details, consent: e.target.checked })} />
                    <span className="text-ink">{CONSENT_TEXT}</span>
                  </label>
                  {errors.consent && <p id="f-consent-err" className="error-text">{errors.consent}</p>}
                </div>

                <Field id="f-notes" label="Notes for the clinic (optional)" hint="Please don't include sensitive medical details here.">
                  <textarea id="f-notes" className="field min-h-24" maxLength={500} value={details.notes} aria-describedby="f-notes-hint"
                    onChange={(e) => setDetails({ ...details, notes: e.target.value })} />
                </Field>
              </div>
            )}

            {/* Step 5: review */}
            {step === 4 && treatment && doctor && date && time && (
              <div className="mt-6" data-testid="review">
                <dl className="divide-y divide-line rounded-2xl border border-line">
                  <ReviewRow label="Treatment" value={treatment.name} onEdit={() => setStep(0)} />
                  <ReviewRow label="Doctor" value={doctor.name} onEdit={() => setStep(1)} />
                  <ReviewRow label="Date & time" value={`${formatDateLong(date)}, ${formatTime(time)}`} onEdit={() => setStep(2)} />
                  <ReviewRow label="Name" value={details.name.trim()} onEdit={() => setStep(3)} />
                  <ReviewRow label="Mobile" value={normalisePkMobile(details.phone) ?? details.phone} onEdit={() => setStep(3)} />
                  {details.email && <ReviewRow label="Email" value={details.email} onEdit={() => setStep(3)} />}
                  <ReviewRow label="Contact by" value={{ whatsapp: "WhatsApp", email: "Email", both: "WhatsApp and email" }[details.method]} onEdit={() => setStep(3)} />
                  {details.notes.trim() && <ReviewRow label="Notes" value={details.notes.trim()} onEdit={() => setStep(3)} />}
                </dl>
                <div className="mt-4 rounded-2xl bg-cream p-4">
                  <PriceTag price={treatment.price} />
                  <p className="mt-1 text-xs text-muted">Demo price. Payment is made at the clinic; final price is confirmed before treatment.</p>
                </div>
              </div>
            )}
          </m.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
          {step > 0 ? (
            <button type="button" className="btn btn-ghost" onClick={() => { setFormError(null); setStep((s) => s - 1); }}>
              <Icon name="chevronLeft" size={18} /> Back
            </button>
          ) : <span />}
          {step < 4 ? (
            <button type="button" className="btn btn-primary" disabled={!canContinue} onClick={next}>
              Continue <Icon name="arrow" size={18} />
            </button>
          ) : (
            <button type="button" className="btn btn-gold" disabled={submitting} onClick={confirm} data-testid="confirm">
              {submitting ? "Booking…" : "Confirm booking"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- helpers --------------------------------- */

function ChoiceCard({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold ${
        checked ? "border-charcoal bg-cream" : "border-line bg-[#fffdf9] hover:border-champagne"
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border ${checked ? "border-charcoal bg-charcoal text-ivory" : "border-sand"}`} aria-hidden="true">
        {checked && <Icon name="check" size={13} strokeWidth={2.4} />}
      </span>
      {children}
    </label>
  );
}

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error ? <p id={`${id}-err`} className="error-text">{error}</p> : hint ? <p id={`${id}-hint`} className="hint">{hint}</p> : null}
    </div>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
        <dd className="mt-0.5 break-words text-charcoal">{value}</dd>
      </div>
      <button type="button" onClick={onEdit} className="flex-none text-sm font-semibold text-gold underline-offset-4 hover:underline" aria-label={`Edit ${label}`}>
        Edit
      </button>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-0.5 text-charcoal">{value}</dd>
    </div>
  );
}
