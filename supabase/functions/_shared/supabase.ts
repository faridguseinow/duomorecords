import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.109.0';

export function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export function createServiceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error('Supabase service environment is missing');
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function createUserClient(authHeader: string | null) {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !key) {
    throw new Error('Supabase anon environment is missing');
  }
  return createClient(url, key, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {}
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export async function requireAdmin(authHeader: string | null) {
  if (!authHeader) return false;
  const supabase = createUserClient(authHeader);
  const { data, error } = await supabase.rpc('is_admin_user');
  return !error && data === true;
}

export function safeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error || 'Unknown error');
}

export function maskPhone(phone: string | null | undefined) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 4) return '';
  return `***${digits.slice(-4)}`;
}

export function timingSafeEqual(a: string, b: string) {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    diff |= (left[index] || 0) ^ (right[index] || 0);
  }
  return diff === 0;
}

export function requireWebhookSecret(request: Request, headerName: string, envName: string) {
  const expected = Deno.env.get(envName);
  const actual = request.headers.get(headerName);
  if (!expected || !actual || !timingSafeEqual(actual, expected)) {
    return false;
  }
  return true;
}

export function publicPayload(record: Record<string, unknown>) {
  return {
    booking_id: record.id,
    booking_number: record.booking_number,
    status: record.status,
    booking_date: record.booking_date,
    booking_time: record.booking_time
  };
}
