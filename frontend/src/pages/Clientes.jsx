import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  
  // Estados para crear cliente
  const [mostrarFormCliente, setMostrarFormCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ razonSocial: '', nit: '', contactoNom: '', contactoTel: '', contactoMail: '', direccion: '', ciudad: '' });

  // Estados para crear sede
  const [mostrarFormSede, setMostrarFormSede] = useState(false);
  const [nuevaSede, setNuevaSede] = useState({ nombre: '', direccion: '', ciudad: '' });

  // Estados para crear equipo
  const [sedeSeleccionada, setSedeSeleccionada] = useState(null);
  const [mostrarFormEquipo, setMostrarFormEquipo] = useState(false);
  const [nuevoEquipo, setNuevoEquipo] = useState({ tipo: '', marca: '', modelo: '', serial: '', ubicacion: '' });

  const cargarClientes = async () => {
    try {
      const { data } = await api.get('/clientes');
      setClientes(data);
      if (clienteSeleccionado) {
        const actualizado = data.find(c => c.id === clienteSeleccionado.id);
        setClienteSeleccionado(actualizado);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarClientes(); }, []);

  const crearCliente = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clientes', nuevoCliente);
      setMostrarFormCliente(false);
      setNuevoCliente({ razonSocial: '', nit: '', contactoNom: '', contactoTel: '', contactoMail: '', direccion: '', ciudad: '' });
      cargarClientes();
    } catch (error) {
      alert('Error al crear cliente: ' + (error.response?.data?.message || error.message));
    }
  };

  const crearSede = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sedes', { ...nuevaSede, clienteId: clienteSeleccionado.id });
      setMostrarFormSede(false);
      setNuevaSede({ nombre: '', direccion: '', ciudad: '' });
      cargarClientes();
    } catch (error) {
      alert('Error al crear sede: ' + (error.response?.data?.message || error.message));
    }
  };

  const crearEquipo = async (e) => {
    e.preventDefault();
    try {
      await api.post('/equipos', { ...nuevoEquipo, sedeId: sedeSeleccionada.id });
      setMostrarFormEquipo(false);
      setNuevoEquipo({ tipo: '', marca: '', modelo: '', serial: '', ubicacion: '' });
      cargarClientes();
    } catch (error) {
      alert('Error al crear equipo: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <p className="p-4">Cargando clientes...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-900">Clientes</h1>
        <button
          onClick={() => setMostrarFormCliente(!mostrarFormCliente)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          {mostrarFormCliente ? 'Cancelar' : '+ Nuevo Cliente'}
        </button>
      </div>

      {/* Formulario Nuevo Cliente */}
      {mostrarFormCliente && (
        <form onSubmit={crearCliente} className="bg-white p-4 rounded-xl shadow-sm space-y-3">
          <h2 className="font-semibold">Crear Nuevo Cliente</h2>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Razón Social *" required className="border p-2 rounded" value={nuevoCliente.razonSocial} onChange={(e) => setNuevoCliente({...nuevoCliente, razonSocial: e.target.value})} />
            <input type="text" placeholder="NIT" className="border p-2 rounded" value={nuevoCliente.nit} onChange={(e) => setNuevoCliente({...nuevoCliente, nit: e.target.value})} />
            <input type="text" placeholder="Contacto (Nombre)" className="border p-2 rounded" value={nuevoCliente.contactoNom} onChange={(e) => setNuevoCliente({...nuevoCliente, contactoNom: e.target.value})} />
            <input type="text" placeholder="Teléfono" className="border p-2 rounded" value={nuevoCliente.contactoTel} onChange={(e) => setNuevoCliente({...nuevoCliente, contactoTel: e.target.value})} />
            <input type="email" placeholder="Correo" className="border p-2 rounded" value={nuevoCliente.contactoMail} onChange={(e) => setNuevoCliente({...nuevoCliente, contactoMail: e.target.value})} />
            <input type="text" placeholder="Dirección" className="border p-2 rounded" value={nuevoCliente.direccion} onChange={(e) => setNuevoCliente({...nuevoCliente, direccion: e.target.value})} />
            <input type="text" placeholder="Ciudad" className="border p-2 rounded" value={nuevoCliente.ciudad} onChange={(e) => setNuevoCliente({...nuevoCliente, ciudad: e.target.value})} />
          </div>
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">Guardar Cliente</button>
        </form>
      )}

      {/* Lista de Clientes */}
      <div className="space-y-2">
        {clientes.map(c => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div 
              className="p-4 cursor-pointer hover:bg-slate-50 flex justify-between items-center"
              onClick={() => setClienteSeleccionado(clienteSeleccionado?.id === c.id ? null : c)}
            >
              <div>
                <p className="font-semibold">{c.razonSocial}</p>
                <p className="text-sm text-slate-500">NIT: {c.nit || 'N/A'} · Contacto: {c.contactoNom || 'N/A'}</p>
              </div>
              <span className="text-slate-400">{clienteSeleccionado?.id === c.id ? '▲' : '▼'}</span>
            </div>

            {/* Panel desplegable del cliente */}
            {clienteSeleccionado?.id === c.id && (
              <div className="border-t p-4 bg-slate-50 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-blue-900">Sedes</h3>
                  <button onClick={() => setMostrarFormSede(!mostrarFormSede)} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">+ Agregar Sede</button>
                </div>

                {mostrarFormSede && (
                  <form onSubmit={crearSede} className="bg-white p-3 rounded border space-y-2">
                    <input type="text" placeholder="Nombre Sede" required className="w-full border p-1 rounded text-sm" value={nuevaSede.nombre} onChange={(e) => setNuevaSede({...nuevaSede, nombre: e.target.value})} />
                    <input type="text" placeholder="Dirección" className="w-full border p-1 rounded text-sm" value={nuevaSede.direccion} onChange={(e) => setNuevaSede({...nuevaSede, direccion: e.target.value})} />
                    <input type="text" placeholder="Ciudad" className="w-full border p-1 rounded text-sm" value={nuevaSede.ciudad} onChange={(e) => setNuevaSede({...nuevaSede, ciudad: e.target.value})} />
                    <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded text-sm">Guardar Sede</button>
                  </form>
                )}

                {c.sedes.length === 0 ? (
                  <p className="text-sm text-slate-500">No hay sedes registradas.</p>
                ) : (
                  <div className="space-y-2">
                    {c.sedes.map(s => (
                      <div key={s.id} className="bg-white p-3 rounded border">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-sm">{s.nombre}</p>
                          <button onClick={() => { setSedeSeleccionada(s); setMostrarFormEquipo(true); }} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200">+ Equipo</button>
                        </div>
                        <p className="text-xs text-slate-500">{s.direccion} · {s.ciudad}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {clientes.length === 0 && <p className="text-center text-slate-400">No hay clientes registrados.</p>}
      </div>

      {/* Modal para crear equipo */}
      {mostrarFormEquipo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h2 className="font-bold text-lg">Agregar Equipo a {sedeSeleccionada?.nombre}</h2>
            <form onSubmit={crearEquipo} className="space-y-2">
              <select required className="w-full border p-2 rounded text-sm" value={nuevoEquipo.tipo} onChange={(e) => setNuevoEquipo({...nuevoEquipo, tipo: e.target.value})}>
                <option value="">Seleccione tipo...</option>
                <option value="CAMARA">Cámara</option>
                <option value="NVR">NVR / DVR</option>
                <option value="PANEL_ALARMA">Panel de Alarma</option>
                <option value="CONTROL_ACCESO">Control de Acceso</option>
                <option value="SENSOR">Sensor</option>
              </select>
              <input type="text" placeholder="Marca" className="w-full border p-2 rounded text-sm" value={nuevoEquipo.marca} onChange={(e) => setNuevoEquipo({...nuevoEquipo, marca: e.target.value})} />
              <input type="text" placeholder="Modelo" className="w-full border p-2 rounded text-sm" value={nuevoEquipo.modelo} onChange={(e) => setNuevoEquipo({...nuevoEquipo, modelo: e.target.value})} />
              <input type="text" placeholder="Serial" className="w-full border p-2 rounded text-sm" value={nuevoEquipo.serial} onChange={(e) => setNuevoEquipo({...nuevoEquipo, serial: e.target.value})} />
              <input type="text" placeholder="Ubicación (ej: Entrada)" className="w-full border p-2 rounded text-sm" value={nuevoEquipo.ubicacion} onChange={(e) => setNuevoEquipo({...nuevoEquipo, ubicacion: e.target.value})} />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setMostrarFormEquipo(false)} className="flex-1 bg-slate-200 py-2 rounded text-sm font-medium">Cancelar</button>
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded text-sm font-medium">Guardar Equipo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}