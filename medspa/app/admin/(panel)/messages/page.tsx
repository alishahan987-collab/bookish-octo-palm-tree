"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, PageTitle, btn, useToast } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/client/api";
import type { ContactMessage } from "@/lib/types";

export default function MessagesPage() {
  const [list, setList] = useState<ContactMessage[] | null>(null);
  const [show, setShow] = useState<"inbox" | "archived">("inbox");
  const [openId, setOpenId] = useState<string | null>(null);
  const toast = useToast();
  const load = useCallback(() => {
    api<{ messages: ContactMessage[] }>("/api/admin/messages").then((r) => setList(r.messages)).catch((e) => toast(e.message, "error"));
  }, [toast]);
  useEffect(load, [load]);

  async function setStatus(m: ContactMessage, status: ContactMessage["status"]) {
    try {
      const r = await api<{ message: ContactMessage }>(`/api/admin/messages/${m.id}`, { method: "PATCH", body: { status } });
      setList((l) => l?.map((x) => (x.id === m.id ? r.message : x)) ?? l);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }
  async function remove(m: ContactMessage) {
    if (!confirm("Delete this message permanently?")) return;
    try {
      await api(`/api/admin/messages/${m.id}`, { method: "DELETE" });
      setList((l) => l?.filter((x) => x.id !== m.id) ?? l);
      toast("Message deleted.");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  const shown = list?.filter((m) => (show === "archived" ? m.status === "archived" : m.status !== "archived"));
  return (
    <>
      <PageTitle title="Messages" description="Messages sent through the contact form. Reply by email or phone." actions={<button type="button" className={btn.secondary} onClick={load}>Refresh</button>} />
      <div className="mb-4 flex gap-1 rounded-lg bg-stone-200/60 p-1 sm:w-fit">
        {(["inbox", "archived"] as const).map((v) => (
          <button key={v} type="button" onClick={() => setShow(v)} className={`rounded-md px-3 py-1.5 text-sm capitalize ${show === v ? "bg-white font-medium shadow-sm" : "text-stone-600"}`}>{v}</button>
        ))}
      </div>
      {!shown ? <p className="text-stone-500">Loading…</p> : shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">No messages.</p>
      ) : (
        <ul className="space-y-2">
          {shown.map((m) => {
            const open = openId === m.id;
            return (
              <li key={m.id} className="rounded-xl border border-stone-200 bg-white shadow-sm">
                <button type="button" className="flex w-full items-start justify-between gap-3 p-4 text-left" aria-expanded={open} onClick={() => { setOpenId(open ? null : m.id); if (m.status === "new") setStatus(m, "read"); }}>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-medium">{m.name} {m.status === "new" && <Badge tone="amber">New</Badge>}</span>
                    <span className="block truncate text-sm text-stone-500">{m.subject || m.message}</span>
                  </span>
                  <span className="flex-none text-xs text-stone-500">{new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </button>
                {open && (
                  <div className="border-t border-stone-100 p-4">
                    <p className="text-sm text-stone-500">{m.email}{m.phone ? ` · ${m.phone}` : ""}</p>
                    <p className="mt-3 whitespace-pre-wrap">{m.message}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a className={btn.primary} href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "Your message"}`)}`}><Icon name="mail" size={15} /> Reply by email</a>
                      {m.phone && <a className={btn.secondary} href={`tel:${m.phone.replace(/[^\d+]/g, "")}`}><Icon name="phone" size={15} /> Call</a>}
                      {m.status !== "archived" ? <button type="button" className={btn.secondary} onClick={() => setStatus(m, "archived")}>Archive</button> : <button type="button" className={btn.secondary} onClick={() => setStatus(m, "read")}>Move to inbox</button>}
                      <button type="button" className={btn.danger} onClick={() => remove(m)}>Delete</button>
                    </div>
                    {m.notifications.length > 0 && (
                      <p className="mt-3 text-xs text-stone-500">Emails: {m.notifications.map((n) => `${n.to === "clinic" ? "spa" : "customer"} ${n.status}`).join(" · ")}</p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
