create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  full_name text,
  phone text,
  email text,
  preferred_contact text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_contact_check check (preferred_contact is null or preferred_contact in ('phone', 'whatsapp', 'telegram', 'email', 'instagram'))
);

alter table public.bookings
add column if not exists customer_id uuid null references public.customers(id) on delete set null;

create table if not exists public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  previous_status text,
  new_status text not null,
  note text,
  changed_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid null references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_users_active_idx on public.admin_users (id, is_active);
create index if not exists customers_phone_idx on public.customers (phone);
create index if not exists customers_email_idx on public.customers (email);
create index if not exists bookings_customer_idx on public.bookings (customer_id);
create index if not exists booking_status_history_booking_idx on public.booking_status_history (booking_id, created_at desc);
create index if not exists admin_activity_log_created_idx on public.admin_activity_log (created_at desc);
create index if not exists admin_activity_log_entity_idx on public.admin_activity_log (entity_type, entity_id);

drop trigger if exists set_admin_users_updated_at on public.admin_users;
create trigger set_admin_users_updated_at before update on public.admin_users for each row execute function public.set_updated_at();

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at before update on public.customers for each row execute function public.set_updated_at();

create or replace function public.is_admin_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.id = auth.uid()
      and au.is_active = true
  );
$$;

create or replace function public.log_admin_activity(
  input_action text,
  input_entity_type text default null,
  input_entity_id uuid default null,
  input_summary text default null,
  input_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id uuid;
begin
  if not public.is_admin_user() then
    raise exception 'admin_access_required';
  end if;

  insert into public.admin_activity_log (
    admin_user_id,
    action,
    entity_type,
    entity_id,
    summary,
    metadata
  )
  values (
    auth.uid(),
    input_action,
    input_entity_type,
    input_entity_id,
    input_summary,
    coalesce(input_metadata, '{}'::jsonb)
  )
  returning id into inserted_id;

  return inserted_id;
end;
$$;

create or replace function public.find_or_create_customer_for_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  found_customer_id uuid;
begin
  if new.customer_id is not null then
    return new;
  end if;

  select c.id
  into found_customer_id
  from public.customers c
  where (new.customer_phone is not null and c.phone = new.customer_phone)
     or (new.customer_email is not null and c.email = new.customer_email)
  order by c.created_at asc
  limit 1;

  if found_customer_id is null then
    insert into public.customers (
      full_name,
      phone,
      email,
      preferred_contact
    )
    values (
      new.customer_name,
      new.customer_phone,
      new.customer_email,
      new.preferred_contact
    )
    returning id into found_customer_id;
  else
    update public.customers
    set full_name = coalesce(nullif(new.customer_name, ''), full_name),
        phone = coalesce(nullif(new.customer_phone, ''), phone),
        email = coalesce(nullif(new.customer_email, ''), email),
        preferred_contact = coalesce(nullif(new.preferred_contact, ''), preferred_contact)
    where id = found_customer_id;
  end if;

  new.customer_id := found_customer_id;
  return new;
end;
$$;

drop trigger if exists set_booking_customer on public.bookings;
create trigger set_booking_customer
before insert on public.bookings
for each row execute function public.find_or_create_customer_for_booking();

insert into public.customers (
  full_name,
  phone,
  email,
  preferred_contact,
  created_at,
  updated_at
)
select distinct on (coalesce(nullif(b.customer_phone, ''), nullif(b.customer_email, '')))
  b.customer_name,
  b.customer_phone,
  b.customer_email,
  b.preferred_contact,
  min(b.created_at) over (partition by coalesce(nullif(b.customer_phone, ''), nullif(b.customer_email, ''))),
  now()
from public.bookings b
where b.customer_id is null
  and coalesce(nullif(b.customer_phone, ''), nullif(b.customer_email, '')) is not null
order by coalesce(nullif(b.customer_phone, ''), nullif(b.customer_email, '')), b.created_at asc
on conflict do nothing;

update public.bookings b
set customer_id = c.id
from public.customers c
where b.customer_id is null
  and (
    (b.customer_phone is not null and b.customer_phone = c.phone)
    or (b.customer_email is not null and b.customer_email = c.email)
  );

create or replace function public.update_booking_status(
  booking_id uuid,
  new_status text,
  note text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.bookings%rowtype;
  updated public.bookings%rowtype;
  allowed boolean := false;
begin
  if not public.is_admin_user() then
    raise exception 'admin_access_required';
  end if;

  if new_status not in ('new', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected') then
    raise exception 'invalid_status';
  end if;

  select *
  into existing
  from public.bookings b
  where b.id = booking_id
  for update;

  if not found then
    raise exception 'booking_not_found';
  end if;

  allowed :=
    (existing.status = 'new' and new_status in ('confirmed', 'rejected', 'cancelled')) or
    (existing.status = 'confirmed' and new_status in ('in_progress', 'cancelled')) or
    (existing.status = 'in_progress' and new_status in ('completed', 'cancelled')) or
    (existing.status = new_status);

  if not allowed then
    raise exception 'invalid_status_transition';
  end if;

  update public.bookings
  set status = new_status,
      admin_notes = case
        when note is null or length(trim(note)) = 0 then admin_notes
        when admin_notes is null or length(trim(admin_notes)) = 0 then trim(note)
        else admin_notes || E'\n' || trim(note)
      end
  where id = booking_id
  returning * into updated;

  insert into public.booking_status_history (
    booking_id,
    previous_status,
    new_status,
    note,
    changed_by
  )
  values (
    booking_id,
    existing.status,
    new_status,
    nullif(trim(coalesce(note, '')), ''),
    auth.uid()
  );

  perform public.log_admin_activity(
    'booking_status_updated',
    'booking',
    booking_id,
    'Booking ' || updated.booking_number || ' status changed to ' || new_status,
    jsonb_build_object('previous_status', existing.status, 'new_status', new_status)
  );

  return updated;
end;
$$;

create or replace function public.reschedule_booking(
  booking_id uuid,
  new_date date,
  new_time time,
  note text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.bookings%rowtype;
  updated public.bookings%rowtype;
begin
  if not public.is_admin_user() then
    raise exception 'admin_access_required';
  end if;

  select *
  into existing
  from public.bookings b
  where b.id = booking_id
  for update;

  if not found then
    raise exception 'booking_not_found';
  end if;

  if existing.status in ('completed', 'cancelled', 'rejected') then
    raise exception 'booking_is_final';
  end if;

  if not exists (
    select 1
    from public.get_available_booking_slots(new_date) slots
    where slots.slot_time = new_time
  ) and not (existing.booking_date = new_date and existing.booking_time = new_time) then
    raise exception 'slot_unavailable';
  end if;

  update public.bookings
  set booking_date = new_date,
      booking_time = new_time,
      admin_notes = case
        when note is null or length(trim(note)) = 0 then admin_notes
        when admin_notes is null or length(trim(admin_notes)) = 0 then trim(note)
        else admin_notes || E'\n' || trim(note)
      end
  where id = booking_id
  returning * into updated;

  insert into public.booking_status_history (
    booking_id,
    previous_status,
    new_status,
    note,
    changed_by
  )
  values (
    booking_id,
    existing.status,
    updated.status,
    'Rescheduled from ' || existing.booking_date || ' ' || existing.booking_time || ' to ' || new_date || ' ' || new_time || coalesce(E'\n' || nullif(trim(note), ''), ''),
    auth.uid()
  );

  perform public.log_admin_activity(
    'booking_rescheduled',
    'booking',
    booking_id,
    'Booking ' || updated.booking_number || ' rescheduled',
    jsonb_build_object('previous_date', existing.booking_date, 'previous_time', existing.booking_time, 'new_date', new_date, 'new_time', new_time)
  );

  return updated;
exception
  when unique_violation then
    raise exception 'slot_unavailable';
end;
$$;

grant execute on function public.is_admin_user() to authenticated;
grant execute on function public.update_booking_status(uuid, text, text) to authenticated;
grant execute on function public.reschedule_booking(uuid, date, time, text) to authenticated;
grant execute on function public.log_admin_activity(text, text, uuid, text, jsonb) to authenticated;
