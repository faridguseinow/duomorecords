const defaultSlots = ['11:00', '12:30', '14:00', '16:00', '18:00'];

export async function fetchAvailableSlots(apiUrl, date) {
  if (!date) {
    return [];
  }

  if (!apiUrl) {
    return defaultSlots;
  }

  const params = new URLSearchParams({ action: 'availability', date });
  const response = await fetch(`${apiUrl}?${params}`);

  if (!response.ok) {
    throw new Error('Availability request failed');
  }

  const payload = await response.json();
  return Array.isArray(payload.slots) ? payload.slots : [];
}

export async function createBooking(apiUrl, payload) {
  if (!apiUrl) {
    return { ok: true };
  }

  // Google Apps Script web apps often accept the POST but do not expose CORS headers
  // for reading the response. We send in no-cors mode and treat successful dispatch
  // as accepted booking request.
  // Intentionally fire-and-forget: some browsers still report CORB/CORS noise and/or
  // reject the promise even though the server processed the request.
  fetch(apiUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'book', ...payload })
  }).catch(() => {});

  return { ok: true };
}

export function addDays(baseDate, days) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return date;
}

export function toIsoDate(value) {
  return new Date(value).toISOString().split('T')[0];
}

export async function fetchMonthAvailability(apiUrl, startDate, days = 30) {
  const checks = [];

  for (let i = 0; i <= days; i += 1) {
    const isoDate = toIsoDate(addDays(startDate, i));
    checks.push(
      fetchAvailableSlots(apiUrl, isoDate)
        .then((slots) => ({ date: isoDate, slots }))
        .catch(() => ({ date: isoDate, slots: [] }))
    );
  }

  return Promise.all(checks);
}
