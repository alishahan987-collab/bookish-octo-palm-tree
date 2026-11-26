import type { Metadata } from "next";
import { AccessibilityView } from "./AccessibilityView";

export const metadata: Metadata = { title: "Accessibility", description: "Our commitment to an accessible website and clinic." };
export default function AccessibilityPage() {
  return <AccessibilityView />;
}
