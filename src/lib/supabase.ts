import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

// Si faltan las variables la app muestra una pantalla de configuración
// (ver App.tsx) y este cliente no se usa.
export const supabase = createClient(
  url ?? 'http://localhost',
  anonKey ?? 'missing-anon-key',
)
