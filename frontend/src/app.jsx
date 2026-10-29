import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { VisitasHoy } from './pages/VisitasHoy';
import { VisitaDetalle } from './pages/VisitaDetalle';
import { Layout } from './components/Layout';
import { useAuthStore } from './stores/auth';

export default function App() {
  const token = useAuthStore(s => s.token);

  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />

      {/* Rutas protegidas */}
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

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}