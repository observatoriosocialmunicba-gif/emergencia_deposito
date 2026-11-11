import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { isSupabaseConfigured } from './lib/supabase'
import AsignarPedidosPage from './pages/AsignarPedidos'
import AutorizarPedidosPage from './pages/AutorizarPedidos'
import CrearCuentaPage from './pages/CrearCuenta'
import DashboardPage from './pages/Dashboard'
import EstadoPedidosPage from './pages/EstadoPedidos'
import HistorialPedidosPage from './pages/HistorialPedidos'
import LoginPage from './pages/Login'
import NuevaSolicitudPage from './pages/NuevaSolicitud'
import PanelEntregasPage from './pages/PanelEntregas'
import PerfilPage from './pages/Perfil'
import PlaceholderPage from './pages/PlaceholderPage'
import RecuperarPasswordPage from './pages/RecuperarPassword'
import SolicitudesPage from './pages/Solicitudes'
import UsuariosPage from './pages/Usuarios'
import VerPedidoPage from './pages/VerPedido'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

// Pantallas del original que todavía no se portaron.
const PENDIENTES: Array<[path: string, title: string]> = [
  ['/ayuda', 'Ayuda'],
  ['/administrativo', 'Administrativo'],
]

function FaltaConfiguracion() {
  return (
    <div className="mx-auto max-w-xl p-8">
      <h1 className="font-headline-md text-headline-md">Falta configurar Supabase</h1>
      <p className="mt-3 text-ink-soft">
        Creá un archivo <code>.env</code> en la raíz del proyecto con{' '}
        <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> y
        reiniciá <code>npm run dev</code>.
      </p>
    </div>
  )
}

export default function App() {
  if (!isSupabaseConfigured) return <FaltaConfiguracion />

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/crear-cuenta" element={<CrearCuentaPage />} />
            <Route
              path="/recuperar-password"
              element={<RecuperarPasswordPage />}
            />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/solicitudes" element={<SolicitudesPage />} />
                <Route
                  path="/solicitudes/nueva"
                  element={<NuevaSolicitudPage />}
                />
                <Route
                  path="/solicitudes/:id/editar"
                  element={<NuevaSolicitudPage />}
                />
                <Route
                  path="/asignar-pedidos"
                  element={<AsignarPedidosPage />}
                />
                <Route
                  path="/panel-entregas"
                  element={<PanelEntregasPage />}
                />
                <Route
                  path="/autorizar-pedidos"
                  element={<AutorizarPedidosPage />}
                />
                <Route
                  path="/historial-pedidos"
                  element={<HistorialPedidosPage />}
                />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/estado-pedidos" element={<EstadoPedidosPage />} />
                <Route path="/ver-pedido/:id" element={<VerPedidoPage />} />
                <Route path="/usuarios" element={<UsuariosPage />} />
                <Route path="/perfil" element={<PerfilPage />} />
                {PENDIENTES.map(([path, title]) => (
                  <Route
                    key={path}
                    path={path}
                    element={<PlaceholderPage title={title} />}
                  />
                ))}
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/estado-pedidos" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
