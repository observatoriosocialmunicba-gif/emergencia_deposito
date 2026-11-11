import { supabase } from '../lib/supabase'
import type { Rol, Usuario } from '../lib/types'

const COLUMNAS_USUARIO = 'id, nombreCompleto, dni, rol, telefono, area_id, activo'

export const POR_PAGINA_USUARIOS = 10

export interface ActualizarPerfilDTO {
  nombreCompleto: string
  dni: number | null
  telefono: string | null
}

export interface ActualizarUsuarioAdminDTO {
  rol?: Rol
  area_id?: number | null
  activo?: boolean
}

export interface FiltroUsuarios {
  busqueda?: string
  rol?: Rol | 'todos'
  areaId?: number | 'todas'
  estado?: 'todos' | 'activos' | 'inactivos' | 'pendientes'
  pagina: number
  porPagina?: number
}

export interface PaginaUsuarios {
  filas: Usuario[]
  total: number
}

export async function obtenerUsuario(id: string): Promise<Usuario | null> {
  const { data, error } = await supabase
    .from('Usuarios')
    .select(COLUMNAS_USUARIO)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as Usuario | null
}

export async function actualizarPerfil(
  id: string,
  datos: ActualizarPerfilDTO,
): Promise<Usuario> {
  const { data, error } = await supabase
    .from('Usuarios')
    .update({
      nombreCompleto: datos.nombreCompleto,
      dni: datos.dni,
      telefono: datos.telefono,
    })
    .eq('id', id)
    .select(COLUMNAS_USUARIO)
    .single()
  if (error) throw error
  return data as Usuario
}

export async function listarUsuarios({
  busqueda = '',
  rol = 'todos',
  areaId = 'todas',
  estado = 'todos',
  pagina,
  porPagina = POR_PAGINA_USUARIOS,
}: FiltroUsuarios): Promise<PaginaUsuarios> {
  const desde = pagina * porPagina
  const hasta = desde + porPagina - 1

  let consulta = supabase
    .from('Usuarios')
    .select(COLUMNAS_USUARIO, { count: 'exact' })

  if (rol && rol !== 'todos') {
    consulta = consulta.eq('rol', rol)
  }

  if (areaId && areaId !== 'todas') {
    consulta = consulta.eq('area_id', areaId)
  }

  if (estado === 'activos') {
    consulta = consulta.eq('activo', true)
  } else if (estado === 'inactivos') {
    consulta = consulta.eq('activo', false)
  } else if (estado === 'pendientes') {
    consulta = consulta.eq('rol', 'No Asignado')
  }

  const q = busqueda.trim().replace(/[,()%*\\"]/g, ' ').trim()
  if (q) {
    if (/^\d+$/.test(q)) {
      consulta = consulta.or(`nombreCompleto.ilike.%${q}%,dni.eq.${q}`)
    } else {
      consulta = consulta.ilike('nombreCompleto', `%${q}%`)
    }
  }

  const { data, count, error } = await consulta
    .order('nombreCompleto', { ascending: true, nullsFirst: false })
    .range(desde, hasta)

  if (error) throw error

  return {
    filas: (data ?? []) as Usuario[],
    total: count ?? 0,
  }
}

export async function actualizarUsuarioAdmin(
  id: string,
  datos: ActualizarUsuarioAdminDTO,
): Promise<Usuario> {
  const updateData: Record<string, unknown> = {}
  if (datos.rol !== undefined) updateData.rol = datos.rol
  if (datos.area_id !== undefined) updateData.area_id = datos.area_id
  if (datos.activo !== undefined) updateData.activo = datos.activo

  const { data, error } = await supabase
    .from('Usuarios')
    .update(updateData)
    .eq('id', id)
    .select(COLUMNAS_USUARIO)
    .single()

  if (error) throw error
  return data as Usuario
}
