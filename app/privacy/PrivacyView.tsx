"use client";

import { PageHeader } from "@/components/site/PageHeader";
import { useSite } from "@/components/site/SiteProvider";

export function PrivacyView() {
  const { content } = useSite();
  const clinic = content.brand.clinicName;
  const contact = content.contact.email || content.contact.phone || "the clinic";
  return (
    <>
      <PageHeader eyebrow="Privacy" title="Privacy notice" crumbs={[{ href: "/privacy", label: "Privacy" }]} intro="How we handle the information you share with us." />
      <div className="container-lux max-w-3xl space-y-10 py-14 leading-relaxed text-muted">
        <section>
          <h2 className="text-3xl">What we collect</h2>
          <p className="mt-3">When you request an appointment we collect your name, phone number, email address, the treatment and time you choose, any notes you add, and your consent to be contacted. Please do not include sensitive medical details in booking notes.</p>
        </section>
        <section>
          <h2 className="text-3xl">Why we use it</h2>
          <p className="mt-3">Only to manage your appointment and care: confirming, rescheduling or cancelling bookings and contacting you by phone, text message or email. We do not sell or share your personal information, and we do not use it for unrelated marketing.</p>
        </section>
        <section>
          <h2 className="text-3xl">How it is protected</h2>
          <p className="mt-3">Data is sent over an encrypted connection (HTTPS) and stored in a secured database. Access is limited to authorized clinic staff with individual logins. Appointment details are never visible to other website visitors.</p>
        </section>
        <section>
          <h2 className="text-3xl">Service providers</h2>
          <p className="mt-3">We use trusted providers to run this website: hosting, a database provider and an email delivery service. They process data only to provide these services.</p>
        </section>
        <section>
          <h2 className="text-3xl">Photographs</h2>
          <p className="mt-3">Before-and-after photographs are published only with the client&apos;s written consent, which can be withdrawn at any time.</p>
        </section>
        <section>
          <h2 className="text-3xl">Your choices</h2>
          <p className="mt-3">You can ask us to update or delete your information, or withdraw consent to be contacted, by contacting {clinic} at {contact}.</p>
        </section>
        <p className="border border-dashed border-sand bg-cream p-5 text-sm">This notice is a starting template. Before launch, the clinic should have it reviewed for compliance with California law, including the Confidentiality of Medical Information Act (CMIA) and, where applicable, the California Consumer Privacy Act (CCPA/CPRA) and HIPAA.</p>
      </div>
    </>
  );
}
