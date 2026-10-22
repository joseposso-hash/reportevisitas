import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { VisitasHoy } from './pages/VisitasHoy';
import { VisitaDetalle } from './pages/VisitaDetalle';
import { Dashboard } from './pages/Dashboard';
import { CotizacionPublica } from './pages/CotizacionPublica';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cotizacion/:token" element={<CotizacionPublica />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<VisitasHoy />} />
                <Route path="/visitas/:id" element={<VisitaDetalle />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
