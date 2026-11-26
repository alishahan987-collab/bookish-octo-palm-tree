"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Card, PageTitle, btn } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/client/api";
import { formatDate, formatTime } from "@/lib/dates";
import type { Appointment } from "@/lib/types";

interface Status {
  mode: string;
  checks: { id: string; label: string; ok: boolean; detail: string; action: string }[];
  counts: { pending: number; upcoming: number; newMessages: number; treatments: number; testimonials: number; gallery: number };
  pending: Appointment[];
}

export default function Dashboard() {
  const [s, setS] = useState<Status | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api<Status>("/api/admin/status").then(setS).catch((e) => setErr(e.message));
  }, []);
  if (err) return <p className="text-red-700">{err}</p>;
  if (!s) return <p className="text-stone-500">Loading…</p>;
  const todo = s.checks.filter((c) => !c.ok);
  const stat = (label: string, value: number, href: string, highlight?: boolean) => (
    <Link href={href} className={`rounded-xl border p-5 shadow-sm transition-colors hover:border-stone-400 ${highlight && value ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-white"}`}>
      <p className="text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-stone-600">{label}</p>
    </Link>
  );
  return (
    <>
      <PageTitle title="Dashboard" description="Appointment requests, messages and the setup checklist for your website." actions={<a href="/" target="_blank" className={btn.secondary}>View website <Icon name="external" size={14} /></a>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stat("Requests awaiting approval", s.counts.pending, "/admin/appointments", true)}
        {stat("Upcoming approved", s.counts.upcoming, "/admin/appointments?view=upcoming")}
        {stat("New messages", s.counts.newMessages, "/admin/messages", true)}
        {stat("Treatments", s.counts.treatments, "/admin/treatments")}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card title="Pending requests" description="Not confirmed until you approve them." actions={<Link href="/admin/appointments" className={btn.secondary}>All appointments</Link>}>
          {s.pending.length === 0 ? (
            <p className="text-sm text-stone-500">No requests waiting. New website requests will appear here.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {s.pending.map((a) => (
                <li key={a.id}>
                  <Link href={`/admin/appointments?open=${a.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-stone-50">
                    <span>
                      <span className="block font-medium">{a.name}</span>
                      <span className="block text-sm text-stone-500">{a.treatmentName}</span>
                    </span>
                    <span className="text-right text-sm">
                      <span className="block">{formatDate(a.date)}</span>
                      <span className="block text-stone-500">{formatTime(a.time)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Setup checklist" description={todo.length ? `${todo.length} item(s) need attention before launch.` : "Everything is configured."}>
          <ul className="space-y-3">
            {s.checks.map((c) => (
              <li key={c.id} className="flex gap-3" data-check={c.id} data-ok={c.ok}>
                <span className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full ${c.ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  <Icon name={c.ok ? "check" : "info"} size={13} />
                </span>
                <span className="text-sm">
                  <span className="font-medium">{c.label}</span> {c.ok ? <Badge tone="green">OK</Badge> : <Badge tone="amber">To do</Badge>}
                  <span className="block text-stone-500">{c.detail}</span>
                  {!c.ok && <span className="block text-xs text-stone-400">{c.action}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Quick edits">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Edit the homepage", "/admin/pages/p_home"],
              ["Change prices", "/admin/treatments"],
              ["Update opening hours", "/admin/business"],
              ["Change colours & fonts", "/admin/design"],
              ["Add a testimonial", "/admin/testimonials"],
              ["Upload before & after", "/admin/gallery"],
              ["Edit menus", "/admin/navigation"],
              ["Booking settings", "/admin/booking"],
            ].map(([l, h]) => (
              <Link key={h} href={h} className="flex items-center justify-between rounded-lg border border-stone-200 px-4 py-3 text-sm hover:border-stone-400">
                {l} <Icon name="arrow" size={14} />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
