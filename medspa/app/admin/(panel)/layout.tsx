"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminProvider, useAdmin } from "@/components/admin/store";
import { ToastProvider, btn } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/client/api";

const NAV = [
  { group: "", items: [{ href: "/admin", label: "Dashboard", icon: "sparkle" }] },
  { group: "Customers", items: [{ href: "/admin/appointments", label: "Appointments", icon: "calendar" }, { href: "/admin/messages", label: "Messages", icon: "mail" }] },
  {
    group: "Website",
    items: [
      { href: "/admin/pages", label: "Pages & sections", icon: "link" },
      { href: "/admin/treatments", label: "Treatments & prices", icon: "sparkle" },
      { href: "/admin/testimonials", label: "Testimonials", icon: "star" },
      { href: "/admin/gallery", label: "Before & after", icon: "chevronRight" },
      { href: "/admin/media", label: "Image library", icon: "external" },
      { href: "/admin/navigation", label: "Menus", icon: "menu" },
    ],
  },
  {
    group: "Settings",
    items: [
      { href: "/admin/business", label: "Business info & hours", icon: "pin" },
      { href: "/admin/booking", label: "Booking & emails", icon: "clock" },
      { href: "/admin/design", label: "Design", icon: "sparkle" },
      { href: "/admin/settings", label: "SEO & site settings", icon: "info" },
      { href: "/admin/account", label: "Account", icon: "check" },
    ],
  },
];

function Shell({ children }: { children: React.ReactNode }) {
  const { data, error, reload } = useAdmin();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const sidebar = (
    <nav aria-label="Admin" className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
      <Link href="/admin" className="px-3">
        <span className="font-display text-2xl tracking-[0.18em]">MEDSPA</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-500">Website admin</span>
      </Link>
      {NAV.map((g) => (
        <div key={g.group || "main"}>
          {g.group && <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">{g.group}</p>}
          <ul className="space-y-0.5">
            {g.items.map((i) => (
              <li key={i.href}>
                <Link href={i.href} aria-current={active(i.href) ? "page" : undefined} className={`flex min-h-[40px] items-center gap-3 rounded-md px-3 text-sm ${active(i.href) ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-200/70"}`}>
                  <Icon name={i.icon} size={16} /> {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="mt-auto space-y-1 border-t border-stone-200 px-1 pt-4">
        <a href="/" target="_blank" rel="noopener" className={`${btn.ghost} w-full justify-start`}><Icon name="external" size={15} /> View website</a>
        <button type="button" className={`${btn.ghost} w-full justify-start`} onClick={async () => { await api("/api/admin/logout", { method: "POST" }); window.location.href = "/admin/login"; }}>
          <Icon name="arrowLeft" size={15} /> Sign out
        </button>
        {data && <p className="px-2.5 pt-1 text-xs text-stone-400">{data.user.email}</p>}
      </div>
    </nav>
  );

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-stone-200 bg-stone-50 lg:block">{sidebar}</aside>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-stone-200 bg-stone-50 px-4 lg:hidden">
        <span className="font-display text-xl tracking-[0.18em]">MEDSPA</span>
        <button type="button" className={btn.ghost} onClick={() => setOpen(true)} aria-label="Open admin menu"><Icon name="menu" size={22} /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-[280px] bg-stone-50 shadow-xl" onClick={(e) => e.stopPropagation()}>{sidebar}</aside>
        </div>
      )}
      <main className="min-w-0 px-4 pb-10 pt-6 md:px-8 md:pt-8">
        {data?.mode === "readonly" && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <strong>Database not connected.</strong> The website shows starter content and changes cannot be saved. Add the Supabase environment variables in your hosting settings (see README).
          </div>
        )}
        {error ? (
          <div className="rounded-lg border border-red-200 bg-white p-6">
            <p className="text-red-700">{error}</p>
            <button type="button" className={`${btn.secondary} mt-4`} onClick={reload}>Try again</button>
          </div>
        ) : data ? (
          <div className="mx-auto max-w-[1200px]">{children}</div>
        ) : (
          <p className="text-stone-500" role="status">Loading…</p>
        )}
      </main>
    </div>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AdminProvider>
        <Shell>{children}</Shell>
      </AdminProvider>
    </ToastProvider>
  );
}
