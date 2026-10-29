import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

export function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      <header className="bg-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold">N24 Reportes</Link>
          <div className="flex items-center gap-3">
            <span className="text-sm">{user?.nombre}</span>
            <button onClick={handleLogout} className="px-3 py-1 text-sm hover:bg-blue-700 rounded">Salir</button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4">{children}</main>
    </div>
  );
}