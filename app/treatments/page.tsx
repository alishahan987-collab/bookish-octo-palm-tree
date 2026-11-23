import type { Metadata } from "next";
import { Suspense } from "react";
import { Catalogue } from "@/components/treatments/Catalogue";
import { TreatmentCard } from "@/components/treatments/TreatmentCard";
import { getTreatments } from "@/lib/data";

export const metadata: Metadata = { title: "Treatments" };

export default async function TreatmentsPage() {
  const treatments = await getTreatments();
  return (
    <section className="container-lux pb-10 pt-12 sm:pt-16">
      <p className="eyebrow">Treatment catalogue</p>
      <h1 className="mt-3 text-5xl sm:text-6xl">Treatments</h1>
      <p className="mt-4 max-w-xl text-muted">
        Explore skin, laser and hair treatments. Not sure what you need? Try the{" "}
        <a href="/skin-finder" className="font-semibold text-gold underline underline-offset-4">Skin Concern Finder</a> or book a consultation.
      </p>
      <div className="mt-10">
        <Suspense
          fallback={
            <ul className="mt-[3.25rem] grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {treatments.map((t) => (
                <li key={t.id}><TreatmentCard t={t} headingLevel={2} /></li>
              ))}
            </ul>
          }
        >
          <Catalogue initial={treatments} />
        </Suspense>
      </div>
    </section>
  );
}
