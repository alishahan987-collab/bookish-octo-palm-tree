"use client";

import { useState } from "react";
import { useData } from "@/components/admin/store";
import { Card, Notice, PageTitle, Text, btn, useToast } from "@/components/admin/ui";
import { api } from "@/lib/client/api";

export default function AccountPage() {
  const { user, mode } = useData();
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function change(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) return toast("The new passwords don't match.", "error");
    setBusy(true);
    try {
      await api("/api/admin/password", { body: { current, next } });
      toast("Password changed.");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageTitle title="Account" description={`Signed in as ${user.email}`} />
      <div className="max-w-xl space-y-6">
        <Card title="Change password">
          {mode !== "supabase" ? (
            <Notice>Local development mode: the admin password comes from the ADMIN_PASSWORD environment variable.</Notice>
          ) : (
            <form onSubmit={change} className="space-y-4">
              <Text label="Current password" type="password" value={current} onChange={setCurrent} />
              <Text label="New password (at least 10 characters)" type="password" value={next} onChange={setNext} />
              <Text label="Repeat new password" type="password" value={confirm} onChange={setConfirm} />
              <button type="submit" className={btn.primary} disabled={busy || !current || next.length < 10}>{busy ? "Saving…" : "Change password"}</button>
            </form>
          )}
        </Card>
        <Card title="Staff accounts">
          <p className="text-sm text-stone-600">To add another admin, run <code className="rounded bg-stone-100 px-1">npm run create-admin -- email@example.com &apos;password&apos;</code> (see README), or ask your developer. Only accounts listed as staff can sign in.</p>
        </Card>
      </div>
    </>
  );
}
