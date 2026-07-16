import { useContext } from 'react';
import { AdminAuthContext } from '../context/AdminAuthContext';

export function useAdminAuth() {
  const value = useContext(AdminAuthContext);
  if (!value) {
    throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  }
  return value;
}
