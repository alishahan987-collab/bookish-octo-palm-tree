import type { Metadata } from "next";
import { SkinFinder } from "@/components/treatments/SkinFinder";
import { MotionProvider } from "@/components/ui/FramerMotion";
import { getConditionsList, getProcedures } from "@/lib/server/data";

export const revalidate = 60;
export const metadata: Metadata = { title: "Treatment finder", description: "Choose your skin concerns to see treatments that may help." };

export default async function SkinFinderPage() {
  const [treatments, conditions] = await Promise.all([getProcedures(), getConditionsList()]);
  return (
    <MotionProvider>
      <SkinFinder initialTreatments={treatments} initialConditions={conditions} />
    </MotionProvider>
  );
}
