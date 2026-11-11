import type { Session } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Usuario } from '../lib/types'
import { cerrarSesion } from '../services/authService'
import { obtenerUsuario } from '../services/usuariosService'

interface AuthState {
  session: Session | null
  /** true mientras se recupera la sesión guardada en el navegador */
  loading: boolean
  /** fila de public.Usuarios del usuario logueado (null si no existe) */
  usuario: Usuario | null
  usuarioLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id

  const { data: usuario = null, isLoading: usuarioLoading } = useQuery({
    queryKey: ['usuario', userId],
    enabled: Boolean(userId),
    queryFn: () => obtenerUsuario(userId!),
  })

  const value = useMemo<AuthState>(
    () => ({
      session,
      loading,
      usuario,
      usuarioLoading: Boolean(userId) && usuarioLoading,
      signOut: cerrarSesion,
    }),
    [session, loading, usuario, usuarioLoading, userId],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
