import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

export function VisitaDetalle() {
  const { id } = useParams();
  const [visita, setVisita] = useState(null);
  const [equipos, setEquipos] = useState([]);
  const [cotizacion, setCotizacion] = useState(null);
  const [tab, setTab] = useState('obs');

  const cargar = async () => {
    const { data } = await api.get('/visitas/' + id);
    setVisita(data);
    const eq = await api.get('/equipos/sede/' + data.sedeId);
    setEquipos(eq.data);
  };

  useEffect(() => { 
    cargar(); 
    api.get('/cotizaciones/visita/' + id)
      .then(r => setCotizacion(r.data))
      .catch(() => setCotizacion(null));
  }, [id]);

  const guardarObs = async (campo, valor) => {
    await api.patch('/visitas/' + id, { [campo]: valor });
    cargar();
  };

  const actualizarEquipo = async (eqId, campo, valor) => {
    await api.patch('/equipos/' + eqId, { [campo]: valor });
    cargar();
  };

  const finalizarYDescargar = async () => {
    try {
      // 1. Descargar el PDF
      const response = await api.get(`/visitas/${id}/pdf-general`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte-${visita.folio}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // 2. Marcar la visita como finalizada
      await api.patch('/visitas/' + id, { estado: 'FINALIZADA' });
      
      alert('✅ Reporte descargado y visita finalizada');
    } catch (error) {
      alert('Error al descargar o finalizar la visita');
    }
  };

  const descargarHojaVida = async (equipoId, serial) => {
    try {
      const response = await api.get(`/equipos/${equipoId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `HojaVida-${serial || equipoId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Error al descargar el PDF');
    }
  };

  const crearCotizacion = async (equipo) => {
    const desc = prompt('Descripción del ítem a cotizar:', `Cambio de ${equipo.tipo} ${equipo.marca || ''} ${equipo.modelo || ''}`);
    if (!desc) return;
    const precio = prompt('Precio unitario:', '100000');
    if (!precio) return;
    
    try {
      const item = { descripcion: desc, cantidad: 1, precioUnitario: Number(precio) };
      await api.post('/cotizaciones/visita/' + id, { items: [item] });
      const r = await api.get('/cotizaciones/visita/' + id);
      setCotizacion(r.data);
      setTab('cotizacion');
    } catch (err) {
      alert('Error creando cotización: ' + (err.response?.data?.message || err.message));
    }
  };

  if (!visita) return <p className="p-4">Cargando...</p>;

  return (
    <div className="space-y-4">
      <Link to="/" className="text-sm text-blue-600">← Volver</Link>
      
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">{visita.cliente.razonSocial}</h1>
          <p className="text-slate-500">{visita.sede.nombre} · {visita.folio}</p>
        </div>
        <button
          onClick={finalizarYDescargar}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2"
        >
          ✅ Finalizar y Descargar PDF
        </button>
      </div>

      <div className="flex gap-2 border-b">
        <button onClick={() => setTab('obs')} className={'px-4 py-2 ' + (tab === 'obs' ? 'border-b-2 border-blue-600 text-blue-600' : '')}>Observaciones</button>
        <button onClick={() => setTab('equipos')} className={'px-4 py-2 ' + (tab === 'equipos' ? 'border-b-2 border-blue-600 text-blue-600' : '')}>Equipos</button>
        <button onClick={() => setTab('cotizacion')} className={'px-4 py-2 ' + (tab === 'cotizacion' ? 'border-b-2 border-blue-600 text-blue-600' : '')}>Cotización</button>
      </div>

      {tab === 'obs' && (
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          <textarea className="w-full border p-2 rounded" placeholder="Observaciones generales..." defaultValue={visita.observaciones || ''} onBlur={(e) => guardarObs('observaciones', e.target.value)} />
          <textarea className="w-full border p-2 rounded" placeholder="Requerimientos del cliente..." defaultValue={visita.requerimientosCliente || ''} onBlur={(e) => guardarObs('requerimientosCliente', e.target.value)} />
        </div>
      )}

      {tab === 'equipos' && (
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
          {equipos.map(eq => (
            <div key={eq.id} className="border p-3 rounded-lg space-y-2">
              
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{eq.tipo} - {eq.marca} {eq.modelo}</p>
                  <p className="text-xs text-slate-500">Serie: {eq.serial} · Ubicación: {eq.ubicacion}</p>
                </div>
                <button
                  onClick={() => descargarHojaVida(eq.id, eq.serial)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border"
                >
                  📑 Hoja de Vida
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <input type="text" placeholder="IP" className="border p-1 rounded text-sm" defaultValue={eq.ip || ''} onBlur={(e) => actualizarEquipo(eq.id, 'ip', e.target.value)} />
                <input type="text" placeholder="Usuario" className="border p-1 rounded text-sm" defaultValue={eq.usuario || ''} onBlur={(e) => actualizarEquipo(eq.id, 'usuario', e.target.value)} />
                <input type="text" placeholder="Clave" className="border p-1 rounded text-sm" defaultValue={eq.clave || ''} onBlur={(e) => actualizarEquipo(eq.id, 'clave', e.target.value)} />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <select className="border p-1 rounded text-sm" defaultValue={eq.estadoFisico || ''} onChange={(e) => actualizarEquipo(eq.id, 'estadoFisico', e.target.value)}>
                  <option value="">Estado físico...</option>
                  <option value="OPTIMO">Óptimo</option>
                  <option value="REGULAR">Regular</option>
                  <option value="MALO">Malo</option>
                </select>
                <select className="border p-1 rounded text-sm" defaultValue={eq.estadoFuncional || ''} onChange={(e) => actualizarEquipo(eq.id, 'estadoFuncional', e.target.value)}>
                  <option value="">Estado funcional...</option>
                  <option value="OPERATIVO">Operativo</option>
                  <option value="FALLA">En Falla</option>
                  <option value="FUERA_SERVICIO">Fuera de servicio</option>
                </select>
              </div>

              <input type="text" className="w-full border p-1 rounded text-sm" placeholder="Observaciones del equipo..." defaultValue={eq.observaciones || ''} onBlur={(e) => actualizarEquipo(eq.id, 'observaciones', e.target.value)} />

              {(eq.estadoFuncional === 'FALLA' || eq.estadoFuncional === 'FUERA_SERVICIO') && !cotizacion && (
                <button
                  onClick={() => crearCotizacion(eq)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-1 rounded text-sm font-medium mt-1"
                >
                  💰 Cotizar Reparación de este Equipo
                </button>
              )}

              <div className="mt-3 p-2 bg-slate-50 rounded border">
                <p className="text-xs font-medium text-slate-600 mb-2">Agregar foto de evidencia</p>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Descripción de la foto (ej: Falla en fuente de poder)"
                    id={`desc-${eq.id}`}
                    className="w-full border p-1 rounded text-sm"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    id={`foto-${eq.id}`}
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      const descripcion = document.getElementById(`desc-${eq.id}`).value;
                      
                      const form = new FormData();
                      form.append('file', file);
                      if (descripcion) form.append('descripcion', descripcion);
                      
                      try {
                        await api.post('/equipos/' + eq.id + '/foto', form, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        document.getElementById(`desc-${eq.id}`).value = '';
                        cargar();
                      } catch (err) {
                        alert('Error subiendo foto: ' + (err.response?.data?.message || err.message));
                      }
                    }}
                  />
                  <label
                    htmlFor={`foto-${eq.id}`}
                    className="inline-block text-center px-3 py-2 bg-blue-600 text-white text-sm rounded cursor-pointer hover:bg-blue-700"
                  >
                    📷 Seleccionar y Subir Foto
                  </label>
                </div>
              </div>

              {eq.fotos && eq.fotos.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {eq.fotos.map(f => (
                    <div key={f.id} className="relative group">
                      <img src={'http://localhost:3001' + f.url} className="w-16 h-16 object-cover rounded border shadow-sm" alt="foto equipo" />
                      {f.descripcion && (
                        <div className="absolute inset-0 bg-black/60 text-white text-[9px] p-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-center rounded">
                          {f.descripcion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          ))}
          {equipos.length === 0 && <p className="text-center text-slate-400">No hay equipos registrados.</p>}
        </div>
      )}

      {tab === 'cotizacion' && (
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          {cotizacion ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-blue-900">Cotización {cotizacion.numero}</h3>
                <span className="text-sm text-slate-500">Vence: {new Date(cotizacion.fechaVencimiento).toLocaleDateString('es-CO')}</span>
              </div>
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left py-2 px-2">Descripción</th>
                    <th className="text-center py-2 px-2">Cant</th>
                    <th className="text-right py-2 px-2">V. Unit</th>
                    <th className="text-right py-2 px-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizacion.items.map(it => (
                    <tr key={it.id} className="border-b">
                      <td className="py-2 px-2">{it.descripcion}</td>
                      <td className="text-center">{it.cantidad}</td>
                      <td className="text-right">${it.precioUnitario.toLocaleString('es-CO')}</td>
                      <td className="text-right">${it.totalLinea.toLocaleString('es-CO')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-col items-end space-y-1 text-sm">
                <p>Subtotal: ${cotizacion.subtotal.toLocaleString('es-CO')}</p>
                <p>IVA (19%): ${cotizacion.iva.toLocaleString('es-CO')}</p>
                <p className="font-bold text-lg text-blue-900">Total: ${cotizacion.total.toLocaleString('es-CO')}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No hay cotización creada para esta visita.</p>
              <p className="text-sm mt-2">Ve a la pestaña de <strong>Equipos</strong>, marca un equipo como <strong>En Falla</strong> y presiona "Cotizar Reparación".</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}