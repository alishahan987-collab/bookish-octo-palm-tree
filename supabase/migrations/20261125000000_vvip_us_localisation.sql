-- =====================================================================
-- VVIP Beauty & Skin Care: US localisation
--   * Patients can ask to be contacted by phone call or text ('phone').
--   * Booking references use the VIP- prefix (VIP-2026-0001).
-- Content and settings live in JSON documents, so the new homepage
-- sections, team, testimonials and per-day hours need no schema change.
-- =====================================================================

alter table public.bookings drop constraint if exists bookings_contact_method_check;
alter table public.bookings
  add constraint bookings_contact_method_check check (contact_method in ('phone', 'whatsapp', 'email', 'both'));

create or replace function public.next_booking_reference(p_year integer)
returns text
language plpgsql security definer set search_path = public
as $$
declare v integer;
begin
  insert into public.booking_counters (year, n) values (p_year, 1)
  on conflict (year) do update set n = public.booking_counters.n + 1
  returning n into v;
  return 'VIP-' || p_year || '-' || lpad(v::text, 4, '0');
end $$;

revoke all on function public.next_booking_reference(integer) from public, anon, authenticated;
