import { supabase } from '../lib/supabase'
import type { Area, AreaConConteo } from '../lib/types'

export async function obtenerAreas(): Promise<Area[]> {
  const { data, error } = await supabase
    .from('Areas')
    .select('id, nombre, activa')
    .eq('activa', true)
    .order('nombre', { ascending: true })

  if (error) throw error
  return (data ?? []) as Area[]
}

export async function obtenerAreasConConteo(): Promise<AreaConConteo[]> {
  // 1. Obtener todas las áreas (activas primero, luego inactivas al final, ordenadas alfabéticamente)
  const { data: areas, error: areasError } = await supabase
    .from('Areas')
    .select('id, nombre, activa')
    .order('activa', { ascending: false })
    .order('nombre', { ascending: true })

  if (areasError) throw areasError
  if (!areas || areas.length === 0) return []

  // 2. Obtener usuarios para contar usuarios por área y solicitantes activos
  const { data: usuarios, error: usuariosError } = await supabase
    .from('Usuarios')
    .select('area_id, rol, activo')

  if (usuariosError) throw usuariosError

  const usuariosMap = new Map<number, number>()
  const solicitantesMap = new Map<number, number>()

  for (const u of usuarios ?? []) {
    if (u.area_id != null) {
      usuariosMap.set(u.area_id, (usuariosMap.get(u.area_id) ?? 0) + 1)
      if (u.rol === 'Solicitante' && u.activo) {
        solicitantesMap.set(u.area_id, (solicitantesMap.get(u.area_id) ?? 0) + 1)
      }
    }
  }

  // 3. Obtener conteo exacto de pedidos por área (consulta liviana con head: true)
  const pedidosCounts = await Promise.all(
    areas.map(async (a) => {
      const { count, error } = await supabase
        .from('Pedidos')
        .select('id', { count: 'exact', head: true })
        .eq('area_id', a.id)
      if (error) throw error
      return { areaId: a.id, count: count ?? 0 }
    }),
  )

  const pedidosMap = new Map(pedidosCounts.map((p) => [p.areaId, p.count]))

  return areas.map((a) => ({
    id: a.id,
    nombre: a.nombre,
    activa: a.activa,
    usuariosCount: usuariosMap.get(a.id) ?? 0,
    pedidosCount: pedidosMap.get(a.id) ?? 0,
    solicitantesActivosCount: solicitantesMap.get(a.id) ?? 0,
  }))
}

export async function crearArea(nombre: string): Promise<Area> {
  const limpio = nombre.trim()
  if (!limpio) {
    throw new Error('El nombre del área es obligatorio.')
  }
  if (limpio.length > 100) {
    throw new Error('El nombre no puede superar los 100 caracteres.')
  }

  const { data, error } = await supabase
    .from('Areas')
    .insert({ nombre: limpio, activa: true })
    .select('id, nombre, activa')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un área con ese nombre.')
    }
    throw error
  }

  return data as Area
}

export async function renombrarArea(id: number, nombre: string): Promise<Area> {
  const limpio = nombre.trim()
  if (!limpio) {
    throw new Error('El nombre del área es obligatorio.')
  }
  if (limpio.length > 100) {
    throw new Error('El nombre no puede superar los 100 caracteres.')
  }

  const { data, error } = await supabase
    .from('Areas')
    .update({ nombre: limpio })
    .eq('id', id)
    .select('id, nombre, activa')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un área con ese nombre.')
    }
    throw error
  }

  return data as Area
}

export async function cambiarEstadoArea(id: number, activa: boolean): Promise<Area> {
  if (!activa) {
    const { count, error: countError } = await supabase
      .from('Usuarios')
      .select('id', { count: 'exact', head: true })
      .eq('area_id', id)
      .eq('rol', 'Solicitante')
      .eq('activo', true)

    if (countError) throw countError
    if (count && count > 0) {
      throw new Error(`Reasigná primero a sus ${count} solicitantes`)
    }
  }

  const { data, error } = await supabase
    .from('Areas')
    .update({ activa })
    .eq('id', id)
    .select('id, nombre, activa')
    .single()

  if (error) throw error
  return data as Area
}
