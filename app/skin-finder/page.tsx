import type { Metadata } from "next";
import { SkinFinder } from "@/components/treatments/SkinFinder";
import { MotionProvider } from "@/components/ui/FramerMotion";
import { getTreatments } from "@/lib/data";

export const metadata: Metadata = { title: "Skin Concern Finder" };

export default async function SkinFinderPage() {
  const treatments = await getTreatments();
  return (
    <MotionProvider>
      <SkinFinder initial={treatments} />
    </MotionProvider>
  );
}
