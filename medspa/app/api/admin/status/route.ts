import { repo } from "@/lib/repo";
import { emailConfigured } from "@/lib/server/email";
import { usingDevPassword } from "@/lib/server/auth";
import { withAdmin } from "@/lib/server/admin";
import { ok, siteUrl } from "@/lib/server/http";
import { spaNow, toISODate } from "@/lib/dates";

/** Setup checklist and dashboard numbers. Reports only what is actually configured. */
export const GET = withAdmin(async (req) => {
  const [health, settings, design, treatments, testimonials, gallery, pending, messages, upcoming] = await Promise.all([
    repo.health(), repo.getDoc("settings"), repo.getDoc("design"), repo.list("treatments"), repo.list("testimonials"), repo.list("gallery"),
    repo.listAppointments({ status: ["pending"] }), repo.listMessages(), repo.listAppointments({ from: toISODate(spaNow()), status: ["approved"] }),
  ]);
  const unverified = treatments.filter((t) => t.published && !t.verified).length;
  const stockImages = [design.header.logo, ...treatments.map((t) => t.image)].filter((x) => x?.startsWith("/images/")).length;
  const checks = [
    { id: "database", label: "Database connected", ok: repo.mode === "supabase" && health.ok, detail: health.detail, action: "See README → Supabase setup" },
    { id: "email", label: "Email sending configured (Resend)", ok: emailConfigured(), detail: emailConfigured() ? `Sending from ${process.env.EMAIL_FROM}` : "RESEND_API_KEY and EMAIL_FROM are not set, so no emails are sent.", action: "See README → Email" },
    { id: "notify", label: "Notification email for new requests", ok: Boolean(settings.business.notificationEmail || settings.business.email), detail: settings.business.notificationEmail || settings.business.email || "Not set", action: "Business info → Notification email" },
    { id: "siteurl", label: "Website address (NEXT_PUBLIC_SITE_URL)", ok: Boolean(process.env.NEXT_PUBLIC_SITE_URL), detail: siteUrl(req), action: "Set NEXT_PUBLIC_SITE_URL to your domain" },
    { id: "admin", label: "Secure admin login", ok: !usingDevPassword, detail: usingDevPassword ? "Using the development password. Never use this on a live site." : "OK", action: "Connect Supabase Auth" },
    { id: "treatments", label: "Treatments verified by the business", ok: unverified === 0, detail: unverified ? `${unverified} published treatment(s) not yet verified` : "All verified", action: "Treatments → mark each as verified" },
    { id: "photos", label: "Real photos uploaded (logo, treatments)", ok: stockImages === 0, detail: stockImages ? `${stockImages} image(s) still use starter stock photos` : "OK", action: "Replace stock photos with your own" },
    { id: "booksy", label: "Booksy link checked", ok: Boolean(settings.booking.booksyUrl), detail: settings.booking.booksyUrl || "No Booksy link", action: "Booking settings" },
    { id: "indexing", label: "Visible to Google (indexing on)", ok: settings.seo.indexable, detail: settings.seo.indexable ? "Search engines may index the site" : "Off: turn on at launch, after reviewing content", action: "SEO & settings → Allow search engines" },
  ];
  return ok({
    mode: repo.mode,
    checks,
    counts: {
      pending: pending.length,
      upcoming: upcoming.length,
      newMessages: messages.filter((m) => m.status === "new").length,
      treatments: treatments.length,
      testimonials: testimonials.filter((t) => t.published).length,
      gallery: gallery.filter((g) => g.published).length,
    },
    pending: pending.slice(0, 8),
  });
});
