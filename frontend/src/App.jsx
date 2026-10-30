import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { VisitasHoy } from './pages/VisitasHoy';
import { VisitaDetalle } from './pages/VisitaDetalle';
import { Clientes } from './pages/Clientes'; // <-- Asegúrate de que esté
import { Layout } from './components/Layout';
import { useAuthStore } from './stores/auth';

export default function App() {
  const token = useAuthStore(s => s.token);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        token ? (
          <Layout>
            <VisitasHoy />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/visitas/:id" element={
        token ? (
          <Layout>
            <VisitaDetalle />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      <Route path="/clientes" element={ // <-- Asegúrate de que esté esta ruta
        token ? (
          <Layout>
            <Clientes />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}