alter table public.bookings
  alter column booking_date drop not null,
  alter column booking_time drop not null;

create or replace function public.generate_booking_number(input_date date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  number_date date := coalesce(input_date, current_date);
  candidate text;
begin
  loop
    candidate := 'DM-' || to_char(number_date, 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
    exit when not exists (select 1 from public.bookings where booking_number = candidate);
  end loop;

  return candidate;
end;
$$;

create or replace function public.create_public_booking(
  input_service_id uuid,
  input_package_id uuid,
  input_booking_date date,
  input_booking_time time,
  input_customer_name text,
  input_customer_email text,
  input_customer_phone text,
  input_project_description text,
  input_preferred_contact text,
  input_language text default 'az',
  input_source text default 'website'
)
returns table(
  id uuid,
  booking_number text,
  status text,
  booking_date date,
  booking_time time
)
language plpgsql
security definer
set search_path = public
as $$
declare
  settings public.booking_settings%rowtype;
  clean_name text := regexp_replace(trim(coalesce(input_customer_name, '')), '\s+', ' ', 'g');
  clean_phone text := regexp_replace(trim(coalesce(input_customer_phone, '')), '\s+', ' ', 'g');
  clean_email text := nullif(lower(trim(coalesce(input_customer_email, ''))), '');
  clean_description text := nullif(trim(coalesce(input_project_description, '')), '');
  new_booking public.bookings%rowtype;
begin
  select bs.*
  into settings
  from public.booking_settings bs
  where bs.is_booking_enabled = true
  order by bs.created_at asc
  limit 1;

  if not found then
    raise exception 'booking_disabled';
  end if;

  if input_language not in ('az', 'ru', 'en') then
    raise exception 'invalid_language';
  end if;

  if input_preferred_contact not in ('phone', 'whatsapp') then
    raise exception 'invalid_preferred_contact';
  end if;

  if input_service_id is null and input_package_id is null then
    raise exception 'service_or_package_required';
  end if;

  if input_service_id is not null and not exists (
    select 1 from public.services s where s.id = input_service_id and s.is_active = true and s.booking_enabled = true
  ) then
    raise exception 'invalid_service';
  end if;

  if input_package_id is not null and not exists (
    select 1 from public.packages p where p.id = input_package_id and p.is_active = true and p.booking_enabled = true
  ) then
    raise exception 'invalid_package';
  end if;

  if length(clean_name) < 2 or length(clean_name) > 100 then
    raise exception 'invalid_customer_name';
  end if;

  if length(clean_phone) < 7 or length(clean_phone) > 30 then
    raise exception 'invalid_customer_phone';
  end if;

  if clean_email is not null and clean_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_customer_email';
  end if;

  if clean_description is not null and length(clean_description) > 3000 then
    raise exception 'project_description_too_long';
  end if;

  if (input_booking_date is null) <> (input_booking_time is null) then
    raise exception 'booking_slot_incomplete';
  end if;

  if input_booking_date is not null and not exists (
    select 1
    from public.get_available_booking_slots(input_booking_date) available
    where available.slot_time = input_booking_time
  ) then
    raise exception 'slot_unavailable';
  end if;

  insert into public.bookings (
    service_id,
    package_id,
    booking_date,
    booking_time,
    duration_minutes,
    customer_name,
    customer_email,
    customer_phone,
    project_description,
    preferred_contact,
    language,
    source,
    status
  )
  values (
    input_service_id,
    input_package_id,
    input_booking_date,
    input_booking_time,
    coalesce(settings.slot_duration_minutes, 60),
    clean_name,
    clean_email,
    clean_phone,
    clean_description,
    input_preferred_contact,
    input_language,
    coalesce(nullif(trim(input_source), ''), 'website'),
    'new'
  )
  returning * into new_booking;

  id := new_booking.id;
  booking_number := new_booking.booking_number;
  status := new_booking.status;
  booking_date := new_booking.booking_date;
  booking_time := new_booking.booking_time;
  return next;
exception
  when unique_violation then
    raise exception 'slot_unavailable';
end;
$$;

grant execute on function public.create_public_booking(uuid, uuid, date, time, text, text, text, text, text, text, text) to anon, authenticated;
