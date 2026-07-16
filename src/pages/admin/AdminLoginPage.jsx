import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';

export function AdminLoginPage() {
  const { lang = 'az' } = useParams();
  const { signIn, loading, isAdmin, session } = useAdminAuth();
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const formData = new FormData(event.currentTarget);
    const result = await signIn(formData.get('email'), formData.get('password'));
    if (!result.ok) {
      setError(result.error?.message || 'Invalid login');
    }
  }

  if (session && isAdmin) {
    return <Navigate to={`/${lang}/admin`} replace />;
  }

  return (
    <main className="admin-login">
      <form onSubmit={handleSubmit}>
        <h1>DUOMO Admin</h1>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {error && <p className="admin-error">{error}</p>}
        <button type="submit" className="admin-primary-btn" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
