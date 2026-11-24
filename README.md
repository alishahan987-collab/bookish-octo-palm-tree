# Dermatology & Aesthetic Clinic Website

A premium, fully responsive website for a dermatologist and aesthetic medicine specialist, with online booking and a complete admin dashboard (CMS). It is pre-filled for **Aesthetica by Dr. Sajjad, Abbottabad**, and every name, text, image, price and colour is editable in the admin.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage) · Resend (email) · WhatsApp Business Cloud API · Vitest · Playwright

---

## Contents

1. [What's included](#whats-included)
2. [Two modes: demo and live](#two-modes-demo-and-live)
3. [Run it locally](#run-it-locally)
4. [Go live: step by step](#go-live-step-by-step)
5. [Using the admin dashboard](#using-the-admin-dashboard)
6. [Security & patient privacy](#security--patient-privacy)
7. [Tests](#tests)
8. [Architecture](#architecture)
9. [Known limitations & recommended next steps](#known-limitations--recommended-next-steps)

---

## What's included

### Public website

| Page | Route | Notes |
|---|---|---|
| Home | `/` | Hero with large doctor portrait (placeholder until uploaded), plus 11 sections. Admins can show, hide, reorder and edit every section and **add their own sections**. |
| About the Doctor | `/about` | Photo, name, qualifications, specialization, experience, certifications, achievements, expertise, biography, registration |
| Skin / Hair / Aesthetic | `/skin-treatments`, `/hair-treatments`, `/aesthetic-procedures` | Procedure galleries by group (plus `/treatments` for all) |
| Procedure page | `/treatments/[slug]` | Image, overview, how it works, benefits, suitable candidates, duration, recovery, sessions, price, FAQ, Book button |
| Skin conditions | `/conditions`, `/conditions/[slug]` | 14 conditions; each page answers: what it is, symptoms, causes, treatments, when to see a dermatologist |
| Before & After | `/before-after` | Comparison sliders, filter by category and treatment. **Consent is enforced.** |
| Pricing | `/pricing` | Every procedure with image, description, price, discount and Book Now. Prices come only from the database. |
| Blog | `/blog`, `/blog/[slug]` | Articles with topics; drafts are never public |
| Contact | `/contact` | Address, timings, phone, email, WhatsApp, social links, embedded Google Map |
| Search | header + `/search` | Searches treatments, conditions, articles and pages. Understands patient language ("hair fall", "pimples", "dark spots") and typos. |
| Booking | `/book` | Treatment → date → time → name, phone, email, notes → submit |
| Skin Concern Finder | `/skin-finder` | Guided suggestions with a "not a diagnosis" notice |
| Privacy notice | `/privacy` | Template for the clinic to review |

Also included: a floating WhatsApp button and a floating Book button, a mobile menu, an announcement bar, SEO metadata per page, social preview images, security headers, and optimised images (AVIF/WebP, responsive sizes, lazy loading).

### Admin dashboard (`/admin`)

| Area | What the clinic can do |
|---|---|
| **Appointments** | View today / upcoming / all; search by name, phone, email or reference; filter; **accept, reject (with a message), reschedule, cancel**, mark arrived or completed; see each patient notification and whether it was sent |
| **Booking hours & slots** | Working days, opening hours, slot length, breaks (per weekday), holidays, **blocked time ranges**, maximum per day, booking window, minimum notice, email required or optional, with a live 14-day availability preview |
| **Procedures & prices** | Add, edit, delete, reorder, show/hide, feature; image upload; six price types (fixed, from, range, on consultation, **discounted**, session packages); duration, recovery, sessions, FAQs; link to conditions |
| **Skin conditions** | Add, edit, delete, reorder, show/hide, image upload; include in the Skin Concern Finder |
| **Before & after** | Upload before/after photos, edit, delete, reorder, filter category. A real photo **cannot be published until written consent is confirmed** (also enforced by the database). |
| **Blog** | Write with a formatting toolbar and live preview, cover image, topics, draft or publish, unpublish, delete |
| **Homepage & sections** | Every heading and paragraph, hero texts and badges, hero background, show/hide/reorder sections, **add custom sections**, "why choose us" items, FAQs, announcement bar, SEO title and description, footer text, preview banner |
| **Doctor profile** | Photo, name, designation, specialization, experience, registration, qualifications, certifications, achievements, expertise, biography |
| **Contact & social** | Address, city, map location, phone, email, WhatsApp number, new-booking alert email, Instagram, Facebook, YouTube, TikTok |
| **Branding & appearance** | Clinic name, logo upload, tagline, currency, 5 colour presets or custom colours (with a live accessibility contrast check), heading and body fonts |
| Treatment journeys | Week-by-week treatment plans per patient (internal) |

---

## Two modes: demo and live

The same code runs in two modes, chosen automatically:

| | **Demo mode** (no Supabase keys) | **Live mode** (Supabase keys set) |
|---|---|---|
| Data | Stored in the visitor's own browser | Postgres database (Supabase) |
| Admin login | Password `demo1234`, clearly labelled as demo | Real staff accounts (email + password) |
| Image uploads | Kept in the browser (IndexedDB) | Supabase Storage (public CDN) |
| Email & WhatsApp | **Never sent.** The exact message is shown as a preview. | Sent via Resend and the WhatsApp Cloud API; delivery is logged on each appointment |
| Use for | Showing the clinic, design review | The real clinic |

Nothing is faked. In demo mode the screens say plainly that messages are not sent. In live mode, a channel that isn't configured is reported as "skipped" with the reason.

---

## Run it locally

Requirements: **Node.js 20.9+**.

```bash
npm install
npm run dev            # http://localhost:3000  (demo mode)
```

Open `/admin` and use password **`demo1234`**. **Reset demo data** is in the admin sidebar.

---

## Go live: step by step

Allow about an hour, plus waiting time for Meta's WhatsApp verification.

### 1. Create the database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com). Choose a region close to Pakistan (e.g. Mumbai or Singapore).
2. In **SQL Editor**, paste the contents of `supabase/migrations/20261124000000_init.sql` and run it.
   (Or with the CLI: `npx supabase link --project-ref <ref>` then `npx supabase db push`.)
3. In **Project Settings → API**, copy the **Project URL**, the **anon public** key and the **service_role** key.
4. Create `.env.local` from `.env.local.example` and fill in the three Supabase values.

### 2. Load the starter content and create the admin login

```bash
npm run db:seed                                            # procedures, conditions, articles, site text
npm run create-admin -- doctor@yourclinic.com 'a-strong-password' owner
```

Add more staff the same way (role `admin` or `reception`).
In Supabase **Authentication → Providers → Email**, turn **off** "Allow new users to sign up", so only accounts you create can exist.

### 3. Email (Resend)

1. Create an account at [resend.com](https://resend.com) and **verify the clinic's domain** (add the DNS records it gives you).
2. Create an API key. Set `RESEND_API_KEY` and `EMAIL_FROM` (e.g. `Aesthetica <appointments@yourclinic.com>`).
3. In the admin, under **Contact & social**, set the **email for new-booking alerts**.

### 4. WhatsApp (Meta Cloud API)

WhatsApp only allows businesses to start conversations with **pre-approved templates**.

1. In Meta Business Manager, complete **business verification** and add a phone number to the WhatsApp Business Platform (Cloud API). A number used by the Cloud API can't be used in the normal WhatsApp app at the same time unless you use Meta's coexistence option.
2. Create a **permanent access token** (System User) with `whatsapp_business_messaging` permission.
3. Create these message templates (category *Utility*, language English). Each uses the variables `{{1}}` name, `{{2}}` treatment, `{{3}}` date & time, `{{4}}` reference:

| Env variable | Suggested template text |
|---|---|
| `WHATSAPP_TEMPLATE_CONFIRMATION` | Assalam-o-Alaikum {{1}}, we have received your request for {{2}} on {{3}}. Ref: {{4}}. We will confirm shortly. |
| `WHATSAPP_TEMPLATE_ACCEPTED` | {{1}}, your {{2}} appointment on {{3}} is confirmed. Ref: {{4}}. Please arrive 10 minutes early. |
| `WHATSAPP_TEMPLATE_REJECTED` | {{1}}, unfortunately we cannot accommodate {{2}} on {{3}} (Ref: {{4}}). Please book another time or reply to this message. |
| `WHATSAPP_TEMPLATE_CANCELLED` | {{1}}, your {{2}} appointment on {{3}} (Ref: {{4}}) has been cancelled. |
| `WHATSAPP_TEMPLATE_RESCHEDULED` | {{1}}, your {{2}} appointment has moved to {{3}}. Ref: {{4}}. |
| `WHATSAPP_TEMPLATE_CLINIC_ALERT` | New booking request: {{1}}, {{2}}, {{3}}. Ref: {{4}}. |

4. Set `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_LANG` (e.g. `en`) and the template names.

Until WhatsApp is configured, bookings still work, emails still go out, and the floating WhatsApp button still opens a normal chat with the clinic's number.

### 5. Deploy (Vercel)

1. Push the repository to GitHub and import it at [vercel.com](https://vercel.com) (framework: Next.js).
2. Add every variable from `.env.local` under **Settings → Environment Variables**, plus `NEXT_PUBLIC_SITE_URL` (your domain).
3. Deploy, then add the clinic's domain under **Settings → Domains**.

### 6. Final checks

- In the admin, under **Homepage & sections → Search engines & footer**, switch **off** the preview banner. This also allows Google to index the site.
- Upload the doctor's photo and logo, and fill in the biography, qualifications, phone, email and WhatsApp number.
- Review every procedure, condition and price; the starter content is general patient information, not the clinic's own approved text.
- Make a test booking, then accept it in the admin and check that the email and WhatsApp messages arrive.

---

## Using the admin dashboard

- **New booking:** the clinic gets an email (and WhatsApp alert, if configured), and the patient gets a "request received" message. Open **Appointments → Upcoming** and press **Accept** or **Reject**. Either way the patient is notified, and a rejected or cancelled slot becomes bookable again.
- **Change a price or add a discount:** **Procedures & prices → Price**, then choose "Discounted price", enter the regular and discounted amounts, and optionally a label and end date. The website updates immediately.
- **Close the clinic for a day or a few hours:** **Booking hours & slots → Holidays** (whole days) or **Blocked time slots** (part of a day).
- **Add a section to the homepage:** **Homepage & sections → Add a new section**, then use the arrows to position it.
- **Photos:** any JPG, PNG or WebP up to 15 MB. Images are automatically resized, compressed and stripped of location metadata before upload.

---

## Security & patient privacy

- **Row Level Security on every table.** Website visitors can read only published content. Bookings, journeys and drafts are readable only by signed-in staff (verified in `tests/live.spec.ts`).
- **Patients never touch the database directly.** Booking and availability go through server API routes that validate everything again. Availability responses contain slot states only, never other patients' details.
- **Double booking is impossible:** a unique database index on (doctor, date, time) for active bookings, plus re-validation at write time.
- **Gallery consent** is enforced in the interface *and* by a database constraint.
- **Spam protection:** a hidden honeypot field and a per-IP rate limit on bookings.
- **Staff-only admin:** Supabase Auth plus a `staff` role table. Admin API routes verify the session token on every request.
- **Uploads:** staff-only Storage policies, an image MIME allow-list, a 15 MB limit, and EXIF stripping.
- **Headers:** `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`; the admin is `noindex`.
- **Content safety:** article Markdown is rendered without raw HTML, so admin text cannot inject scripts.
- Secrets (`SUPABASE_SERVICE_ROLE_KEY`, Resend and WhatsApp tokens) are server-only and never sent to the browser.

---

## Tests

```bash
npm test                 # 24 unit tests: slot engine, double booking, validation, pricing, consent, search
npm run build
npx playwright install chromium    # first time only
npm run test:e2e         # 37 end-to-end tests on a 375px phone and desktop (demo mode)
```

**Live-backend tests** (real Supabase plus stand-in email/WhatsApp servers that record every message):

```bash
npx supabase start                              # local Supabase (Docker)
# put the local keys from `npx supabase status` in your shell, plus the test values from .env.local.example
npx supabase db reset && npm run db:seed && npm run create-admin -- admin@example.com 'test-password-123'
NEXT_DIST_DIR=.next-supa npm run build
npm run test:live                               # 10 tests
```

What's covered: every navigation link and internal link; no console errors; no horizontal scroll at 375px; search; condition and procedure page structure; booking validation; double booking (UI and API); accept/reject/reschedule/cancel, with the exact email and WhatsApp payloads checked; every admin editor, including real file uploads; theme changes; custom sections; anonymous-access security; SSR pages refreshing after edits.

Lighthouse (mobile, production build): homepage **Performance 91–96, Accessibility 100, Best Practices 100**; procedure, condition, pricing, blog and booking pages **94–98**. (Demo mode scores lower on SEO by design, because the preview banner sets `noindex`.)

---

## Architecture

```
app/                       Pages and API routes
  api/availability         GET  public slot states (no patient data)
  api/bookings             POST create booking → validate → insert → notify
  api/admin/bookings/[id]  PATCH accept/reject/cancel/reschedule (staff token)
  api/revalidate           POST refresh server-rendered pages after edits (staff token)
components/
  home/ site/ layout/      Public UI
  admin/                   CMS
  booking/                 Booking flow, slot picker, message preview
lib/
  data/types.ts            Domain model (the contract)
  data/source.ts           DataSource interface
  data/local-source.ts     Demo backend (browser)
  data/supabase-source.ts  Live backend (browser side)
  data/rules.ts            Shared validation and status rules
  data/slots.ts            Slot engine (shared by browser and server)
  data/seed*.ts            Starter content
  server/                  Server-only: bookings, notifications, SSR reads
  supabase/                Clients and row mappers
  search.ts messages.ts theme.ts tz.ts ...
supabase/migrations/       Database schema, RLS, storage
scripts/                   Seeding and admin creation
tests/                     Playwright (demo, admin, live) + mock providers
```

**Design choices**
- **Content as JSON documents, bookings as strict relational rows.** The clinic can add fields and sections without database migrations, while patient data keeps hard constraints.
- **Server-rendered pages** (SEO and speed), refreshed within 60 seconds or immediately after an admin edit.
- **Clinic time zone** (`Asia/Karachi` by default; set `NEXT_PUBLIC_CLINIC_TIMEZONE`): "today" and same-day slots are correct even though servers run in UTC.
- **Modular:** new procedures, conditions, articles and homepage sections need no code. A new *type* of page or section is one component plus one entry in the content model.

**Images:** stock photography from Pexels under the Pexels License (see `IMAGE_CREDITS.md`). No stock photo is presented as the doctor or as a patient result.

---

## Known limitations & recommended next steps

- **Appointment reminders** (e.g. 24 hours before) are not scheduled yet. The template exists (`reminder`); add a Supabase `pg_cron` job or Vercel Cron that calls a reminder endpoint.
- **Rate limiting** is per server instance. For heavier traffic, add Vercel Firewall rules or a shared store (e.g. Upstash).
- **Content review:** the starter medical text is general patient information. The doctor should review every page, and the clinic should confirm compliance with PMDC guidance on medical advertising and with applicable data-protection law before launch.
- **Single practitioner:** the data model supports several doctors (`doctorId`), but the interface currently assumes one. Adding a doctor selector is a small change if the clinic grows.
- **No contact form:** the site uses WhatsApp, phone, email and booking instead, which avoids collecting unstructured medical information.
