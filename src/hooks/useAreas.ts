import { useQuery } from '@tanstack/react-query'
import { obtenerAreas } from '../services/areasService'

export function useAreas() {
  return useQuery({
    queryKey: ['areas'],
    queryFn: obtenerAreas,
    staleTime: 5 * 60_000,
  })
}

