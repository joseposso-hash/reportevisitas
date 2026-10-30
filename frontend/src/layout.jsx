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
    <div className="min-h-screen bg-slate-50">
      {/* Barra de navegación superior */}
      <header className="bg-blue-900 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg hover:text-blue-200 transition-colors">
            <span>🛡️</span>
            <span>N24 Reportes</span> <Link to="/" className="flex items-center gap-2 font-bold text-lg hover:text-blue-200 transition-colors">
  <span>🛡️</span>
  <span>N24 Reportes</span>
</Link>
<Link to="/clientes" className="text-sm hover:text-blue-200 transition-colors ml-4">Clientes</Link>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-blue-100">{user?.nombre}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Contenido de la página */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}