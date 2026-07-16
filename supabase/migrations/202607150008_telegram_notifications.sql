create table if not exists public.telegram_settings (
  id uuid primary key default gen_random_uuid(),
  notifications_enabled boolean not null default true,
  booking_created_enabled boolean not null default true,
  booking_status_enabled boolean not null default true,
  reminders_enabled boolean not null default true,
  reminder_after_minutes integer not null default 20,
  reminder_repeat_minutes integer not null default 60,
  active_start_time time not null default '09:00',
  active_end_time time not null default '21:00',
  daily_summary_enabled boolean not null default false,
  daily_summary_time time not null default '09:00',
  timezone text not null default 'Asia/Baku',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint telegram_settings_reminder_check check (reminder_after_minutes > 0 and reminder_repeat_minutes > 0),
  constraint telegram_settings_active_hours_check check (active_start_time < active_end_time)
);

create table if not exists public.telegram_notifications (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid null references public.bookings(id) on delete cascade,
  event_type text not null,
  deduplication_key text unique not null,
  telegram_chat_id text,
  telegram_message_id bigint,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint telegram_notifications_event_check check (
    event_type in (
      'booking_created',
      'booking_confirmed',
      'booking_rescheduled',
      'booking_cancelled',
      'booking_rejected',
      'booking_completed',
      'booking_reminder',
      'daily_summary'
    )
  ),
  constraint telegram_notifications_status_check check (status in ('pending', 'sent', 'failed', 'skipped'))
);

create table if not exists public.telegram_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.telegram_notifications(id) on delete cascade,
  attempt_number integer not null,
  response_status integer,
  response_body jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create unique index if not exists telegram_settings_singleton_idx on public.telegram_settings ((true));
create index if not exists telegram_notifications_booking_idx on public.telegram_notifications (booking_id, created_at desc);
create index if not exists telegram_notifications_status_idx on public.telegram_notifications (status, created_at desc);
create index if not exists telegram_notifications_event_idx on public.telegram_notifications (event_type, created_at desc);
create index if not exists telegram_delivery_attempts_notification_idx on public.telegram_delivery_attempts (notification_id, created_at desc);

drop trigger if exists set_telegram_settings_updated_at on public.telegram_settings;
create trigger set_telegram_settings_updated_at before update on public.telegram_settings for each row execute function public.set_updated_at();

drop trigger if exists set_telegram_notifications_updated_at on public.telegram_notifications;
create trigger set_telegram_notifications_updated_at before update on public.telegram_notifications for each row execute function public.set_updated_at();

insert into public.telegram_settings (id)
values ('30000000-0000-4000-8000-000000000001')
on conflict do nothing;

alter table public.telegram_settings enable row level security;
alter table public.telegram_notifications enable row level security;
alter table public.telegram_delivery_attempts enable row level security;

grant select, update on public.telegram_settings to authenticated;
grant select on public.telegram_notifications to authenticated;
grant select on public.telegram_delivery_attempts to authenticated;

drop policy if exists "admin can read telegram settings" on public.telegram_settings;
create policy "admin can read telegram settings"
on public.telegram_settings for select
to authenticated
using (public.is_admin_user());

drop policy if exists "admin can update telegram settings" on public.telegram_settings;
create policy "admin can update telegram settings"
on public.telegram_settings for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "admin can read telegram notifications" on public.telegram_notifications;
create policy "admin can read telegram notifications"
on public.telegram_notifications for select
to authenticated
using (public.is_admin_user());

drop policy if exists "admin can read telegram delivery attempts" on public.telegram_delivery_attempts;
create policy "admin can read telegram delivery attempts"
on public.telegram_delivery_attempts for select
to authenticated
using (public.is_admin_user());

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

  if existing.status <> 'new' then
    return existing;
  end if;

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
    'Confirmed from Telegram',
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
