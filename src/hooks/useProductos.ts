import { useQuery } from '@tanstack/react-query'
import { obtenerProductos } from '../services/productosService'

export function useProductos() {
  return useQuery({
    queryKey: ['productos'],
    queryFn: obtenerProductos,
    staleTime: 1000 * 60 * 30, // 30 minutos de caché
  })
}
