import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  actualizarPersona,
  buscarPersonas,
  crearPersona,
  obtenerResumenPersonasDni,
} from '../services/personasService'
import type { FiltroPersonas } from '../services/personasService'

export function usePersonas(filtro: FiltroPersonas) {
  return useQuery({
    queryKey: ['personas', filtro.busqueda, filtro.pagina, filtro.porPagina],
    queryFn: () => buscarPersonas(filtro),
    placeholderData: keepPreviousData,
  })
}

export function useCrearPersona() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: crearPersona,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['personas'] })
    },
  })
}

export function useActualizarPersona() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      persona,
    }: {
      id: number
      persona: Parameters<typeof actualizarPersona>[1]
    }) => actualizarPersona(id, persona),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['personas'] })
    },
  })
}

/** Cantidad de pedidos y datos de DNI repetido para las personas de la página actual. */
export function usePersonasDni(ids: number[]) {
  return useQuery({
    queryKey: ['personas-dni', ids],
    queryFn: () => obtenerResumenPersonasDni(ids),
    enabled: ids.length > 0,
    placeholderData: keepPreviousData,
  })
}
