import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  actualizarProducto,
  cambiarEstadoProducto,
  crearProducto,
  obtenerProductos,
  obtenerProductosAdmin,
} from '../services/productosService'

export function useProductos() {
  return useQuery({
    queryKey: ['productos'],
    queryFn: obtenerProductos,
    staleTime: 1000 * 60 * 30, // 30 minutos de caché
  })
}

export function useProductosAdmin() {
  return useQuery({
    queryKey: ['productos-admin'],
    queryFn: obtenerProductosAdmin,
  })
}

export function useCrearProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ rubro, necesidad }: { rubro: string; necesidad: string }) =>
      crearProducto(rubro, necesidad),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['productos'] })
      void queryClient.invalidateQueries({ queryKey: ['productos-admin'] })
    },
  })
}

export function useActualizarProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      rubro,
      necesidad,
    }: {
      id: number
      rubro: string
      necesidad: string
    }) => actualizarProducto(id, rubro, necesidad),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['productos'] })
      void queryClient.invalidateQueries({ queryKey: ['productos-admin'] })
    },
  })
}

export function useCambiarEstadoProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: boolean }) =>
      cambiarEstadoProducto(id, estado),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['productos'] })
      void queryClient.invalidateQueries({ queryKey: ['productos-admin'] })
    },
  })
}
