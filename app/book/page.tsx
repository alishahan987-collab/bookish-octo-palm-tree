import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { getDoctors, getTreatments } from "@/lib/data";

export const metadata: Metadata = { title: "Book an appointment" };

export default async function BookPage() {
  const [treatments, doctors] = await Promise.all([getTreatments(), getDoctors()]);
  return (
    <section className="container-lux max-w-3xl pb-16 pt-10 sm:pt-14">
      <p className="eyebrow">Online booking</p>
      <h1 className="mt-3 text-5xl sm:text-6xl">Book an appointment</h1>
      <p className="mt-3 text-muted">Takes about a minute. The clinic will confirm your appointment.</p>
      <Suspense fallback={<div className="mt-10 h-96" aria-busy="true" />}>
        <BookingFlow initialTreatments={treatments} initialDoctors={doctors} />
      </Suspense>
    </section>
  );
}
