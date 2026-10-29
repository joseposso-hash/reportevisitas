import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth';

export function VisitasHoy() {
  const [visitas, setVisitas] = useState([]);
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    api.get('/visitas', { params: { tecnicoId: user?.tecnicoId } }).then(r => setVisitas(r.data));
  }, [user]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-blue-900">Hola, {user?.nombre}</h1>
      <div className="space-y-3">
        {visitas.map(v => (
          <Link key={v.id} to={'/visitas/' + v.id} className="block bg-white p-4 rounded-xl shadow-sm border hover:border-blue-500">
            <p className="font-semibold">{v.cliente.razonSocial}</p>
            <p className="text-sm text-slate-500">{v.sede.nombre} · {v.folio}</p>
          </Link>
        ))}
        {visitas.length === 0 && <p className="text-center text-slate-400">No tienes visitas asignadas.</p>}
      </div>
    </div>
  );
}