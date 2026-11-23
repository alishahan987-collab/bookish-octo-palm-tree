"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { resetDemoData } from "@/lib/data";
import { Logo } from "../layout/Logo";
import { Dialog } from "../ui/Dialog";
import { Icon, type IconName } from "../ui/Icon";
import { Appointments } from "./Appointments";
import { JourneysAdmin } from "./JourneysAdmin";
import { SettingsAdmin } from "./SettingsAdmin";
import { TreatmentsAdmin } from "./TreatmentsAdmin";
import { ToastProvider, useToast } from "./ui";

/**
 * DEMO ONLY: the password is checked in the browser and shown on screen.
 * Phase 2 replaces this with Supabase Auth (email + password / magic link)
 * and role-based access enforced by Row Level Security.
 */
const DEMO_PASSWORD = "demo1234";
const SESSION_KEY = "aesthetica-demo-admin";

const TABS: { id: string; label: string; icon: IconName }[] = [
  { id: "appointments", label: "Appointments", icon: "calendar" },
  { id: "treatments", label: "Treatments & pricing", icon: "tag" },
  { id: "settings", label: "Clinic settings", icon: "settings" },
  { id: "journeys", label: "Treatment journeys", icon: "route" },
];

export function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setAuthed(sessionStorage.getItem(SESSION_KEY) === "1");
    } catch {
      setAuthed(false);
    }
  }, []);

  if (authed === null) return <div className="min-h-dvh" aria-busy="true" />;
  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;
  return (
    <ToastProvider>
      <Dashboard
        onLogout={() => {
          try { sessionStorage.removeItem(SESSION_KEY); } catch {}
          setAuthed(false);
        }}
      />
    </ToastProvider>
  );
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="flex min-h-[calc(100dvh-2rem)] items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center"><Logo /></div>
        <form
          className="card mt-8 p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (pw === DEMO_PASSWORD) {
              try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
              onSuccess();
            } else {
              setError("Incorrect password. For this demo, use demo1234.");
            }
          }}
        >
          <h1 className="text-4xl">Clinic admin</h1>
          <p className="mt-2 text-sm text-muted">Manage appointments, treatments, prices and clinic hours.</p>
          <div className="mt-5 rounded-2xl border border-dashed border-champagne bg-ivory p-4 text-sm">
            <p className="font-semibold text-charcoal">Demo login only</p>
            <p className="mt-1 text-muted">Password: <code className="rounded bg-cream px-1.5 py-0.5 font-semibold text-charcoal">demo1234</code></p>
            <p className="mt-1 text-xs text-muted">The real system will use secure staff accounts with roles (Phase 2).</p>
          </div>
          <label htmlFor="pw" className="label mt-6">Password</label>
          <input id="pw" type="password" className="field" value={pw} autoComplete="current-password"
            aria-invalid={!!error} aria-describedby={error ? "pw-err" : undefined}
            onChange={(e) => { setPw(e.target.value); setError(""); }} />
          {error && <p id="pw-err" className="error-text" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary mt-6 w-full">Sign in</button>
          <Link href="/" className="mt-4 block text-center text-sm text-muted underline underline-offset-4">Back to website</Link>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState("appointments");
  const [confirmReset, setConfirmReset] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "");
    if (TABS.some((t) => t.id === fromHash)) setTab(fromHash);
  }, []);
  const choose = (id: string) => {
    setTab(id);
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <div className="min-h-dvh bg-cream/60">
      <header className="sticky top-0 z-30 border-b border-line bg-ivory/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="chip hidden bg-charcoal text-champagne-soft sm:inline-flex">Admin · demo</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/" className="btn btn-ghost btn-sm" target="_blank">
              <Icon name="eye" size={16} /><span className="hidden sm:inline">View site</span><span className="sr-only sm:hidden">View site</span>
            </Link>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(true)}>
              <Icon name="refresh" size={16} /><span className="hidden sm:inline">Reset demo data</span><span className="sr-only sm:hidden">Reset demo data</span>
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onLogout}>
              <Icon name="logout" size={16} /><span className="hidden sm:inline">Log out</span><span className="sr-only sm:hidden">Log out</span>
            </button>
          </div>
        </div>
        <nav aria-label="Admin sections" className="mx-auto max-w-7xl px-4 sm:px-6">
          <div role="tablist" className="no-scrollbar -mb-px flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                id={`tab-${t.id}`}
                onClick={() => choose(t.id)}
                className={`flex flex-none items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                  tab === t.id ? "border-charcoal text-charcoal" : "border-transparent text-muted hover:text-charcoal"
                }`}
              >
                <Icon name={t.icon} size={17} /> {t.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <p className="mb-6 flex items-start gap-2 rounded-2xl border border-dashed border-champagne bg-ivory p-3 text-xs leading-relaxed text-muted">
          <Icon name="info" size={16} className="mt-px flex-none text-gold" />
          Demo dashboard. All patients and appointments are fictional and stored only in this browser. Prices are demo prices. No messages are sent.
        </p>
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "appointments" && <Appointments />}
          {tab === "treatments" && <TreatmentsAdmin />}
          {tab === "settings" && <SettingsAdmin />}
          {tab === "journeys" && <JourneysAdmin />}
        </div>
      </div>

      <Dialog open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset demo data?">
        <p className="text-muted">This restores the original treatments, prices, settings and demo appointments. Any bookings or changes made in this browser will be removed.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              await resetDemoData();
              setConfirmReset(false);
              toast("Demo data reset");
            }}
          >
            Reset data
          </button>
        </div>
      </Dialog>
    </div>
  );
}
