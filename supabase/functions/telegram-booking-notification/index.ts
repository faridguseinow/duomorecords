import { createServiceClient, jsonResponse, publicPayload, requireAdmin, requireWebhookSecret, safeErrorMessage } from '../_shared/supabase.ts';
import { buildAdminBookingUrl, escapeTelegramHtml, normalizeWhatsappUrl, sendTelegramMessage, truncateText, type TelegramReplyMarkup } from '../_shared/telegram.ts';

type Booking = Record<string, any>;

const eventLabels: Record<string, string> = {
  booking_created: 'Новая заявка',
  booking_confirmed: 'Бронь подтверждена',
  booking_rescheduled: 'Бронь перенесена',
  booking_cancelled: 'Бронь отменена',
  booking_rejected: 'Заявка отклонена',
  booking_completed: 'Бронь завершена',
  booking_reminder: 'Напоминание'
};

function localized(value: Record<string, string> | null | undefined, language = 'az') {
  if (!value || typeof value !== 'object') return '';
  return value[language] || value.az || value.ru || value.en || '';
}

function statusEvent(status: string) {
  const map: Record<string, string> = {
    confirmed: 'booking_confirmed',
    cancelled: 'booking_cancelled',
    rejected: 'booking_rejected',
    completed: 'booking_completed'
  };
  return map[status] || '';
}

function detectEvent(record: Booking, oldRecord: Booking | null, webhookType: string) {
  if (webhookType === 'INSERT') {
    return {
      eventType: 'booking_created',
      deduplicationKey: `booking_created:${record.id}`
    };
  }

  if (!oldRecord) return null;

  const dateChanged = record.booking_date !== oldRecord.booking_date;
  const timeChanged = record.booking_time !== oldRecord.booking_time;
  const statusChanged = record.status !== oldRecord.status;

  if ((dateChanged || timeChanged) && statusChanged && record.status === 'confirmed' && !oldRecord.booking_date && !oldRecord.booking_time) {
    return {
      eventType: 'booking_confirmed',
      deduplicationKey: `booking_scheduled:${record.id}:${record.booking_date}:${record.booking_time}`
    };
  }

  if (dateChanged || timeChanged) {
    return {
      eventType: 'booking_rescheduled',
      deduplicationKey: `booking_rescheduled:${record.id}:${record.booking_date}:${record.booking_time}`
    };
  }

  if (statusChanged) {
    const eventType = statusEvent(record.status);
    if (!eventType) return null;
    return {
      eventType,
      deduplicationKey: `booking_status:${record.id}:${record.status}:${record.updated_at || Date.now()}`
    };
  }

  return null;
}

function buildMessage(booking: Booking, eventType: string) {
  const service = localized(booking.services?.title, booking.language);
  const pkg = localized(booking.packages?.title, booking.language);
  const title = eventType === 'booking_created' ? '🎙 <b>Новая заявка DUOMO</b>' : `🎙 <b>DUOMO — ${escapeTelegramHtml(eventLabels[eventType] || eventType)}</b>`;
  const comment = truncateText(booking.project_description, 500);
  const bookingDate = booking.booking_date ? String(booking.booking_date).slice(0, 10) : 'Не назначено';
  const bookingTime = booking.booking_time ? String(booking.booking_time).slice(0, 5) : 'Не назначено';
  const rows = [
    title,
    '',
    `<b>Номер:</b> ${escapeTelegramHtml(booking.booking_number)}`,
    `<b>Клиент:</b> ${escapeTelegramHtml(booking.customer_name)}`,
    `<b>Телефон:</b> ${escapeTelegramHtml(booking.customer_phone)}`,
    booking.customer_email ? `<b>Email:</b> ${escapeTelegramHtml(booking.customer_email)}` : '',
    service ? `<b>Услуга:</b> ${escapeTelegramHtml(service)}` : '',
    pkg ? `<b>Пакет:</b> ${escapeTelegramHtml(pkg)}` : '',
    `<b>Дата:</b> ${escapeTelegramHtml(bookingDate)}`,
    `<b>Время:</b> ${escapeTelegramHtml(bookingTime)}`,
    `<b>Связь:</b> ${escapeTelegramHtml(booking.preferred_contact)}`,
    `<b>Язык:</b> ${escapeTelegramHtml(String(booking.language || '').toUpperCase())}`,
    comment ? `<b>Комментарий:</b>\n${escapeTelegramHtml(comment)}` : '',
    '',
    `<b>Статус:</b> ${escapeTelegramHtml(booking.status)}`
  ];

  return rows.filter(Boolean).join('\n');
}

function buildReplyMarkup(booking: Booking): TelegramReplyMarkup {
  const buttons = [];
  const adminUrl = buildAdminBookingUrl(booking.id, booking.language || 'az');
  const whatsappUrl = normalizeWhatsappUrl(booking.customer_phone);
  if (adminUrl) buttons.push([{ text: 'Открыть заявку', url: adminUrl }]);
  const secondRow = [];
  if (whatsappUrl) secondRow.push({ text: 'WhatsApp', url: whatsappUrl });
  if (['new', 'confirmed'].includes(booking.status)) secondRow.push({ text: 'Выбрать дату', callback_data: `dates|${booking.id}` });
  if (booking.status === 'new' && booking.booking_date && booking.booking_time) secondRow.push({ text: 'Подтвердить', callback_data: `confirm:${booking.id}` });
  if (secondRow.length) buttons.push(secondRow);
  return { inline_keyboard: buttons };
}

async function loadBooking(supabase: ReturnType<typeof createServiceClient>, bookingId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, services(title,slug), packages(title,slug), customers(full_name,phone,email)')
    .eq('id', bookingId)
    .single();
  if (error) throw error;
  return data;
}

async function reserveNotification(supabase: ReturnType<typeof createServiceClient>, booking: Booking, eventType: string, deduplicationKey: string) {
  const { data, error } = await supabase
    .from('telegram_notifications')
    .insert({
      booking_id: booking.id,
      event_type: eventType,
      deduplication_key: deduplicationKey,
      status: 'pending',
      payload: publicPayload(booking)
    })
    .select()
    .single();

  if (error?.code === '23505') return { notification: null, skipped: true };
  if (error) throw error;
  return { notification: data, skipped: false };
}

async function markAttempt(supabase: ReturnType<typeof createServiceClient>, notificationId: string, attemptNumber: number, responseStatus: number | null, responseBody: Record<string, unknown> | null, errorMessage: string | null) {
  await supabase.from('telegram_delivery_attempts').insert({
    notification_id: notificationId,
    attempt_number: attemptNumber,
    response_status: responseStatus,
    response_body: responseBody || {},
    error_message: errorMessage
  });
}

async function deliverNotification(supabase: ReturnType<typeof createServiceClient>, notification: Record<string, any>, booking: Booking) {
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
  if (!chatId) throw new Error('Telegram chat id is not configured');

  const attemptNumber = Number(notification.attempt_count || 0) + 1;
  try {
    const result = await sendTelegramMessage({
      chatId,
      text: buildMessage(booking, notification.event_type),
      replyMarkup: buildReplyMarkup(booking)
    });
    await markAttempt(supabase, notification.id, attemptNumber, result.status, { ok: result.body.ok }, null);
    await supabase
      .from('telegram_notifications')
      .update({
        telegram_chat_id: chatId,
        telegram_message_id: result.body.result?.message_id || null,
        status: 'sent',
        attempt_count: attemptNumber,
        error_message: null,
        sent_at: new Date().toISOString()
      })
      .eq('id', notification.id);
    return { status: 'sent', messageId: result.body.result?.message_id || null };
  } catch (error) {
    const message = safeErrorMessage(error);
    await markAttempt(supabase, notification.id, attemptNumber, null, null, message);
    await supabase
      .from('telegram_notifications')
      .update({
        telegram_chat_id: chatId,
        status: 'failed',
        attempt_count: attemptNumber,
        error_message: message
      })
      .eq('id', notification.id);
    return { status: 'failed', error: message };
  }
}

async function handleRetry(request: Request, body: Record<string, any>) {
  if (!await requireAdmin(request.headers.get('Authorization'))) {
    return jsonResponse({ error: 'admin_access_required' }, 403);
  }

  const notificationId = body.notification_id;
  if (!notificationId) return jsonResponse({ error: 'notification_id_required' }, 400);

  const supabase = createServiceClient();
  const { data: notification, error } = await supabase
    .from('telegram_notifications')
    .select('*')
    .eq('id', notificationId)
    .single();
  if (error) return jsonResponse({ error: 'notification_not_found' }, 404);
  if (!notification.booking_id) return jsonResponse({ error: 'booking_notification_required' }, 400);
  if (notification.attempt_count >= 3) return jsonResponse({ error: 'max_attempts_reached' }, 400);

  const booking = await loadBooking(supabase, notification.booking_id);
  return jsonResponse(await deliverNotification(supabase, notification, booking));
}

async function handleTest(request: Request) {
  if (!await requireAdmin(request.headers.get('Authorization'))) {
    return jsonResponse({ error: 'admin_access_required' }, 403);
  }

  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
  if (!chatId) return jsonResponse({ error: 'configuration_missing' }, 400);

  const supabase = createServiceClient();
  const { data: notification, error } = await supabase
    .from('telegram_notifications')
    .insert({
      booking_id: null,
      event_type: 'daily_summary',
      deduplication_key: `telegram_test:${crypto.randomUUID()}`,
      status: 'pending',
      payload: { test: true }
    })
    .select()
    .single();
  if (error) throw error;

  const attemptNumber = 1;
  try {
    const result = await sendTelegramMessage({
      chatId,
      text: '🎙 <b>DUOMO Telegram test</b>\n\nУведомления настроены корректно.'
    });
    await markAttempt(supabase, notification.id, attemptNumber, result.status, { ok: result.body.ok }, null);
    await supabase
      .from('telegram_notifications')
      .update({
        telegram_chat_id: chatId,
        telegram_message_id: result.body.result?.message_id || null,
        status: 'sent',
        attempt_count: attemptNumber,
        sent_at: new Date().toISOString()
      })
      .eq('id', notification.id);
    return jsonResponse({ success: true });
  } catch (error) {
    const message = safeErrorMessage(error);
    await markAttempt(supabase, notification.id, attemptNumber, null, null, message);
    await supabase
      .from('telegram_notifications')
      .update({
        telegram_chat_id: chatId,
        status: 'failed',
        attempt_count: attemptNumber,
        error_message: message
      })
      .eq('id', notification.id);
    return jsonResponse({ success: false, error: message }, 400);
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  const requestId = crypto.randomUUID();

  try {
    const body = await request.json();
    if (body.action === 'retry') return await handleRetry(request, body);
    if (body.action === 'test') return await handleTest(request);

    if (!requireWebhookSecret(request, 'x-duomo-webhook-secret', 'TELEGRAM_WEBHOOK_SECRET')) {
      return jsonResponse({ error: 'unauthorized' }, 401);
    }

    const webhookType = String(body.type || body.eventType || '').toUpperCase();
    const record = body.record;
    const oldRecord = body.old_record || null;
    if (!record?.id || !['INSERT', 'UPDATE'].includes(webhookType)) {
      return jsonResponse({ skipped: true, reason: 'unsupported_payload' });
    }

    const event = detectEvent(record, oldRecord, webhookType);
    if (!event) return jsonResponse({ skipped: true, reason: 'no_relevant_change' });

    const supabase = createServiceClient();
    const { data: settings } = await supabase.from('telegram_settings').select('*').limit(1).maybeSingle();
    if (!settings?.notifications_enabled) return jsonResponse({ skipped: true, reason: 'notifications_disabled' });
    if (event.eventType === 'booking_created' && !settings.booking_created_enabled) return jsonResponse({ skipped: true, reason: 'booking_created_disabled' });
    if (event.eventType !== 'booking_created' && !settings.booking_status_enabled) return jsonResponse({ skipped: true, reason: 'booking_status_disabled' });

    const booking = await loadBooking(supabase, record.id);
    const { notification, skipped } = await reserveNotification(supabase, booking, event.eventType, event.deduplicationKey);
    if (skipped) return jsonResponse({ skipped: true, reason: 'duplicate' });

    const result = await deliverNotification(supabase, notification, booking);
    console.log(JSON.stringify({ requestId, eventType: event.eventType, bookingId: booking.id, status: result.status }));
    return jsonResponse(result);
  } catch (error) {
    console.error(JSON.stringify({ requestId, error: safeErrorMessage(error) }));
    return jsonResponse({ error: 'telegram_notification_failed' }, 500);
  }
});
