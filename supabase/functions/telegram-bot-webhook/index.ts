import { createServiceClient, jsonResponse, requireWebhookSecret, safeErrorMessage } from '../_shared/supabase.ts';
import { allowedTelegramUserIds, answerCallbackQuery, editTelegramMessage, escapeTelegramHtml } from '../_shared/telegram.ts';

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

async function handleConfirm(callbackQuery: Record<string, any>, bookingId: string) {
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID') || '';
  if (!chatId || callbackChatId(callbackQuery) !== chatId) {
    await answerCallbackQuery({ callbackQueryId: callbackQuery.id, text: 'Недоступно для этого чата', showAlert: true });
    return jsonResponse({ skipped: true, reason: 'invalid_chat' }, 403);
  }

  if (!isAllowedCallbackUser(callbackQuery)) {
    await answerCallbackQuery({ callbackQueryId: callbackQuery.id, text: 'Нет доступа к действию', showAlert: true });
    return jsonResponse({ skipped: true, reason: 'unauthorized_user' }, 403);
  }

  const supabase = createServiceClient();
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
      text: `🎙 <b>DUOMO</b>\n\n<b>Заявка:</b> ${escapeTelegramHtml(data.booking_number)}\n<b>Статус:</b> confirmed`,
      replyMarkup: {
        inline_keyboard: []
      }
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

    const [action, bookingId] = String(callbackQuery.data).split(':');
    if (action === 'confirm' && bookingId) {
      return await handleConfirm(callbackQuery, bookingId);
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
