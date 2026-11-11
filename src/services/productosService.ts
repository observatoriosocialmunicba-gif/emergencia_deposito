import { supabase } from '../lib/supabase'
import type { Producto } from '../lib/types'

export async function obtenerProductos(): Promise<Producto[]> {
  const { data, error } = await supabase
    .from('Productos')
    .select('id, rubro, necesidad, estado')
    .eq('estado', true)
    .order('rubro', { ascending: true })
    .order('necesidad', { ascending: true })

  if (error) throw error
  return (data ?? []) as Producto[]
}
