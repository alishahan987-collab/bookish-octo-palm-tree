-- =====================================================================
-- MEDSPA Skincare & Body: database schema
--   * Website content (pages, treatments, testimonials, gallery) is stored
--     as JSON documents, so new pages, sections and fields need no migration.
--   * Appointments and contact messages are strict relational rows.
--   * Row Level Security is on for every table. The website server uses the
--     service role after checking the admin session; the public (anon) key
--     can only read published content.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- staff
create table public.staff (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'admin' check (role in ('owner', 'admin', 'staff')),
  created_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.staff where user_id = auth.uid()) $$;

-- ---------------------------------------------------- site documents
-- settings, design, navigation
create table public.site_documents (
  key        text primary key check (key in ('settings', 'design', 'navigation')),
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------- content items
create table public.content_items (
  collection text not null check (collection in ('pages', 'treatments', 'testimonials', 'gallery')),
  id         text not null,
  slug       text,
  data       jsonb not null,
  sort       integer not null default 0,
  published  boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (collection, id),
  -- A before/after photo can never be published without recorded client consent.
  constraint gallery_consent_required check (
    collection <> 'gallery' or not published or coalesce((data ->> 'consentConfirmed')::boolean, false)
  ),
  constraint slug_format check (slug is null or slug ~ '^([a-z0-9]+(-[a-z0-9]+)*)?$')
);

create unique index content_items_slug_unique on public.content_items (collection, slug) where slug is not null;
create index content_items_sort on public.content_items (collection, sort);

-- --------------------------------------------------------- appointments
create table public.appointments (
  id               uuid primary key default gen_random_uuid(),
  reference        text not null unique,
  treatment_id     text not null,
  treatment_name   text not null,
  date             date not null,
  time             text not null check (time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  duration_minutes integer not null check (duration_minutes between 5 and 600),
  name             text not null check (char_length(name) between 2 and 100),
  email            text not null check (char_length(email) <= 200),
  phone            text not null check (char_length(phone) <= 30),
  message          text not null default '' check (char_length(message) <= 1000),
  status           text not null default 'pending'
                   check (status in ('pending', 'approved', 'rejected', 'cancelled', 'completed', 'no_show')),
  source           text not null default 'website' check (source in ('website', 'admin')),
  internal_notes   text not null default '',
  history          jsonb not null default '[]'::jsonb,
  notifications    jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index appointments_date_idx on public.appointments (date, status);

-- Minutes since midnight for "HH:MM".
create or replace function public.hhmm_to_min(t text)
returns integer language sql immutable
as $$ select split_part(t, ':', 1)::int * 60 + split_part(t, ':', 2)::int $$;

-- Number of active appointments overlapping [start, start + duration) on a date.
create or replace function public.overlap_count(p_date date, p_time text, p_duration int, p_ignore uuid)
returns integer language sql stable set search_path = public
as $$
  select count(*)::int from public.appointments a
  where a.date = p_date
    and a.status in ('pending', 'approved')
    and (p_ignore is null or a.id <> p_ignore)
    and public.hhmm_to_min(a.time) < public.hhmm_to_min(p_time) + p_duration
    and public.hhmm_to_min(a.time) + a.duration_minutes > public.hhmm_to_min(p_time)
$$;

-- Double-booking guard: capacity is re-checked under a per-day lock, so two
-- simultaneous requests for the last place cannot both succeed.
create or replace function public.book_appointment(p jsonb, p_capacity int)
returns public.appointments
language plpgsql security definer set search_path = public
as $$
declare
  v_row public.appointments;
begin
  perform pg_advisory_xact_lock(hashtext('medspa-appointments-' || (p ->> 'date')));
  if public.overlap_count((p ->> 'date')::date, p ->> 'time', (p ->> 'duration_minutes')::int, null) >= greatest(p_capacity, 1) then
    raise exception 'SLOT_TAKEN' using errcode = 'P0001';
  end if;
  insert into public.appointments (
    reference, treatment_id, treatment_name, date, time, duration_minutes, name, email, phone, message,
    status, source, internal_notes, history, notifications
  ) values (
    p ->> 'reference', p ->> 'treatment_id', p ->> 'treatment_name', (p ->> 'date')::date, p ->> 'time',
    (p ->> 'duration_minutes')::int, p ->> 'name', p ->> 'email', p ->> 'phone', coalesce(p ->> 'message', ''),
    coalesce(p ->> 'status', 'pending'), coalesce(p ->> 'source', 'website'), coalesce(p ->> 'internal_notes', ''),
    coalesce(p -> 'history', '[]'::jsonb), coalesce(p -> 'notifications', '[]'::jsonb)
  ) returning * into v_row;
  return v_row;
end $$;

create or replace function public.move_appointment(p_id uuid, p_date date, p_time text, p_duration int, p_capacity int, p_history jsonb)
returns public.appointments
language plpgsql security definer set search_path = public
as $$
declare
  v_row public.appointments;
begin
  perform pg_advisory_xact_lock(hashtext('medspa-appointments-' || p_date::text));
  if public.overlap_count(p_date, p_time, p_duration, p_id) >= greatest(p_capacity, 1) then
    raise exception 'SLOT_TAKEN' using errcode = 'P0001';
  end if;
  update public.appointments
     set date = p_date, time = p_time, duration_minutes = p_duration, history = p_history, updated_at = now()
   where id = p_id
  returning * into v_row;
  if v_row.id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  return v_row;
end $$;

create or replace function public.reorder_content(p_collection text, p_ids text[])
returns void
language sql security definer set search_path = public
as $$
  update public.content_items c
     set sort = o.ord, data = jsonb_set(c.data, '{order}', to_jsonb(o.ord)), updated_at = now()
    from unnest(p_ids) with ordinality as o(id, ord)
   where c.collection = p_collection and c.id = o.id
$$;

revoke all on function public.book_appointment(jsonb, int) from public, anon, authenticated;
revoke all on function public.move_appointment(uuid, date, text, int, int, jsonb) from public, anon, authenticated;
revoke all on function public.reorder_content(text, text[]) from public, anon, authenticated;
revoke all on function public.overlap_count(date, text, int, uuid) from public, anon, authenticated;

-- ------------------------------------------------------ contact messages
create table public.contact_messages (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 100),
  email         text not null check (char_length(email) <= 200),
  phone         text not null default '' check (char_length(phone) <= 30),
  subject       text not null default '' check (char_length(subject) <= 150),
  message       text not null check (char_length(message) between 2 and 3000),
  status        text not null default 'new' check (status in ('new', 'read', 'archived')),
  notifications jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------------ RLS
alter table public.staff            enable row level security;
alter table public.site_documents   enable row level security;
alter table public.content_items    enable row level security;
alter table public.appointments     enable row level security;
alter table public.contact_messages enable row level security;

create policy staff_self_read on public.staff for select to authenticated using (user_id = auth.uid());

create policy site_documents_read  on public.site_documents for select using (true);
create policy site_documents_write on public.site_documents for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy content_read  on public.content_items for select using (published or public.is_staff());
create policy content_write on public.content_items for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Customer data: staff only. Visitors never read or write these tables
-- directly; requests go through the website server, which validates them.
create policy appointments_staff on public.appointments for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy messages_staff     on public.contact_messages for all to authenticated using (public.is_staff()) with check (public.is_staff());

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
