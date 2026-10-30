import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth';

export function VisitasHoy() {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    // Traemos TODAS las visitas (sin filtrar por técnico para asegurar que aparezcan)
    api.get('/visitas')
      .then(r => {
        if (Array.isArray(r.data)) {
          setVisitas(r.data);
        } else {
          setVisitas([]);
        }
      })
      .catch(() => setVisitas([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-4">Cargando...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-blue-900">Hola, {user?.nombre}</h1>
      <p className="text-slate-500">Tienes {visitas.length} visita(s) asignada(s)</p>

      <div className="space-y-3">
        {visitas.map(v => (
          <Link key={v.id} to={'/visitas/' + v.id} className="block bg-white p-4 rounded-xl shadow-sm border hover:border-blue-500 transition-colors">
            <p className="font-semibold">{v.cliente?.razonSocial || 'Cliente'}</p>
            <p className="text-sm text-slate-500">{v.sede?.nombre || 'Sede'} · {v.folio}</p>
          </Link>
        ))}
        {visitas.length === 0 && (
          <p className="text-center text-slate-400">No tienes visitas asignadas.</p>
        )}
      </div>
    </div>
  );
}