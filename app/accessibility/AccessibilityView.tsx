"use client";

import { PageHeader } from "@/components/site/PageHeader";
import { useSite } from "@/components/site/SiteProvider";
import { telHref } from "@/lib/phone";

export function AccessibilityView() {
  const { content } = useSite();
  const { phone, email } = content.contact;
  return (
    <>
      <PageHeader eyebrow="Accessibility" title="Accessibility statement" crumbs={[{ href: "/accessibility", label: "Accessibility" }]} intro="We want everyone to be able to learn about our treatments, book an appointment and visit us comfortably." />
      <div className="container-lux max-w-3xl space-y-10 py-14 leading-relaxed text-muted">
        <section>
          <h2 className="text-3xl">Our website</h2>
          <p className="mt-3">
            This website is designed to meet the Web Content Accessibility Guidelines (WCAG) 2.1, level AA. It works with keyboard navigation and screen readers,
            uses text and colors chosen for readable contrast, labels every form field, respects your device&apos;s reduced-motion setting and adapts to any screen size.
          </p>
        </section>
        <section>
          <h2 className="text-3xl">Our clinic</h2>
          <p className="mt-3">Our clinic has a wheelchair-accessible entrance, parking lot, restroom and seating.</p>
        </section>
        <section>
          <h2 className="text-3xl">Need help or found a problem?</h2>
          <p className="mt-3">
            If any part of this website is difficult to use, please tell us and we will help you directly, including booking your appointment for you.
            {phone && <> Call us at <a href={telHref(phone)} className="text-gold underline underline-offset-4">{phone}</a>.</>}
            {email && <> Or email <a href={`mailto:${email}`} className="text-gold underline underline-offset-4">{email}</a>.</>}
          </p>
        </section>
        <p className="text-sm">We review this website regularly and welcome feedback.</p>
      </div>
    </>
  );
}
