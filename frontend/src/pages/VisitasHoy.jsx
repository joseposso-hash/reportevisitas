import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth';

const estadoColor = {
  ASIGNADA: 'bg-slate-100 text-slate-700',
  EN_CURSO: 'bg-green-100 text-green-800',
  FINALIZADA: 'bg-blue-100 text-blue-800',
  ENVIADA: 'bg-blue-100 text-blue-800'
};

export function VisitasHoy() {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    api.get('/visitas', { params: { tecnicoId: user?.tecnicoId } })
      .then(r => setVisitas(r.data))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Hola, {user?.nombre} 👋</h1>
        <p className="text-slate-500">Tienes {visitas.length} visita(s) asignada(s)</p>
      </div>

      <div className="space-y-3">
        {visitas.map(v => (
          <Link key={v.id} to={'/visitas/' + v.id}>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={'px-2.5 py-0.5 rounded-full text-xs font-medium ' + estadoColor[v.estado]}>
                      {v.estado.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">{v.folio}</span>
                  </div>
                  <p className="font-semibold">{v.cliente.razonSocial}</p>
                  <p className="text-sm text-slate-500">{v.sede.nombre}</p>
                  <p className="text-sm text-slate-500">
                    {v.tipoServicio} · {new Date(v.fechaProgramada).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="text-2xl">→</span>
              </div>
            </div>
          </Link>
        ))}
        {visitas.length === 0 && (
          <div className="bg-white p-8 rounded-xl text-center text-slate-500">
            No tienes visitas asignadas
          </div>
        )}
      </div>
    </div>
  );
}
