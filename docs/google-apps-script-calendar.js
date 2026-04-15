/**
 * Google Apps Script (Web App) for availability and booking.
 * Deploy as Web App with access: Anyone.
 * Link script to your Google Calendar.
 */

const CALENDAR_ID = '5bbf349028764ee0ce308fe4443a023dc0243f2417b3db35dbd798318a69b796@group.calendar.google.com';
const SLOT_START = 11; // 11:00
const SLOT_END = 20;   // 20:00
const SLOT_STEP_MIN = 60;

function doGet(e) {
  const action = (e.parameter.action || '').toLowerCase();

  if (action === 'availability') {
    const dateStr = e.parameter.date;
    if (!dateStr) return json({ slots: [] });

    const slots = getFreeSlots(dateStr);
    return json({ slots });
  }

  return json({ ok: true, message: 'Use action=availability' });
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents || '{}');
  const action = (payload.action || '').toLowerCase();

  if (action === 'book') {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) return json({ ok: false, error: 'Calendar not found' });

    const date = payload.date;
    const slot = payload.slot;
    if (!date || !slot) return json({ ok: false, error: 'date/slot required' });

    const [hour, minute] = slot.split(':').map(Number);
    const start = new Date(date + 'T00:00:00');
    start.setHours(hour, minute || 0, 0, 0);

    const end = new Date(start.getTime() + SLOT_STEP_MIN * 60000);

    const conflicts = calendar.getEvents(start, end);
    if (conflicts.length > 0) {
      return json({ ok: false, error: 'slot already booked' });
    }

    const title = `Booking: ${payload.service || 'Service'} | ${payload.name || 'Client'}`;
    const description = [
      `Phone: ${payload.phone || '-'}`,
      `Details: ${payload.details || '-'}`,
      `Source: duomorecords.com`
    ].join('\n');

    calendar.createEvent(title, start, end, { description });

    return json({ ok: true });
  }

  return json({ ok: false, error: 'unknown action' });
}

function getFreeSlots(dateStr) {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) return [];

  const dayStart = new Date(dateStr + 'T00:00:00');
  const result = [];

  for (let h = SLOT_START; h < SLOT_END; h++) {
    const start = new Date(dayStart);
    start.setHours(h, 0, 0, 0);

    const end = new Date(start.getTime() + SLOT_STEP_MIN * 60000);
    const hasEvent = calendar.getEvents(start, end).length > 0;

    if (!hasEvent) {
      result.push(formatTime(start));
    }
  }

  return result;
}

function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
