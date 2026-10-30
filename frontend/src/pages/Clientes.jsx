import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ razonSocial: '', nit: '', contactoNom: '', contactoTel: '', contactoMail: '', direccion: '', ciudad: '' });

  const cargarClientes = async () => {
    try {
      const { data } = await api.get('/clientes');
      setClientes(data);
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
      setMostrarForm(false);
      setNuevoCliente({ razonSocial: '', nit: '', contactoNom: '', contactoTel: '', contactoMail: '', direccion: '', ciudad: '' });
      cargarClientes();
    } catch (error) {
      alert('Error al crear cliente: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <p className="p-4">Cargando clientes...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-900">Clientes</h1>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          {mostrarForm ? 'Cancelar' : '+ Nuevo Cliente'}
        </button>
      </div>

      {mostrarForm && (
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

      <div className="space-y-2">
        {clientes.map(c => (
          <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="font-semibold">{c.razonSocial}</p>
            <p className="text-sm text-slate-500">NIT: {c.nit || 'N/A'} · Contacto: {c.contactoNom || 'N/A'}</p>
            <p className="text-sm text-slate-500">Sedes: {c.sedes.length}</p>
          </div>
        ))}
        {clientes.length === 0 && <p className="text-center text-slate-400">No hay clientes registrados.</p>}
      </div>
    </div>
  );
}