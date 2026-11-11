import { supabase } from '../lib/supabase'
import type { Barrio } from '../lib/types'

export async function obtenerBarrios(): Promise<Barrio[]> {
  const { data, error } = await supabase
    .from('Barrios')
    .select('id, NombreBarrio, Long, Lat')
    .order('NombreBarrio', { ascending: true })

  if (error) throw error
  return (data ?? []) as Barrio[]
}
