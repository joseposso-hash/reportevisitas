import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

const estadoOpts = ['OPTIMO', 'CON_FALLAS', 'CRITICO'];
const catOpts = ['FALLA', 'TRABAJO', 'ESTADO'];
const catColor = { FALLA: 'bg-red-600', TRABAJO: 'bg-green-600', ESTADO: 'bg-blue-600' };

export function VisitaDetalle() {
  const { id } = useParams();
  const [visita, setVisita] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('obs');
  const [cat, setCat] = useState('FALLA');
  const [desc, setDesc] = useState('');
  const [cotItems, setCotItems] = useState([{ descripcion: '', cantidad: 1, precioUnitario: 0 }]);
  const [mostrarCot, setMostrarCot] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef(null);

  const cargar = async () => {
    const [v, f] = await Promise.all([
      api.get('/visitas/' + id),
      api.get('/fotos/visita/' + id)
    ]);
    setVisita(v.data);
    setFotos(f.data);
    if (v.data.cotizacion) {
      setMostrarCot(true);
      setCotItems(v.data.cotizacion.items.map(i => ({
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario
      })));
    }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [id]);

  const mostrarMsg = (texto) => {
    setMsg(texto);
    setTimeout(() => setMsg(''), 3000);
  };

  const checkin = async () => {
    await api.post('/visitas/' + id + '/checkin');
    await cargar();
    mostrarMsg('✅ Check-in registrado');
  };

  const checkout = async () => {
    await api.post('/visitas/' + id + '/checkout');
    await cargar();
    mostrarMsg('✅ Check-out registrado');
  };

  const guardar = async (data) => {
    await api.patch('/visitas/' + id, data);
    mostrarMsg('💾 Guardado');
    cargar();
  };

  const toggleCheck = async (item) => {
    await api.patch('/visitas/' + id + '/checklist', [
      { id: item.id, completado: !item.completado, nota: item.nota }
    ]);
    cargar();
  };

  const subirFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('categoria', cat);
    if (desc) form.append('descripcion', desc);
    try {
      await api.post('/fotos/' + id, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDesc('');
      if (fileRef.current) fileRef.current.value = '';
      await cargar();
      mostrarMsg('📷 Foto subida');
    } catch (err) {
      mostrarMsg('❌ ' + (err.response?.data?.message || 'Error'));
    }
  };

  const eliminarFoto = async (fid) => {
    if (!confirm('¿Eliminar foto?')) return;
    await api.delete('/fotos/' + fid);
    cargar();
  };

  const guardarCot = async () => {
    const items = cotItems.filter(i => i.descripcion.trim());
    if (items.length === 0) return mostrarMsg('❌ Agrega ítems');
    try {
      await api.post('/cotizaciones/visita/' + id, {
        items,
        validezDias: 15,
        ivaPorcentaje: 19
      });
      await cargar();
      mostrarMsg('✅ Cotización creada');
    } catch (err) {
      mostrarMsg('❌ ' + (err.response?.data?.message || 'Error'));
    }
  };

  const enviarCot = async () => {
    if (!visita.cotizacion) return;
    await api.post('/cotizaciones/' + visita.cotizacion.id + '/enviar');
    await cargar();
    mostrarMsg('📧 Cotización enviada');
  };

  const copiarLink = () => {
    const url = window.location.origin + '/cotizacion/' + visita.cotizacion.tokenAprobacion;
    navigator.clipboard.writeText(url);
    mostrarMsg('📋 Link copiado');
  };

  const verPDF = () => {
    window.open('http://localhost:3001/api/pdf/visita/' + id + '?token=' + localStorage.getItem('auth'), '_blank');
  };

  const finalizar = async () => {
    if (!confirm('¿Finalizar visita?')) return;
    await api.post('/visitas/' + id + '/finalizar');
    await cargar();
    mostrarMsg('✅ Visita finalizada');
  };

  const firmar = () => {
    const nombre = prompt('Nombre de quien firma');
    if (!nombre) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 400, 100);
    ctx.strokeStyle = '#1a2332';
    ctx.lineWidth = 2;
    ctx.font = 'italic 30px cursive';
    ctx.fillStyle = '#1a2332';
    ctx.fillText(nombre, 20, 60);
    const dataUrl = canvas.toDataURL();
    api.post('/visitas/' + id + '/firma', { firmaDataUrl: dataUrl, nombreFirmante: nombre })
      .then(() => {
        cargar();
        mostrarMsg('✍️ Firma guardada');
      });
  };

  if (loading || !visita) return <p className="p-4">Cargando...</p>;

  const subtotal = cotItems.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0);
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  return (
    <div className="space-y-4">
      <Link to="/" className="text-sm text-blue-600 hover:underline">← Volver</Link>

      {msg && (
        <div className="fixed top-4 right-4 bg-blue-900 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {msg}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-blue-900">{visita.cliente.razonSocial}</h1>
        <p className="text-slate-500">{visita.sede.nombre} · {visita.folio} · {visita.tipoServicio}</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex gap-2 flex-wrap">
          {!visita.horaCheckin && (
            <button onClick={checkin} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
              Iniciar visita
            </button>
          )}
          {visita.horaCheckin && !visita.horaCheckout && (
            <button onClick={checkout} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-300">
              Marcar check-out
            </button>
          )}
          {visita.horaCheckin && visita.estado !== 'ENVIADA' && (
            <button onClick={finalizar} className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700">
              📧 Finalizar
            </button>
          )}
          {visita.firmaClienteUrl ? (
            <span className="text-sm text-green-700 self-center">✍️ Firmada por {visita.firmaClienteNombre}</span>
          ) : (
            <button onClick={firmar} className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-600">
              ✍️ Firmar
            </button>
          )}
          <button onClick={() => window.open('http://localhost:3001/api/pdf/visita/' + id, '_blank')} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-300">
            📄 Ver reporte
          </button>
        </div>
        {visita.estado === 'ENVIADA' && (
          <p className="text-sm text-green-700 mt-2">✅ Visita enviada al cliente</p>
        )}
      </div>

      <div className="flex gap-2 border-b">
        {[
          { id: 'obs', label: 'Observaciones' },
          { id: 'check', label: 'Checklist (' + visita.checklist.filter(c => c.completado).length + '/' + visita.checklist.length + ')' },
          { id: 'fotos', label: 'Fotos (' + fotos.length + '/6)' },
          { id: 'cot', label: 'Cotización' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={'px-4 py-2 text-sm font-medium border-b-2 ' +
              (tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'obs' && (
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Estado general del sistema</label>
            <div className="flex gap-2">
              {estadoOpts.map(e => (
                <button
                  key={e}
                  onClick={() => guardar({ estadoGeneral: e })}
                  className={'px-3 py-1.5 rounded-lg text-sm font-medium ' +
                    (visita.estadoGeneral === e
                      ? (e === 'OPTIMO' ? 'bg-green-600 text-white' : e === 'CON_FALLAS' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white')
                      : 'bg-slate-100 text-slate-700')}
                >
                  {e.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Observaciones técnicas</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg min-h-[100px]"
              defaultValue={visita.observaciones || ''}
              onBlur={e => guardar({ observaciones: e.target.value })}
              placeholder="Describe lo que encontraste..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Requerimientos del cliente</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg min-h-[80px]"
              defaultValue={visita.requerimientosCliente || ''}
              onBlur={e => guardar({ requerimientosCliente: e.target.value })}
              placeholder="Lo que pidió el cliente..."
            />
          </div>
        </div>
      )}

      {tab === 'check' && (
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
          {visita.checklist.map(c => (
            <label key={c.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={c.completado}
                onChange={() => toggleCheck(c)}
                className="w-4 h-4"
              />
              <span className={c.completado ? 'line-through text-slate-400' : ''}>{c.descripcion}</span>
            </label>
          ))}
        </div>
      )}

      {tab === 'fotos' && (
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg space-y-2">
            <div className="flex gap-2">
              {catOpts.map(c => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={'px-3 py-1 rounded text-xs font-medium ' +
                    (cat === c ? catColor[c] + ' text-white' : 'bg-white border')}
                >
                  {c}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={subirFoto}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={fotos.length >= 6}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              📷 Subir foto ({fotos.length}/6)
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {fotos.map(f => (
              <div key={f.id} className="relative border rounded-lg overflow-hidden group">
                <img src={f.urlAbsoluta} alt="" className="w-full h-32 object-cover" />
                <div className="p-2 bg-slate-50 text-xs">
                  <span className={'inline-block px-1.5 py-0.5 rounded text-white text-[10px] mr-1 ' + catColor[f.categoria]}>
                    {f.categoria}
                  </span>
                  {f.descripcion || 'Sin descripción'}
                </div>
                <button
                  onClick={() => eliminarFoto(f.id)}
                  className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white text-sm opacity-0 group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'cot' && (
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          {!visita.cotizacion ? (
            <>
              <p className="text-sm text-slate-500">Crea una cotización si detectas algo que requiera inversión.</p>
              {cotItems.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <input
                    placeholder="Descripción"
                    value={it.descripcion}
                    onChange={e => {
                      const c = [...cotItems];
                      c[i].descripcion = e.target.value;
                      setCotItems(c);
                    }}
                    className="col-span-5 px-2 py-1 border rounded text-sm"
                  />
                  <input
                    type="number"
                    value={it.cantidad}
                    onChange={e => {
                      const c = [...cotItems];
                      c[i].cantidad = Number(e.target.value);
                      setCotItems(c);
                    }}
                    className="col-span-2 px-2 py-1 border rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Precio"
                    value={it.precioUnitario}
                    onChange={e => {
                      const c = [...cotItems];
                      c[i].precioUnitario = Number(e.target.value);
                      setCotItems(c);
                    }}
                    className="col-span-3 px-2 py-1 border rounded text-sm"
                  />
                  <div className="col-span-1 text-sm text-right self-center">
                    
                  </div>
                  <button
                    onClick={() => setCotItems(cotItems.filter((_, j) => j !== i))}
                    className="col-span-1 text-red-500 text-lg"
                  >✕</button>
                </div>
              ))}
              <button
                onClick={() => setCotItems([...cotItems, { descripcion: '', cantidad: 1, precioUnitario: 0 }])}
                className="w-full bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium"
              >
                + Agregar ítem
              </button>
              <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toLocaleString('es-CO')}</span></div>
                <div className="flex justify-between"><span>IVA (19%)</span><span>{iva.toLocaleString('es-CO')}</span></div>
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>{total.toLocaleString('es-CO')}</span></div>
              </div>
              <button
                onClick={guardarCot}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Guardar cotización
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Cotización {visita.cotizacion.numero}</h3>
                <span className={'px-2 py-1 rounded text-xs font-medium ' +
                  (visita.cotizacion.estado === 'APROBADA' ? 'bg-green-100 text-green-800' :
                   visita.cotizacion.estado === 'RECHAZADA' ? 'bg-red-100 text-red-800' :
                   visita.cotizacion.estado === 'ENVIADA' ? 'bg-amber-100 text-amber-800' :
                   'bg-slate-100 text-slate-700')}>
                  {visita.cotizacion.estado}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                {visita.cotizacion.items.map((it, i) => (
                  <div key={i} className="flex justify-between border-b py-1">
                    <span>{it.cantidad}x {it.descripcion}</span>
                    <span>{it.totalLinea.toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{visita.cotizacion.subtotal.toLocaleString('es-CO')}</span></div>
                <div className="flex justify-between"><span>IVA</span><span>{visita.cotizacion.iva.toLocaleString('es-CO')}</span></div>
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>{visita.cotizacion.total.toLocaleString('es-CO')}</span></div>
              </div>
              {visita.cotizacion.estado === 'BORRADOR' && (
                <button onClick={enviarCot} className="w-full bg-green-600 text-white py-2 rounded-lg font-medium">
                  📧 Enviar al cliente
                </button>
              )}
              {visita.cotizacion.estado === 'ENVIADA' && visita.cotizacion.tokenAprobacion && (
                <button onClick={copiarLink} className="w-full bg-amber-500 text-white py-2 rounded-lg font-medium">
                  📋 Copiar link de aprobación
                </button>
              )}
              {visita.cotizacion.estado === 'APROBADA' && (
                <div className="bg-green-50 p-3 rounded-lg text-sm">
                  ✅ Aprobada por {visita.cotizacion.aprobadaPorNombre} ({visita.cotizacion.aprobadaPorCargo})
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
