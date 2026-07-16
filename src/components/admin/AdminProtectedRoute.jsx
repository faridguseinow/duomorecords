import { Navigate, useParams } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';

export function AdminProtectedRoute({ children }) {
  const { lang = 'az' } = useParams();
  const { loading, isAdmin, session } = useAdminAuth();

  if (loading) {
    return <div className="admin-auth-screen">Loading...</div>;
  }

  if (!session || !isAdmin) {
    return <Navigate to={`/${lang}/admin/login`} replace />;
  }

  return children;
}
