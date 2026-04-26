import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ROUTE_PATHS } from '@/lib/index';
import { useAuth } from '@/hooks/useAuth';
import Login from '@/pages/Login';
import JurorPanel from '@/pages/JurorPanel';
import AdminPanel from '@/pages/AdminPanel';

function ProtectedJuror({ children }: { children: React.ReactNode }) {
  const { type } = useAuth();
  if (!type) return <Navigate to={ROUTE_PATHS.HOME} replace />;
  if (type === 'admin') return <Navigate to={ROUTE_PATHS.ADMIN} replace />;
  return <>{children}</>;
}

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const { type } = useAuth();
  if (!type) return <Navigate to={ROUTE_PATHS.HOME} replace />;
  if (type === 'juror') return <Navigate to={ROUTE_PATHS.JUROR} replace />;
  return <>{children}</>;
}

function HomeRedirect() {
  const { type } = useAuth();
  if (type === 'juror') return <Navigate to={ROUTE_PATHS.JUROR} replace />;
  if (type === 'admin') return <Navigate to={ROUTE_PATHS.ADMIN} replace />;
  return <Login />;
}

export default function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' },
        }}
      />
      <Routes>
        <Route path={ROUTE_PATHS.HOME} element={<HomeRedirect />} />
        <Route
          path={ROUTE_PATHS.JUROR}
          element={
            <ProtectedJuror>
              <JurorPanel />
            </ProtectedJuror>
          }
        />
        <Route
          path={ROUTE_PATHS.ADMIN}
          element={
            <ProtectedAdmin>
              <AdminPanel />
            </ProtectedAdmin>
          }
        />
        <Route path="*" element={<Navigate to={ROUTE_PATHS.HOME} replace />} />
      </Routes>
    </Router>
  );
}
