# Aesthetica by Dr. Sajjad: Pitch Prototype (Phase 1)

A clickable, frontend-only prototype of a website and booking system for **Aesthetica by Dr. Sajjad**, a skin and laser clinic at Jadoon Plaza, Phase 2 Road, Abbottabad.

> **Design preview.** This is not the official website. Every page shows a banner saying so and is marked `noindex`. No real patient data, no backend, no API keys. All data is mock data saved in the visitor's own browser (`localStorage`). No messages are ever sent.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · Vitest · Playwright

---

## What's inside

| Area | Route | Highlights |
|---|---|---|
| Homepage | `/` | Hero, introduction, doctor (placeholder bio), featured treatments, categories, why Aesthetica, technology (placeholders), before/after slider demo (abstract images), reviews placeholder, live offers, FAQ, location (Google Maps link), floating WhatsApp + Book |
| Catalogue | `/treatments` | Category filter (shareable `?category=` URLs) |
| Treatment page | `/treatments/[slug]` | Description, how it works, benefits, who it suits, downtime, sessions, side effects, FAQ, price block, Book button |
| Booking | `/book` | Treatment → doctor → date & time → details (PK mobile validation, contact preference, consent) → review → confirmation with reference `AES-2026-0001`, add-to-calendar file and **Message preview** |
| Skin Concern Finder | `/skin-finder` | Multi-select concerns → relevant treatments + "Book a consultation". Clear "This is not a diagnosis" note |
| Admin | `/admin` | Appointments (today / upcoming / all, search, filters, confirm / cancel / reschedule / arrived / completed, notification previews), treatments & pricing editor, clinic settings, treatment journeys, reset demo data |

### Pricing models
Every treatment uses one of six price models, each rendered in its own style:
`fixed` · `from` (starting from) · `range` · `consultation` (price after consultation) · `promo` (regular + promotional, feeds the homepage offers) · `package` (per-session price + multi-session packages, e.g. PRP: PKR 12,000/session, 3 sessions PKR 32,000).

### Content honesty rules (built in)
- No reviews, before/after photos, credentials, equipment claims or clinic phone numbers are invented. Each has a clearly labelled placeholder.
- Clinical copy is general patient information ("may", "aims to", "results vary") and is marked for review by Dr. Sajjad.
- All prices are labelled **Demo price** in the admin, and as demo prices on the public site.
- The WhatsApp button explains that the number is pending until one is entered in **Admin → Clinic settings**; then it opens WhatsApp for real.

---

## Run locally

Requirements: Node.js 20.9 or newer.

```bash
npm install
npm run dev          # http://localhost:3000
```

Production build:

```bash
npm run build
npm start            # http://localhost:3000
```

To view it on your phone over Wi-Fi, run `npm run dev -- -H 0.0.0.0` and open `http://<your-computer-ip>:3000`.

## Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project**, import the repository and keep the defaults (framework: Next.js; build command `next build`).
3. Click **Deploy**. No environment variables are needed for Phase 1.

The `X-Robots-Tag: noindex, nofollow` header (in `next.config.ts`) and the `robots` meta tag keep the preview out of search engines. Only share the URL privately.

## Demo admin

- Open `/admin` (also linked in the footer and mobile menu).
- Password: **`demo1234`** (shown on the login screen and labelled demo-only).
- The login is a browser-side demo gate, **not security**. Phase 2 replaces it with Supabase Auth.

## Reset demo data

- **Admin → Reset demo data** (top bar) restores the original treatments, prices, settings and demo appointments.
- Or clear the site data in the browser (the key is `aesthetica-demo:v1`).

Demo appointments are generated relative to *today*, so the "Today" and "Upcoming" views always look alive.

## Tests

```bash
npm test                 # unit tests: slot engine, double booking, validation, pricing
npm run build            # e2e tests run against the production build
npx playwright install chromium   # first time only
npm run test:e2e         # end-to-end on 375px mobile and desktop
MOTION=reduce npm run test:e2e    # same, with prefers-reduced-motion
```

The end-to-end suite covers the acceptance criteria: a full booking at 375px and desktop; a booked slot can't be booked again (including two tabs racing for the same slot); an admin price edit shows on the treatment page and in homepage offers; closing a weekday or adding a holiday removes those slots; every internal link resolves with no console errors; admin status actions and previews; add treatment, journey and reset; and the banner plus `noindex` on every page.

**Last verified results** (production build, Lighthouse 12 mobile preset):

| Page | Performance | Accessibility | Best practices |
|---|---|---|---|
| `/` | 96 | 100 | 100 |
| `/treatments` | 98 | 100 | 100 |
| `/treatments/prp-hair-treatment` | 97 | 100 | 100 |
| `/book` | 93 | 100 | 100 |
| `/skin-finder` | 98 | 100 | 100 |
| `/admin` | 98 | 100 | 100 |

Scores were measured locally; scores on Vercel's CDN are usually similar or better.

---

## Architecture

```
app/                      Routes (App Router)
components/
  layout/                 Banner, header, footer, floating buttons, WhatsApp link
  home/                   Homepage sections
  treatments/             Cards, catalogue, detail page, Skin Finder
  booking/                Booking flow, slot picker, message preview
  admin/                  Dashboard, appointments, pricing, settings, journeys
  ui/                     Icons, abstract artwork, price display, dialog, reveal
lib/
  data/
    types.ts              Domain types: the contract for Phase 2
    source.ts             DataSource interface (every backend implements this)
    local-source.ts       localStorage implementation (Phase 1)
    index.ts              ← the ONLY module the UI imports for data
    slots.ts              Pure slot engine (hours, breaks, holidays, max/day, notice)
    seed.ts               Mock catalogue, settings and doctor
    hooks.ts              useData(): load + live-update on change (incl. other tabs)
  messages.ts             WhatsApp/email templates (rendered as previews only)
  phone.ts · pricing.ts · dates.ts · journey.ts · ics.ts
tests/                    Playwright end-to-end tests
```

**Why it swaps cleanly to a real backend:**
- The UI calls async functions only (`getTreatments`, `getAvailability`, `createBooking`, `updatePrice`, `setBookingStatus`, `rescheduleBooking`, …) from `lib/data`.
- `lib/data/index.ts` delegates to a `DataSource`. Phase 2 adds `supabase-source.ts` implementing the same interface and changes one line.
- The public booking page never receives other patients' bookings, only slot states from `getAvailability()`, mirroring how the real API must behave.
- Double booking is re-checked at write time (`createBooking`), which in Phase 2 becomes a database constraint.
- `subscribe()` (localStorage events today) maps to Supabase Realtime.
- Pages are statically rendered from seed data for speed, then hydrate from the data layer.

---

## Phase 2 plan

Phase 2 turns the prototype into the clinic's live system once Dr. Sajjad approves it. The UI stays; the data source, auth and messaging are added.

### 1. Supabase database (Postgres)

| Table | Key columns |
|---|---|
| `treatments` | id, slug (unique), name, category, content fields (jsonb for lists/FAQs), `price` (jsonb, validated by a check constraint or trigger), featured, active, updated_at |
| `doctors` | id, name, role, bio, active |
| `treatment_doctors` | treatment_id, doctor_id |
| `clinic_settings` | single row: hours, slot length, max per day, booking window, notice, contact details |
| `breaks`, `holidays` | clinic closures |
| `patients` | id, name, phone (E.164, unique), email |
| `bookings` | id, reference (unique), patient_id, treatment_id, treatment_name (snapshot), doctor_id, date, time, status, notes, created_at |
| `booking_events` | audit trail: booking_id, action, note, actor, at |
| `consents` | patient_id, booking_id, channel(s), consent text version, given_at, withdrawn_at, source (web/staff) |
| `messages` | booking_id, channel, template, status (queued/sent/delivered/failed), provider id, sent_at |
| `journeys`, `journey_steps` | treatment plans |
| `staff` | user_id (auth.users), role |

**Double booking at database level:**
```sql
create unique index bookings_no_double_booking
  on bookings (doctor_id, date, time)
  where status <> 'cancelled';
```
Bookings are created through a `create_booking()` Postgres function (security definer) that validates the slot against settings, inserts the patient and booking, records consent and generates the reference (`AES-YYYY-NNNN` from a per-year sequence) in one transaction.

**Row Level Security (RLS)**, enabled on every table:
- **Public (anon):** read active treatments, doctors, public settings; call `get_availability()` (returns slot states only) and `create_booking()`. **No direct read access to bookings or patients.**
- **Staff:** policies based on `staff.role` (via a JWT custom claim or a `has_role()` helper).

### 2. Supabase Auth and roles
- Staff sign in with email + password or magic link; MFA for the owner.
- Roles: **owner/admin** (everything, including prices and settings), **reception** (appointments, patients), **doctor** (appointments, journeys, read-only prices).
- Replaces the demo password gate in `components/admin/AdminApp.tsx`.

### 3. WhatsApp Business Platform (Cloud API)
- Requires the clinic's **Meta Business account and business verification**, a dedicated phone number registered to the Cloud API, and an approved display name. Verification can take days to weeks, so start early.
- Appointment confirmations, reminders, cancellations and reschedules are **business-initiated messages**, so they must use **pre-approved message templates** (the templates in `lib/messages.ts` are written for this).
- Meta charges per template message; check current rates for Pakistan before quoting running costs to the clinic.
- Sending runs server-side (Supabase Edge Function or a Next.js route handler). The access token is never exposed to the browser.
- Delivery status webhooks update the `messages` table.

### 4. Email with Resend
- Send from the clinic's own domain (e.g. `appointments@<clinic-domain>`). This needs the domain's DNS records (SPF/DKIM) verified in Resend.
- The same templates are used, with an unsubscribe/withdraw-consent link.

### 5. Reminders via scheduled jobs
- A scheduled job (Supabase `pg_cron` calling an Edge Function, or Vercel Cron) runs every 15–60 minutes and queues reminders, e.g. 24 hours and 2 hours before each confirmed appointment, respecting each patient's consent and channel.
- Idempotent: each reminder is recorded in `messages` so it is never sent twice.
- All times are computed in **Asia/Karachi** on the server.

### 6. Consent records
- Store who consented, to what (channel + text version), when, and from where; support withdrawal (patient reply "STOP" or staff action).
- Collect only what's needed; booking notes warn patients not to enter sensitive medical details.
- Confirm current Pakistani data-protection and medical-advertising requirements (e.g. PMDC guidance) with the clinic before launch.

### 7. Also before go-live
- Real content from the clinic: doctor bio and qualifications, approved treatment copy, prices, equipment details, clinic photos, consented before/after photos.
- Clinic domain, Google Business Profile link, analytics (privacy-friendly), error monitoring, backups.
- Remove the preview banner and `noindex`.

---

## Pitch demo script (about 5 minutes)

1. **Phone first.** Open the site on your phone: hero, treatments, offers. Point out the banner: "this is a preview I built for you."
2. **Book an appointment** for HydraFacial. Show the Pakistani number check and the consent box; confirm. Show the reference number and the **message preview**: "this is exactly what your patients will receive on WhatsApp."
3. **Open `/admin`** (on a laptop beside the phone): the new booking appears instantly. Confirm it; reschedule it to show the reschedule notice.
4. **Change a price** (e.g. HydraFacial offer). Refresh the phone: the new price is on the treatment page and homepage offers.
5. **Clinic settings:** close Sunday or add an Eid holiday. The booking page no longer offers those days.
6. **Skin Finder** and **Treatment journey:** show how patients find the right treatment and how a PRP course is planned week by week.
7. End on the Phase 2 plan: "Everything you saw is ready to connect to a real database, WhatsApp and email."

Tip: press **Reset demo data** before each demo.
