import { supabase } from '../lib/supabase'
import type { Barrio } from '../lib/types'

/**
 * Obtiene los barrios activos (para el combobox de Nueva Solicitud).
 */
export async function obtenerBarrios(): Promise<Barrio[]> {
  const { data, error } = await supabase
    .from('Barrios')
    .select('id, NombreBarrio, Long, Lat, activo')
    .eq('activo', true)
    .order('NombreBarrio', { ascending: true })

  if (error) throw error
  return (data ?? []) as Barrio[]
}

/**
 * Obtiene todos los barrios (activos e inactivos) para administración.
 */
export async function obtenerBarriosAdmin(): Promise<Barrio[]> {
  const { data, error } = await supabase
    .from('Barrios')
    .select('id, NombreBarrio, Long, Lat, activo')
    .order('activo', { ascending: false })
    .order('NombreBarrio', { ascending: true })

  if (error) {
    throw new Error(`Error al consultar los barrios: ${error.message}`)
  }
  return (data ?? []) as Barrio[]
}

/**
 * Crea un nuevo barrio.
 */
export async function crearBarrio({
  nombre,
  lat,
  long,
}: {
  nombre: string
  lat?: string | null
  long?: string | null
}): Promise<Barrio> {
  const nombreLimpio = nombre.trim()
  if (!nombreLimpio) throw new Error('El nombre del barrio es obligatorio.')

  const { data, error } = await supabase
    .from('Barrios')
    .insert({
      NombreBarrio: nombreLimpio,
      Lat: lat?.trim() || null,
      Long: long?.trim() || null,
      activo: true,
    })
    .select('id, NombreBarrio, Long, Lat, activo')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un barrio con ese nombre.')
    }
    throw new Error(`Error al crear barrio: ${error.message}`)
  }

  return data as Barrio
}

/**
 * Actualiza un barrio existente.
 */
export async function actualizarBarrio(
  id: number,
  {
    nombre,
    lat,
    long,
  }: {
    nombre: string
    lat?: string | null
    long?: string | null
  },
): Promise<Barrio> {
  const nombreLimpio = nombre.trim()
  if (!nombreLimpio) throw new Error('El nombre del barrio es obligatorio.')

  const { data, error } = await supabase
    .from('Barrios')
    .update({
      NombreBarrio: nombreLimpio,
      Lat: lat?.trim() || null,
      Long: long?.trim() || null,
    })
    .eq('id', id)
    .select('id, NombreBarrio, Long, Lat, activo')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un barrio con ese nombre.')
    }
    throw new Error(`Error al actualizar barrio: ${error.message}`)
  }

  return data as Barrio
}

/**
 * Activa o desactiva un barrio.
 */
export async function cambiarEstadoBarrio(id: number, activo: boolean): Promise<Barrio> {
  const { data, error } = await supabase
    .from('Barrios')
    .update({ activo })
    .eq('id', id)
    .select('id, NombreBarrio, Long, Lat, activo')
    .single()

  if (error) {
    throw new Error(`Error al cambiar estado del barrio: ${error.message}`)
  }

  return data as Barrio
}
