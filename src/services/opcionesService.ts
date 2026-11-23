import { supabase } from '../lib/supabase'
import type { CategoriaOpcion, Opcion } from '../lib/types'

/**
 * Obtiene las opciones activas para una categoría, ordenadas por su campo `orden` y luego por `valor`.
 * Usado en formularios de carga y edición.
 */
export async function obtenerOpciones(categoria: CategoriaOpcion): Promise<Opcion[]> {
  const { data, error } = await supabase
    .from('Opciones')
    .select('id, categoria, valor, activa, orden')
    .eq('categoria', categoria)
    .eq('activa', true)
    .order('orden', { ascending: true })
    .order('valor', { ascending: true })

  if (error) {
    throw new Error(`Error al obtener opciones de ${categoria}: ${error.message}`)
  }
  return data ?? []
}

/**
 * Obtiene todas las opciones (activas e inactivas) para administración.
 * Ordenadas: activas primero (ordenadas por `orden` y `valor`), luego inactivas.
 */
export async function obtenerOpcionesAdmin(categoria: CategoriaOpcion): Promise<Opcion[]> {
  const { data, error } = await supabase
    .from('Opciones')
    .select('id, categoria, valor, activa, orden')
    .eq('categoria', categoria)
    .order('activa', { ascending: false })
    .order('orden', { ascending: true })
    .order('valor', { ascending: true })

  if (error) {
    throw new Error(`Error al obtener opciones para administración: ${error.message}`)
  }
  return data ?? []
}

/**
 * Crea una nueva opción en la categoría indicada.
 * Calcula el siguiente valor de `orden`.
 */
export async function crearOpcion(categoria: CategoriaOpcion, valor: string): Promise<Opcion> {
  const valorLimpio = valor.trim()
  if (!valorLimpio) {
    throw new Error('El valor de la opción es obligatorio.')
  }
  if (valorLimpio.length > 100) {
    throw new Error('El valor de la opción no puede superar los 100 caracteres.')
  }

  // Obtener el orden máximo actual para esta categoría
  const { data: maxRows } = await supabase
    .from('Opciones')
    .select('orden')
    .eq('categoria', categoria)
    .order('orden', { ascending: false })
    .limit(1)

  const siguienteOrden = (maxRows?.[0]?.orden ?? 0) + 1

  const { data, error } = await supabase
    .from('Opciones')
    .insert({
      categoria,
      valor: valorLimpio,
      activa: true,
      orden: siguienteOrden,
    })
    .select('id, categoria, valor, activa, orden')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe una opción con ese nombre.')
    }
    throw new Error(`Error al crear la opción: ${error.message}`)
  }

  return data
}

/**
 * Renombra una opción existente.
 */
export async function renombrarOpcion(id: number, valor: string): Promise<Opcion> {
  const valorLimpio = valor.trim()
  if (!valorLimpio) {
    throw new Error('El valor de la opción es obligatorio.')
  }
  if (valorLimpio.length > 100) {
    throw new Error('El valor de la opción no puede superar los 100 caracteres.')
  }

  const { data, error } = await supabase
    .from('Opciones')
    .update({ valor: valorLimpio })
    .eq('id', id)
    .select('id, categoria, valor, activa, orden')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe una opción con ese nombre.')
    }
    throw new Error(`Error al renombrar la opción: ${error.message}`)
  }

  return data
}

/**
 * Activa o desactiva una opción.
 */
export async function cambiarEstadoOpcion(id: number, activa: boolean): Promise<Opcion> {
  const { data, error } = await supabase
    .from('Opciones')
    .update({ activa })
    .eq('id', id)
    .select('id, categoria, valor, activa, orden')
    .single()

  if (error) {
    throw new Error(`Error al cambiar el estado de la opción: ${error.message}`)
  }

  return data
}

/**
 * Reordena las opciones de una categoría asignando un orden secuencial (1, 2, 3...)
 * según el array ordenado de IDs provisto.
 */
export async function reordenarOpciones(categoria: CategoriaOpcion, ids: number[]): Promise<void> {
  const updates = ids.map((id, index) =>
    supabase
      .from('Opciones')
      .update({ orden: index + 1 })
      .eq('id', id)
      .eq('categoria', categoria)
  )

  const results = await Promise.all(updates)
  const primerError = results.find((r) => r.error)?.error
  if (primerError) {
    throw new Error(`Error al reordenar las opciones: ${primerError.message}`)
  }
}
