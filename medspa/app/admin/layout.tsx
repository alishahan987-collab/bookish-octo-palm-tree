import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Admin · MEDSPA" }, robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-stone-100 font-sans text-stone-900 [--fg:#1c1917]">{children}</div>;
}
