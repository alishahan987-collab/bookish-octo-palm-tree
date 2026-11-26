# VVIP Beauty & Skin Care — website

A premium, fully responsive website for **VVIP Beauty & Skin Care**, a skin care clinic at 13788 Roswell Ave, #118, Chino, CA 91710, with online booking and a complete admin dashboard (CMS).

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage) · Resend (email) · optional WhatsApp Cloud API · Vitest · Playwright

---

## Contents

1. [What's included](#whats-included)
2. [Design system](#design-system)
3. [Content: what is verified and what the clinic must supply](#content-what-is-verified-and-what-the-clinic-must-supply)
4. [Run it locally](#run-it-locally)
5. [Go live](#go-live)
6. [Using the admin dashboard](#using-the-admin-dashboard)
7. [Security, privacy & compliance](#security-privacy--compliance)
8. [Tests & quality checks](#tests--quality-checks)
9. [Architecture](#architecture)

---

## What's included

### Public website

| Page | Route | Notes |
|---|---|---|
| Home | `/` | Hero, popular treatments, about, why choose us, before & after, reviews, team, appointment banner, location & hours, footer. Every section is editable, movable, hideable, duplicable and removable in the admin. |
| Treatments | `/treatments` | Searchable, filterable directory of all 17 treatments |
| Treatment groups | `/skin-care`, `/injectables`, `/laser`, `/wellness` | One page per menu group |
| Treatment page | `/treatments/[slug]` | Overview, how it works, benefits, ideal for, side effects, questions, price, duration/sessions/recovery, Book button |
| Skin concerns | `/conditions`, `/conditions/[slug]` | 8 concerns that match the clinic's services, each linked to relevant treatments |
| Before & after | `/before-after` | Consent is enforced; empty until real photos are added |
| Pricing | `/pricing` | Prices come only from the database |
| About | `/about` | Clinic story, values, rating, team (once added) |
| Contact | `/contact` | Address, directions, full weekly hours, phone, map, accessibility/payment notes |
| Booking | `/book` | Treatment → date → time → details → review. US phone numbers, email confirmation. |
| Treatment finder | `/skin-finder` | Guided suggestions with a "not a diagnosis" notice |
| Journal | `/blog` | Four starter articles |
| Privacy, Accessibility | `/privacy`, `/accessibility` | Templates for the clinic to review |

Navigation: desktop mega-menu for treatments (opens on click, hover or keyboard; Escape closes), a full-screen mobile menu, a slim top bar with address, live "Open now" status and phone, and on phones a sticky **Call · Directions · Book now** bar.

### Admin dashboard (`/admin`)

| Area | What the clinic can do |
|---|---|
| **Appointments** | Today / upcoming / all; search; accept, reject (with a message), reschedule, cancel, arrived, completed; notification log |
| **Booking hours & slots** | Working days, **opening hours per weekday**, slot length, breaks, holidays, blocked time ranges, daily maximum, booking window, minimum notice |
| **Treatments & prices** | Add, edit, delete, reorder, hide, feature; image upload; six price types including discounts and packages |
| **Skin concerns, Before & after, Blog** | Full editing; gallery photos cannot be published without recorded consent |
| **Homepage & pages** | **Section builder**: edit, move up/down, show/hide, duplicate, remove, add any of 14 section types; why-choose-us points; About page; FAQs; announcement bar; SEO; footer; preview mode |
| **Team & reviews** | Team members (portrait, role, license/credentials, bio); testimonials (shown only with the client's permission); public rating summary |
| **Contact & visit** | Address, phone, email, optional WhatsApp, booking-alert email, map, "good to know" notes, social links (incl. Yelp) |
| **Branding & appearance** | Name, logo, palette presets or custom colors with automatic accessible text shades and a live contrast check, heading/body fonts |

---

## Design system

**Palette** (from the brief): warm ivory `#F8F6F1` · champagne beige `#E8DDCE` · muted gold `#B49A70` · soft taupe `#A99B8C` · deep charcoal `#252525` · white.

**Accessibility finding:** muted gold and taupe are too light to read as text on ivory (≈2.5:1; WCAG AA requires 4.5:1), and white text on a gold button is only 2.7:1. They are therefore used only for decoration (rules, icons, button fills with charcoal text, text on dark sections, where gold reaches 5.7:1). For small text the site derives companions automatically (`lib/theme.ts`):

| Token | Value | Contrast |
|---|---|---|
| Text gold | `#725C38` | 5.9:1 on ivory, 4.7:1 on champagne |
| Secondary text | `#655F57` | ≥ 4.7:1 on every light background |
| Form borders | `#978A7E` | 3.4:1 (WCAG 1.4.11) |
| Text on gold buttons | charcoal | 5.7:1 |

If the clinic changes colors in the admin, these are recalculated, and the admin shows a pass/fail contrast panel.

**Typography:** Cormorant Garamond (display headings, lining numerals) + DM Sans (body, navigation, buttons). Buttons are square, uppercase and tracked, at least 48 px tall (44 px small).

**Motion:** soft page fade, scroll reveals, a curtain-style image reveal, a gentle hero "settle", animated dropdowns, hover zoom on cards. All of it is disabled for visitors who set *reduce motion*, and nothing animates opacity on the hero image, so it never delays the largest paint.

**Imagery:** licensed stock (see `IMAGE_CREDITS.md`) with a light, uniform grade on catalogue images so mixed sources read as one set. Client results and team portraits are never filtered.

---

## Content: what is verified and what the clinic must supply

**Taken from the clinic's verified Google Business Profile (25 Nov 2026):** name, address, phone, hours (Mon–Fri 9:30 AM–6:30 PM, Sat–Sun 10 AM–7 PM), the service list and "About" description, wheelchair accessibility, LGBTQ+ friendly / transgender safe space, accepted payments, the 5.0 rating from 193 reviews, and the two published prices (Laser hair removal from $168; Botox from $8).

**Assumption to confirm:** Botox is shown as "From $8 **per unit**" because Botox is priced per unit in the US; the profile only says "From $8.00".

**Not invented, so the clinic must add before launch:** team members and their licenses, client testimonials, before & after photos, prices for the other treatments, clinic email (required for booking alerts), social links, a logo if they have one, and professional photography of the clinic. While the site is in **preview mode**, the empty team, reviews and results sections show clearly labeled placeholders; when preview mode is turned off they hide themselves until content exists.

All treatment and concern descriptions are general patient information and should be reviewed by the clinic's medical director.

---

## Run it locally

Requirements: **Node.js 20.9+**.

```bash
npm install
npm run dev            # http://localhost:3000  (demo mode, data stays in your browser)
```

Open `/admin` and use password **`demo1234`** (demo mode only). **Reset demo data** is in the admin sidebar.

---

## Go live

1. **Database (Supabase):** create a project (US West region), run both files in `supabase/migrations/` in order, copy the URL, anon key and service-role key into `.env.local` (see `.env.local.example`). Keep `NEXT_PUBLIC_CLINIC_TIMEZONE=America/Los_Angeles`.
2. **Seed and create staff:** `npm run db:seed`, then `npm run create-admin -- owner@clinic.com 'a-strong-password' owner`. In Supabase Auth, turn off public sign-ups.
3. **Email (Resend):** verify the clinic's domain, set `RESEND_API_KEY` and `EMAIL_FROM`, and set the booking-alert email in **Admin → Contact & visit**.
4. **WhatsApp (optional):** only if the clinic wants it. Without it, clients choose "call or text me" or "email me", and confirmations go by email. (Automatic SMS is not built; see "Recommended next steps".)
5. **Deploy (Vercel):** import the repo, add the environment variables plus `NEXT_PUBLIC_SITE_URL`, add the domain.
6. **Final checks:** turn **off** preview mode (Admin → Homepage & pages → Search engines & footer); add team, photos and prices; make a test booking and accept it.

---

## Using the admin dashboard

- **Rearrange the homepage:** Homepage & pages → use the arrows; the eye switch hides a section; the copy icon duplicates it (e.g. a second treatment row showing only *Laser*); the bin removes it (with confirmation); **Add a section** brings back any section type.
- **New booking:** the clinic gets an email alert and the client gets a "request received" email. Accept or reject in **Appointments**; the client is notified either way.
- **Change opening hours:** Booking hours & slots → **Opening hours by day**. The website, the "Open now" status and online booking all update together.
- **Add a testimonial:** Team & reviews → Add testimonial; paste the review exactly as written and tick the permission box. Without permission it is never shown.
- **Update the Google rating:** Team & reviews → Rating summary; update the "Checked on" date too.

---

## Security, privacy & compliance

- Row Level Security on every table; clients never touch the database directly; double booking is prevented by a unique index; gallery consent is enforced by the database; honeypot and rate limiting on bookings; staff-only admin; secrets are server-only; uploads are size-limited and stripped of metadata.
- **California notes for the clinic to confirm with its advisers:** the privacy notice is a template (review against CMIA and, where applicable, CCPA/CPRA and HIPAA); injectables, PRP, IV therapy and laser are medical procedures in California, so the team section should list licensed providers and the medical director once verified; testimonials must be genuine and unedited (FTC rule on consumer reviews, 16 CFR Part 465); the accessibility statement assumes the site is kept at WCAG 2.1 AA.

---

## Tests & quality checks

```bash
npm test               # 30 unit tests: US phone rules, USD pricing, per-day hours, slots, double booking, search
npm run build
npm run test:e2e       # 46 Playwright tests (phone + desktop), demo mode
```

The end-to-end suite covers navigation and the treatment menu (including keyboard), every internal link, **no horizontal scroll at 320, 375, 390, 430, 768, 1024, 1280, 1440 and 1920 px**, booking buttons visible and ≥ 44 px at every width, the homepage structure and verified facts, search, the treatment directory, booking with US phone validation, double booking, the full section builder (edit, hide, move, duplicate, remove, add), team & testimonials with permission, theme and logo, prices in USD, gallery consent, blog, contact, appointments, per-day hours, and reduced motion. An axe-core WCAG 2.2 AA audit of 12 key pages at phone and desktop width reports no violations.

Live-backend tests (`npm run test:live`) run against a local Supabase with stand-in email/WhatsApp servers.

---

## Architecture

```
app/                     Pages and API routes (booking, availability, admin actions, revalidation)
components/home/         Homepage section renderer
components/layout/       Header + mega-menu, mobile menu, action bar, footer, logo, search
components/site/         Cards, lists, detail pages, category pages
components/admin/        CMS, including the section builder (ContentAdmin.tsx)
lib/theme.ts             Brand colors → accessible derived tokens
lib/categories.ts        Treatment groups (labels, addresses, intros)
lib/hours.ts             Per-day hours, grouped display, "Open now"
lib/phone.ts             US / international phone validation
lib/data/                Types, seed content, demo and Supabase backends, rules, slot engine
supabase/migrations/     Schema, RLS, storage; US localisation (contact method, VIP- references)
tests/                   Playwright (site, admin, live) and helpers
```

### Recommended next steps

1. **Professional photography** of the real clinic (white and gold interior, treatment rooms, team). This is the single biggest upgrade to the premium feel and to trust.
2. **Simplified Chinese version** — the clinic's signage is bilingual (童颜·轻医美), which suggests a significant Chinese-speaking clientele.
3. **SMS confirmations and reminders** (e.g. Twilio), with TCPA-compliant consent, since US clients expect texts.
4. **Google reviews widget or Places API** to keep the rating current automatically.
