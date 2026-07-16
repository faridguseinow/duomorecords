import { supabase } from '../../lib/supabase';
import { formatCell, getValue, setValue } from '../../config/adminTableConfigs';

export { formatCell, getValue };

const relationKeys = ['services', 'packages', 'customers', 'bookings', 'package_features', 'admin_users'];

function cleanPayload(row) {
  const payload = { ...row };
  relationKeys.forEach((key) => {
    delete payload[key];
  });
  Object.keys(payload).forEach((key) => {
    if (payload[key] === '') payload[key] = null;
  });
  return payload;
}

function normalizeError(error) {
  if (!error) return new Error('Unknown error');
  if (error.code === '23505') return new Error('Duplicate value. Check slug or unique field.');
  if (error.code === '42501') return new Error('Access denied by RLS policy.');
  if (error.message?.includes('invalid input syntax')) return new Error('Invalid field value.');
  return error;
}

export async function listResource(config, { page = 1, pageSize = 20, search = '', filters = {}, sortKey, ascending } = {}) {
  let query = supabase
    .from(config.table)
    .select(config.select || '*', { count: 'exact' });

  if (search && config.searchColumns?.length) {
    const pattern = `%${search}%`;
    query = query.or(config.searchColumns.map((column) => `${column}.ilike.${pattern}`).join(','));
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value != null) {
      query = query.eq(key, value);
    }
  });

  const orderColumn = sortKey && !sortKey.includes('.') ? sortKey : config.order || 'created_at';

  query = query
    .order(orderColumn, { ascending: ascending ?? config.ascending ?? true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: data || [], count: count || 0 };
}

export async function upsertResource(config, row) {
  const payload = cleanPayload(row);
  const { data, error } = await supabase
    .from(config.table)
    .upsert(payload)
    .select()
    .single();
  if (error) throw normalizeError(error);
  await logActivity('content_saved', config.table, data.id, `Saved ${config.title}`);
  return data;
}

export async function updateResource(config, id, values) {
  const { data, error } = await supabase
    .from(config.table)
    .update(values)
    .eq('id', id)
    .select()
    .single();
  if (error) throw normalizeError(error);
  await logActivity('content_updated', config.table, id, `Updated ${config.title}`);
  return data;
}

export async function savePackageWithFeatures(config, row, features = []) {
  const packagePayload = cleanPayload(row);
  const normalizedFeatures = features
    .map((feature, index) => ({
      id: feature.id || null,
      title: feature.title || { az: '', ru: '', en: '' },
      sort_order: Number(feature.sort_order ?? index * 10)
    }))
    .filter((feature) => feature.title.az || feature.title.ru || feature.title.en);

  const { data, error } = await supabase.rpc('save_package_with_features', {
    input_package: packagePayload,
    input_features: normalizedFeatures
  });
  if (error) throw normalizeError(error);
  return data;
}

export async function listBookings({ page = 1, pageSize = 20, search = '', status = '', date = '' } = {}) {
  let query = supabase
    .from('bookings')
    .select('*, services(title,slug), packages(title,slug), customers(full_name,phone,email)', { count: 'exact' });

  if (search) {
    const pattern = `%${search}%`;
    query = query.or(`booking_number.ilike.${pattern},customer_name.ilike.${pattern},customer_phone.ilike.${pattern},customer_email.ilike.${pattern}`);
  }

  if (status) query = query.eq('status', status);
  if (date) query = query.eq('booking_date', date);

  query = query.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: data || [], count: count || 0 };
}

export async function listBookingHistory(bookingId) {
  const { data, error } = await supabase
    .from('booking_status_history')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateBookingStatus(bookingId, status, note) {
  const { data, error } = await supabase.rpc('update_booking_status', {
    booking_id: bookingId,
    new_status: status,
    note: note || null
  });
  if (error) throw error;
  return data;
}

export async function rescheduleBooking(bookingId, date, time, note) {
  const { data, error } = await supabase.rpc('reschedule_booking', {
    booking_id: bookingId,
    new_date: date,
    new_time: time,
    note: note || null
  });
  if (error) throw error;
  return data;
}

export async function listCustomers({ page = 1, pageSize = 20, search = '' } = {}) {
  let query = supabase.from('customers').select('*, bookings(id,booking_number,booking_date,status)', { count: 'exact' });
  if (search) {
    const pattern = `%${search}%`;
    query = query.or(`full_name.ilike.${pattern},phone.ilike.${pattern},email.ilike.${pattern}`);
  }
  query = query.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: data || [], count: count || 0 };
}

export async function getDashboardSummary() {
  const today = new Date().toISOString().slice(0, 10);
  const [newBookings, todayBookings, completedBookings, customers, latestBookings, activity] = await Promise.all([
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_date', today),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(6),
    supabase.from('admin_activity_log').select('*').order('created_at', { ascending: false }).limit(8)
  ]);

  [newBookings, todayBookings, completedBookings, customers, latestBookings, activity].forEach((result) => {
    if (result.error) throw result.error;
  });

  return {
    newBookings: newBookings.count || 0,
    todayBookings: todayBookings.count || 0,
    completedBookings: completedBookings.count || 0,
    customers: customers.count || 0,
    latestBookings: latestBookings.data || [],
    activity: activity.data || []
  };
}

export async function listCalendarBookings({ startDate, endDate, status = '' }) {
  let query = supabase
    .from('bookings')
    .select('*, services(title,slug), packages(title,slug)')
    .gte('booking_date', startDate)
    .lte('booking_date', endDate)
    .order('booking_date')
    .order('booking_time');
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function listActivity({ page = 1, pageSize = 30 } = {}) {
  const { data, error, count } = await supabase
    .from('admin_activity_log')
    .select('*, admin_users(display_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw error;
  return { rows: data || [], count: count || 0 };
}

export async function logActivity(action, entityType, entityId, summary, metadata = {}) {
  const { error } = await supabase.rpc('log_admin_activity', {
    input_action: action,
    input_entity_type: entityType,
    input_entity_id: entityId || null,
    input_summary: summary,
    input_metadata: metadata
  });
  if (error && import.meta.env.DEV) {
    console.warn('Failed to log admin activity', error.message);
  }
}

export async function listMedia(prefix = '') {
  const { data, error } = await supabase.storage.from('public-media').list(prefix, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' }
  });
  if (error) throw error;
  return data || [];
}

export async function listSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .order('setting_key', { ascending: true });
  if (error) throw normalizeError(error);
  return data || [];
}

export async function saveSetting(settingKey, value, description = '', isPublic = true) {
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({
      setting_key: settingKey,
      value,
      description,
      is_public: isPublic
    }, { onConflict: 'setting_key' })
    .select()
    .single();
  if (error) throw normalizeError(error);
  await logActivity('settings_updated', 'site_settings', data.id, `Updated ${settingKey}`);
  return data;
}

export async function listTelegramSettings() {
  const { data, error } = await supabase
    .from('telegram_settings')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error) throw normalizeError(error);
  return data;
}

export async function updateTelegramSettings(values) {
  const current = await listTelegramSettings();
  const { data, error } = await supabase
    .from('telegram_settings')
    .update(values)
    .eq('id', current.id)
    .select()
    .single();
  if (error) throw normalizeError(error);
  await logActivity('telegram_settings_updated', 'telegram_settings', data.id, 'Updated Telegram notification settings');
  return data;
}

export async function listTelegramNotifications({ page = 1, pageSize = 30, search = '', filters = {} } = {}) {
  let query = supabase
    .from('telegram_notifications')
    .select('*, bookings(booking_number,customer_name,booking_date,booking_time,status)', { count: 'exact' });

  if (search) {
    const pattern = `%${search}%`;
    query = query.or(`event_type.ilike.${pattern},status.ilike.${pattern},deduplication_key.ilike.${pattern},error_message.ilike.${pattern}`);
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value != null) query = query.eq(key, value);
  });

  query = query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw normalizeError(error);
  return { rows: data || [], count: count || 0 };
}

export async function listTelegramDeliveryAttempts(notificationId) {
  const { data, error } = await supabase
    .from('telegram_delivery_attempts')
    .select('*')
    .eq('notification_id', notificationId)
    .order('created_at', { ascending: false });
  if (error) throw normalizeError(error);
  return data || [];
}

export async function retryTelegramNotification(notificationId) {
  const { data, error } = await supabase.functions.invoke('telegram-booking-notification', {
    body: {
      action: 'retry',
      notification_id: notificationId
    }
  });
  if (error) throw error;
  return data;
}

export async function sendTelegramTestNotification() {
  const { data, error } = await supabase.functions.invoke('telegram-booking-notification', {
    body: {
      action: 'test'
    }
  });
  if (error) throw error;
  return data;
}

export async function uploadMedia(file, folder = 'site') {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowed = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'mp4', 'webm'];
  if (!allowed.includes(extension)) {
    throw new Error('Unsupported file type');
  }

  const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-z0-9._-]/gi, '-')}`;
  const { data, error } = await supabase.storage.from('public-media').upload(path, file, {
    upsert: false
  });
  if (error) throw error;
  await logActivity('media_uploaded', 'storage_object', null, `Uploaded ${path}`, { path });
  return data;
}

export async function deleteMedia(path) {
  const { error } = await supabase.storage.from('public-media').remove([path]);
  if (error) throw error;
  await logActivity('media_deleted', 'storage_object', null, `Deleted ${path}`, { path });
}

export function buildPayloadFromForm(row, fields, formData) {
  const payload = { ...row };
  fields.forEach((field) => {
    const raw = formData.get(field.key);
    let value = raw;
    if (field.type === 'checkbox') value = raw === 'on';
    if (field.type === 'number') value = raw === '' ? null : Number(raw);
    if (field.type === 'json') {
      try {
        value = raw ? JSON.parse(raw) : {};
      } catch {
        value = getValue(row, field.key) || {};
      }
    }
    setValue(payload, field.key, value);
  });
  return payload;
}

export function defaultFieldsForResource(config) {
  if (config.fields) return config.fields;
  return [
    { key: 'slug', label: 'Slug' },
    { key: 'title.az', label: 'Title AZ' },
    { key: 'title.ru', label: 'Title RU' },
    { key: 'title.en', label: 'Title EN' },
    { key: 'short_description.az', label: 'Short AZ', type: 'textarea' },
    { key: 'short_description.ru', label: 'Short RU', type: 'textarea' },
    { key: 'short_description.en', label: 'Short EN', type: 'textarea' },
    { key: 'category', label: 'Category' },
    { key: 'sort_order', label: 'Order', type: 'number' },
    { key: 'is_active', label: 'Active', type: 'checkbox' }
  ];
}
