import { supabase } from '../lib/supabase'
import type { Producto } from '../lib/types'

/**
 * Obtiene los productos activos para los formularios de pedidos.
 */
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

/**
 * Obtiene todos los productos (activos e inactivos) para administración.
 */
export async function obtenerProductosAdmin(): Promise<Producto[]> {
  const { data, error } = await supabase
    .from('Productos')
    .select('id, rubro, necesidad, estado')
    .order('estado', { ascending: false })
    .order('rubro', { ascending: true })
    .order('necesidad', { ascending: true })

  if (error) {
    throw new Error(`Error al consultar los productos: ${error.message}`)
  }
  return (data ?? []) as Producto[]
}

/**
 * Crea un nuevo producto.
 */
export async function crearProducto(rubro: string, necesidad: string): Promise<Producto> {
  const rubroLimpio = rubro.trim()
  const necesidadLimpia = necesidad.trim()

  if (!rubroLimpio) throw new Error('El rubro es obligatorio.')
  if (!necesidadLimpia) throw new Error('La necesidad es obligatoria.')

  const { data, error } = await supabase
    .from('Productos')
    .insert({
      rubro: rubroLimpio,
      necesidad: necesidadLimpia,
      estado: true,
    })
    .select('id, rubro, necesidad, estado')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un producto con ese rubro y necesidad.')
    }
    throw new Error(`Error al crear producto: ${error.message}`)
  }

  return data as Producto
}

/**
 * Actualiza rubro y necesidad de un producto existente.
 */
export async function actualizarProducto(
  id: number,
  rubro: string,
  necesidad: string,
): Promise<Producto> {
  const rubroLimpio = rubro.trim()
  const necesidadLimpia = necesidad.trim()

  if (!rubroLimpio) throw new Error('El rubro es obligatorio.')
  if (!necesidadLimpia) throw new Error('La necesidad es obligatoria.')

  const { data, error } = await supabase
    .from('Productos')
    .update({
      rubro: rubroLimpio,
      necesidad: necesidadLimpia,
    })
    .eq('id', id)
    .select('id, rubro, necesidad, estado')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un producto con ese rubro y necesidad.')
    }
    throw new Error(`Error al actualizar producto: ${error.message}`)
  }

  return data as Producto
}

/**
 * Activa o desactiva un producto.
 */
export async function cambiarEstadoProducto(id: number, estado: boolean): Promise<Producto> {
  const { data, error } = await supabase
    .from('Productos')
    .update({ estado })
    .eq('id', id)
    .select('id, rubro, necesidad, estado')
    .single()

  if (error) {
    throw new Error(`Error al cambiar el estado del producto: ${error.message}`)
  }

  return data as Producto
}
