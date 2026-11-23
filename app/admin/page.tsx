import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";

export const metadata: Metadata = { title: "Clinic admin (demo)" };

export default function AdminPage() {
  return <AdminApp />;
}
