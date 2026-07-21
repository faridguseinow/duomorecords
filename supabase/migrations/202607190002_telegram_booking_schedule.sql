create or replace function public.enqueue_telegram_booking_webhook()
returns trigger
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  webhook_secret text;
  endpoint_url text;
  request_id bigint;
begin
  if current_setting('duomo.suppress_telegram_booking_webhook', true) = 'true' then
    return new;
  end if;

  if tg_op = 'UPDATE'
    and not (
      new.status is distinct from old.status
      or new.booking_date is distinct from old.booking_date
      or new.booking_time is distinct from old.booking_time
    )
  then
    return new;
  end if;

  select decrypted_secret
  into webhook_secret
  from vault.decrypted_secrets
  where name = 'telegram_webhook_secret'
  limit 1;

  select decrypted_secret
  into endpoint_url
  from vault.decrypted_secrets
  where name = 'telegram_booking_notification_url'
  limit 1;

  if webhook_secret is null or endpoint_url is null then
    return new;
  end if;

  select net.http_post(
    url := endpoint_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-duomo-webhook-secret', webhook_secret
    ),
    body := jsonb_build_object(
      'type', tg_op,
      'table', tg_table_name,
      'schema', tg_table_schema,
      'record', to_jsonb(new),
      'old_record', case when tg_op = 'UPDATE' then to_jsonb(old) else null end
    ),
    timeout_milliseconds := 2000
  )
  into request_id;

  return new;
end;
$$;

create or replace function public.schedule_booking_from_telegram(
  input_booking_id uuid,
  input_booking_date date,
  input_booking_time time,
  input_telegram_user_id text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.bookings%rowtype;
  updated public.bookings%rowtype;
  next_status text;
begin
  if input_booking_date is null or input_booking_time is null then
    raise exception 'booking_slot_incomplete';
  end if;

  select *
  into existing
  from public.bookings b
  where b.id = input_booking_id
  for update;

  if not found then
    raise exception 'booking_not_found';
  end if;

  if existing.status in ('completed', 'cancelled', 'rejected') then
    raise exception 'booking_is_final';
  end if;

  if not exists (
    select 1
    from public.get_available_booking_slots(input_booking_date) available
    where available.slot_time = input_booking_time
  ) and not (existing.booking_date = input_booking_date and existing.booking_time = input_booking_time) then
    raise exception 'slot_unavailable';
  end if;

  next_status := case when existing.status = 'new' then 'confirmed' else existing.status end;

  perform set_config('duomo.suppress_telegram_booking_webhook', 'true', true);

  update public.bookings
  set booking_date = input_booking_date,
      booking_time = input_booking_time,
      status = next_status
  where id = input_booking_id
  returning * into updated;

  insert into public.booking_status_history (
    booking_id,
    previous_status,
    new_status,
    note,
    changed_by
  )
  values (
    input_booking_id,
    existing.status,
    updated.status,
    'Scheduled from Telegram by user ' ||
      coalesce(nullif(trim(input_telegram_user_id), ''), 'unknown') ||
      ' from ' ||
      coalesce(existing.booking_date::text, 'not assigned') || ' ' ||
      coalesce(existing.booking_time::text, '') ||
      ' to ' || input_booking_date || ' ' || input_booking_time,
    null
  );

  insert into public.admin_activity_log (
    admin_user_id,
    action,
    entity_type,
    entity_id,
    summary,
    metadata
  )
  values (
    null,
    case when existing.booking_date is null then 'telegram_booking_scheduled' else 'telegram_booking_rescheduled' end,
    'booking',
    input_booking_id,
    'Booking ' || updated.booking_number || ' scheduled from Telegram',
    jsonb_build_object(
      'source', 'telegram',
      'telegram_user_id', input_telegram_user_id,
      'previous_date', existing.booking_date,
      'previous_time', existing.booking_time,
      'new_date', input_booking_date,
      'new_time', input_booking_time,
      'status', updated.status
    )
  );

  return updated;
exception
  when unique_violation then
    raise exception 'slot_unavailable';
end;
$$;

revoke all on function public.schedule_booking_from_telegram(uuid, date, time, text) from public;
grant execute on function public.schedule_booking_from_telegram(uuid, date, time, text) to service_role;

create or replace function public.confirm_booking_from_telegram(
  input_booking_id uuid,
  input_telegram_user_id text default null
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
  select *
  into existing
  from public.bookings b
  where b.id = input_booking_id
  for update;

  if not found then
    raise exception 'booking_not_found';
  end if;

  if existing.booking_date is null or existing.booking_time is null then
    raise exception 'booking_slot_incomplete';
  end if;

  if existing.status <> 'new' then
    return existing;
  end if;

  perform set_config('duomo.suppress_telegram_booking_webhook', 'true', true);

  update public.bookings
  set status = 'confirmed'
  where id = input_booking_id
  returning * into updated;

  insert into public.booking_status_history (
    booking_id,
    previous_status,
    new_status,
    note,
    changed_by
  )
  values (
    input_booking_id,
    existing.status,
    'confirmed',
    'Confirmed from Telegram by user ' || coalesce(nullif(trim(input_telegram_user_id), ''), 'unknown'),
    null
  );

  insert into public.admin_activity_log (
    admin_user_id,
    action,
    entity_type,
    entity_id,
    summary,
    metadata
  )
  values (
    null,
    'telegram_confirmed',
    'bookings',
    input_booking_id,
    'Booking confirmed from Telegram',
    jsonb_build_object('source', 'telegram', 'telegram_user_id', input_telegram_user_id)
  );

  return updated;
end;
$$;

revoke all on function public.confirm_booking_from_telegram(uuid, text) from public;
grant execute on function public.confirm_booking_from_telegram(uuid, text) to service_role;
