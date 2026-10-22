import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [campo, setCampo] = useState([]);
  const [visitas, setVisitas] = useState([]);
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/resumen-hoy'),
      api.get('/dashboard/tecnicos-en-campo'),
      api.get('/dashboard/visitas-del-dia'),
      api.get('/dashboard/alertas')
    ]).then(([r, c, v, a]) => {
      setResumen(r.data);
      setCampo(c.data);
      setVisitas(v.data);
      setAlertas(a.data);
    });
  }, []);

  if (!resumen) return <p>Cargando dashboard...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-blue-900">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-medium text-blue-700">Visitas hoy</p>
          <p className="text-3xl font-bold text-blue-900">{resumen.total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs font-medium text-green-700">En curso</p>
          <p className="text-3xl font-bold text-green-900">{resumen.enCurso}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-medium text-blue-700">Finalizadas</p>
          <p className="text-3xl font-bold text-blue-900">{resumen.finalizadas}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-medium text-amber-700">Cot. pendientes</p>
          <p className="text-3xl font-bold text-amber-900">{resumen.pendientesCotizacion}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white p-4 rounded-xl shadow-sm">
          <h2 className="font-semibold mb-3">Técnicos en campo ({campo.length})</h2>
          {campo.length === 0 ? (
            <p className="text-sm text-slate-400">Ninguno en campo ahora</p>
          ) : (
            <div className="space-y-2">
              {campo.map(t => (
                <div key={t.visitaId} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <div>
                      <p className="font-medium text-sm">{t.tecnico}</p>
                      <p className="text-xs text-slate-500">{t.cliente} · {t.sede}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    desde {new Date(t.horaCheckin).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="font-semibold mb-3">Alertas ({alertas.length})</h2>
          {alertas.length === 0 ? (
            <p className="text-sm text-slate-400">Sin alertas activas</p>
          ) : (
            <div className="space-y-2">
              {alertas.map((a, i) => (
                <div key={i} className={'p-2 rounded border-l-4 text-xs ' +
                  (a.severidad === 'alta' ? 'border-red-500 bg-red-50' : 'border-amber-500 bg-amber-50')}>
                  ⚠️ {a.mensaje}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm overflow-x-auto">
        <h2 className="font-semibold mb-3">Visitas del día</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="pb-2">Folio</th>
              <th className="pb-2">Cliente</th>
              <th className="pb-2">Sede</th>
              <th className="pb-2">Técnico</th>
              <th className="pb-2">Estado</th>
              <th className="pb-2">Hora</th>
            </tr>
          </thead>
          <tbody>
            {visitas.map(v => (
              <tr key={v.id} className="border-b hover:bg-slate-50">
                <td className="py-2 text-xs text-slate-400">{v.folio}</td>
                <td className="py-2">{v.cliente.razonSocial}</td>
                <td className="py-2 text-slate-500">{v.sede.nombre}</td>
                <td className="py-2 text-slate-500">{v.tecnico.usuario.nombre}</td>
                <td className="py-2">
                  <span className="px-2 py-0.5 rounded text-xs bg-slate-100">{v.estado.replace('_', ' ')}</span>
                </td>
                <td className="py-2 text-slate-500">
                  {new Date(v.fechaProgramada).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
