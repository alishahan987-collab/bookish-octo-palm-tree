import type { Metadata } from "next";
import { ContactView } from "@/components/site/Details";

export const metadata: Metadata = { title: "Contact us" };
export default function ContactPage() {
  return <ContactView />;
}
