"use client";

import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DataError, createBooking, dataMode, getAvailability, getTreatments } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import { MAIN_DOCTOR_ID } from "@/lib/data/seed";
import type { BookingResult, ContactMethod, DayAvailability, ISODate, NotificationLog, Treatment } from "@/lib/data/types";
import { formatDateLong, formatTime } from "@/lib/dates";
import { bookingToICS } from "@/lib/ics";
import { CONSENT_TEXT, CONTACT_METHOD_LABEL, buildMessages } from "@/lib/messages";
import { isValidEmail, normalisePhone } from "@/lib/phone";
import { CATEGORY_LABEL } from "../site/Cards";
import { useSite } from "../site/SiteProvider";
import { m } from "../ui/FramerMotion";
import { Icon } from "../ui/Icon";
import { PriceTag } from "../ui/Price";
import { MessagePreview } from "./MessagePreview";
import { SlotPicker } from "./SlotPicker";

const STEPS = ["Treatment", "Date & time", "Your details", "Review"] as const;

interface Details {
  name: string;
  phone: string;
  email: string;
  method: ContactMethod;
  consent: boolean;
  notes: string;
  website: string; // honeypot
}
type Errors = Partial<Record<keyof Details, string>>;
const EMPTY: Details = { name: "", phone: "", email: "", method: "phone", consent: false, notes: "", website: "" };
const PHONE_ERROR = "Enter a valid phone number, e.g. (909) 555-0142. For numbers outside the US, start with + and the country code.";

export function BookingFlow({ initialTreatments }: { initialTreatments: Treatment[] }) {
  const params = useSearchParams();
  const { content, settings } = useSite();
  const { data: treatments } = useData(() => getTreatments(), initialTreatments);
  const doctorId = MAIN_DOCTOR_ID;

  const [step, setStep] = useState(0);
  const [treatmentId, setTreatmentId] = useState<string | null>(null);
  const [date, setDate] = useState<ISODate | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [details, setDetails] = useState<Details>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    const slug = params.get("treatment");
    const t = slug ? treatments.find((x) => x.slug === slug) : undefined;
    if (t && !treatmentId) {
      setTreatmentId(t.id);
      setStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, treatments]);

  const treatment = treatments.find((t) => t.id === treatmentId) ?? null;
  const { data: days, ready: daysReady, error: daysError, reload } = useData<DayAvailability[]>(() => getAvailability(doctorId), [], [step >= 1], { fresh: true });

  useEffect(() => {
    if (!date || !days.length) return;
    const day = days.find((d) => d.date === date);
    if (!day || !day.open || day.availableCount === 0) {
      setDate(null);
      setTime(null);
    } else if (time && !day.slots.some((s) => s.time === time && s.state === "available")) setTime(null);
  }, [days, date, time]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [step, result]);

  const emailRequired = settings.requireEmail || details.method === "email" || details.method === "both";
  const methods: ContactMethod[] = content.contact.whatsapp ? ["phone", "email", "whatsapp"] : ["phone", "email"];

  const validate = (): Errors => {
    const e: Errors = {};
    if (details.name.trim().length < 2) e.name = "Please enter your full name.";
    if (!normalisePhone(details.phone)) e.phone = PHONE_ERROR;
    if (details.email.trim() && !isValidEmail(details.email)) e.email = "Please enter a valid email address.";
    else if (emailRequired && !details.email.trim()) e.email = "Please enter your email address.";
    if (!details.consent) e.consent = "Please check the box so we can contact you about your appointment.";
    return e;
  };

  const canContinue = [!!treatment, !!date && !!time, true, true][step];

  const next = () => {
    if (step === 2) {
      const e = validate();
      setErrors(e);
      if (Object.keys(e).length) {
        document.getElementById(`f-${Object.keys(e)[0]}`)?.focus();
        return;
      }
    }
    setFormError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const confirm = async () => {
    if (!treatment || !date || !time) return;
    setSubmitting(true);
    setFormError(null);
    try {
      setResult(
        await createBooking({
          treatmentId: treatment.id,
          doctorId,
          date,
          time,
          patientName: details.name,
          phone: details.phone,
          email: details.email || undefined,
          contactMethod: details.method,
          consent: details.consent,
          notes: details.notes,
          website: details.website,
        }),
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      if (err instanceof DataError && (err.code === "SLOT_UNAVAILABLE" || err.code === "DAY_CLOSED")) {
        setTime(null);
        setStep(1);
        void reload();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setStep(0);
    setTreatmentId(null);
    setDate(null);
    setTime(null);
    setDetails(EMPTY);
    setErrors({});
  };

  /* ------------------------------ Confirmation ------------------------------ */
  if (result) {
    const b = result.booking;
    const preview = buildMessages("confirmation", b, content);
    const ics = `data:text/calendar;charset=utf-8,${encodeURIComponent(bookingToICS(b, content))}`;
    const patientLogs = result.notifications.filter((n) => n.audience === "patient");
    return (
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10 space-y-6" data-testid="confirmation">
        <div className="card overflow-hidden">
          <div className="bg-charcoal px-6 py-8 text-center text-ivory sm:px-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-champagne text-charcoal"><Icon name="check" size={28} /></span>
            <h2 ref={headingRef} tabIndex={-1} className="mt-4 text-4xl !text-ivory focus:outline-none">Appointment request received</h2>
            <p className="mt-2 text-[#ddd6cc]">We will review your request and confirm your appointment.</p>
            <p className="mt-5 text-xs uppercase tracking-[0.2em] text-champagne">Reference</p>
            <p className="font-serif text-3xl tracking-wide text-ivory" data-testid="reference">{b.reference}</p>
          </div>
          <dl className="grid gap-4 p-6 text-sm sm:grid-cols-2 sm:p-8">
            <Summary label="Treatment" value={b.treatmentName} />
            <Summary label="Date" value={formatDateLong(b.date)} />
            <Summary label="Time" value={formatTime(b.time)} />
            <Summary label="Name" value={b.patientName} />
            <Summary label="Phone" value={b.phone} />
            {b.email && <Summary label="Email" value={b.email} />}
            <Summary label="Location" value={[content.contact.address, content.contact.city].filter(Boolean).join(", ")} />
          </dl>
          <div className="border-t border-line px-6 py-5 sm:px-8" data-testid="notification-status">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Confirmation messages</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {patientLogs.map((n, i) => <NotificationLine key={i} n={n} to={n.channel === "email" ? b.email : b.phone} />)}
            </ul>
          </div>
          <div className="flex flex-col gap-3 border-t border-line p-6 sm:flex-row sm:p-8">
            <a href={ics} download={`${b.reference}.ics`} className="btn btn-ghost"><Icon name="calendar" size={18} /> Add to calendar</a>
            <button type="button" onClick={reset} className="btn btn-ghost">Book another</button>
            <Link href="/" className="btn btn-primary sm:ml-auto">Back to home</Link>
          </div>
        </div>
        {(dataMode === "demo" || patientLogs.some((n) => n.status !== "sent")) && (
          <MessagePreview preview={preview} title={dataMode === "demo" ? "Message preview (demo mode)" : "Your confirmation"} />
        )}
      </m.div>
    );
  }

  /* --------------------------------- Steps --------------------------------- */
  return (
    <div className="mt-8">
      <ol className="flex items-center gap-1.5" aria-label="Booking progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1" aria-current={i === step ? "step" : undefined}>
            <div className={`h-px transition-colors duration-500 ${i <= step ? "bg-charcoal" : "bg-line"}`} />
            <p className={`mt-2.5 hidden text-[0.68rem] font-medium uppercase tracking-[0.16em] sm:block ${i === step ? "text-charcoal" : "text-muted"}`}>{label}</p>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-muted sm:hidden">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>

      <div className="card mt-6 p-5 sm:p-8">
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
            <h2 ref={headingRef} tabIndex={-1} className="text-3xl focus:outline-none sm:text-4xl">
              {["Which treatment?", "Pick a date and time", "Your details", "Review and confirm"][step]}
            </h2>
            {formError && <p role="alert" className="mt-4 border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{formError}</p>}

            {step === 0 && (
              <fieldset className="mt-6">
                <legend className="sr-only">Treatment</legend>
                <div className="grid gap-3">
                  {treatments.map((t) => (
                    <ChoiceCard key={t.id} name="treatment" checked={treatmentId === t.id} onChange={() => setTreatmentId(t.id)}>
                      <span className="flex flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <span>
                          <span className="block font-medium text-charcoal">{t.name}</span>
                          <span className="text-xs text-muted">{CATEGORY_LABEL[t.category]} · {t.sessionLength}</span>
                        </span>
                        <PriceTag price={t.price} currency={content.currency} className="sm:text-right" />
                      </span>
                    </ChoiceCard>
                  ))}
                </div>
                <p className="hint mt-4">
                  Not sure? Choose <strong className="font-medium text-charcoal">Consultation</strong>, or try the <Link href="/skin-finder" className="font-medium text-gold underline underline-offset-4">treatment finder</Link>.
                </p>
              </fieldset>
            )}

            {step === 1 && (
              <div className="mt-6">
                {daysError ? (
                  <p role="alert" className="bg-cream p-4 text-sm text-danger">Could not load available times. <button type="button" className="font-semibold underline" onClick={() => void reload()}>Try again</button></p>
                ) : !daysReady || days.length === 0 ? (
                  <div className="h-40 animate-pulse bg-cream" aria-busy="true" />
                ) : days.every((d) => !d.open || d.availableCount === 0) ? (
                  <p className="bg-cream p-4 text-sm text-muted">No times are available in the next {settings.bookingWindowDays} days. Please contact the clinic.</p>
                ) : (
                  <SlotPicker days={days} date={date} time={time} onDate={(d) => { setDate(d); setTime(null); }} onTime={setTime} />
                )}
              </div>
            )}

            {step === 2 && (
              <div className="relative mt-6 grid gap-5" data-testid="details-form">
                <Field id="f-name" label="Full name" error={errors.name}>
                  <input id="f-name" className="field" autoComplete="name" maxLength={80} value={details.name} aria-invalid={!!errors.name} aria-describedby={errors.name ? "f-name-err" : undefined}
                    onChange={(e) => setDetails({ ...details, name: e.target.value })} />
                </Field>
                <Field id="f-phone" label="Phone number" error={errors.phone} hint="Mobile preferred, e.g. (909) 555-0142">
                  <input id="f-phone" className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="(909) 555-0142" value={details.phone}
                    aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "f-phone-err" : "f-phone-hint"}
                    onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                    onBlur={() => details.phone && setErrors((er) => ({ ...er, phone: normalisePhone(details.phone) ? undefined : PHONE_ERROR }))} />
                </Field>
                <Field id="f-email" label={emailRequired ? "Email address" : "Email address (optional)"} error={errors.email}>
                  <input id="f-email" className="field" type="email" inputMode="email" autoComplete="email" maxLength={120} placeholder="you@example.com" value={details.email}
                    aria-invalid={!!errors.email} aria-describedby={errors.email ? "f-email-err" : undefined}
                    onChange={(e) => setDetails({ ...details, email: e.target.value })} />
                </Field>
                <fieldset>
                  <legend className="label">If we need to reach you, we should</legend>
                  <div className={`mt-1 grid gap-2 ${methods.length === 3 ? "sm:grid-cols-3" : "grid-cols-2"}`}>
                    {methods.map((v) => (
                      <label key={v} className={`flex min-h-12 cursor-pointer items-center justify-center border px-2 py-3 text-center text-sm font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-charcoal ${details.method === v ? "border-charcoal bg-charcoal text-ivory" : "border-sand text-charcoal hover:border-charcoal"}`}>
                        <input type="radio" name="method" value={v} className="sr-only" checked={details.method === v} onChange={() => setDetails({ ...details, method: v })} />
                        {v === "phone" ? "Call or text me" : v === "email" ? "Email me" : "WhatsApp me"}
                      </label>
                    ))}
                  </div>
                  <p className="hint">Your confirmation is always sent by email.</p>
                </fieldset>
                <Field id="f-notes" label="Notes (optional)" hint="Please don't include sensitive medical details here.">
                  <textarea id="f-notes" className="field min-h-24" maxLength={500} value={details.notes} aria-describedby="f-notes-hint" onChange={(e) => setDetails({ ...details, notes: e.target.value })} />
                </Field>
                <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
                  <label htmlFor="f-website">Website</label>
                  <input id="f-website" tabIndex={-1} autoComplete="off" value={details.website} onChange={(e) => setDetails({ ...details, website: e.target.value })} />
                </div>
                <div>
                  <label className={`flex cursor-pointer gap-3  border p-4 text-sm leading-relaxed ${errors.consent ? "border-danger" : "border-line"} bg-ivory`}>
                    <input id="f-consent" type="checkbox" className="mt-0.5 h-5 w-5 flex-none accent-[#252525]" checked={details.consent} aria-invalid={!!errors.consent} aria-describedby={errors.consent ? "f-consent-err" : undefined}
                      onChange={(e) => setDetails({ ...details, consent: e.target.checked })} />
                    <span className="text-ink">{CONSENT_TEXT} <Link href="/privacy" className="font-medium text-gold underline underline-offset-4" target="_blank">Privacy notice</Link></span>
                  </label>
                  {errors.consent && <p id="f-consent-err" className="error-text">{errors.consent}</p>}
                </div>
              </div>
            )}

            {step === 3 && treatment && date && time && (
              <div className="mt-6" data-testid="review">
                <dl className="divide-y divide-line  border border-line">
                  <ReviewRow label="Treatment" value={treatment.name} onEdit={() => setStep(0)} />
                  <ReviewRow label="Date & time" value={`${formatDateLong(date)}, ${formatTime(time)}`} onEdit={() => setStep(1)} />
                  <ReviewRow label="Name" value={details.name.trim()} onEdit={() => setStep(2)} />
                  <ReviewRow label="Phone" value={normalisePhone(details.phone) ?? details.phone} onEdit={() => setStep(2)} />
                  {details.email && <ReviewRow label="Email" value={details.email} onEdit={() => setStep(2)} />}
                  <ReviewRow label="Contact preference" value={CONTACT_METHOD_LABEL[details.method]} onEdit={() => setStep(2)} />
                  {details.notes.trim() && <ReviewRow label="Notes" value={details.notes.trim()} onEdit={() => setStep(2)} />}
                </dl>
                <div className="mt-4  bg-cream p-4">
                  <PriceTag price={treatment.price} currency={content.currency} />
                  <p className="mt-1 text-xs text-muted">Payment is made at the clinic (all major cards and contactless). Your final price is confirmed before treatment.</p>
                </div>
              </div>
            )}
          </m.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
          {step > 0 ? (
            <button type="button" className="btn btn-ghost flex-none !px-4 sm:!px-6" onClick={() => { setFormError(null); setStep((s) => s - 1); }}><Icon name="chevronLeft" size={18} /> Back</button>
          ) : <span />}
          {step < 3 ? (
            <button type="button" className="btn btn-primary min-w-0 flex-1 sm:flex-none" disabled={!canContinue} onClick={next}>Continue <Icon name="arrow" size={18} /></button>
          ) : (
            <button type="button" className="btn btn-primary min-w-0 flex-1 sm:flex-none" disabled={submitting} onClick={confirm} data-testid="confirm">{submitting ? "Sending request…" : "Submit request"}</button>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationLine({ n, to }: { n: NotificationLog; to?: string }) {
  const label = n.channel === "email" ? "Email" : "WhatsApp";
  if (n.status === "sent") return <li className="flex items-center gap-2 text-success"><Icon name="check" size={16} /> {label} confirmation sent{to ? ` to ${to}` : ""}</li>;
  if (n.status === "failed") return <li className="flex items-center gap-2 text-danger"><Icon name="info" size={16} /> {label} could not be sent. The clinic will contact you.</li>;
  return <li className="flex items-center gap-2 text-muted"><Icon name="info" size={16} /> {label}: not sent ({n.detail ?? "not configured"})</li>;
}

function ChoiceCard({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className={`flex cursor-pointer items-center gap-4 border p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-charcoal ${checked ? "border-charcoal bg-beige" : "border-line bg-surface hover:border-charcoal"}`}>
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
      <button type="button" onClick={onEdit} className="min-h-11 flex-none px-1 text-sm font-medium text-gold underline underline-offset-4" aria-label={`Edit ${label}`}>Edit</button>
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
