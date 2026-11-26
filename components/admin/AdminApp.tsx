"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { dataMode, resetDemoData } from "@/lib/data";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { Logo } from "../layout/Logo";
import { Dialog } from "../ui/Dialog";
import { Icon, type IconName } from "../ui/Icon";
import { Appointments } from "./Appointments";
import { BlogAdmin } from "./BlogAdmin";
import { ConditionsAdmin } from "./ConditionsAdmin";
import { ContentAdmin } from "./ContentAdmin";
import { GalleryAdmin } from "./GalleryAdmin";
import { JourneysAdmin } from "./JourneysAdmin";
import { SettingsAdmin } from "./SettingsAdmin";
import { TreatmentsAdmin } from "./TreatmentsAdmin";
import { ToastProvider, useToast } from "./ui";

/**
 * Authentication
 *  - Production (Supabase): email + password via Supabase Auth; access requires a row in `staff`
 *    (enforced again by Row Level Security on every table and by the server API).
 *  - Demo mode: a browser-only gate with a published password, clearly labelled.
 */
const DEMO_PASSWORD = "demo1234";
const DEMO_SESSION_KEY = "clinic-demo-admin";

type Tab = { id: string; label: string; icon: IconName; group: string };
const TABS: Tab[] = [
  { id: "appointments", label: "Appointments", icon: "calendar", group: "Clinic" },
  { id: "availability", label: "Booking hours & slots", icon: "clock", group: "Clinic" },
  { id: "journeys", label: "Treatment journeys", icon: "route", group: "Clinic" },
  { id: "procedures", label: "Treatments & prices", icon: "tag", group: "Content" },
  { id: "conditions", label: "Skin concerns", icon: "heartPulse", group: "Content" },
  { id: "gallery", label: "Before & after", icon: "image", group: "Content" },
  { id: "blog", label: "Blog articles", icon: "doc", group: "Content" },
  { id: "site", label: "Homepage & pages", icon: "layout", group: "Website" },
  { id: "team", label: "Team & reviews", icon: "user", group: "Website" },
  { id: "contact", label: "Contact & visit", icon: "phone", group: "Website" },
  { id: "appearance", label: "Branding & appearance", icon: "palette", group: "Website" },
];

export function AdminApp() {
  const [state, setState] = useState<"loading" | "out" | "in" | "denied">("loading");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (dataMode === "demo") {
      try {
        setState(sessionStorage.getItem(DEMO_SESSION_KEY) === "1" ? "in" : "out");
      } catch {
        setState("out");
      }
      return;
    }
    const sb = getBrowserSupabase();
    const check = async () => {
      const { data } = await sb.auth.getSession();
      if (!data.session) return setState("out");
      setEmail(data.session.user.email ?? null);
      const { data: staff } = await sb.from("staff").select("role").eq("user_id", data.session.user.id).maybeSingle();
      setState(staff ? "in" : "denied");
    };
    void check();
    const { data: sub } = sb.auth.onAuthStateChange(() => void check());
    return () => sub.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    if (dataMode === "demo") {
      try { sessionStorage.removeItem(DEMO_SESSION_KEY); } catch {}
      setState("out");
    } else {
      await getBrowserSupabase().auth.signOut();
      setState("out");
    }
  };

  if (state === "loading") return <div className="min-h-dvh" aria-busy="true" />;
  if (state === "out") return <Login onSuccess={() => setState("in")} />;
  if (state === "denied")
    return (
      <div className="flex min-h-[80dvh] items-center justify-center px-4">
        <div className="card max-w-md p-8 text-center">
          <h1 className="text-3xl">No admin access</h1>
          <p className="mt-3 text-muted">{email} is signed in but is not registered as clinic staff. Ask the clinic owner to grant access.</p>
          <button type="button" className="btn btn-primary mt-6" onClick={logout}>Sign out</button>
        </div>
      </div>
    );
  return (
    <ToastProvider>
      <Dashboard onLogout={logout} email={email} />
    </ToastProvider>
  );
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const demo = dataMode === "demo";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (demo) {
      if (pw === DEMO_PASSWORD) {
        try { sessionStorage.setItem(DEMO_SESSION_KEY, "1"); } catch {}
        onSuccess();
      } else setError("Incorrect password. For this demo, use demo1234.");
      return;
    }
    setBusy(true);
    const { error: err } = await getBrowserSupabase().auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (err) setError(err.message === "Invalid login credentials" ? "Incorrect email or password." : err.message);
  };

  return (
    <div className="flex min-h-[calc(100dvh-2rem)] items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center"><Logo /></div>
        <form className="card mt-8 p-6 sm:p-8" onSubmit={submit}>
          <h1 className="text-4xl">Clinic admin</h1>
          <p className="mt-2 text-sm text-muted">Manage appointments, content, prices and the website.</p>
          {demo ? (
            <div className="mt-5 rounded-2xl border border-dashed border-champagne bg-ivory p-4 text-sm">
              <p className="font-semibold text-charcoal">Demo mode</p>
              <p className="mt-1 text-muted">Password: <code className="rounded bg-cream px-1.5 py-0.5 font-semibold text-charcoal">demo1234</code></p>
              <p className="mt-1 text-xs text-muted">Changes are saved in this browser only. Connect Supabase for secure staff accounts.</p>
            </div>
          ) : (
            <div className="mt-5">
              <label htmlFor="email" className="label">Email</label>
              <input id="email" type="email" className="field" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          )}
          <label htmlFor="pw" className="label mt-5">Password</label>
          <input id="pw" type="password" className="field" value={pw} autoComplete="current-password" required
            aria-invalid={!!error} aria-describedby={error ? "pw-err" : undefined} onChange={(e) => { setPw(e.target.value); setError(""); }} />
          {error && <p id="pw-err" className="error-text" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary mt-6 w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          <Link href="/" className="mt-4 block text-center text-sm text-muted underline underline-offset-4">Back to website</Link>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ onLogout, email }: { onLogout: () => void; email: string | null }) {
  const [tab, setTab] = useState("appointments");
  const [navOpen, setNavOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const sync = () => {
      const fromHash = window.location.hash.replace("#", "");
      if (TABS.some((t) => t.id === fromHash)) setTab(fromHash);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const choose = (id: string) => {
    setTab(id);
    setNavOpen(false);
    history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0 });
  };
  const current = TABS.find((t) => t.id === tab)!;
  const groups = [...new Set(TABS.map((t) => t.group))];

  const nav = (
    <nav aria-label="Admin sections" className="space-y-6">
      {groups.map((g) => (
        <div key={g}>
          <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">{g}</p>
          <ul className="mt-2 space-y-0.5">
            {TABS.filter((t) => t.group === g).map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => choose(t.id)} aria-current={tab === t.id ? "page" : undefined} data-admin-tab={t.id}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${tab === t.id ? "bg-charcoal text-ivory" : "text-ink hover:bg-cream"}`}>
                  <Icon name={t.icon} size={18} /> {t.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-cream/50 lg:flex">
      <aside className="z-30 hidden w-64 flex-none flex-col overflow-y-auto border-r border-line bg-ivory p-4 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <div className="px-2 py-3"><Logo /></div>
        <div className="mt-6 flex-1">{nav}</div>
        <AdminFooter email={email} onLogout={onLogout} onReset={() => setConfirmReset(true)} />
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-ivory/95 px-4 py-3 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setNavOpen(true)} className="flex items-center gap-2 rounded-full border border-sand px-3 py-2 text-sm font-semibold" aria-expanded={navOpen} aria-controls="admin-mobile-nav">
          <Icon name="menu" size={18} /> {current.label}
        </button>
        <Link href="/" target="_blank" className="btn btn-ghost btn-sm"><Icon name="eye" size={16} /> Site</Link>
      </header>
      {navOpen && (
        <div id="admin-mobile-nav" className="fixed inset-0 z-40 overflow-y-auto bg-ivory p-4 lg:hidden">
          <div className="mb-6 flex items-center justify-between"><Logo /><button type="button" onClick={() => setNavOpen(false)} className="rounded-full p-2 hover:bg-cream" aria-label="Close menu"><Icon name="close" /></button></div>
          {nav}
          <div className="mt-8"><AdminFooter email={email} onLogout={onLogout} onReset={() => setConfirmReset(true)} /></div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 pb-32 sm:px-6 sm:py-8">
          {dataMode === "demo" && (
            <p className="mb-6 flex items-start gap-2 rounded-2xl border border-dashed border-champagne bg-ivory p-3 text-xs leading-relaxed text-muted">
              <Icon name="info" size={16} className="mt-px flex-none text-gold" />
              Demo mode: clients and appointments are fictional, changes are saved only in this browser and no messages are sent. Connect Supabase to go live.
            </p>
          )}
          <div data-admin-panel={tab}>
            {tab === "appointments" && <Appointments />}
            {tab === "availability" && <SettingsAdmin />}
            {tab === "journeys" && <JourneysAdmin />}
            {tab === "procedures" && <TreatmentsAdmin />}
            {tab === "conditions" && <ConditionsAdmin />}
            {tab === "gallery" && <GalleryAdmin />}
            {tab === "blog" && <BlogAdmin />}
            {(tab === "site" || tab === "team" || tab === "contact" || tab === "appearance") && <ContentAdmin section={tab} />}
          </div>
        </div>
      </div>

      <Dialog open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset demo data?">
        <p className="text-muted">This restores the original content, prices, settings and demo appointments. All changes and uploads in this browser are removed.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={async () => { await resetDemoData(); setConfirmReset(false); toast("Demo data reset"); }}>Reset data</button>
        </div>
      </Dialog>
    </div>
  );
}

function AdminFooter({ email, onLogout, onReset }: { email: string | null; onLogout: () => void; onReset: () => void }) {
  return (
    <div className="space-y-1 border-t border-line pt-4">
      {email && <p className="truncate px-3 pb-2 text-xs text-muted">{email}</p>}
      <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-cream"><Icon name="eye" size={18} /> View website</Link>
      {dataMode === "demo" && (
        <button type="button" onClick={onReset} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-cream"><Icon name="refresh" size={18} /> Reset demo data</button>
      )}
      <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-cream"><Icon name="logout" size={18} /> Log out</button>
    </div>
  );
}
