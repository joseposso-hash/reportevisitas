import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';

export function CotizacionPublica() {
  const { token } = useParams();
  const [cot, setCot] = useState(null);
  const [nombre, setNombre] = useState('');
  const [cargo, setCargo] = useState('');
  const [estado, setEstado] = useState('pendiente');

  useEffect(() => {
    api.get('/cotizaciones/publica/' + token)
      .then(r => {
        setCot(r.data);
        if (r.data.estado === 'APROBADA') setEstado('aprobada');
        if (r.data.estado === 'RECHAZADA') setEstado('rechazada');
      })
      .catch(() => alert('Cotización no encontrada'));
  }, [token]);

  const aprobar = async () => {
    if (!nombre.trim()) return alert('Escribe tu nombre');
    await api.post('/cotizaciones/publica/' + token + '/aprobar', { nombre, cargo });
    setEstado('aprobada');
  };

  const rechazar = async () => {
    const razon = prompt('Motivo (opcional)');
    await api.post('/cotizaciones/publica/' + token + '/rechazar', { razon });
    setEstado('rechazada');
  };

  if (!cot) return <p className="p-8 text-center">Cargando...</p>;

  const fmt = n => '$' + n.toLocaleString('es-CO');

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-blue-900">Cotización {cot.numero}</h1>
            <p className="text-sm text-slate-500">{cot.visita.cliente.razonSocial} · {cot.visita.sede.nombre}</p>
          </div>
          <div className="space-y-1 text-sm">
            {cot.items.map(it => (
              <div key={it.id} className="flex justify-between border-b py-1">
                <span>{it.cantidad}x {it.descripcion}</span>
                <span>{fmt(it.totalLinea)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{fmt(cot.subtotal)}</span></div>
            <div className="flex justify-between"><span>IVA</span><span>{fmt(cot.iva)}</span></div>
            <div className="flex justify-between font-bold text-base"><span>Total</span><span>{fmt(cot.total)}</span></div>
          </div>
        </div>

        {estado === 'pendiente' && (
          <div className="bg-white p-6 rounded-xl shadow-sm space-y-3">
            <h2 className="font-semibold">¿Apruebas esta cotización?</h2>
            <input
              placeholder="Tu nombre"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <input
              placeholder="Tu cargo"
              value={cargo}
              onChange={e => setCargo(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <div className="flex gap-2">
              <button onClick={aprobar} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium">
                ✅ Aprobar
              </button>
              <button onClick={rechazar} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium">
                ❌ Rechazar
              </button>
            </div>
          </div>
        )}

        {estado === 'aprobada' && (
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="text-4xl mb-2">✅</div>
            <h2 className="font-semibold text-green-700">Cotización aprobada</h2>
            <p className="text-sm text-slate-500">Gracias, nos pondremos en contacto.</p>
          </div>
        )}

        {estado === 'rechazada' && (
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="text-4xl mb-2">❌</div>
            <h2 className="font-semibold text-red-700">Cotización rechazada</h2>
          </div>
        )}
      </div>
    </div>
  );
}
