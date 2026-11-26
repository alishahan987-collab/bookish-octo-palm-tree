"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/client/api";
import type { CollectionName, Collections, Design, DocKey, Docs, GalleryItem, Navigation, Page, Settings, Testimonial, Treatment } from "@/lib/types";

export interface AdminData {
  user: { id: string; email: string };
  mode: "file" | "supabase" | "readonly";
  settings: Settings;
  design: Design;
  navigation: Navigation;
  pages: Page[];
  treatments: Treatment[];
  testimonials: Testimonial[];
  gallery: GalleryItem[];
}

interface Store {
  data: AdminData | null;
  error: string;
  reload: () => Promise<void>;
  saveDoc: <K extends DocKey>(key: K, value: Docs[K]) => Promise<Docs[K]>;
  saveItem: <C extends CollectionName>(c: C, item: Collections[C]) => Promise<Collections[C]>;
  deleteItem: (c: CollectionName, id: string) => Promise<void>;
  reorder: <C extends CollectionName>(c: C, items: Collections[C][]) => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function useAdmin() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useAdmin outside AdminProvider");
  return s;
}

/** Hook for pages that need data loaded. */
export function useData(): AdminData {
  const { data } = useAdmin();
  return data!;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setData(await api<AdminData>("/api/admin/bootstrap"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveDoc = useCallback(async <K extends DocKey>(key: K, value: Docs[K]) => {
    const r = await api<{ data: Docs[K] }>(`/api/admin/docs/${key}`, { method: "PUT", body: value });
    setData((d) => (d ? { ...d, [key]: r.data } : d));
    return r.data;
  }, []);

  const saveItem = useCallback(async <C extends CollectionName>(c: C, item: Collections[C]) => {
    const r = await api<{ item: Collections[C] }>(`/api/admin/items/${c}`, { body: item });
    setData((d) => {
      if (!d) return d;
      const list = d[c] as unknown as { id: string }[];
      const exists = list.some((x) => x.id === r.item.id);
      const next = exists ? list.map((x) => (x.id === r.item.id ? r.item : x)) : [...list, r.item];
      return { ...d, [c]: next };
    });
    return r.item;
  }, []);

  const deleteItem = useCallback(async (c: CollectionName, id: string) => {
    await api(`/api/admin/items/${c}/${id}`, { method: "DELETE" });
    if (c === "pages") await reload();
    else setData((d) => (d ? { ...d, [c]: (d[c] as { id: string }[]).filter((x) => x.id !== id) } : d));
  }, [reload]);

  const reorder = useCallback(async <C extends CollectionName>(c: C, items: Collections[C][]) => {
    setData((d) => (d ? { ...d, [c]: items.map((x, i) => ({ ...x, order: i + 1 })) } : d));
    await api(`/api/admin/items/${c}/reorder`, { body: { ids: items.map((x) => (x as { id: string }).id) } });
  }, []);

  return <Ctx.Provider value={{ data, error, reload, saveDoc, saveItem, deleteItem, reorder }}>{children}</Ctx.Provider>;
}
