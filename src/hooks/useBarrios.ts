import { useQuery } from '@tanstack/react-query'
import { obtenerBarrios } from '../services/barriosService'

export function useBarrios() {
  return useQuery({
    queryKey: ['barrios'],
    queryFn: obtenerBarrios,
    staleTime: 1000 * 60 * 60, // 1 hora de caché ya que los barrios no cambian frecuentemente
  })
}
