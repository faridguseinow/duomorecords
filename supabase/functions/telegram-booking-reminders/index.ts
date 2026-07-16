import { createServiceClient, jsonResponse, publicPayload, requireAdmin, requireWebhookSecret, safeErrorMessage } from '../_shared/supabase.ts';
import { buildAdminBookingUrl, escapeTelegramHtml, sendTelegramMessage } from '../_shared/telegram.ts';

function bakuParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Baku',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    minutes: Number(map.hour) * 60 + Number(map.minute)
  };
}

function timeToMinutes(value: string) {
  const [hours, minutes] = String(value || '00:00').split(':').map(Number);
  return hours * 60 + minutes;
}

function inActiveHours(settings: Record<string, any>) {
  const now = bakuParts();
  return now.minutes >= timeToMinutes(settings.active_start_time) && now.minutes <= timeToMinutes(settings.active_end_time);
}

function reminderKey(booking: Record<string, any>, repeatMinutes: number) {
  const windowIndex = Math.floor(Date.now() / (repeatMinutes * 60 * 1000));
  return `booking_reminder:${booking.id}:${windowIndex}`;
}

function reminderMessage(booking: Record<string, any>) {
  const adminUrl = buildAdminBookingUrl(booking.id, booking.language || 'az');
  return [
    '⏰ <b>DUOMO — необработанная заявка</b>',
    '',
    `<b>Номер:</b> ${escapeTelegramHtml(booking.booking_number)}`,
    `<b>Клиент:</b> ${escapeTelegramHtml(booking.customer_name)}`,
    `<b>Телефон:</b> ${escapeTelegramHtml(booking.customer_phone)}`,
    `<b>Дата:</b> ${escapeTelegramHtml(booking.booking_date)}`,
    `<b>Время:</b> ${escapeTelegramHtml(String(booking.booking_time || '').slice(0, 5))}`,
    '',
    adminUrl ? `<a href="${escapeTelegramHtml(adminUrl)}">Открыть в админке</a>` : ''
  ].filter(Boolean).join('\n');
}

function summaryMessage(rows: Record<string, any>[]) {
  const now = bakuParts();
  const todayRows = rows.filter((row) => row.booking_date === now.date);
  const newRows = rows.filter((row) => row.status === 'new');
  const confirmedRows = rows.filter((row) => row.status === 'confirmed');
  const next = [...todayRows].sort((a, b) => String(a.booking_time).localeCompare(String(b.booking_time)))[0];
  return [
    '📅 <b>DUOMO — сводка на сегодня</b>',
    '',
    `<b>Новых заявок:</b> ${newRows.length}`,
    `<b>Подтверждено:</b> ${confirmedRows.length}`,
    `<b>Броней сегодня:</b> ${todayRows.length}`,
    `<b>Ближайшая бронь:</b> ${next ? `${String(next.booking_time).slice(0, 5)} — ${escapeTelegramHtml(next.customer_name)}` : '—'}`,
    `<b>Необработанных:</b> ${newRows.length}`
  ].join('\n');
}

async function reserve(supabase: ReturnType<typeof createServiceClient>, row: Record<string, any>) {
  const { data, error } = await supabase
    .from('telegram_notifications')
    .insert(row)
    .select()
    .single();
  if (error?.code === '23505') return null;
  if (error) throw error;
  return data;
}

async function sendAndLog(supabase: ReturnType<typeof createServiceClient>, notification: Record<string, any>, text: string, replyMarkup?: Record<string, unknown>) {
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
  if (!chatId) throw new Error('Telegram chat id is not configured');
  const attemptNumber = Number(notification.attempt_count || 0) + 1;

  try {
    const result = await sendTelegramMessage({ chatId, text, replyMarkup });
    await supabase.from('telegram_delivery_attempts').insert({
      notification_id: notification.id,
      attempt_number: attemptNumber,
      response_status: result.status,
      response_body: { ok: result.body.ok },
      error_message: null
    });
    await supabase.from('telegram_notifications').update({
      telegram_chat_id: chatId,
      telegram_message_id: result.body.result?.message_id || null,
      status: 'sent',
      attempt_count: attemptNumber,
      error_message: null,
      sent_at: new Date().toISOString()
    }).eq('id', notification.id);
    return 'sent';
  } catch (error) {
    await supabase.from('telegram_delivery_attempts').insert({
      notification_id: notification.id,
      attempt_number: attemptNumber,
      response_status: null,
      response_body: {},
      error_message: safeErrorMessage(error)
    });
    await supabase.from('telegram_notifications').update({
      telegram_chat_id: chatId,
      status: 'failed',
      attempt_count: attemptNumber,
      error_message: safeErrorMessage(error)
    }).eq('id', notification.id);
    return 'failed';
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  const hasSecret = requireWebhookSecret(request, 'x-duomo-webhook-secret', 'TELEGRAM_WEBHOOK_SECRET');
  const hasAdmin = await requireAdmin(request.headers.get('Authorization'));
  if (!hasSecret && !hasAdmin) return jsonResponse({ error: 'unauthorized' }, 401);

  try {
    const supabase = createServiceClient();
    const { data: settings } = await supabase.from('telegram_settings').select('*').limit(1).maybeSingle();
    if (!settings?.notifications_enabled || !settings.reminders_enabled) {
      return jsonResponse({ skipped: true, reason: 'reminders_disabled' });
    }
    if (!inActiveHours(settings)) {
      return jsonResponse({ skipped: true, reason: 'outside_active_hours' });
    }

    const threshold = new Date(Date.now() - settings.reminder_after_minutes * 60 * 1000).toISOString();
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'new')
      .lte('created_at', threshold)
      .order('created_at', { ascending: true })
      .limit(20);
    if (error) throw error;

    let sent = 0;
    let skipped = 0;
    for (const booking of bookings || []) {
      const deduplicationKey = reminderKey(booking, settings.reminder_repeat_minutes);
      const notification = await reserve(supabase, {
        booking_id: booking.id,
        event_type: 'booking_reminder',
        deduplication_key: deduplicationKey,
        status: 'pending',
        payload: publicPayload(booking)
      });
      if (!notification) {
        skipped += 1;
        continue;
      }
      const adminUrl = buildAdminBookingUrl(booking.id, booking.language || 'az');
      const status = await sendAndLog(
        supabase,
        notification,
        reminderMessage(booking),
        adminUrl ? { inline_keyboard: [[{ text: 'Открыть админку', url: adminUrl }]] } : undefined
      );
      if (status === 'sent') sent += 1;
    }

    if (settings.daily_summary_enabled) {
      const now = bakuParts();
      const summaryKey = `daily_summary:${now.date}`;
      const notification = await reserve(supabase, {
        booking_id: null,
        event_type: 'daily_summary',
        deduplication_key: summaryKey,
        status: 'pending',
        payload: { date: now.date }
      });
      if (notification) {
        const { data: todayRows } = await supabase
          .from('bookings')
          .select('*')
          .gte('booking_date', now.date)
          .lte('booking_date', now.date);
        await sendAndLog(supabase, notification, summaryMessage(todayRows || []));
      }
    }

    return jsonResponse({ sent, skipped });
  } catch (error) {
    console.error(JSON.stringify({ error: safeErrorMessage(error) }));
    return jsonResponse({ error: 'telegram_reminder_failed' }, 500);
  }
});
