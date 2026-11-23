import { supabase } from '../lib/supabase'
import type { Vehiculo } from '../lib/types'

/**
 * Obtiene los vehículos activos disponibles para asignaciones.
 */
export async function obtenerVehiculosDisponibles(): Promise<Vehiculo[]> {
  const { data, error } = await supabase
    .from('Vehiculos')
    .select('idVehiculo, tipoVehiculo, patente, Nombre, estado')
    .eq('estado', true)
    .order('Nombre', { ascending: true })

  if (error) throw error
  return (data ?? []) as Vehiculo[]
}

/**
 * Obtiene todos los vehículos para administración.
 */
export async function obtenerVehiculosAdmin(): Promise<Vehiculo[]> {
  const { data, error } = await supabase
    .from('Vehiculos')
    .select('idVehiculo, tipoVehiculo, patente, Nombre, estado')
    .order('estado', { ascending: false })
    .order('Nombre', { ascending: true })

  if (error) {
    throw new Error(`Error al consultar vehículos: ${error.message}`)
  }
  return (data ?? []) as Vehiculo[]
}

/**
 * Crea un nuevo vehículo.
 */
export async function crearVehiculo({
  nombre,
  tipoVehiculo,
  patente,
}: {
  nombre: string
  tipoVehiculo?: string | null
  patente?: string | null
}): Promise<Vehiculo> {
  const nombreLimpio = nombre.trim()
  if (!nombreLimpio) throw new Error('El nombre o identificación del vehículo es obligatorio.')

  const { data, error } = await supabase
    .from('Vehiculos')
    .insert({
      Nombre: nombreLimpio,
      tipoVehiculo: tipoVehiculo?.trim() || null,
      patente: patente?.trim() || null,
      estado: true,
    })
    .select('idVehiculo, tipoVehiculo, patente, Nombre, estado')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un vehículo con ese nombre.')
    }
    throw new Error(`Error al crear vehículo: ${error.message}`)
  }

  return data as Vehiculo
}

/**
 * Actualiza un vehículo existente.
 */
export async function actualizarVehiculo(
  id: number,
  {
    nombre,
    tipoVehiculo,
    patente,
  }: {
    nombre: string
    tipoVehiculo?: string | null
    patente?: string | null
  },
): Promise<Vehiculo> {
  const nombreLimpio = nombre.trim()
  if (!nombreLimpio) throw new Error('El nombre o identificación del vehículo es obligatorio.')

  const { data, error } = await supabase
    .from('Vehiculos')
    .update({
      Nombre: nombreLimpio,
      tipoVehiculo: tipoVehiculo?.trim() || null,
      patente: patente?.trim() || null,
    })
    .eq('idVehiculo', id)
    .select('idVehiculo, tipoVehiculo, patente, Nombre, estado')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un vehículo con ese nombre.')
    }
    throw new Error(`Error al actualizar vehículo: ${error.message}`)
  }

  return data as Vehiculo
}

/**
 * Activa o desactiva un vehículo.
 */
export async function cambiarEstadoVehiculo(id: number, estado: boolean): Promise<Vehiculo> {
  const { data, error } = await supabase
    .from('Vehiculos')
    .update({ estado })
    .eq('idVehiculo', id)
    .select('idVehiculo, tipoVehiculo, patente, Nombre, estado')
    .single()

  if (error) {
    throw new Error(`Error al cambiar estado del vehículo: ${error.message}`)
  }

  return data as Vehiculo
}
