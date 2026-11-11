import { supabase } from '../lib/supabase'
import type { Vehiculo } from '../lib/types'

export async function obtenerVehiculosDisponibles(): Promise<Vehiculo[]> {
  const { data, error } = await supabase
    .from('Vehiculos')
    .select('idVehiculo, tipoVehiculo, patente, Nombre, estado')
    .eq('estado', true)
    .order('Nombre', { ascending: true })

  if (error) throw error
  return data as Vehiculo[]
}
