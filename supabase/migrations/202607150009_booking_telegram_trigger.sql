create extension if not exists pg_net;

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

drop trigger if exists telegram_booking_webhook on public.bookings;
create trigger telegram_booking_webhook
after insert or update on public.bookings
for each row execute function public.enqueue_telegram_booking_webhook();
