"use client";

import { useMemo, useState } from "react";
import { createJourney, deleteJourney, getBookings, getJourneys, getTreatments, updateJourneyStep } from "@/lib/data";
import { useData } from "@/lib/data/hooks";
import type { Journey, JourneyStep } from "@/lib/data/types";
import { addDays, formatDate, todayISO } from "@/lib/dates";
import { uid } from "@/lib/id";
import { suggestJourneySteps } from "@/lib/journey";
import { Dialog } from "../ui/Dialog";
import { Icon } from "../ui/Icon";
import { errorMessage, useToast } from "./ui";

export function JourneysAdmin() {
  const toast = useToast();
  const { data: journeys, ready } = useData(getJourneys, []);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Journey | null>(null);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl sm:text-5xl">Treatment journeys</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Week-by-week plans for a patient&apos;s course of treatment. Demo feature: in Phase 2 patients could receive reminders for each step.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
          <Icon name="plus" size={18} /> New journey
        </button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2" data-testid="journey-list">
        {journeys.map((j) => (
          <JourneyCard key={j.id} journey={j} onDelete={() => setDeleteTarget(j)} />
        ))}
      </div>
      {ready && journeys.length === 0 && <p className="card p-8 text-center text-muted">No journeys yet. Create one for a patient.</p>}

      {creating && <JourneyBuilder onClose={() => setCreating(false)} />}

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete journey?">
        <p className="text-muted">The plan for {deleteTarget?.patientName} will be removed.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Keep</button>
          <button type="button" className="btn btn-primary !bg-danger" onClick={async () => {
            if (deleteTarget) await deleteJourney(deleteTarget.id);
            toast("Journey deleted");
            setDeleteTarget(null);
          }}>Delete</button>
        </div>
      </Dialog>
    </div>
  );
}

function JourneyCard({ journey: j, onDelete }: { journey: Journey; onDelete: () => void }) {
  const toast = useToast();
  const done = j.steps.filter((s) => s.done).length;
  const pct = Math.round((done / j.steps.length) * 100);
  const today = todayISO();
  const nextStep = j.steps.find((s) => !s.done);

  return (
    <article className="card overflow-hidden" data-patient={j.patientName}>
      <div className="border-b border-line bg-cream/60 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-3xl">{j.patientName}</h2>
            <p className="mt-1 text-sm text-muted">{j.treatmentName} · started {formatDate(j.startDate, { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
          <button type="button" onClick={onDelete} className="rounded-full p-2 text-muted hover:bg-ivory hover:text-danger" aria-label={`Delete journey for ${j.patientName}`}>
            <Icon name="trash" size={18} />
          </button>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs font-semibold text-muted">
            <span>{done} of {j.steps.length} steps complete</span>
            <span>{pct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Journey progress">
            <div className="h-full rounded-full bg-gradient-to-r from-champagne to-gold transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <ol className="relative p-5">
        {j.steps.map((s, i) => {
          const due = addDays(j.startDate, s.week * 7);
          const overdue = !s.done && due < today;
          const isNext = s.id === nextStep?.id;
          return (
            <li key={s.id} className="relative flex gap-4 pb-6 last:pb-0">
              {i < j.steps.length - 1 && <span className="absolute left-[0.9rem] top-8 h-[calc(100%-1.5rem)] w-px bg-line" aria-hidden="true" />}
              <button
                type="button"
                role="checkbox"
                aria-checked={s.done}
                aria-label={`Mark ${s.title} as ${s.done ? "not done" : "done"}`}
                onClick={async () => {
                  try {
                    await updateJourneyStep(j.id, s.id, { done: !s.done });
                  } catch (e) {
                    toast(errorMessage(e), "error");
                  }
                }}
                className={`relative z-10 flex h-[1.85rem] w-[1.85rem] flex-none items-center justify-center rounded-full border-2 transition-colors ${
                  s.done ? "border-gold bg-gold text-white" : isNext ? "border-charcoal bg-ivory" : "border-sand bg-ivory"
                }`}
              >
                {s.done && <Icon name="check" size={15} strokeWidth={2.4} />}
              </button>
              <div className="min-w-0 pt-0.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                  Week {s.week} · {formatDate(due)}
                  {isNext && <span className="ml-2 chip bg-charcoal normal-case tracking-normal text-ivory">Next</span>}
                  {overdue && <span className="ml-2 chip bg-[#fbefd5] normal-case tracking-normal text-[#7a5410]">Due</span>}
                </p>
                <p className={`mt-0.5 font-semibold ${s.done ? "text-muted line-through decoration-sand" : "text-charcoal"}`}>{s.title}</p>
                {s.detail && <p className="mt-0.5 text-sm text-muted">{s.detail}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </article>
  );
}

function JourneyBuilder({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const { data: treatments } = useData(() => getTreatments(), []);
  const { data: bookings } = useData(() => getBookings(), []);
  const patientNames = useMemo(() => [...new Set(bookings.filter((b) => b.status !== "cancelled").map((b) => b.patientName))].sort(), [bookings]);

  const [patientName, setPatientName] = useState("");
  const [treatmentId, setTreatmentId] = useState("");
  const [startDate, setStartDate] = useState(todayISO());
  const [steps, setSteps] = useState<JourneyStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  const chooseTreatment = (id: string) => {
    setTreatmentId(id);
    const t = treatments.find((x) => x.id === id);
    if (t) setSteps(suggestJourneySteps(t));
  };
  const update = (id: string, patch: Partial<JourneyStep>) => setSteps((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  return (
    <Dialog open onClose={onClose} title="New treatment journey" wide>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="j-name" className="label">Patient</label>
          <input id="j-name" className="field" list="j-patients" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Name" />
          <datalist id="j-patients">{patientNames.map((n) => <option key={n} value={n} />)}</datalist>
        </div>
        <div>
          <label htmlFor="j-treatment" className="label">Treatment</label>
          <select id="j-treatment" className="field" value={treatmentId} onChange={(e) => chooseTreatment(e.target.value)}>
            <option value="">Choose…</option>
            {treatments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="j-start" className="label">Start date</label>
          <input id="j-start" type="date" className="field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
      </div>

      {treatmentId ? (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl">Plan</h3>
            <p className="text-xs text-muted">Suggested template. Edit to suit the patient.</p>
          </div>
          <ul className="mt-3 space-y-2">
            {steps.map((s, i) => (
              <li key={s.id} className="grid gap-2 rounded-2xl border border-line p-3 sm:grid-cols-[5.5rem_1fr_1.4fr_auto] sm:items-center">
                <div className="flex items-center gap-1.5">
                  <label htmlFor={`w-${s.id}`} className="text-xs font-semibold text-muted">Week</label>
                  <input id={`w-${s.id}`} type="number" min={0} max={104} className="field !min-h-10 !px-2" value={s.week} onChange={(e) => update(s.id, { week: Math.max(0, Number(e.target.value)) })} />
                </div>
                <input aria-label={`Step ${i + 1} title`} className="field !min-h-10" value={s.title} onChange={(e) => update(s.id, { title: e.target.value })} />
                <input aria-label={`Step ${i + 1} details`} className="field !min-h-10" placeholder="Details (optional)" value={s.detail} onChange={(e) => update(s.id, { detail: e.target.value })} />
                <button type="button" className="justify-self-end rounded-full p-2 text-muted hover:bg-cream hover:text-danger" aria-label={`Remove step ${i + 1}`} onClick={() => setSteps(steps.filter((x) => x.id !== s.id))}>
                  <Icon name="trash" size={17} />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-ghost btn-sm mt-3"
            onClick={() => setSteps([...steps, { id: uid("st"), week: (steps.at(-1)?.week ?? 0) + 4, title: "Follow-up", detail: "", done: false }])}>
            <Icon name="plus" size={16} /> Add step
          </button>
        </div>
      ) : (
        <p className="mt-6 rounded-2xl bg-cream p-4 text-sm text-muted">Choose a treatment to start from a suggested week-by-week plan.</p>
      )}

      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!patientName.trim() || !treatmentId || steps.length === 0}
          onClick={async () => {
            try {
              await createJourney({ patientName, treatmentId, startDate, steps: steps.filter((s) => s.title.trim()) });
              toast(`Journey created for ${patientName.trim()}`);
              onClose();
            } catch (e) {
              setError(errorMessage(e));
            }
          }}
        >
          Create journey
        </button>
      </div>
    </Dialog>
  );
}
