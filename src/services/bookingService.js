import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PREFERRED_CONTACT_TYPES } from '../utils/constants';

const requestTimeoutMs = 12000;

function withTimeout(promise, timeoutMs = requestTimeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
    })
  ]);
}

function safeTrim(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

export function validateBookingPayload(payload, availableSlots = [], maximumAdvanceDays = 90) {
  const errors = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maximumAdvanceDays);
  const bookingDate = payload.bookingDate ? new Date(`${payload.bookingDate}T00:00:00`) : null;

  if (!payload.serviceId && !payload.packageId) {
    errors.selectedOption = 'Select a service or package.';
  }

  if (!payload.customerName || payload.customerName.length < 2 || payload.customerName.length > 100) {
    errors.customerName = 'Name must be 2-100 characters.';
  }

  if (!payload.phone || payload.phone.length < 7 || payload.phone.length > 30 || !/^[+\d\s().-]+$/.test(payload.phone)) {
    errors.phone = 'Phone must be 7-30 characters.';
  }

  if (payload.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.customerEmail)) {
    errors.customerEmail = 'Email format is invalid.';
  }

  if (payload.projectDescription && payload.projectDescription.length > 3000) {
    errors.projectDescription = 'Project description is too long.';
  }

  if (!bookingDate || Number.isNaN(bookingDate.getTime()) || bookingDate < today || bookingDate > maxDate) {
    errors.bookingDate = 'Choose a valid available date.';
  }

  if (!payload.bookingTime || (availableSlots.length > 0 && !availableSlots.includes(payload.bookingTime))) {
    errors.bookingTime = 'Choose an available time slot.';
  }

  if (!PREFERRED_CONTACT_TYPES.includes(payload.preferredContact)) {
    errors.preferredContact = 'Choose a contact method.';
  }

  return errors;
}

export function normalizeBookingForm(formData, language) {
  const selectedOption = String(formData.get('selectedOption') || '');

  return {
    serviceId: selectedOption.startsWith('service:') ? selectedOption.replace('service:', '') : '',
    packageId: selectedOption.startsWith('package:') ? selectedOption.replace('package:', '') : '',
    bookingDate: String(formData.get('bookingDate') || ''),
    bookingTime: String(formData.get('bookingTime') || ''),
    customerName: safeTrim(formData.get('customerName')),
    customerEmail: safeTrim(formData.get('customerEmail')),
    phone: safeTrim(formData.get('phone')),
    projectDescription: String(formData.get('projectDescription') || '').trim(),
    preferredContact: String(formData.get('preferredContact') || ''),
    language,
    source: 'website'
  };
}

export async function getAvailableBookingSlots(date, fallbackSlots = []) {
  if (!date) {
    return { slots: [], source: 'local', error: null };
  }

  if (!isSupabaseConfigured) {
    return { slots: fallbackSlots, source: 'fallback', error: null };
  }

  try {
    const { data, error } = await withTimeout(
      supabase.rpc('get_available_booking_slots', { target_date: date })
    );
    if (error) throw error;

    return {
      slots: (data || []).map((item) => String(item.slot_time).slice(0, 5)),
      source: 'supabase',
      error: null
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[booking slots] Supabase request failed.', error.message);
    }
    return { slots: fallbackSlots, source: 'fallback', error };
  }
}

export async function createPublicBooking(payload) {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      code: 'not_configured',
      message: 'Supabase is not configured yet.'
    };
  }

  try {
    const { data, error } = await withTimeout(
      supabase.rpc('create_public_booking', {
        input_service_id: payload.serviceDbId || null,
        input_package_id: payload.packageDbId || null,
        input_booking_date: payload.bookingDate,
        input_booking_time: payload.bookingTime,
        input_customer_name: payload.customerName,
        input_customer_email: payload.customerEmail || null,
        input_customer_phone: payload.phone,
        input_project_description: payload.projectDescription || null,
        input_preferred_contact: payload.preferredContact,
        input_language: payload.language,
        input_source: payload.source || 'website'
      })
    );

    if (error) throw error;

    return {
      ok: true,
      booking: Array.isArray(data) ? data[0] : data
    };
  } catch (error) {
    const message = error.message || 'Booking request failed.';
    return {
      ok: false,
      code: message.toLowerCase().includes('slot') ? 'slot_conflict' : 'request_failed',
      message
    };
  }
}
