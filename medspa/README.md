# MEDSPA Skincare & Body: website, CMS and appointment requests

The website for **MEDSPA Skincare & Body**, 2632 Hollywood Blvd, Suite 307, Hollywood, FL 33020, with a full admin dashboard so the business can edit almost everything itself, an appointment request system with double-booking protection, and Booksy integration.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage) · Resend (email) · Vercel · Playwright + Vitest.

---

## Contents

1. [Status: what works and what you must set up](#1-status-what-works-and-what-you-must-set-up)
2. [Run it on your computer](#2-run-it-on-your-computer)
3. [Go live, step by step](#3-go-live-step-by-step)
4. [Using the admin dashboard](#4-using-the-admin-dashboard)
5. [Content rules (please read before launch)](#5-content-rules-please-read-before-launch)
6. [How it is built](#6-how-it-is-built)
7. [Tests](#7-tests)
8. [Known limitations and recommended next steps](#8-known-limitations-and-recommended-next-steps)

---

## 1. Status: what works and what you must set up

**Built and tested** (39 end-to-end tests pass against a real local Supabase, plus 11 unit tests):

| Area | Status |
|---|---|
| All 10 pages (Home, About, Treatments, 8 treatment pages, Gallery, Reviews, Contact, Book, Privacy, Terms) | Working |
| Admin login (Supabase Auth, staff-only) | Working |
| Edit every heading, paragraph, image, button and link on every page | Working |
| Add / remove / hide / duplicate / drag-and-drop sections; create / duplicate / hide / delete / reorder pages | Working |
| Treatments: add, edit, hide, duplicate, reorder, delete; inline price editing | Working |
| Image upload (auto-resized, compressed, location data removed) and image library with delete | Working (Supabase Storage) |
| Testimonials and before/after gallery (consent enforced in the database) | Working |
| Menus, business info, opening hours, social links, Google rating | Working |
| Design editor: colours, fonts, buttons, corners, spacing, header, footer, with live preview | Working |
| Appointment requests: treatment → date → time → details; pending until approved | Working |
| Double-booking prevention (database lock, tested with simultaneous requests) | Working |
| Admin: approve, reject, reschedule, complete, no-show, cancel, notes, call/text/email/WhatsApp, phone bookings | Working |
| Emails: request received, confirmed, declined, rescheduled, cancelled, spa alert, contact auto-reply (all editable) | Working **once Resend is configured** (tested against a stand-in Resend server) |
| Booksy | Link-based (see §8). Three modes: website requests + Booksy, requests only, Booksy only |
| SEO: titles, descriptions, canonical URLs, sitemap, robots, LocalBusiness + Service + Breadcrumb structured data | Working (indexing is **off** until you switch it on) |
| Responsive: 320, 375, 390, 430, 768, 1024, 1280, 1440, 1920 px | Tested: no horizontal scroll or clipped content |

**Not connected yet (needs your accounts; nothing here is faked):**

| You need | Why | Cost |
|---|---|---|
| A **Supabase** project | Database, admin logins, image storage | Free tier is enough to start |
| A **Resend** account with the spa's domain verified | Sending emails | Free tier: 3,000 emails/month |
| A **Vercel** account | Hosting | Hobby is free for personal use; a business site should use **Pro** |
| A **domain** (e.g. medspaskincarebody.com) | The website address, and the email sender domain | ~$12–20/year |

Until these are set, the admin dashboard's **Setup checklist** shows exactly what is missing.

**The business must verify** (the site is deliberately cautious until then): the service menu, prices, durations, benefits, team details and licences, the Booksy and Cherry links, the Instagram link, the opening hours, the cancellation policy, and the Privacy/Terms templates (have a lawyer review them).

---

## 2. Run it on your computer

Requires **Node.js 20.9 or newer**.

```bash
cd medspa
npm install
npm run dev
```

Open <http://localhost:3000> for the website and <http://localhost:3000/admin> for the dashboard.
Without Supabase settings, the site runs in **local mode**: data is saved in the `.data` folder, and the admin login is `admin@medspa.local` / `medspa-admin` (shown on the login page). Local mode is for trying things out only; it cannot be used on Vercel.

---

## 3. Go live, step by step

Allow about an hour, plus DNS waiting time.

### Step 1: Create the database (Supabase)

1. Sign up at [supabase.com](https://supabase.com) and create a project. Region: **East US (North Virginia)** is closest to Florida.
2. Open **SQL Editor → New query**, paste the whole file `supabase/migrations/20261125000000_init.sql`, and press **Run**.
   (Developers can instead run `npx supabase link --project-ref <ref>` and `npx supabase db push`.)
3. **Authentication → Sign In / Providers → Email**: turn **off** "Allow new users to sign up". Only accounts you create can then exist.
4. **Project Settings → API**: copy the **Project URL**, the **anon public** key and the **service_role** key (keep the service key secret).

### Step 2: Configure and load the starter content

In the `medspa` folder, copy `.env.example` to `.env.local` and fill in the three Supabase values. Then:

```bash
npm run db:seed                                                  # loads pages, treatments, settings (safe to re-run)
npm run create-admin -- owner@yourdomain.com 'a-long-password'  # your admin login (10+ characters)
```

Run `create-admin` again for each staff member (add `admin` or `staff` at the end for the role). Running it again for an existing email resets that password.

### Step 3: Email (Resend)

1. Sign up at [resend.com](https://resend.com) → **Domains → Add domain**, and add the DNS records it shows at your domain registrar. Wait until it shows **Verified**.
2. **API Keys → Create** (permission: Sending access).
3. Set `RESEND_API_KEY` and `EMAIL_FROM`, e.g. `MEDSPA Skincare & Body <appointments@yourdomain.com>`.
4. In the admin: **Business info → Notification email**: the inbox that receives new requests and messages.

Without a verified domain, Resend only delivers to your own Resend account email, so customers would not receive anything.

### Step 4: Deploy (Vercel)

1. Push this repository to GitHub, then in Vercel: **Add New → Project → Import** the repository.
2. **Root Directory: `medspa`** (important: the app lives in this sub-folder). Framework: Next.js.
3. Add the environment variables from `.env.example`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_SITE_URL` (your final domain, e.g. `https://www.yourdomain.com`).
4. Deploy. Then **Settings → Domains** → add your domain and follow the DNS instructions.

### Step 5: Launch checklist

Sign in at `https://yourdomain.com/admin` and work through the **Setup checklist** on the dashboard. In particular:

- Replace the stock photos with real photos of the spa and team (Image library / each treatment).
- Check each treatment, set confirmed prices and durations, then switch on **Verified**.
- Check the Booksy link (Booking & emails), and the Instagram/WhatsApp links (Business info).
- Review the Privacy Policy and Terms pages with your legal adviser.
- Send yourself a test request, approve it, and check that both emails arrive.
- **SEO & site settings → Allow search engines** (turn on at launch).
- Claim/verify the **Google Business Profile** and add the website address to it; this matters more for local search than anything on the website itself.

---

## 4. Using the admin dashboard

Sign in at `/admin`. Everything saves to the database and updates the live site immediately.

| I want to… | Go to |
|---|---|
| See and approve appointment requests | **Appointments** → open a request → **Approve** (the customer is emailed). Reject, Reschedule, Cancel, Mark completed or No-show work the same way. |
| Add a booking taken by phone | **Appointments → + Add appointment** (uses the same double-booking protection) |
| Edit homepage text or images | **Pages & sections → Home → click a section** → edit → **Save changes** |
| Reorder sections | Drag the ⋮⋮ handle (or use ↑ ↓). Keyboard: focus the handle, Space, arrow keys, Space |
| Hide a section without deleting it | **Hide** on the section (shows **Hidden**; press **Show** to bring it back) |
| Add a section | **+ Add section** → choose a type (hero, text, image + text, treatments, highlights/steps, reviews, before & after, call to action, contact & map, booking form, FAQ, team, image banner) |
| Create, duplicate, hide or delete a page | **Pages & sections** (required pages such as Home or Book can be hidden but not deleted) |
| Put a page in the menu | **Pages & sections → Add to menu**, or **Menus** for full control (order, labels, custom links, footer columns) |
| Change a price | **Treatments & prices** → type in the price box → ✓ |
| Add or edit a treatment | **Treatments & prices → + New treatment / Edit** (description, image, price, duration, verified benefits, extra sections, FAQ, SEO, Booksy link) |
| Change opening hours, phone, address | **Business info & hours** (also used for online booking times) |
| Close for a holiday or a few hours | **Booking & emails → Closed dates & times** |
| Change how booking works | **Booking & emails → Booking method** (website + Booksy, website only, Booksy only) |
| Edit the emails customers receive | **Booking & emails → Emails to customers** |
| Change colours, fonts, buttons, logo, footer | **Design** (live preview on the right; "Restore original design" undoes everything) |
| Add a testimonial / before & after | **Testimonials** / **Before & after** |
| Turn on Google indexing, edit the announcement bar | **SEO & site settings** |

---

## 5. Content rules (please read before launch)

These are built into the site; please keep to them when editing.

- **No invented content.** The starter text describes services in neutral terms. No prices, durations, benefits, results, credentials or testimonials were invented. Treatments show "Pricing on request" and a short "details being updated" notice until you verify them.
- **Reviews.** The U.S. FTC's rule on fake reviews (effective October 2024) prohibits fake or misrepresented reviews. Only publish genuine reviews, word for word, with the client's permission or from a public review. The admin requires you to confirm this before a testimonial can be published.
- **Before & after photos.** Only real, unedited photos of your own clients with **written consent**. The database refuses to publish a photo set unless consent is recorded. Never use stock images as results.
- **Medical claims.** Avoid "guaranteed", "permanent", "painless", "FDA-approved" or similar unless you hold documentation; device names such as Venus Legacy are trademarks of their owners.
- **Google rating.** The 5.0 / 286 reviews figure was entered from the Google listing as reported in November 2026. Update it (with the "as of" date) when it changes. It is deliberately **not** added to structured data, because Google ignores and may penalise ratings a business publishes about itself.
- **Health information.** Forms ask customers not to send medical details. If the spa is a HIPAA covered entity, review with your compliance adviser whether Business Associate Agreements are needed with your hosting and email providers.

---

## 6. How it is built

```
medspa/
  app/(site)/[[...slug]]   every CMS page (home, about, any page you create)
  app/(site)/treatments/[slug]  treatment detail pages
  app/admin/               dashboard (login + panel)
  app/api/                 public: availability, appointments, contact · admin: content, appointments, media, status
  components/blocks/       one renderer per section type
  components/admin/        dashboard UI, page builder, drag & drop
  lib/types.ts             content model (the contract)
  lib/seed.ts              starter content for MEDSPA Skincare & Body
  lib/slots.ts             availability engine (shared by browser and server)
  lib/repo/                storage: Supabase (production) or local files (development)
  lib/server/              auth, appointments, email, content reads
  lib/schemas.ts           validation of everything the admin saves
  supabase/migrations/     database schema, security policies, booking lock
  scripts/                 seed and create-admin
  tests/                   Playwright (site, admin, database security) + mock email server
```

**Design decisions**

- **Pages are lists of sections stored as JSON**, so new pages, sections and fields need no database migration. Appointments and messages are strict relational tables.
- **Double booking** is prevented three times: in the form (taken times are shown as unavailable), in the server (re-check before saving), and in the database (`book_appointment` runs under a per-day lock, so simultaneous requests cannot both take the last place). **Pending requests hold their time**, so two people cannot request the same slot; rejected or cancelled requests free it again. "Appointments at the same time" (capacity) supports several rooms or providers.
- **Spa time zone** (`America/New_York`) is used for "today" and notice periods, even though servers run in UTC.
- **Fast pages:** pages are pre-rendered and cached, refreshed the moment an admin saves. Images are served as AVIF/WebP at the right size and lazy-loaded; fonts are self-hosted by Next.js.

**Security**

- Admin login via Supabase Auth; only users in the `staff` table get in. Session tokens are in `httpOnly`, `SameSite=Strict` cookies (never readable by page scripts) and refreshed server-side.
- Every admin API checks the session; writes also reject cross-site requests (Origin check).
- Row Level Security on every table: the public key can only read published content; customer data is staff-only. Verified by `tests/live.spec.ts`.
- The service role key and Resend key are used only on the server.
- Uploads: staff only, real file-type check (not just the extension), 15 MB limit, re-encoded in the browser (strips location metadata).
- All admin input is validated on the server; links are restricted to safe schemes; text is rendered without raw HTML; colours and fonts are sanitised before they reach CSS.
- Spam protection on forms: hidden honeypot field and per-IP rate limits. Security headers (HSTS, nosniff, frame and referrer policies); admin pages are `noindex`.

---

## 7. Tests

```bash
npm run typecheck
npm test                 # 11 unit tests: availability engine, validation, design sanitising
npm run test:e2e         # 34 browser tests against the local file store (builds the app first)
```

**Against a real Supabase** (Docker required):

```bash
npx supabase start
npx supabase db reset                       # applies the migration
export SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=<anon key> SUPABASE_SERVICE_ROLE_KEY=<service key>   # from `npx supabase status`
npm run db:seed && npm run create-admin -- admin@test.local 'test-password-123'
LIVE=1 npx playwright test --trace off      # 39 tests, including database security
```

The tests cover: every page and its SEO basics; no horizontal scrolling or clipped content at all 9 widths; navigation and the mobile menu; the full booking flow on a phone; validation, honeypot and cross-site protection; double booking (sequential and 5 simultaneous requests); the exact emails sent at each step; admin login and protection of every admin API; editing, hiding, reordering (drag and drop by mouse and keyboard), creating, duplicating and deleting pages and sections; treatments and inline prices; image upload; testimonials and gallery consent rules; design, hours, menus and booking-mode changes reaching the live site; approve / reschedule / complete / reject; phone bookings; messages; and, against Supabase, that anonymous users cannot read customer data or write content.

---

## 8. Known limitations and recommended next steps

1. **Booksy is linked, not synchronised.** Booksy does not offer a public API for third-party websites to read availability or create bookings, so the website cannot see Booksy's calendar. That is why website bookings are **requests** that staff approve after checking Booksy. If you want one calendar only, choose **Booksy only** in Booking & emails.
2. **Spanish version (recommended next).** The spa's own Linktree is in Spanish ("Somos un MEDSPA…") and Hollywood, FL has a large Spanish-speaking population. A bilingual site (English/Spanish with `hreflang`) would likely bring more bookings. Today you can create Spanish pages manually (e.g. `/es`), but a proper language switcher needs development work.
3. **Appointment reminders** (e.g. 24 hours before) are not sent yet. They need a scheduled job (Vercel Cron) calling a reminder endpoint; the email template system is ready for it.
4. **Google reviews are not pulled automatically.** The rating is entered by hand. Automatic display needs the Google Places API (paid per request, with display rules).
5. **Rate limiting** is per server instance. Add Vercel Firewall rules if the forms attract spam.
6. **Password reset** for staff is done with `npm run create-admin` (or in the Supabase dashboard). A self-service "forgot password" email could be added.
7. **Analytics** are not installed. Vercel Web Analytics or Google Analytics 4 can be added; if you add cookies-based tracking, add a consent notice.
8. **Facebook link:** the Linktree lists a Facebook profile but its address could not be read automatically. Add it under Business info → Social links.
9. **Starter photos** are licensed stock photos (see `IMAGE_CREDITS.md`). They are illustrative only and should be replaced with real photos of the spa.
