import { supabase } from '../lib/supabase'
import type {
  DiaDashboard,
  DimensionDashboard,
  DimensionDashboardNombre,
  KpisDashboard,
  RubroDashboard,
} from '../lib/types'

// El servidor devuelve como máximo 1.000 filas por consulta: se pide por tandas.
const TANDA = 1000

/** Serie diaria completa (una fila por día que tuvo pedidos o entregas), de la más vieja a la más nueva. */
export async function obtenerSerieDiaria(): Promise<DiaDashboard[]> {
  const filas: DiaDashboard[] = []
  for (let desde = 0; ; desde += TANDA) {
    const { data, error } = await supabase
      .from('vista_dashboard_dia')
      .select('*')
      .order('fecha', { ascending: true })
      .range(desde, desde + TANDA - 1)
    if (error) throw error
    filas.push(...((data ?? []) as DiaDashboard[]))
    if (!data || data.length < TANDA) break
  }
  return filas
}

export interface ResumenDimension {
  /** los `limite` valores con más pedidos, de mayor a menor */
  top: DimensionDashboard[]
  /** todo lo que quedó fuera del top, junto: sirve para la barra "Otros" */
  otros: { valores: number; pedidos: number; entregados: number }
  total: number
}

/** Pedidos por procedencia, subsecretaría o barrio: top N + "Otros". */
export async function obtenerDimension(
  dimension: DimensionDashboardNombre,
  limite = 10,
): Promise<ResumenDimension> {
  const { data, error } = await supabase
    .from('vista_dashboard_dimension')
    .select('dimension, valor, pedidos, entregados')
    .eq('dimension', dimension)
    .order('pedidos', { ascending: false })
    .limit(TANDA)
  if (error) throw error
  const filas = (data ?? []) as DimensionDashboard[]
  const top = filas.slice(0, limite)
  const resto = filas.slice(limite)
  return {
    top,
    otros: {
      valores: resto.length,
      pedidos: resto.reduce((s, f) => s + f.pedidos, 0),
      entregados: resto.reduce((s, f) => s + f.entregados, 0),
    },
    total: filas.reduce((s, f) => s + f.pedidos, 0),
  }
}

/** Productos solicitados por rubro. Ordenado por unidades (el rubro "Dinero" queda al final, en 0). */
export async function obtenerRubros(): Promise<RubroDashboard[]> {
  const { data, error } = await supabase
    .from('vista_dashboard_rubro')
    .select('rubro, renglones, unidades, unidades_entregadas, pedidos, monto')
    .order('unidades', { ascending: false })
  if (error) throw error
  return (data ?? []) as RubroDashboard[]
}

export async function obtenerKpis(): Promise<KpisDashboard> {
  const { data, error } = await supabase.from('vista_dashboard_kpis').select('*').single()
  if (error) throw error
  const k = data as KpisDashboard
  // numeric puede llegar como texto según el cliente: se normaliza a número
  return { ...k, dias_promedio_entrega: k.dias_promedio_entrega == null ? null : Number(k.dias_promedio_entrega) }
}
