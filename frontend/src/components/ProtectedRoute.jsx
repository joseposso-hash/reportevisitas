import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

export function ProtectedRoute({ children }) {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
