export type TelegramButton = {
  text: string;
  url?: string;
  callback_data?: string;
};

export type TelegramReplyMarkup = {
  inline_keyboard: TelegramButton[][];
};

export function escapeTelegramHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildAdminBookingUrl(bookingId: string, language = 'az') {
  const adminSiteUrl = Deno.env.get('ADMIN_SITE_URL') || '';
  if (!adminSiteUrl) return '';
  const base = adminSiteUrl.replace(/\/+$/, '');
  return `${base}/${language}/admin/bookings?booking=${encodeURIComponent(bookingId)}`;
}

export function normalizeWhatsappUrl(phone: string | null | undefined) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return '';
  return `https://wa.me/${digits}`;
}

export async function telegramRequest<T>(
  method: string,
  body: Record<string, unknown>,
  token = Deno.env.get('TELEGRAM_BOT_TOKEN') || ''
) {
  if (!token) {
    throw new Error('Telegram bot token is not configured');
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const responseBody = await response.json().catch(() => ({}));
  validateTelegramResponse(response.status, responseBody);
  return { status: response.status, body: responseBody as T };
}

export async function sendTelegramMessage(params: {
  chatId: string;
  text: string;
  replyMarkup?: TelegramReplyMarkup;
}) {
  return telegramRequest<{ ok: boolean; result?: { message_id?: number } }>('sendMessage', {
    chat_id: params.chatId,
    text: params.text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: params.replyMarkup
  });
}

export async function editTelegramMessage(params: {
  chatId: string;
  messageId: number;
  text: string;
  replyMarkup?: TelegramReplyMarkup;
}) {
  return telegramRequest('editMessageText', {
    chat_id: params.chatId,
    message_id: params.messageId,
    text: params.text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: params.replyMarkup
  });
}

export async function answerCallbackQuery(params: {
  callbackQueryId: string;
  text: string;
  showAlert?: boolean;
}) {
  return telegramRequest('answerCallbackQuery', {
    callback_query_id: params.callbackQueryId,
    text: params.text,
    show_alert: params.showAlert || false
  });
}

export function validateTelegramResponse(status: number, body: Record<string, unknown>) {
  if (status >= 200 && status < 300 && body.ok !== false) return;
  const description = typeof body.description === 'string' ? body.description : 'Telegram request failed';
  const parameters = body.parameters && typeof body.parameters === 'object' ? body.parameters : {};
  const retryAfter = 'retry_after' in parameters ? Number((parameters as { retry_after?: number }).retry_after) : null;
  const error = new Error(retryAfter ? `${description}; retry_after=${retryAfter}` : description);
  throw error;
}

export function truncateText(value: unknown, max = 500) {
  const text = String(value || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function allowedTelegramUserIds() {
  return (Deno.env.get('TELEGRAM_ALLOWED_USER_IDS') || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
