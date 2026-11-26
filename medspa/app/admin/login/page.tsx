"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { btn, inputCls } from "@/components/admin/ui";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dev, setDev] = useState<{ email: string; password: string } | null>(null);
  const [mode, setMode] = useState("");

  useEffect(() => {
    api<{ user: unknown; mode: string; devLogin: { email: string; password: string } | null }>("/api/admin/session")
      .then((s) => {
        if (s.user) window.location.href = "/admin";
        setDev(s.devLogin);
        setMode(s.mode);
      })
      .catch(() => undefined);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/login", { body: { email, password } });
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && next.startsWith("/admin") ? next : "/admin";
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
        <p className="font-display text-3xl tracking-[0.18em]">MEDSPA</p>
        <h1 className="mt-1 text-sm font-medium uppercase tracking-[0.2em] text-stone-500">Admin sign in</h1>
        <div className="mt-7 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
            <input id="email" type="email" autoComplete="username" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">Password</label>
            <input id="password" type="password" autoComplete="current-password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <button type="submit" className={`${btn.primary} w-full`} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </div>
        {dev && (
          <p className="mt-6 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            Local development mode{mode === "file" ? " (data saved in the .data folder)" : ""}. Sign in with <strong>{dev.email}</strong> / <strong>{dev.password}</strong>. Set ADMIN_PASSWORD or connect Supabase before going live.
          </p>
        )}
      </form>
    </main>
  );
}
