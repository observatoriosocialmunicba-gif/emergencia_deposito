import { LogOut } from 'lucide-react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

export default function ProtectedRoute() {
  const { session, loading, usuario, usuarioLoading, signOut } = useAuth()
  const navigate = useNavigate()

  if (loading || usuarioLoading) return <Spinner fullscreen />
  if (!session) return <Navigate to="/login" replace />

  if (usuario?.rol === 'No Asignado') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-page p-margin">
        <div className="w-full max-w-md rounded-xl border border-line bg-white p-space-lg text-center shadow-sm">
          <h1 className="font-headline-md text-headline-md font-bold text-ink">
            Tu cuenta está pendiente de habilitación
          </h1>
          <p className="mt-3 font-body-md text-body-md text-ink-soft">
            Un administrador debe asignar tu rol y habilitar tu acceso para que puedas ingresar.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={async () => {
                await signOut()
                navigate('/login', { replace: true })
              }}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-primary-container px-6 py-2.5 font-label-lg text-label-lg font-bold text-primary-container transition-colors hover:bg-primary-container/5 active:scale-[0.98]"
            >
              <LogOut size={18} />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (usuario && usuario.activo === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-page p-margin">
        <div className="w-full max-w-md rounded-xl border border-line bg-white p-space-lg text-center shadow-sm">
          <h1 className="font-headline-md text-headline-md font-bold text-ink">
            Tu cuenta está desactivada
          </h1>
          <p className="mt-3 font-body-md text-body-md text-ink-soft">
            El acceso para esta cuenta ha sido deshabilitado.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={async () => {
                await signOut()
                navigate('/login', { replace: true })
              }}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-primary-container px-6 py-2.5 font-label-lg text-label-lg font-bold text-primary-container transition-colors hover:bg-primary-container/5 active:scale-[0.98]"
            >
              <LogOut size={18} />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <Outlet />
}
