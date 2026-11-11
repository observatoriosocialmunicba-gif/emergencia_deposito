import { useQuery } from '@tanstack/react-query'
import {
  obtenerDimension,
  obtenerKpis,
  obtenerRubros,
  obtenerSerieDiaria,
} from '../services/dashboardService'
import type { DimensionDashboardNombre } from '../lib/types'

// Son totales de toda la operación: alcanza con refrescarlos una vez por minuto.
const OPCIONES = { staleTime: 60_000 }

export function useKpisDashboard() {
  return useQuery({ queryKey: ['dashboard', 'kpis'], queryFn: obtenerKpis, ...OPCIONES })
}

/** Serie diaria completa; el agrupado por semana/mes y el rango se calculan en el cliente. */
export function useSerieDiaria() {
  return useQuery({ queryKey: ['dashboard', 'serie'], queryFn: obtenerSerieDiaria, ...OPCIONES })
}

export function useDimensionDashboard(dimension: DimensionDashboardNombre, limite = 10) {
  return useQuery({
    queryKey: ['dashboard', 'dimension', dimension, limite],
    queryFn: () => obtenerDimension(dimension, limite),
    ...OPCIONES,
  })
}

export function useRubrosDashboard() {
  return useQuery({ queryKey: ['dashboard', 'rubros'], queryFn: obtenerRubros, ...OPCIONES })
}
