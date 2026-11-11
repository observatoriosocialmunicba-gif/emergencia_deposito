import { supabase } from '../lib/supabase'
import type { Persona, PersonaDni } from '../lib/types'

export interface FiltroPersonas {
  busqueda: string
  pagina: number
  porPagina?: number
}

export interface PaginaPersonas {
  filas: Persona[]
  total: number
}

function limpiarBusqueda(texto: string): string {
  return texto.replace(/[,()%*\\"]/g, ' ').trim()
}

export async function buscarPersonas({
  busqueda,
  pagina,
  porPagina = 10,
}: FiltroPersonas): Promise<PaginaPersonas> {
  const desde = pagina * porPagina
  let consulta = supabase
    .from('Personas')
    .select('id, nombreCompleto, dni, telefono, genero', { count: 'exact' })

  const q = limpiarBusqueda(busqueda)
  if (q) {
    consulta = consulta.or(`nombreCompleto.ilike.%${q}%,dni.ilike.%${q}%,telefono.ilike.%${q}%`)
  }

  const { data, count, error } = await consulta
    .order('id', { ascending: false })
    .range(desde, desde + porPagina - 1)

  if (error) throw error
  return { filas: (data ?? []) as Persona[], total: count ?? 0 }
}

export async function crearPersona(persona: {
  nombreCompleto: string
  dni: string
  telefono?: string | null
  genero?: string | null
}): Promise<Persona> {
  const { data, error } = await supabase
    .from('Personas')
    .insert({
      nombreCompleto: persona.nombreCompleto.trim(),
      dni: persona.dni.trim(),
      telefono: persona.telefono?.trim() || null,
      genero: persona.genero?.trim() || null,
    })
    .select('id, nombreCompleto, dni, telefono, genero')
    .single()

  if (error) throw error
  return data as Persona
}

export async function actualizarPersona(
  id: number,
  persona: {
    nombreCompleto?: string
    dni?: string
    telefono?: string | null
    genero?: string | null
  },
): Promise<Persona> {
  const { data, error } = await supabase
    .from('Personas')
    .update({
      ...(persona.nombreCompleto && { nombreCompleto: persona.nombreCompleto.trim() }),
      ...(persona.dni && { dni: persona.dni.trim() }),
      ...(persona.telefono !== undefined && { telefono: persona.telefono?.trim() || null }),
      ...(persona.genero !== undefined && { genero: persona.genero?.trim() || null }),
    })
    .eq('id', id)
    .select('id, nombreCompleto, dni, telefono, genero')
    .single()

  if (error) throw error
  return data as Persona
}

/** Resumen de DNI y cantidad de pedidos de las personas indicadas (vista `vista_personas_dni`). */
export async function obtenerResumenPersonasDni(ids: number[]): Promise<PersonaDni[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase
    .from('vista_personas_dni')
    .select(
      'id_persona, dni, dni_valido, registros_mismo_dni, nombres_distintos, pedidos_propios, pedidos_total',
    )
    .in('id_persona', ids)

  if (error) throw error
  return (data ?? []) as PersonaDni[]
}
