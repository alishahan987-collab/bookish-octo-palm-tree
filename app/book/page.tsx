import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { MotionProvider } from "@/components/ui/FramerMotion";
import { getProcedures } from "@/lib/server/data";

export const revalidate = 60;
export const metadata: Metadata = { title: "Book an appointment" };

export default async function BookPage() {
  const treatments = await getProcedures();
  return (
    <section className="container-lux max-w-3xl pb-24 pt-10 sm:pt-16">
      <p className="eyebrow">Online booking</p>
      <h1 className="display mt-4 text-[2.8rem] sm:text-6xl">Book an appointment</h1>
      <p className="lead mt-4">Takes about a minute. We will confirm your appointment by email.</p>
      <Suspense fallback={<div className="mt-10 h-96" aria-busy="true" />}>
        <MotionProvider>
          <BookingFlow initialTreatments={treatments} />
        </MotionProvider>
      </Suspense>
    </section>
  );
}
