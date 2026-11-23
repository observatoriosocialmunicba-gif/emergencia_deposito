import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CategoriaOpcion } from '../lib/types'
import {
  cambiarEstadoOpcion,
  crearOpcion,
  obtenerOpciones,
  obtenerOpcionesAdmin,
  renombrarOpcion,
  reordenarOpciones,
} from '../services/opcionesService'

export function useOpciones(categoria: CategoriaOpcion) {
  return useQuery({
    queryKey: ['opciones', categoria],
    queryFn: () => obtenerOpciones(categoria),
    staleTime: 1000 * 60 * 5, // 5 min
  })
}

export function useOpcionesAdmin(categoria: CategoriaOpcion) {
  return useQuery({
    queryKey: ['opciones-admin', categoria],
    queryFn: () => obtenerOpcionesAdmin(categoria),
  })
}

export function useCrearOpcion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ categoria, valor }: { categoria: CategoriaOpcion; valor: string }) =>
      crearOpcion(categoria, valor),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['opciones', vars.categoria] })
      void queryClient.invalidateQueries({ queryKey: ['opciones-admin', vars.categoria] })
    },
  })
}

export function useRenombrarOpcion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: {
      id: number
      valor: string
      categoria: CategoriaOpcion
    }) => renombrarOpcion(vars.id, vars.valor),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['opciones', vars.categoria] })
      void queryClient.invalidateQueries({ queryKey: ['opciones-admin', vars.categoria] })
    },
  })
}

export function useCambiarEstadoOpcion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: {
      id: number
      activa: boolean
      categoria: CategoriaOpcion
    }) => cambiarEstadoOpcion(vars.id, vars.activa),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['opciones', vars.categoria] })
      void queryClient.invalidateQueries({ queryKey: ['opciones-admin', vars.categoria] })
    },
  })
}

export function useReordenarOpciones() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ categoria, ids }: { categoria: CategoriaOpcion; ids: number[] }) =>
      reordenarOpciones(categoria, ids),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['opciones', vars.categoria] })
      void queryClient.invalidateQueries({ queryKey: ['opciones-admin', vars.categoria] })
    },
  })
}
