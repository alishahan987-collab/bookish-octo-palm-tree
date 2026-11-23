-- =====================================================================
-- Dermatology clinic website: initial schema
--   * Content (procedures, conditions, posts, gallery, site config) is
--     stored as JSON documents so the clinic can add fields and sections
--     without database migrations.
--   * Bookings are relational, with constraints that make double booking
--     impossible even under concurrent requests.
--   * Row Level Security is enabled on every table.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- staff
create table public.staff (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'admin' check (role in ('owner', 'admin', 'reception')),
  created_at timestamptz not null default now()
);

-- True when the current JWT belongs to a staff member.
create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.staff where user_id = auth.uid()) $$;

-- ---------------------------------------------------------- site config
create table public.site_config (
  key        text primary key check (key in ('content', 'settings')),
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------ documents
create table public.procedures (
  id         text primary key,
  slug       text not null unique,
  data       jsonb not null,
  active     boolean not null default true,
  sort       integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.conditions (
  id         text primary key,
  slug       text not null unique,
  data       jsonb not null,
  active     boolean not null default true,
  sort       integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.posts (
  id           text primary key,
  slug         text not null unique,
  data         jsonb not null,
  status       text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  updated_at   timestamptz not null default now()
);

create table public.gallery (
  id                text primary key,
  data              jsonb not null,
  published         boolean not null default false,
  consent_confirmed boolean not null default false,
  illustrative      boolean not null default false,
  sort              integer not null default 0,
  created_at        timestamptz not null default now(),
  -- A real patient photo can never be published without recorded consent.
  constraint gallery_consent_required check (not published or consent_confirmed or illustrative)
);

create table public.journeys (
  id         text primary key,
  data       jsonb not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------- bookings
create table public.bookings (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null unique,
  treatment_id   text not null,
  treatment_name text not null,
  doctor_id      text not null,
  date           date not null,
  time           text not null check (time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  patient_name   text not null check (char_length(patient_name) between 2 and 80),
  phone          text not null check (char_length(phone) <= 20),
  email          text check (email is null or char_length(email) <= 120),
  contact_method text not null check (contact_method in ('whatsapp', 'email', 'both')),
  consent        jsonb not null,
  notes          text check (notes is null or char_length(notes) <= 500),
  status         text not null default 'pending'
                 check (status in ('pending', 'confirmed', 'rejected', 'arrived', 'completed', 'cancelled')),
  history        jsonb not null default '[]'::jsonb,
  notifications  jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now()
);

-- The double-booking guard: one active booking per doctor per slot.
create unique index bookings_one_per_slot
  on public.bookings (doctor_id, date, time)
  where status not in ('cancelled', 'rejected');

create index bookings_date_idx on public.bookings (date);

-- Per-year sequence for human-friendly references (AES-2026-0001).
create table public.booking_counters (
  year integer primary key,
  n    integer not null
);

create or replace function public.next_booking_reference(p_year integer)
returns text
language plpgsql security definer set search_path = public
as $$
declare v integer;
begin
  insert into public.booking_counters (year, n) values (p_year, 1)
  on conflict (year) do update set n = public.booking_counters.n + 1
  returning n into v;
  return 'AES-' || p_year || '-' || lpad(v::text, 4, '0');
end $$;

revoke all on function public.next_booking_reference(integer) from public, anon, authenticated;

-- ----------------------------------------------------------------- RLS
alter table public.staff            enable row level security;
alter table public.site_config      enable row level security;
alter table public.procedures       enable row level security;
alter table public.conditions       enable row level security;
alter table public.posts            enable row level security;
alter table public.gallery          enable row level security;
alter table public.journeys         enable row level security;
alter table public.bookings         enable row level security;
alter table public.booking_counters enable row level security;

-- staff: members can see their own row (used to check access after login)
create policy staff_self_read on public.staff for select to authenticated using (user_id = auth.uid());

-- public content
create policy site_config_read  on public.site_config for select using (true);
create policy site_config_write on public.site_config for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy procedures_read  on public.procedures for select using (active or public.is_staff());
create policy procedures_write on public.procedures for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy conditions_read  on public.conditions for select using (active or public.is_staff());
create policy conditions_write on public.conditions for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy posts_read  on public.posts for select using (status = 'published' or public.is_staff());
create policy posts_write on public.posts for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy gallery_read  on public.gallery for select using ((published and (consent_confirmed or illustrative)) or public.is_staff());
create policy gallery_write on public.gallery for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- private data: staff only. Patients never read bookings directly; the
-- booking API runs server-side with the service role.
create policy journeys_staff on public.journeys for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy bookings_staff_read on public.bookings for select to authenticated using (public.is_staff());
-- (no insert/update/delete policies: writes go through the server API, which re-validates and sends notifications)
-- booking_counters: no policies at all (service role only)

-- -------------------------------------------------------------- storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy media_staff_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_staff());
create policy media_staff_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_staff());
create policy media_staff_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_staff());
