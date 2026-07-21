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

const bookingErrorMessages = {
  not_configured: 'Booking system is not configured yet.',
  booking_disabled: 'Booking requests are temporarily disabled.',
  service_or_package_required: 'Select a service or package.',
  invalid_service: 'Selected service is unavailable. Refresh the page and try again.',
  invalid_package: 'Selected package is unavailable. Refresh the page and try again.',
  invalid_customer_name: 'Check the customer name.',
  invalid_customer_phone: 'Check the phone number.',
  invalid_customer_email: 'Check the email address.',
  invalid_preferred_contact: 'Choose a contact method.',
  project_description_too_long: 'Project description is too long.',
  booking_slot_incomplete: 'Booking request cannot include an incomplete time slot.',
  slot_unavailable: 'This booking time is unavailable.',
  request_failed: 'Booking request failed.'
};

function normalizeBookingError(error) {
  const message = String(error?.message || '').trim();
  const knownCode = Object.keys(bookingErrorMessages).find((code) => message.includes(code));

  if (knownCode) {
    return {
      code: knownCode,
      message: bookingErrorMessages[knownCode]
    };
  }

  if (message.toLowerCase().includes('null value in column "booking_date"')) {
    return {
      code: 'booking_request_schema_outdated',
      message: 'Booking database is not ready for request-only submissions.'
    };
  }

  return {
    code: 'request_failed',
    message: bookingErrorMessages.request_failed
  };
}

export function validateBookingPayload(payload) {
  const errors = {};

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
        input_booking_date: payload.bookingDate || null,
        input_booking_time: payload.bookingTime || null,
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
    const normalizedError = normalizeBookingError(error);
    if (import.meta.env.DEV) {
      console.warn('[booking create] Supabase request failed.', error);
    }
    return {
      ok: false,
      code: normalizedError.code,
      message: normalizedError.message
    };
  }
}
