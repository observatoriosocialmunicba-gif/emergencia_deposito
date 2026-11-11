import { supabase } from '../lib/supabase'
import type { Area } from '../lib/types'

export async function obtenerAreas(): Promise<Area[]> {
  const { data, error } = await supabase
    .from('Areas')
    .select('id, nombre, activa')
    .eq('activa', true)
    .order('nombre', { ascending: true })

  if (error) throw error
  return (data ?? []) as Area[]
}

