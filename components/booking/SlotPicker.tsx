"use client";

import { formatDate, formatTime, parseISODate, timeToMinutes } from "@/lib/dates";
import type { DayAvailability, ISODate } from "@/lib/data/types";

/** Day strip + time grid. Shared by the public booking flow and admin reschedule. */
export function SlotPicker({
  days,
  date,
  time,
  onDate,
  onTime,
}: {
  days: DayAvailability[];
  date: ISODate | null;
  time: string | null;
  onDate: (d: ISODate) => void;
  onTime: (t: string) => void;
}) {
  const selectedDay = days.find((d) => d.date === date);

  const groups: { label: string; test: (m: number) => boolean }[] = [
    { label: "Morning", test: (m) => m < 12 * 60 },
    { label: "Afternoon", test: (m) => m >= 12 * 60 && m < 17 * 60 },
    { label: "Evening", test: (m) => m >= 17 * 60 },
  ];

  return (
    <div>
      <fieldset>
        <legend className="label">Choose a date</legend>
        <div className="no-scrollbar -mx-4 mt-2 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0" data-testid="day-strip">
          {days.map((d) => {
            const dt = parseISODate(d.date);
            const selected = d.date === date;
            const disabled = !d.open || d.availableCount === 0;
            const sub = !d.open ? (d.reason.startsWith("Holiday") ? "Holiday" : d.reason === "Closed" ? "Closed" : "—") : d.availableCount === 0 ? "Full" : `${d.availableCount} free`;
            return (
              <button
                key={d.date}
                type="button"
                disabled={disabled}
                onClick={() => onDate(d.date)}
                aria-pressed={selected}
                aria-label={`${formatDate(d.date, { weekday: "long", day: "numeric", month: "long" })}, ${!d.open ? d.reason : sub}`}
                title={!d.open ? d.reason : undefined}
                data-date={d.date}
                className={`flex w-[4.6rem] flex-none snap-start flex-col items-center rounded-2xl border px-2 py-3 text-center transition-colors ${
                  selected
                    ? "border-charcoal bg-charcoal text-ivory"
                    : disabled
                      ? "cursor-not-allowed border-line bg-cream/50 text-muted/70"
                      : "border-sand bg-surface text-charcoal hover:border-champagne"
                }`}
              >
                <span className="text-[0.68rem] font-semibold uppercase tracking-wider">{dt.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                <span className="mt-0.5 font-serif text-2xl leading-none">{dt.getDate()}</span>
                <span className="text-[0.68rem]">{dt.toLocaleDateString("en-GB", { month: "short" })}</span>
                <span className={`mt-1.5 text-[0.65rem] font-medium ${selected ? "text-champagne-soft" : disabled ? "" : "text-success"}`}>{sub}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {selectedDay && selectedDay.open && (
        <fieldset className="mt-6" data-testid="time-grid">
          <legend className="label">Choose a time · {formatDate(selectedDay.date, { weekday: "long", day: "numeric", month: "long" })}</legend>
          <div className="mt-2 space-y-5">
            {groups.map((g) => {
              const slots = selectedDay.slots.filter((s) => g.test(timeToMinutes(s.time)));
              if (slots.length === 0) return null;
              return (
                <div key={g.label}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{g.label}</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {slots.map((s) => {
                      const selected = s.time === time;
                      const taken = s.state !== "available";
                      return (
                        <button
                          key={s.time}
                          type="button"
                          disabled={taken}
                          aria-pressed={selected}
                          aria-label={`${formatTime(s.time)}${taken ? (s.state === "booked" ? ", already booked" : ", day fully booked") : ""}`}
                          onClick={() => onTime(s.time)}
                          data-time={s.time}
                          data-state={s.state}
                          className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition-colors ${
                            selected
                              ? "border-charcoal bg-charcoal text-ivory"
                              : taken
                                ? "cursor-not-allowed border-line bg-cream/50 text-muted/60 line-through"
                                : "border-sand bg-surface text-charcoal hover:border-champagne hover:bg-cream"
                          }`}
                        >
                          {formatTime(s.time)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="hint mt-3">Crossed-out times are already booked.</p>
        </fieldset>
      )}
    </div>
  );
}
