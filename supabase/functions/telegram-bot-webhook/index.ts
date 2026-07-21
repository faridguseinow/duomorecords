import { createServiceClient, jsonResponse, requireWebhookSecret, safeErrorMessage } from '../_shared/supabase.ts';
import {
  allowedTelegramUserIds,
  answerCallbackQuery,
  buildAdminBookingUrl,
  editTelegramMessage,
  escapeTelegramHtml,
  normalizeWhatsappUrl,
  truncateText,
  type TelegramReplyMarkup
} from '../_shared/telegram.ts';

type Booking = Record<string, any>;

const DATE_LOOKAHEAD_DAYS = 14;
const MAX_DATE_BUTTONS = 8;
const FINAL_STATUSES = ['completed', 'cancelled', 'rejected'];

const weekdaysRu = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function callbackChatId(callbackQuery: Record<string, any>) {
  return String(callbackQuery.message?.chat?.id || '');
}

function callbackUserId(callbackQuery: Record<string, any>) {
  return String(callbackQuery.from?.id || '');
}

function isAllowedCallbackUser(callbackQuery: Record<string, any>) {
  const allowed = allowedTelegramUserIds();
  if (allowed.length === 0) return false;
  return allowed.includes(callbackUserId(callbackQuery));
}

async function requireAllowedCallback(callbackQuery: Record<string, any>) {
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID') || '';
  if (!chatId || callbackChatId(callbackQuery) !== chatId) {
    await answerCallbackQuery({ callbackQueryId: callbackQuery.id, text: 'Недоступно для этого чата', showAlert: true });
    return '';
  }

  if (!isAllowedCallbackUser(callbackQuery)) {
    await answerCallbackQuery({ callbackQueryId: callbackQuery.id, text: 'Нет доступа к действию', showAlert: true });
    return '';
  }

  return chatId;
}

function parseCallbackData(data: string) {
  if (data.includes('|')) {
    const [action, ...args] = data.split('|');
    return { action, args };
  }

  const [action, ...args] = data.split(':');
  return { action, args };
}

function localized(value: Record<string, string> | null | undefined, language = 'az') {
  if (!value || typeof value !== 'object') return '';
  return value[language] || value.az || value.ru || value.en || '';
}

function bookingDateLabel(booking: Booking) {
  return booking.booking_date ? String(booking.booking_date).slice(0, 10) : 'Не назначено';
}

function bookingTimeLabel(booking: Booking) {
  return booking.booking_time ? String(booking.booking_time).slice(0, 5) : 'Не назначено';
}

function formatBookingMessage(booking: Booking, title = '🎙 <b>DUOMO — заявка</b>') {
  const service = localized(booking.services?.title, booking.language);
  const pkg = localized(booking.packages?.title, booking.language);
  const comment = truncateText(booking.project_description, 500);
  const rows = [
    title,
    '',
    `<b>Номер:</b> ${escapeTelegramHtml(booking.booking_number)}`,
    `<b>Клиент:</b> ${escapeTelegramHtml(booking.customer_name)}`,
    `<b>Телефон:</b> ${escapeTelegramHtml(booking.customer_phone)}`,
    booking.customer_email ? `<b>Email:</b> ${escapeTelegramHtml(booking.customer_email)}` : '',
    service ? `<b>Услуга:</b> ${escapeTelegramHtml(service)}` : '',
    pkg ? `<b>Пакет:</b> ${escapeTelegramHtml(pkg)}` : '',
    `<b>Дата:</b> ${escapeTelegramHtml(bookingDateLabel(booking))}`,
    `<b>Время:</b> ${escapeTelegramHtml(bookingTimeLabel(booking))}`,
    `<b>Связь:</b> ${escapeTelegramHtml(booking.preferred_contact)}`,
    `<b>Язык:</b> ${escapeTelegramHtml(String(booking.language || '').toUpperCase())}`,
    comment ? `<b>Комментарий:</b>\n${escapeTelegramHtml(comment)}` : '',
    '',
    `<b>Статус:</b> ${escapeTelegramHtml(booking.status)}`
  ];

  return rows.filter(Boolean).join('\n');
}

function buildLinkRows(booking: Booking) {
  const rows = [];
  const adminUrl = buildAdminBookingUrl(booking.id, booking.language || 'az');
  const whatsappUrl = normalizeWhatsappUrl(booking.customer_phone);
  if (adminUrl) rows.push([{ text: 'Открыть заявку', url: adminUrl }]);
  if (whatsappUrl) rows.push([{ text: 'WhatsApp', url: whatsappUrl }]);
  return rows;
}

function buildFinalReplyMarkup(booking: Booking): TelegramReplyMarkup {
  return { inline_keyboard: buildLinkRows(booking) };
}

function addDaysIso(startIso: string, days: number) {
  const [year, month, day] = startIso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function todayInTimeZone(timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function formatDateButtonLabel(dateIso: string, slotsCount: number) {
  const [year, month, day] = dateIso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')} ${weekdaysRu[date.getUTCDay()]} (${slotsCount})`;
}

function chunkButtons<T>(items: T[], size: number) {
  const rows = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
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

async function loadBookingTimezone(supabase: ReturnType<typeof createServiceClient>) {
  const { data } = await supabase
    .from('booking_settings')
    .select('timezone')
    .eq('is_booking_enabled', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.timezone || 'Asia/Baku';
}

async function loadAvailableSlots(supabase: ReturnType<typeof createServiceClient>, date: string) {
  const { data, error } = await supabase.rpc('get_available_booking_slots', {
    target_date: date
  });
  if (error) throw error;
  return (data || []).map((item: Record<string, any>) => String(item.slot_time).slice(0, 5));
}

async function loadDateOptions(supabase: ReturnType<typeof createServiceClient>) {
  const timezone = await loadBookingTimezone(supabase);
  const today = todayInTimeZone(timezone);
  const dates = Array.from({ length: DATE_LOOKAHEAD_DAYS }, (_, index) => addDaysIso(today, index));
  const options = await Promise.all(dates.map(async (date) => ({
    date,
    slots: await loadAvailableSlots(supabase, date)
  })));

  return options.filter((option) => option.slots.length > 0).slice(0, MAX_DATE_BUTTONS);
}

function buildDateReplyMarkup(booking: Booking, options: Array<{ date: string; slots: string[] }>): TelegramReplyMarkup {
  const dateButtons = options.map((option) => ({
    text: formatDateButtonLabel(option.date, option.slots.length),
    callback_data: `date|${booking.id}|${option.date}`
  }));

  return {
    inline_keyboard: [
      ...chunkButtons(dateButtons, 2),
      ...buildLinkRows(booking)
    ]
  };
}

function buildSlotReplyMarkup(booking: Booking, date: string, slots: string[]): TelegramReplyMarkup {
  const slotButtons = slots.map((slot) => ({
    text: slot,
    callback_data: `slot|${booking.id}|${date}|${slot}`
  }));

  return {
    inline_keyboard: [
      ...chunkButtons(slotButtons, 3),
      [{ text: 'Назад к датам', callback_data: `dates|${booking.id}` }],
      ...buildLinkRows(booking)
    ]
  };
}

function finalStatusMessage(booking: Booking) {
  return FINAL_STATUSES.includes(booking.status)
    ? `Заявку со статусом "${booking.status}" нельзя перенести из Telegram`
    : '';
}

async function editCallbackMessage(callbackQuery: Record<string, any>, chatId: string, text: string, replyMarkup: TelegramReplyMarkup) {
  const messageId = callbackQuery.message?.message_id;
  if (!messageId) {
    await answerCallbackQuery({ callbackQueryId: callbackQuery.id, text: 'Не удалось обновить сообщение', showAlert: true });
    return false;
  }

  await editTelegramMessage({
    chatId,
    messageId,
    text,
    replyMarkup
  });
  return true;
}

async function handleChooseDates(callbackQuery: Record<string, any>, bookingId: string) {
  const chatId = await requireAllowedCallback(callbackQuery);
  if (!chatId) return jsonResponse({ skipped: true, reason: 'unauthorized_callback' }, 403);

  const supabase = createServiceClient();
  const booking = await loadBooking(supabase, bookingId);
  const finalMessage = finalStatusMessage(booking);
  if (finalMessage) {
    await answerCallbackQuery({ callbackQueryId: callbackQuery.id, text: finalMessage, showAlert: true });
    return jsonResponse({ skipped: true, reason: 'final_booking' }, 400);
  }

  const options = await loadDateOptions(supabase);
  if (options.length === 0) {
    await answerCallbackQuery({ callbackQueryId: callbackQuery.id, text: 'Свободных дат пока нет', showAlert: true });
    await editCallbackMessage(
      callbackQuery,
      chatId,
      `${formatBookingMessage(booking, '🎙 <b>DUOMO — выбор даты</b>')}\n\nСвободных дат на ближайшие дни нет. Проверьте расписание в админке.`,
      buildFinalReplyMarkup(booking)
    ).catch(() => null);
    return jsonResponse({ skipped: true, reason: 'no_available_dates' });
  }

  await editCallbackMessage(
    callbackQuery,
    chatId,
    `${formatBookingMessage(booking, '🎙 <b>DUOMO — выберите дату брони</b>')}\n\n<b>Доступные даты:</b>`,
    buildDateReplyMarkup(booking, options)
  );
  await answerCallbackQuery({ callbackQueryId: callbackQuery.id, text: 'Выберите дату' });
  return jsonResponse({ success: true, step: 'date' });
}

async function handleChooseDate(callbackQuery: Record<string, any>, bookingId: string, date: string) {
  const chatId = await requireAllowedCallback(callbackQuery);
  if (!chatId) return jsonResponse({ skipped: true, reason: 'unauthorized_callback' }, 403);

  const supabase = createServiceClient();
  const booking = await loadBooking(supabase, bookingId);
  const finalMessage = finalStatusMessage(booking);
  if (finalMessage) {
    await answerCallbackQuery({ callbackQueryId: callbackQuery.id, text: finalMessage, showAlert: true });
    return jsonResponse({ skipped: true, reason: 'final_booking' }, 400);
  }

  const slots = await loadAvailableSlots(supabase, date);
  if (slots.length === 0) {
    await answerCallbackQuery({ callbackQueryId: callbackQuery.id, text: 'На эту дату свободных слотов нет', showAlert: true });
    return jsonResponse({ skipped: true, reason: 'no_available_slots' });
  }

  await editCallbackMessage(
    callbackQuery,
    chatId,
    `${formatBookingMessage(booking, '🎙 <b>DUOMO — выберите время</b>')}\n\n<b>Дата:</b> ${escapeTelegramHtml(date)}\n<b>Доступное время:</b>`,
    buildSlotReplyMarkup(booking, date, slots)
  );
  await answerCallbackQuery({ callbackQueryId: callbackQuery.id, text: 'Выберите время' });
  return jsonResponse({ success: true, step: 'time' });
}

async function handleChooseSlot(callbackQuery: Record<string, any>, bookingId: string, date: string, time: string) {
  const chatId = await requireAllowedCallback(callbackQuery);
  if (!chatId) return jsonResponse({ skipped: true, reason: 'unauthorized_callback' }, 403);

  const supabase = createServiceClient();
  try {
    const { error } = await supabase.rpc('schedule_booking_from_telegram', {
      input_booking_id: bookingId,
      input_booking_date: date,
      input_booking_time: `${String(time).slice(0, 5)}:00`,
      input_telegram_user_id: callbackUserId(callbackQuery)
    });
    if (error) throw error;

    const booking = await loadBooking(supabase, bookingId);
    await editCallbackMessage(
      callbackQuery,
      chatId,
      formatBookingMessage(booking, '🎙 <b>DUOMO — Бронь подтверждена</b>'),
      buildFinalReplyMarkup(booking)
    );
    await answerCallbackQuery({ callbackQueryId: callbackQuery.id, text: 'Дата и время сохранены' });
    return jsonResponse({ success: true, booking_id: bookingId, date, time });
  } catch (error) {
    const message = safeErrorMessage(error);
    const text = message.includes('slot_unavailable')
      ? 'Этот слот уже занят. Выберите другое время.'
      : message.includes('booking_is_final')
        ? 'Финальную заявку нельзя изменить'
        : 'Не удалось сохранить дату и время';
    await answerCallbackQuery({ callbackQueryId: callbackQuery.id, text, showAlert: true });
    return jsonResponse({ error: 'schedule_failed', message }, 400);
  }
}

async function handleConfirm(callbackQuery: Record<string, any>, bookingId: string) {
  const chatId = await requireAllowedCallback(callbackQuery);
  if (!chatId) return jsonResponse({ skipped: true, reason: 'unauthorized_callback' }, 403);

  const supabase = createServiceClient();
  const booking = await loadBooking(supabase, bookingId);
  if (!booking.booking_date || !booking.booking_time) {
    await answerCallbackQuery({ callbackQueryId: callbackQuery.id, text: 'Сначала выберите дату и время', showAlert: true });
    return jsonResponse({ skipped: true, reason: 'booking_slot_required' }, 400);
  }

  const { data, error } = await supabase.rpc('confirm_booking_from_telegram', {
    input_booking_id: bookingId,
    input_telegram_user_id: callbackUserId(callbackQuery)
  });
  if (error) throw error;

  await answerCallbackQuery({ callbackQueryId: callbackQuery.id, text: 'Бронь подтверждена' });

  const messageId = callbackQuery.message?.message_id;
  if (messageId) {
    await editTelegramMessage({
      chatId,
      messageId,
      text: formatBookingMessage(data, '🎙 <b>DUOMO — Бронь подтверждена</b>'),
      replyMarkup: buildFinalReplyMarkup(data)
    }).catch(() => null);
  }

  return jsonResponse({ success: true, booking_id: bookingId });
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);
  if (!requireWebhookSecret(request, 'X-Telegram-Bot-Api-Secret-Token', 'TELEGRAM_BOT_WEBHOOK_SECRET')) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  try {
    const update = await request.json();
    const callbackQuery = update.callback_query;
    if (!callbackQuery?.data) return jsonResponse({ skipped: true, reason: 'unsupported_update' });

    const { action, args } = parseCallbackData(String(callbackQuery.data));
    const [bookingId, date, time] = args;

    if (action === 'confirm' && bookingId) {
      return await handleConfirm(callbackQuery, bookingId);
    }

    if (action === 'dates' && bookingId) {
      return await handleChooseDates(callbackQuery, bookingId);
    }

    if (action === 'date' && bookingId && date) {
      return await handleChooseDate(callbackQuery, bookingId, date);
    }

    if (action === 'slot' && bookingId && date && time) {
      return await handleChooseSlot(callbackQuery, bookingId, date, time);
    }

    if (action === 'reject') {
      await answerCallbackQuery({ callbackQueryId: callbackQuery.id, text: 'Отклонение выполняется через админку', showAlert: true });
      return jsonResponse({ skipped: true, reason: 'reject_requires_admin' });
    }

    await answerCallbackQuery({ callbackQueryId: callbackQuery.id, text: 'Неизвестное действие', showAlert: true });
    return jsonResponse({ skipped: true, reason: 'unknown_callback' });
  } catch (error) {
    console.error(JSON.stringify({ error: safeErrorMessage(error) }));
    return jsonResponse({ error: 'telegram_callback_failed' }, 500);
  }
});
