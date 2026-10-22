import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

export function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLink = ({ to, label }) => {
    const activo = location.pathname === to;
    return (
      <Link
        to={to}
        className={'px-3 py-1.5 rounded text-sm font-medium transition-colors ' +
          (activo ? 'bg-blue-700' : 'hover:bg-blue-700/50')}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen">
      <header className="bg-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="text-xl">🛡️</span>
            <span>Reportes Técnicos</span>
          </Link>
          <nav className="flex gap-1">
            <NavLink to="/" label="Mis visitas" />
            {user?.rol === 'ADMIN' && <NavLink to="/dashboard" label="Dashboard" />}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-100">{user?.nombre}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
