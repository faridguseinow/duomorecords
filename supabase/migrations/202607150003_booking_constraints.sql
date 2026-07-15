create unique index bookings_active_slot_unique_idx
on public.bookings (booking_date, booking_time)
where status in ('new', 'confirmed', 'in_progress');

-- TODO(booking-range): if service/package durations start occupying multiple slots,
-- replace the fixed-slot unique index with tstzrange + exclusion constraint logic.

create or replace function public.generate_booking_number(input_date date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    candidate := 'DM-' || to_char(input_date, 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
    exit when not exists (select 1 from public.bookings where booking_number = candidate);
  end loop;

  return candidate;
end;
$$;

create or replace function public.set_booking_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.booking_number is null or length(trim(new.booking_number)) = 0 then
    new.booking_number := public.generate_booking_number(new.booking_date);
  end if;

  return new;
end;
$$;

create trigger set_bookings_booking_number
before insert on public.bookings
for each row execute function public.set_booking_number();

create or replace function public.get_available_booking_slots(target_date date)
returns table(slot_time time)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  settings public.booking_settings%rowtype;
  slot_value time;
  local_today date;
  minimum_local_ts timestamp;
  candidate_local_ts timestamp;
begin
  select *
  into settings
  from public.booking_settings
  where is_booking_enabled = true
  order by created_at asc
  limit 1;

  if not found or target_date is null then
    return;
  end if;

  -- PostgreSQL extract(isodow) numbering: Monday = 1, Sunday = 7.
  local_today := (now() at time zone settings.timezone)::date;
  minimum_local_ts := (now() at time zone settings.timezone) + make_interval(mins => settings.minimum_advance_minutes);

  if target_date < local_today
    or target_date > local_today + settings.maximum_advance_days
    or not (extract(isodow from target_date)::integer = any(settings.working_days))
    or target_date = any(settings.disabled_dates)
  then
    return;
  end if;

  for slot_value in
    select generated_slot::time
    from generate_series(
      target_date + settings.opening_time,
      target_date + settings.closing_time - make_interval(mins => settings.slot_duration_minutes),
      make_interval(mins => settings.slot_duration_minutes)
    ) as generated_slot
  loop
    candidate_local_ts := target_date + slot_value;

    if candidate_local_ts < minimum_local_ts then
      continue;
    end if;

    if exists (
      select 1
      from public.bookings
      where booking_date = target_date
        and booking_time = slot_value
        and status in ('new', 'confirmed', 'in_progress')
    ) then
      continue;
    end if;

    slot_time := slot_value;
    return next;
  end loop;
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
  select *
  into settings
  from public.booking_settings
  where is_booking_enabled = true
  order by created_at asc
  limit 1;

  if not found then
    raise exception 'booking_disabled';
  end if;

  if input_language not in ('az', 'ru', 'en') then
    raise exception 'invalid_language';
  end if;

  if input_preferred_contact not in ('phone', 'whatsapp', 'telegram', 'email', 'instagram') then
    raise exception 'invalid_preferred_contact';
  end if;

  if input_service_id is null and input_package_id is null then
    raise exception 'service_or_package_required';
  end if;

  if input_service_id is not null and not exists (
    select 1 from public.services where id = input_service_id and is_active = true and booking_enabled = true
  ) then
    raise exception 'invalid_service';
  end if;

  if input_package_id is not null and not exists (
    select 1 from public.packages where id = input_package_id and is_active = true and booking_enabled = true
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

  if not exists (
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
    settings.slot_duration_minutes,
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

revoke all on function public.generate_booking_number(date) from public;
revoke all on function public.set_booking_number() from public;
grant execute on function public.get_available_booking_slots(date) to anon, authenticated;
grant execute on function public.create_public_booking(uuid, uuid, date, time, text, text, text, text, text, text, text) to anon, authenticated;
