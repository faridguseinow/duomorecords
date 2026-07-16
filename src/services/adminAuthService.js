import { supabase, isSupabaseConfigured } from '../lib/supabase';

export async function getSession() {
  if (!isSupabaseConfigured) {
    return { session: null, error: new Error('Supabase is not configured') };
  }

  const { data, error } = await supabase.auth.getSession();
  return { session: data?.session || null, error };
}

export async function signIn(email, password) {
  if (!isSupabaseConfigured) {
    return { session: null, user: null, error: new Error('Supabase is not configured') };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { session: data?.session || null, user: data?.user || null, error };
}

export async function signOut() {
  if (!isSupabaseConfigured) {
    return { error: null };
  }

  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function checkAdminAccess() {
  if (!isSupabaseConfigured) {
    return { isAdmin: false, error: new Error('Supabase is not configured') };
  }

  const { data, error } = await supabase.rpc('is_admin_user');
  return { isAdmin: Boolean(data), error };
}

export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured) {
    return { unsubscribe: () => {} };
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return data.subscription;
}
