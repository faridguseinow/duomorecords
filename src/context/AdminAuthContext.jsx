import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  checkAdminAccess,
  getSession,
  onAuthStateChange,
  signIn as signInService,
  signOut as signOutService
} from '../services/adminAuthService';

export const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const restore = useCallback(async () => {
    setLoading(true);
    const sessionResult = await getSession();
    setSession(sessionResult.session);

    if (sessionResult.session) {
      const adminResult = await checkAdminAccess();
      setIsAdmin(adminResult.isAdmin);
      setError(adminResult.error || null);
    } else {
      setIsAdmin(false);
      setError(sessionResult.error || null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    restore();
    const subscription = onAuthStateChange(async (nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        const adminResult = await checkAdminAccess();
        setIsAdmin(adminResult.isAdmin);
        setError(adminResult.error || null);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [restore]);

  async function signIn(email, password) {
    setLoading(true);
    setError(null);
    const result = await signInService(email, password);

    if (result.error) {
      setLoading(false);
      setError(result.error);
      return { ok: false, error: result.error };
    }

    const adminResult = await checkAdminAccess();
    setSession(result.session);
    setIsAdmin(adminResult.isAdmin);
    setLoading(false);

    if (!adminResult.isAdmin) {
      await signOutService();
      const accessError = new Error('Admin access is not enabled for this user.');
      setError(accessError);
      return { ok: false, error: accessError };
    }

    return { ok: true, error: null };
  }

  async function signOut() {
    setLoading(true);
    await signOutService();
    setSession(null);
    setIsAdmin(false);
    setLoading(false);
  }

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      isAdmin,
      loading,
      error,
      signIn,
      signOut,
      refresh: restore
    }),
    [session, isAdmin, loading, error, restore]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
