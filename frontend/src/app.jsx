import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { VisitasHoy } from './pages/VisitasHoy';
import { VisitaDetalle } from './pages/VisitaDetalle';
import { Layout } from './components/Layout';
import { useAuthStore } from './stores/auth';

function ProtectedRoute({ children }) {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<VisitasHoy />} />
              <Route path="/visitas/:id" element={<VisitaDetalle />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}