import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cambiarEstadoArea,
  crearArea,
  obtenerAreas,
  obtenerAreasConConteo,
  renombrarArea,
} from '../services/areasService'

export function useAreas() {
  return useQuery({
    queryKey: ['areas'],
    queryFn: obtenerAreas,
    staleTime: 5 * 60_000,
  })
}

export function useAreasAdmin() {
  return useQuery({
    queryKey: ['areas-admin'],
    queryFn: obtenerAreasConConteo,
    staleTime: 30_000,
  })
}

export function useCrearArea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (nombre: string) => crearArea(nombre),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['areas'] })
      void qc.invalidateQueries({ queryKey: ['areas-admin'] })
    },
  })
}

export function useRenombrarArea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, nombre }: { id: number; nombre: string }) =>
      renombrarArea(id, nombre),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['areas'] })
      void qc.invalidateQueries({ queryKey: ['areas-admin'] })
      void qc.invalidateQueries({ queryKey: ['usuarios'] })
    },
  })
}

export function useCambiarEstadoArea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, activa }: { id: number; activa: boolean }) =>
      cambiarEstadoArea(id, activa),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['areas'] })
      void qc.invalidateQueries({ queryKey: ['areas-admin'] })
      void qc.invalidateQueries({ queryKey: ['usuarios'] })
    },
  })
}
