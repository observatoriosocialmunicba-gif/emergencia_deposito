import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  actualizarBarrio,
  cambiarEstadoBarrio,
  crearBarrio,
  obtenerBarrios,
  obtenerBarriosAdmin,
} from '../services/barriosService'

export function useBarrios() {
  return useQuery({
    queryKey: ['barrios'],
    queryFn: obtenerBarrios,
    staleTime: 1000 * 60 * 30, // 30 minutos de caché
  })
}

export function useBarriosAdmin() {
  return useQuery({
    queryKey: ['barrios-admin'],
    queryFn: obtenerBarriosAdmin,
  })
}

export function useCrearBarrio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      nombre,
      lat,
      long,
    }: {
      nombre: string
      lat?: string | null
      long?: string | null
    }) => crearBarrio({ nombre, lat, long }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['barrios'] })
      void queryClient.invalidateQueries({ queryKey: ['barrios-admin'] })
    },
  })
}

export function useActualizarBarrio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      nombre,
      lat,
      long,
    }: {
      id: number
      nombre: string
      lat?: string | null
      long?: string | null
    }) => actualizarBarrio(id, { nombre, lat, long }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['barrios'] })
      void queryClient.invalidateQueries({ queryKey: ['barrios-admin'] })
    },
  })
}

export function useCambiarEstadoBarrio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      cambiarEstadoBarrio(id, activo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['barrios'] })
      void queryClient.invalidateQueries({ queryKey: ['barrios-admin'] })
    },
  })
}
